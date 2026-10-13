import 'package:lunas_mobile/features/auth/presentation/screens/registration_password_screen.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:lunas_mobile/core/storage/secure_session_store.dart';
import 'package:lunas_mobile/core/network/api_client.dart';
import 'package:lunas_mobile/features/auth/data/services/auth_service.dart';
import 'package:lunas_mobile/features/auth/data/models/registration_mfa_challenge.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  test('password requirements match web policy', () {
    expect(validatePassword('Abc12345!'), isNull);
    expect(validatePassword('LongPassword123'), isNull);
    expect(validatePassword('LongPassword123!'), isNull);
    expect(validatePassword('password'), isNotNull);
  });
  test('password validation enforces backend length maximum', () {
    expect(validatePassword("Aa1!${'x' * 68}"), isNull);
    expect(validatePassword("Aa1!${'x' * 69}"), isNotNull);
    expect(validatePassword("Aa1!${'é' * 35}"), isNotNull);
  });
  test(
    'pending verification restores in a new service and can be cleared',
    () async {
      FlutterSecureStorage.setMockInitialValues({});
      AuthService service() {
        final store = SecureSessionStore();
        return AuthService(
          apiClient: ApiClient(sessionStore: store),
          sessionStore: store,
        );
      }

      await service().savePendingRegistration(
        const RegistrationMfaChallenge(
          challengeToken: 'resume-token',
          email: 'citizen@example.test',
          expiresInSeconds: 600,
          resendAfterSeconds: 60,
        ),
      );
      final restored = await service().restorePendingRegistration();
      expect(restored?.challengeToken, 'resume-token');
      expect(restored?.email, 'citizen@example.test');
      expect(restored!.resendAfterSeconds, lessThanOrEqualTo(60));
      await service().clearPendingRegistration();
      expect(await service().restorePendingRegistration(), isNull);
    },
  );
}
