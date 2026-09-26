import 'package:flutter_test/flutter_test.dart';
import 'package:lunas_mobile/features/auth/domain/auth_role_policy.dart';

void main() {
  test('citizens and official roles receive their authorized mobile homes', () {
    expect(mobileWorkspaceHome('citizen'), '/citizen');
    expect(mobileWorkspaceHome('barangay_official'), '/official');
    expect(mobileWorkspaceHome('city_engineer'), '/engineering');
    expect(mobileWorkspaceHome('admin'), '/official');
    expect(isSupportedMobileRole('repair_personnel'), isTrue);
    expect(mobileWorkspaceHome('repair_personnel'), '/repair');
    expect(isSupportedMobileRole('utility_provider'), isTrue);
    expect(mobileWorkspaceHome('utility_provider'), '/utility');
  });

  test('utility providers retain their official workflow boundary', () {
    expect(isValidationOfficialRole('utility_provider'), isTrue);
    expect(isUtilityProviderRole('utility_provider'), isTrue);
  });

  test('unsupported roles fail closed instead of receiving citizen routes', () {
    expect(isSupportedMobileRole('unknown_role'), isFalse);
    expect(mobileWorkspaceHome('unknown_role'), isNull);
    expect(mobileWorkspaceHome(''), isNull);
  });
}
