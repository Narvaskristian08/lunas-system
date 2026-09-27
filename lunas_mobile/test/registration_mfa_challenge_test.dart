import 'package:flutter_test/flutter_test.dart';
import 'package:lunas_mobile/features/auth/data/models/registration_mfa_challenge.dart';

void main() {
  test('parses the backend registration MFA challenge', () {
    final challenge = RegistrationMfaChallenge.fromResponse({
      'success': true,
      'data': {
        'challengeToken': List.filled(64, 'a').join(),
        'email': 'juan@example.com',
        'expiresInSeconds': 600,
        'resendAfterSeconds': 60,
      },
    });

    expect(challenge.email, 'juan@example.com');
    expect(challenge.challengeToken.length, 64);
    expect(challenge.expiresInSeconds, 600);
    expect(challenge.resendAfterSeconds, 60);
  });
}
