import 'dart:async';
import 'dart:convert';

import 'package:http/http.dart' as http;
import 'package:http_parser/http_parser.dart';
import 'package:lunas_mobile/core/config/api_config.dart';
import 'package:lunas_mobile/core/network/api_exception.dart';
import 'package:lunas_mobile/core/storage/secure_session_store.dart';

typedef JsonMap = Map<String, dynamic>;

/// REST client shared by the Citizen and Repair Personnel mobile workflows.
///
/// It attaches the short-lived access token, performs one safe refresh/retry on
/// a 401 response, and tells the auth controller when a session is no longer
/// valid. API failures are intentionally converted to user-safe messages.
class ApiClient {
  ApiClient({required SecureSessionStore sessionStore, http.Client? httpClient})
    : _sessionStore = sessionStore,
      _httpClient = httpClient ?? http.Client();

  final SecureSessionStore _sessionStore;
  final http.Client _httpClient;
  static const _requestTimeout = Duration(seconds: 30);

  Future<void> Function()? onAuthenticationFailure;

  Future<JsonMap> get(
    String path, {
    Map<String, String>? queryParameters,
    bool authenticated = true,
  }) {
    return _sendJson(
      method: 'GET',
      path: path,
      queryParameters: queryParameters,
      authenticated: authenticated,
    );
  }

  Future<JsonMap> post(String path, {Object? body, bool authenticated = true}) {
    return _sendJson(
      method: 'POST',
      path: path,
      body: body,
      authenticated: authenticated,
    );
  }

  Future<JsonMap> put(String path, {Object? body, bool authenticated = true}) {
    return _sendJson(
      method: 'PUT',
      path: path,
      body: body,
      authenticated: authenticated,
    );
  }

  Future<JsonMap> patch(
    String path, {
    Object? body,
    bool authenticated = true,
  }) {
    return _sendJson(
      method: 'PATCH',
      path: path,
      body: body,
      authenticated: authenticated,
    );
  }

  Future<JsonMap> multipart(
    String path, {
    required Map<String, String> fields,
    required List<ApiMultipartFile> files,
    bool authenticated = true,
  }) {
    return _sendMultipart(
      path: path,
      fields: fields,
      files: files,
      authenticated: authenticated,
    );
  }

  Future<JsonMap> _sendJson({
    required String method,
    required String path,
    Object? body,
    Map<String, String>? queryParameters,
    required bool authenticated,
    bool allowRefresh = true,
  }) async {
    try {
      final headers = await _headers(authenticated: authenticated);
      final uri = ApiConfig.uri(path, queryParameters);
      final encodedBody = body == null ? null : jsonEncode(body);
      final response = switch (method) {
        'GET' =>
          await _httpClient.get(uri, headers: headers).timeout(_requestTimeout),
        'POST' =>
          await _httpClient
              .post(uri, headers: headers, body: encodedBody)
              .timeout(_requestTimeout),
        'PUT' =>
          await _httpClient
              .put(uri, headers: headers, body: encodedBody)
              .timeout(_requestTimeout),
        'PATCH' =>
          await _httpClient
              .patch(uri, headers: headers, body: encodedBody)
              .timeout(_requestTimeout),
        _ => throw ArgumentError.value(method, 'method', 'Unsupported method'),
      };
      return await _handleJsonResponse(
        response,
        retry: authenticated && allowRefresh
            ? () => _sendJson(
                method: method,
                path: path,
                body: body,
                queryParameters: queryParameters,
                authenticated: authenticated,
                allowRefresh: false,
              )
            : null,
      );
    } on ApiException {
      rethrow;
    } on http.ClientException {
      throw ApiException.network();
    } catch (_) {
      throw ApiException.network();
    }
  }

