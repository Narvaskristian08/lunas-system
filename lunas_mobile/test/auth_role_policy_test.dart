import 'package:flutter_test/flutter_test.dart';
import 'package:lunas_mobile/features/auth/domain/auth_role_policy.dart';

void main() {
  test('citizens and repair personnel receive the supported mobile homes', () {
    expect(mobileWorkspaceHome('citizen'), '/citizen');
    expect(isSupportedMobileRole('citizen'), isTrue);
    expect(isSupportedMobileRole('repair_personnel'), isTrue);
    expect(mobileWorkspaceHome('repair_personnel'), '/repair');
  });

  test(
    'Tanod and Repair Personnel have distinct homes and reject cross-role paths',
    () {
      expect(mobileWorkspaceHome('barangay_tanod'), '/tanod');
      expect(
        mobileWorkspaceAllows('barangay_tanod', '/tanod/inspections'),
        isTrue,
      );
      expect(
        mobileWorkspaceAllows('barangay_tanod', '/repair/work-orders/id'),
        isFalse,
      );
      expect(
        mobileWorkspaceAllows('repair_personnel', '/tanod/inspections'),
        isFalse,
      );
      expect(
        mobileWorkspaceAllows('repair_personnel', '/repair/work-orders/id'),
        isTrue,
      );
      expect(mobileWorkspaceAllows('citizen', '/tanod'), isFalse);
      expect(mobileWorkspaceAllows('unknown', '/tanod'), isFalse);
    },
  );

  test(
    'web-only and unknown roles fail closed instead of receiving mobile homes',
    () {
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
    },
  );

  test('empty roles fail closed instead of receiving mobile homes', () {
    expect(mobileWorkspaceHome(''), isNull);
  });
}
