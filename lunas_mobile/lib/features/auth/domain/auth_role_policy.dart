import 'package:lunas_mobile/core/utils/display_labels.dart';

/// Utility Personnel use the Tanod workspace; legacy repair roles stay distinct.
const supportedMobileRoles = <String>{'citizen', 'utility_personnel', 'repair_personnel'};

bool isCitizenRole(String role) => role == 'citizen';

bool isSupportedMobileRole(String role) => supportedMobileRoles.contains(role);

bool isUtilityPersonnelRole(String role) => role == 'utility_personnel';

bool isRepairPersonnelRole(String role) => role == 'repair_personnel';

/// The only authenticated entry point for each implemented mobile workspace.
/// Keeping this decision beside the role policy prevents a successful
/// sign-in from being redirected into another role's routes.
String? mobileWorkspaceHome(String role) {
  if (isCitizenRole(role)) return '/citizen';
  if (isUtilityPersonnelRole(role)) return '/repair';
  if (isRepairPersonnelRole(role)) return '/repair';
  return null;
}

String roleLabel(String role) => humanizeCodeLabel(role);
