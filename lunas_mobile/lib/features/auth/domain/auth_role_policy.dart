/// Roles with a usable mobile workspace. This is only a presentation guard;
/// the API remains authoritative for every incident and work-order request.
const supportedMobileRoles = <String>{
  'citizen',
  'barangay_official',
  'city_engineer',
  'admin',
  'repair_personnel',
  'utility_provider',
};

const validationOfficialRoles = <String>{
  'barangay_official',
  'city_engineer',
  'utility_provider',
  'admin',
};

bool isCitizenRole(String role) => role == 'citizen';

bool isValidationOfficialRole(String role) =>
    validationOfficialRoles.contains(role);

bool isSupportedMobileRole(String role) => supportedMobileRoles.contains(role);

bool isUtilityProviderRole(String role) => role == 'utility_provider';

bool isRepairPersonnelRole(String role) => role == 'repair_personnel';

/// The only authenticated entry point for each implemented mobile workspace.
/// Keeping this decision beside the role policy prevents a successful official
/// sign-in from being redirected into citizen reporting routes.
String? mobileWorkspaceHome(String role) {
  if (isCitizenRole(role)) return '/citizen';
  if (isRepairPersonnelRole(role)) return '/repair';
  if (isUtilityProviderRole(role)) return '/utility';
  if (role == 'barangay_official') return '/official';
  if (role == 'city_engineer') return '/engineering';
  if (role == 'admin') return '/official';
  return null;
}

String roleLabel(String role) => role
    .replaceAll('_', ' ')
    .split(' ')
    .where((part) => part.isNotEmpty)
    .map((part) => '${part[0].toUpperCase()}${part.substring(1)}')
    .join(' ');
