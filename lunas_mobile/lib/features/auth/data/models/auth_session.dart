import 'package:lunas_mobile/features/auth/data/models/auth_user.dart';

class AuthSession {
  const AuthSession({
    required this.user,
    required this.accessToken,
    this.refreshToken,
  });

  final AuthUser user;
  final String accessToken;
  final String? refreshToken;

  factory AuthSession.fromResponse(Map<String, dynamic> payload) {
    final data = authData(payload);
    final userValue = data['user'];
    final user = userValue is Map<String, dynamic>
        ? AuthUser.fromJson(userValue)
        : userValue is Map
        ? AuthUser.fromJson(Map<String, dynamic>.from(userValue))
        : throw const FormatException('The server did not return an account.');
    final accessToken = (data['accessToken'] ?? data['token'] ?? '').toString();
    if (accessToken.isEmpty) {
      throw const FormatException('The server did not return a session token.');
    }
    return AuthSession(
      user: user,
      accessToken: accessToken,
      refreshToken: data['refreshToken']?.toString(),
    );
  }
}
