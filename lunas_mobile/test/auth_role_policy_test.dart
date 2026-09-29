import 'package:flutter_test/flutter_test.dart';
import 'package:lunas_mobile/features/auth/domain/auth_role_policy.dart';

void main() {
  test('only Citizen and Repair Personnel receive mobile workspaces', () {
    expect(mobileWorkspaceHome('citizen'), '/citizen');
    expect(isSupportedMobileRole('citizen'), isTrue);
    expect(isSupportedMobileRole('repair_personnel'), isTrue);
    expect(mobileWorkspaceHome('repair_personnel'), '/repair');
    for (final role in [
      'admin', 'barangay_official', 'city_engineer', 'utility_provider',
    ]) {
      expect(isSupportedMobileRole(role), isFalse);
      expect(mobileWorkspaceHome(role), isNull);
    }
  });

  test('unsupported roles fail closed instead of receiving citizen routes', () {
    expect(isSupportedMobileRole('unknown_role'), isFalse);
    expect(mobileWorkspaceHome('unknown_role'), isNull);
    expect(mobileWorkspaceHome(''), isNull);
  });
}
