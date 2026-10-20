import 'dart:io';

import 'package:lunas_mobile/features/auth/domain/auth_role_policy.dart';

// SDK-only route-policy check; does not certify Flutter widgets or navigation.
void main() {
  var count = 0;
  void check(bool result) {
    if (!result) throw StateError('Route policy check ${count + 1} failed');
    count++;
  }

  check(mobileWorkspaceHome('barangay_tanod') == '/tanod');
  check(mobileWorkspaceHome('repair_personnel') == '/repair');
  check(mobileWorkspaceHome('citizen') == '/citizen');
  check(mobileWorkspaceHome('unknown') == null);
  check(mobileWorkspaceAllows('barangay_tanod', '/tanod/inspections'));
  check(mobileWorkspaceAllows('barangay_tanod', '/tanod/notifications'));
  check(!mobileWorkspaceAllows('barangay_tanod', '/repair/work-orders/id'));
  check(!mobileWorkspaceAllows('repair_personnel', '/tanod'));
  check(mobileWorkspaceAllows('repair_personnel', '/repair/work-orders/id'));
  check(!mobileWorkspaceAllows('citizen', '/tanod/inspections'));
  check(!mobileWorkspaceAllows('unknown', '/tanod'));
  check(!mobileWorkspaceAllows('barangay_tanod', '/tanod-other'));
  stdout.writeln('$count SDK-only role/route checks passed');
}
