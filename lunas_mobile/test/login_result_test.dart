import 'package:flutter_test/flutter_test.dart';
import 'package:lunas_mobile/features/auth/data/models/login_result.dart';

void main() {
  test(
    'parses a privileged MFA challenge without requiring a session token',
    () {
      final result = LoginResult.fromResponse({
        'success': true,
        'data': {
          'mfaRequired': true,
          'challengeToken': List.filled(64, 'b').join(),
          'email': 'official@example.com',
          'expiresInSeconds': 600,
          'resendAfterSeconds': 60,
        },
      });

      expect(result.session, isNull);
      expect(result.mfaChallenge?.email, 'official@example.com');
      expect(result.mfaChallenge?.challengeToken.length, 64);
    },
  );

  test('keeps the existing direct session response for ordinary accounts', () {
    final result = LoginResult.fromResponse({
      'success': true,
      'data': {
        'accessToken': 'access-token',
        'refreshToken': 'refresh-token',
        'user': {
          'id': 'citizen-1',
          'firstName': 'Juan',
          'lastName': 'Dela Cruz',
          'email': 'juan@example.com',
          'phone': '09123456789',
          'role': 'citizen',
          'isVerified': true,
        },
      },
    });

    expect(result.mfaChallenge, isNull);
    expect(result.session?.accessToken, 'access-token');
    expect(result.session?.user.role, 'citizen');
  });
}