  Future<JsonMap> _sendMultipart({
    required String path,
    required Map<String, String> fields,
    required List<ApiMultipartFile> files,
    required bool authenticated,
    bool allowRefresh = true,
  }) async {
    try {
      final request = http.MultipartRequest('POST', ApiConfig.uri(path));
      final headers = await _headers(authenticated: authenticated);
      // MultipartRequest supplies its own content type and boundary.
      headers.remove('Content-Type');
      request.headers.addAll(headers);
      request.fields.addAll(fields);
      for (final file in files) {
        request.files.add(
          http.MultipartFile.fromBytes(
            file.fieldName,
            file.bytes,
            filename: file.filename,
            contentType: file.contentType,
          ),
        );
      }
      final streamed = await request.send().timeout(_requestTimeout);
      final response = await http.Response.fromStream(streamed);
      return await _handleJsonResponse(
        response,
        retry: authenticated && allowRefresh
            ? () => _sendMultipart(
                path: path,
                fields: fields,
                files: files,
                authenticated: authenticated,
                allowRefresh: false,
              )
            : null,
      );
    } on ApiException {
      rethrow;
    } on http.ClientException {
      throw ApiException.network();
    } catch (_) {
      throw ApiException.network();
    }
  }

  Future<JsonMap> _handleJsonResponse(
    http.Response response, {
    required Future<JsonMap> Function()? retry,
  }) async {
    final payload = _decodeBody(response.body);
    if (response.statusCode >= 200 && response.statusCode < 300) {
      return payload;
    }

    if (response.statusCode == 401 && retry != null && await _refreshToken()) {
      return retry();
    }

    if (response.statusCode == 401) {
      await _sessionStore.clear();
      await onAuthenticationFailure?.call();
    }
    throw _exceptionFromPayload(response.statusCode, payload);
  }

  Future<Map<String, String>> _headers({required bool authenticated}) async {
    final headers = <String, String>{
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    };
    if (authenticated) {
      final accessToken = await _sessionStore.readAccessToken();
      if (accessToken != null && accessToken.isNotEmpty) {
        headers['Authorization'] = 'Bearer $accessToken';
      }
    }
    return headers;
  }

  Future<bool> _refreshToken() async {
    final refreshToken = await _sessionStore.readRefreshToken();
    if (refreshToken == null || refreshToken.isEmpty) return false;
    try {
      final response = await _httpClient
          .post(
            ApiConfig.uri('/auth/refresh'),
            headers: const {
              'Accept': 'application/json',
              'Content-Type': 'application/json',
            },
            body: jsonEncode({'refreshToken': refreshToken}),
          )
          .timeout(_requestTimeout);
      if (response.statusCode < 200 || response.statusCode >= 300) {
        return false;
      }
      final payload = _decodeBody(response.body);
      final data = _map(payload['data']);
      final accessToken =
          _string(data['accessToken']) ?? _string(data['token']);
      final replacementRefreshToken = _string(data['refreshToken']);
      if (accessToken == null || accessToken.isEmpty) return false;
      await _sessionStore.saveTokens(
        accessToken: accessToken,
        refreshToken: replacementRefreshToken ?? refreshToken,
      );
      return true;
    } catch (_) {
      return false;
    }
  }

  JsonMap _decodeBody(String body) {
    if (body.trim().isEmpty) return <String, dynamic>{};
    try {
      final decoded = jsonDecode(body);
      return decoded is Map<String, dynamic>
          ? decoded
          : Map<String, dynamic>.from(decoded as Map);
    } catch (_) {
      return <String, dynamic>{'message': body};
    }
  }

  ApiException _exceptionFromPayload(int statusCode, JsonMap payload) {
    final errors = <String, String>{};
    final rawErrors = payload['errors'];
    if (rawErrors is List) {
      for (final raw in rawErrors) {
        if (raw is Map) {
          final field = _string(raw['field']);
          final message = _string(raw['message']);
          if (field != null && message != null) errors[field] = message;
        }
      }
    }
    return ApiException(
      statusCode: statusCode,
      code: _string(payload['code']),
      data: _map(payload['data']),
      message:
          _string(payload['message']) ??
          (statusCode >= 500
              ? 'LUNAS is temporarily unavailable. Please try again.'
              : 'We could not complete that request.'),
      fieldErrors: errors,
    );
  }
}

class ApiMultipartFile {
  const ApiMultipartFile({
    required this.fieldName,
    required this.filename,
    required this.bytes,
    this.contentType,
  });

  final String fieldName;
  final String filename;
  final List<int> bytes;
  final MediaType? contentType;
}

Map<String, dynamic> _map(Object? value) => value is Map<String, dynamic>
    ? value
    : value is Map
    ? Map<String, dynamic>.from(value)
    : <String, dynamic>{};

String? _string(Object? value) => value?.toString();
