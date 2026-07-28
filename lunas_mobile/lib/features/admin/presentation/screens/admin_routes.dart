/// Route names owned by the System Administration workspace.
///
/// They are declared here so the feature can stay self-contained while the
/// application root registers the screens.
abstract final class AdminRoutes {
  static const dashboard = '/admin';
  static const users = '/admin/users';
  static const userDetails = '/admin/users/details';
  static const verifyUser = '/admin/users/verify';
  static const auditLogs = '/admin/audit';
  static const announcements = '/admin/announcements';
  static const createAnnouncement = '/admin/announcements/create';
  static const settings = '/admin/settings';

  static const profile = '/profile';
}
