import 'package:lunas_mobile/core/utils/display_labels.dart';

/// The mobile application exposes independent Citizen, Tanod and Repair workspaces.
const supportedMobileRoles = <String>{
  'citizen',
  'barangay_tanod',
  'repair_personnel',
};

bool isTanodRole(String role) => role == 'barangay_tanod';

bool isCitizenRole(String role) => role == 'citizen';

bool isSupportedMobileRole(String role) => supportedMobileRoles.contains(role);

bool isRepairPersonnelRole(String role) => role == 'repair_personnel';

/// The only authenticated entry point for each implemented mobile workspace.
/// Keeping this decision beside the role policy prevents a successful
/// sign-in from being redirected into another role's routes.
String? mobileWorkspaceHome(String role) {
  if (isTanodRole(role)) return '/tanod';
  if (isCitizenRole(role)) return '/citizen';
  if (isRepairPersonnelRole(role)) return '/repair';
  return null;
}

String roleLabel(String role) => humanizeCodeLabel(role);

/// Route access is separate from backend data authorization.
bool mobileWorkspaceAllows(String role, String path) {
  if (isTanodRole(role)) return path == '/tanod' || path.startsWith('/tanod/');
  if (isRepairPersonnelRole(role)) {
    return path == '/repair' || path.startsWith('/repair/');
  }
  if (isCitizenRole(role)) {
    return path == '/citizen' ||
        path == '/profile' ||
        path == '/notifications' ||
        path.startsWith('/notifications/') ||
        path == '/reports' ||
        path.startsWith('/reports/');
  }
  return false;
}
