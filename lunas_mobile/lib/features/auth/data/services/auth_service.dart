import 'package:flutter/foundation.dart';
import 'package:lunas_mobile/core/network/api_client.dart';
import 'package:lunas_mobile/core/storage/secure_session_store.dart';
import 'package:lunas_mobile/features/auth/data/models/auth_session.dart';
import 'package:lunas_mobile/features/auth/data/models/auth_user.dart';
import 'package:lunas_mobile/features/auth/data/models/login_result.dart';
import 'package:lunas_mobile/features/auth/data/models/privileged_login_mfa_challenge.dart';
import 'package:lunas_mobile/features/auth/data/models/registration_mfa_challenge.dart';

class AuthService {
  const AuthService({
    required ApiClient apiClient,
    required SecureSessionStore sessionStore,
  }) : _apiClient = apiClient,
       _sessionStore = sessionStore;

  final ApiClient _apiClient;
  final SecureSessionStore _sessionStore;

  String get _platform => switch (defaultTargetPlatform) {
    TargetPlatform.iOS => 'ios',
    _ => 'android',
  };

  Future<LoginResult> login({
    required String email,
    required String password,
  }) async {
    final payload = await _apiClient.post(
      '/auth/login',
      authenticated: false,
      body: {'email': email, 'password': password, 'platform': _platform},
    );
    return LoginResult.fromResponse(payload);
  }

  Future<AuthSession> verifyPrivilegedLoginMfa({
    required PrivilegedLoginMfaChallenge challenge,
    required String code,
  }) async {
    final payload = await _apiClient.post(
      '/auth/login/verify',
      authenticated: false,
      body: {
        'email': challenge.email,
        'challengeToken': challenge.challengeToken,
        'code': code,
        'platform': _platform,
      },
    );
    return AuthSession.fromResponse(payload);
  }

  Future<PrivilegedLoginMfaChallenge> resendPrivilegedLoginMfa(
    PrivilegedLoginMfaChallenge challenge,
  ) async {
    final payload = await _apiClient.post(
      '/auth/login/resend',
      authenticated: false,
      body: {
        'email': challenge.email,
        'challengeToken': challenge.challengeToken,
        'platform': _platform,
      },
    );
    return PrivilegedLoginMfaChallenge.fromResponse(payload);
  }

  Future<RegistrationMfaChallenge> register({
    required String firstName,
    required String lastName,
    required String email,
    required String phone,
    required String password,
  }) async {
    final payload = await _apiClient.post(
      '/auth/register',
      authenticated: false,
      body: {
        'firstName': firstName,
        'lastName': lastName,
        'email': email,
        'phone': phone,
        'password': password,
        // Public mobile registration must never self-assign a privileged role.
        'role': 'citizen',
      },
    );
    return RegistrationMfaChallenge.fromResponse(payload);
  }

  Future<AuthSession> verifyRegistrationMfa({
    required RegistrationMfaChallenge challenge,
    required String code,
  }) async {
    final payload = await _apiClient.post(
      '/auth/register/verify',
      authenticated: false,
      body: {
        'email': challenge.email,
        'challengeToken': challenge.challengeToken,
        'code': code,
      },
    );
    return AuthSession.fromResponse(payload);
  }

  Future<RegistrationMfaChallenge> resendRegistrationMfa(
    RegistrationMfaChallenge challenge,
  ) async {
    final payload = await _apiClient.post(
      '/auth/register/resend',
      authenticated: false,
      body: {
        'email': challenge.email,
        'challengeToken': challenge.challengeToken,
      },
    );
    return RegistrationMfaChallenge.fromResponse(payload);
  }

  Future<AuthUser> getCurrentUser() async {
    final payload = await _apiClient.get('/auth/me');
    return AuthUser.fromJson(authData(payload));
  }

  Future<AuthUser> updateProfile({
    required String firstName,
    required String lastName,
    required String phone,
    String? address,
  }) async {
    final payload = await _apiClient.patch(
      '/users/me',
      body: {
        'firstName': firstName,
        'lastName': lastName,
        'phone': phone,
        if (address != null) 'address': {'street': address.trim()},
      },
    );
    return AuthUser.fromJson(authData(payload));
  }

  Future<void> requestPasswordReset(String email) async {
    await _apiClient.post(
      '/auth/forgot-password',
      authenticated: false,
      body: {'email': email},
    );
  }

  Future<void> resetPassword({
    required String token,
    required String password,
  }) async {
    await _apiClient.post(
      '/auth/reset-password',
      authenticated: false,
      body: {'token': token, 'password': password},
    );
  }

  Future<void> persist(AuthSession session) {
    return _sessionStore.saveTokens(
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
    );
  }

  Future<bool> hasStoredSession() async {
    final accessToken = await _sessionStore.readAccessToken();
    return accessToken != null && accessToken.isNotEmpty;
  }

  Future<void> logout() async {
    try {
      await _apiClient.post('/auth/logout');
    } catch (_) {
      // A network failure cannot prevent a person from clearing this device's
      // locally stored session. The server-side token expires/revocation can be
      // retried on the next authenticated session.
    } finally {
      await _sessionStore.clear();
    }
  }

  Future<void> clearSession() => _sessionStore.clear();
}
