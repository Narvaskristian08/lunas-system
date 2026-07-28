/// Named destinations for the static engineering workspace.
///
/// Route registration belongs to the application shell so this feature can be
/// moved to a router without bringing router dependencies into its screens.
abstract final class EngineeringRoutes {
  static const dashboard = '/engineering';
  static const incidents = '/engineering/incidents';
  static const incidentDetails = '/engineering/incidents/details';
  static const map = '/engineering/map';
  static const utilityAssignment = '/engineering/utility-assignment';
  static const sla = '/engineering/sla';
  static const analytics = '/engineering/analytics';
  static const performance = '/engineering/performance';
  static const verifyRepair = '/engineering/verify';
}
