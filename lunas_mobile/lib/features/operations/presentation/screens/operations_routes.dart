/// Named routes for the static official-operations prototype.
///
/// Route registration deliberately lives in `main.dart` so this feature stays
/// independent of application composition.
abstract final class OperationsRoutes {
  static const hub = '/official';
  static const incomingReports = '/official/incoming';
  static const validateReport = '/official/validate';
  static const assignPersonnel = '/official/assign';
  static const repairVerification = '/official/verify';
  static const slaMonitoring = '/official/sla';
}
