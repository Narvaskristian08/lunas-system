import 'dart:convert';
import 'package:lunas_mobile/core/network/api_client.dart';
import 'package:lunas_mobile/core/storage/secure_session_store.dart';
import 'package:lunas_mobile/features/auth/data/models/auth_session.dart';
import 'package:lunas_mobile/features/auth/data/models/auth_user.dart';
import 'package:lunas_mobile/features/auth/data/models/registration_mfa_challenge.dart';

class AuthService {
  const AuthService({
    required ApiClient apiClient,
    required SecureSessionStore sessionStore,
  }) : _apiClient = apiClient,
       _sessionStore = sessionStore;

  final ApiClient _apiClient;
  final SecureSessionStore _sessionStore;

  Future<void> savePendingRegistration(RegistrationMfaChallenge challenge) =>
      _sessionStore.savePendingRegistration(
        jsonEncode({
          'challengeToken': challenge.challengeToken,
          'email': challenge.email,
          'expiresAt': DateTime.now()
              .add(Duration(seconds: challenge.expiresInSeconds))
              .millisecondsSinceEpoch,
          'resendAt': DateTime.now()
              .add(Duration(seconds: challenge.resendAfterSeconds))
              .millisecondsSinceEpoch,
        }),
      );
  Future<void> clearPendingRegistration() =>
      _sessionStore.clearPendingRegistration();
  Future<RegistrationMfaChallenge?> restorePendingRegistration() async {
    final raw = await _sessionStore.readPendingRegistration();
    if (raw == null) return null;
    try {
      final data = jsonDecode(raw) as Map<String, dynamic>;
      final now = DateTime.now().millisecondsSinceEpoch;
      return RegistrationMfaChallenge.fromResponse({
        'data': {
          'challengeToken': data['challengeToken'],
          'email': data['email'],
          'expiresInSeconds': ((data['expiresAt'] as int) - now) ~/ 1000,
          'resendAfterSeconds': (((data['resendAt'] as int) - now) ~/ 1000)
              .clamp(0, 3600),
        },
      });
    } catch (_) {
      await clearPendingRegistration();
      return null;
    }
  }

  Future<AuthSession> login({
    required String email,
    required String password,
  }) async {
    final payload = await _apiClient.post(
      '/auth/login',
      authenticated: false,
      body: {'email': email, 'password': password},
    );
    return AuthSession.fromResponse(payload);
  }

  Future<RegistrationMfaChallenge> register({
    required String firstName,
    String? middleName,
    bool noMiddleName = false,
    String? suffix,
    required String lastName,
    required String email,
    String? phone,
    required String password,
  }) async {
    final payload = await _apiClient.post(
      '/auth/register',
      authenticated: false,
      body: {
        'firstName': firstName,
        'noMiddleName': noMiddleName,
        if (middleName != null && middleName.trim().isNotEmpty)
          'middleName': middleName.trim(),
        if (suffix != null && suffix.trim().isNotEmpty) 'suffix': suffix.trim(),
        'lastName': lastName,
        'email': email,
        if (phone != null && phone.trim().isNotEmpty) 'phone': phone.trim(),
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
    String? middleName,
    String? suffix,
    bool? noMiddleName,
    Map<String, dynamic>? currentAddress,
    String? address,
  }) async {
    final payload = await _apiClient.patch(
      '/users/me',
      body: {
        'firstName': firstName,
        'lastName': lastName,
        'phone': phone,
        'middleName': ?middleName,
        'suffix': ?suffix,
        'noMiddleName': ?noMiddleName,
        if (address != null)
          'address': {...?currentAddress, 'street': address.trim()},
      },
    );
    return AuthUser.fromJson(authData(payload));
  }

  Future<AuthSession> changePassword({
    required String currentPassword,
    required String newPassword,
  }) async {
    final response = await _apiClient.put(
      '/auth/change-password',
      body: {'currentPassword': currentPassword, 'newPassword': newPassword},
    );
    return AuthSession.fromResponse(response);
  }

  Future<void> requestPasswordReset(String email) async {
    await _apiClient.post(
      '/auth/forgot-password',
      authenticated: false,
      body: {'email': email},
    );
  }

  Future<AuthSession> resetPassword({
    required String token,
    required String password,
  }) async {
    final payload = await _apiClient.post(
      '/auth/reset-password',
      authenticated: false,
      body: {'token': token, 'password': password},
    );
    return AuthSession.fromResponse(payload);
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
