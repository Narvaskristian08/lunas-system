/// Paths used by the authenticated utility-provider workspace.
abstract final class UtilityRoutes {
  static const dashboard = '/utility';
  static const workOrders = '/utility/work-orders';

  // Legacy prototype destinations remain declared while their screens are
  // retained in the source tree. The authenticated router intentionally uses
  // only the live dashboard and work-order monitor above.
  static const incidents = '/utility/incidents';
  static const incidentDetails = '/utility/incidents/details';
  static const acceptAssignment = '/utility/accept-assignment';
  static const map = '/utility/map';
  static const alerts = '/utility/alerts';
  static const profile = '/utility/profile';
}
