import 'package:flutter_secure_storage/flutter_secure_storage.dart';

/// Stores authentication tokens and pending verification challenges in platform-backed secure storage.
/// User profile data is always refreshed from the API after app launch.
class SecureSessionStore {
  SecureSessionStore({FlutterSecureStorage? storage})
    : _storage = storage ?? const FlutterSecureStorage();

  static const _accessTokenKey = 'lunas.access_token';
  static const _refreshTokenKey = 'lunas.refresh_token';

  final FlutterSecureStorage _storage;

  Future<String?> readPendingRegistration() =>
      _storage.read(key: 'lunas.pending_registration');
  Future<void> savePendingRegistration(String value) =>
      _storage.write(key: 'lunas.pending_registration', value: value);
  Future<void> clearPendingRegistration() =>
      _storage.delete(key: 'lunas.pending_registration');

  Future<String?> readAccessToken() => _storage.read(key: _accessTokenKey);

  Future<String?> readRefreshToken() => _storage.read(key: _refreshTokenKey);

  Future<void> saveTokens({
    required String accessToken,
    String? refreshToken,
  }) async {
    await _storage.write(key: _accessTokenKey, value: accessToken);
    if (refreshToken != null && refreshToken.isNotEmpty) {
      await _storage.write(key: _refreshTokenKey, value: refreshToken);
    } else {
      await _storage.delete(key: _refreshTokenKey);
    }
  }

  Future<void> clear() async {
    await _storage.delete(key: _accessTokenKey);
    await _storage.delete(key: _refreshTokenKey);
  }
}
