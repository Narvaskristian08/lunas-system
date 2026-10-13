import 'package:lunas_mobile/features/auth/data/models/registration_mfa_challenge.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:lunas_mobile/features/auth/data/models/auth_session.dart';
import 'package:lunas_mobile/features/auth/data/models/auth_user.dart';
import 'package:lunas_mobile/features/auth/data/services/auth_service.dart';
import 'package:lunas_mobile/features/auth/presentation/controllers/auth_controller.dart';

class FakeAuth extends Fake implements AuthService {
  FakeAuth(this.role);
  final String role;
  bool persisted = false;
  bool cleared = false;
  AuthUser get user => AuthUser.fromJson({'role': role});
  @override
  Future<void> clearPendingRegistration() async {}
  @override
  Future<RegistrationMfaChallenge?> restorePendingRegistration() async => null;

  @override
  Future<AuthSession> login({
    required String email,
    required String password,
  }) async => AuthSession(user: user, accessToken: 'test-token');
  @override
  Future<void> persist(AuthSession session) async {
    persisted = true;
  }

  @override
  Future<void> clearSession() async {
    cleared = true;
  }

  @override
  Future<bool> hasStoredSession() async => true;
  @override
  Future<AuthUser> getCurrentUser() async => user;
}

void main() {
  for (final role in [
    'citizen',
    'repair_personnel',
    'admin',
    'barangay_official',
    'city_engineer',
    'utility_provider',
    'unknown',
    '',
  ]) {
    test('mobile login restricts $role', () async {
      final service = FakeAuth(role);
      final controller = AuthController(service);
      addTearDown(controller.dispose);
      final allowed = role == 'citizen' || role == 'repair_personnel';
      expect(
        await controller.login(email: 'test@example.com', password: 'password'),
        allowed,
      );
      expect(service.persisted, allowed);
      expect(service.cleared, !allowed);
      expect(
        controller.status,
        allowed ? AuthStatus.authenticated : AuthStatus.unauthenticated,
      );
      if (!allowed) {
        expect(controller.user, isNull);
        expect(
          controller.message,
          contains('only for citizen and repair personnel'),
        );
      }
    });
  }
  test('restored web account is cleared', () async {
    final service = FakeAuth('admin');
    final controller = AuthController(service);
    addTearDown(controller.dispose);
    await controller.restoreSession();
    expect(service.cleared, isTrue);
    expect(controller.status, AuthStatus.unauthenticated);
    expect(controller.user, isNull);
  });
}
