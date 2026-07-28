/// Named routes for the static repair-personnel workflow.
///
/// Keep route registration in the application router. This file deliberately
/// contains no router dependency so the repair UI can be integrated in either
/// the existing [MaterialApp] routes table or a future GoRouter setup.
abstract final class RepairRoutes {
  static const dashboard = '/repair';
  static const workOrders = '/repair/tasks';
  static const workOrderDetails = '/repair/work-order';
  static const startRepair = '/repair/start';
  static const updateProgress = '/repair/progress';
  static const uploadEvidence = '/repair/evidence';
  static const qualityCheck = '/repair/quality';
  static const confirmCompletion = '/repair/confirm';
  static const submitted = '/repair/submitted';
  static const completed = '/repair/completed';
  static const officialVerification = '/official/verify';

  // Existing application destinations used by the repair bottom navigation.
  static const map = '/maps';
  static const alerts = '/notifications';
  static const profile = '/profile';
}
