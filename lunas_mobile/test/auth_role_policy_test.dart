import 'package:flutter_test/flutter_test.dart';
import 'package:lunas_mobile/features/auth/domain/auth_role_policy.dart';

void main() {
  test('Utility Personnel use the Tanod workspace with a distinct role', () {
    expect(isSupportedMobileRole('utility_personnel'), isTrue);
    expect(isUtilityPersonnelRole('utility_personnel'), isTrue);
    expect(isRepairPersonnelRole('utility_personnel'), isFalse);
    expect(mobileWorkspaceHome('utility_personnel'), '/repair');
    expect(isSupportedMobileRole('barangay_tanod'), isFalse);
  });
  test('citizens and repair personnel receive the supported mobile homes', () {
    expect(mobileWorkspaceHome('citizen'), '/citizen');
    expect(isSupportedMobileRole('citizen'), isTrue);
    expect(isSupportedMobileRole('repair_personnel'), isTrue);
    expect(mobileWorkspaceHome('repair_personnel'), '/repair');
  });

  test('web-only and unknown roles fail closed instead of receiving mobile homes', () {
    for (final role in [
      'barangay_official',
      'city_engineer',
      'utility_provider',
      'admin',
      'unknown_role',
    ]) {
      expect(isSupportedMobileRole(role), isFalse);
      expect(mobileWorkspaceHome(role), isNull);
    }
  });

  test('empty roles fail closed instead of receiving mobile homes', () {
    expect(mobileWorkspaceHome(''), isNull);
  });
}
