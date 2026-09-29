import 'package:flutter_test/flutter_test.dart';
import 'package:lunas_mobile/features/auth/domain/auth_role_policy.dart';

void main() {
<<<<<<< Updated upstream
  test('only Citizen and Repair Personnel receive mobile workspaces', () {
=======
  test('citizens and repair personnel receive the supported mobile homes', () {
>>>>>>> Stashed changes
    expect(mobileWorkspaceHome('citizen'), '/citizen');
    expect(isSupportedMobileRole('citizen'), isTrue);
    expect(isSupportedMobileRole('repair_personnel'), isTrue);
    expect(mobileWorkspaceHome('repair_personnel'), '/repair');
<<<<<<< Updated upstream
    for (final role in [
      'admin', 'barangay_official', 'city_engineer', 'utility_provider',
=======
  });

  test('web-only and unknown roles fail closed instead of receiving mobile routes', () {
    for (final role in [
      'barangay_official',
      'city_engineer',
      'utility_provider',
      'admin',
      'unknown_role',
>>>>>>> Stashed changes
    ]) {
      expect(isSupportedMobileRole(role), isFalse);
      expect(mobileWorkspaceHome(role), isNull);
    }
<<<<<<< Updated upstream
  });

  test('unsupported roles fail closed instead of receiving citizen routes', () {
    expect(isSupportedMobileRole('unknown_role'), isFalse);
    expect(mobileWorkspaceHome('unknown_role'), isNull);
=======
>>>>>>> Stashed changes
    expect(mobileWorkspaceHome(''), isNull);
  });
}
