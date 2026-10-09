/// Paths used by the authenticated repair-personnel workspace.
abstract final class RepairRoutes {
  static const dashboard = '/repair';
  static const workOrders = '/repair/work-orders';
  static const notifications = '/repair/notifications';
  static const notificationDetails = '/repair/notifications/details';
  static const profile = '/repair/profile';

  static String workOrder(String id) => '$workOrders/$id';
  static String start(String id) => '${workOrder(id)}/start';
  static String progress(String id) => '${workOrder(id)}/progress';
  static String location(String id) => '${workOrder(id)}/location';
}
