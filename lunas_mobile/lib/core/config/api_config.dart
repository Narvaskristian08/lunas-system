import 'package:flutter/foundation.dart';

/// Runtime configuration for the LUNAS REST API.
///
/// Set this at build/run time instead of committing environment-specific URLs:
/// `--dart-define=LUNAS_API_BASE_URL=https://api.example.gov.ph/api/v1`.
/// Local defaults are selected by target platform, while an explicit
/// `LUNAS_API_BASE_URL` define always takes precedence.
abstract final class ApiConfig {
  static const String _configuredBaseUrl = String.fromEnvironment(
    'LUNAS_API_BASE_URL',
  );

  static String get baseUrl {
    if (_configuredBaseUrl.isNotEmpty) return _configuredBaseUrl;

    // 10.0.2.2 is the Android emulator alias for the host machine. Web,
    // iOS simulator, desktop, and other targets use host loopback instead.
    return kIsWeb || defaultTargetPlatform != TargetPlatform.android
        ? 'http://localhost:5002/api/v1'
        : 'http://10.0.2.2:5000/api/v1';
  }

  static Uri uri(String path, [Map<String, String>? queryParameters]) {
    final normalizedPath = path.startsWith('/') ? path.substring(1) : path;
    return Uri.parse('${baseUrl.replaceFirst(RegExp(r'/+$'), '')}/$normalizedPath')
        .replace(queryParameters: queryParameters);
  }
}
