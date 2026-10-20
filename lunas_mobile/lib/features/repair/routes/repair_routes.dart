import 'package:lunas_mobile/app/app_services.dart';

/// Paths used by the authenticated repair-personnel workspace.
abstract final class RepairRoutes {
  static String get dashboard => authController.isTanod ? '/tanod' : '/repair';
  static String get workOrders =>
      authController.isTanod ? '/tanod/inspections' : '/repair/work-orders';
  static String get notifications => '$dashboard/notifications';
  static String get notificationDetails => '$notifications/details';
  static String get profile => '$dashboard/profile';

  static String workOrder(String id) => '$workOrders/$id';
  static String filteredWorkOrders(String filter) =>
      '$workOrders?filter=${Uri.encodeQueryComponent(filter)}';
  static String progress(String id) => '${workOrder(id)}/progress';
  static String location(String id) => '${workOrder(id)}/location';
}
