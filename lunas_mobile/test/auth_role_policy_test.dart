import 'package:flutter_test/flutter_test.dart';
import 'package:lunas_mobile/features/auth/domain/auth_role_policy.dart';

void main() {
  test('citizens and implemented officials receive separate mobile homes', () {
    expect(mobileWorkspaceHome('citizen'), '/citizen');
    expect(mobileWorkspaceHome('barangay_official'), '/official');
    expect(mobileWorkspaceHome('city_engineer'), '/official');
    expect(mobileWorkspaceHome('admin'), '/official');
  });

  test('utility providers remain official accounts but fail closed on mobile', () {
    expect(isValidationOfficialRole('utility_provider'), isTrue);
    expect(isSupportedMobileRole('utility_provider'), isFalse);
    expect(mobileWorkspaceHome('utility_provider'), isNull);
  });

  test('unsupported roles fail closed instead of receiving citizen routes', () {
    expect(isSupportedMobileRole('repair_personnel'), isFalse);
    expect(mobileWorkspaceHome('repair_personnel'), isNull);
    expect(mobileWorkspaceHome(''), isNull);
  });
}
