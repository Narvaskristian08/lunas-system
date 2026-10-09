import 'package:lunas_mobile/features/reporting/data/models/incident_report.dart';
import 'package:lunas_mobile/features/reporting/presentation/screens/barangay_picker_screen.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:lunas_mobile/app/app_services.dart';
import 'package:lunas_mobile/features/citizen/presentation/widgets/citizen_bottom_navigation.dart';
import 'package:lunas_mobile/features/auth/presentation/controllers/auth_controller.dart';
import 'package:lunas_mobile/features/auth/presentation/screens/app_splash_screen.dart';
import 'package:lunas_mobile/features/auth/presentation/screens/citizen_login_screen.dart';
import 'package:lunas_mobile/features/auth/presentation/screens/citizen_registration_screen.dart';
import 'package:lunas_mobile/features/auth/presentation/screens/otp_verification_screen.dart';
import 'package:lunas_mobile/features/auth/presentation/screens/password_recovery_screen.dart';
import 'package:lunas_mobile/features/auth/presentation/screens/reset_password_with_token_screen.dart';
import 'package:lunas_mobile/features/auth/presentation/screens/role_unavailable_screen.dart';
import 'package:lunas_mobile/features/auth/presentation/screens/onboarding_screen.dart';
import 'package:lunas_mobile/features/citizen/presentation/screens/citizen_dashboard_screen.dart';
import 'package:lunas_mobile/features/reporting/presentation/screens/my_drafts_screen.dart';
import 'package:lunas_mobile/features/reporting/presentation/screens/report_timeline_screen.dart';
import 'package:lunas_mobile/features/maps/domain/models/selected_location.dart';
import 'package:lunas_mobile/features/maps/presentation/screens/map_picker_screen.dart';
import 'package:lunas_mobile/features/notifications/presentation/screens/notifications_screen.dart';
import 'package:lunas_mobile/features/notifications/presentation/screens/notification_details_screen.dart';
import 'package:lunas_mobile/features/notifications/presentation/widgets/notification_widgets.dart';
import 'package:lunas_mobile/features/profile/presentation/screens/citizen_profile_screen.dart';
import 'package:lunas_mobile/features/repair/presentation/screens/assigned_work_orders_screen.dart';
import 'package:lunas_mobile/features/repair/presentation/screens/repair_dashboard_screen.dart';
import 'package:lunas_mobile/features/repair/presentation/screens/repair_profile_screen.dart';
import 'package:lunas_mobile/features/repair/presentation/screens/repair_work_order_location_screen.dart';
import 'package:lunas_mobile/features/repair/presentation/screens/update_repair_progress_screen.dart';
import 'package:lunas_mobile/features/repair/presentation/screens/work_order_details_screen.dart';
import 'package:lunas_mobile/features/reporting/data/models/category_option.dart';
import 'package:lunas_mobile/features/reporting/domain/models/citizen_report_draft.dart';
import 'package:lunas_mobile/features/reporting/presentation/screens/category_picker_screen.dart';
import 'package:lunas_mobile/features/reporting/presentation/screens/citizen_report_detail_screen.dart';
import 'package:lunas_mobile/features/reporting/presentation/screens/evidence_picker_screen.dart';
import 'package:lunas_mobile/features/reporting/presentation/screens/my_reports_screen.dart';
import 'package:lunas_mobile/features/reporting/presentation/screens/new_citizen_report_screen.dart';
import 'package:lunas_mobile/features/reporting/presentation/screens/report_review_screen.dart';

final GlobalKey<NavigatorState> rootNavigatorKey = GlobalKey<NavigatorState>(
  debugLabel: 'root',
);

final GoRouter appRouter = GoRouter(
  navigatorKey: rootNavigatorKey,
  initialLocation: '/splash',
  refreshListenable: authController,
  debugLogDiagnostics: false,
  redirect: (context, state) {
    final location = state.uri.path;
    const publicLocations = {
      '/onboarding',
      '/login',
      '/register',
      '/register/verify',
      '/forgot-password',
      '/reset-password',
    };
    final isPublic = publicLocations.contains(location);
    final isCitizenLocation = isCitizenWorkspaceLocation(location);
    final isRepairLocation = isRepairWorkspaceLocation(location);
    switch (authController.status) {
      case AuthStatus.initializing:
        return location == '/splash' ? null : '/splash';
      case AuthStatus.restoreFailed:
        return location == '/splash' || isPublic ? null : '/splash';
      case AuthStatus.unauthenticated:
        if (location == '/register/verify' &&
            authController.pendingRegistration == null) {
          return '/register';
        }
        return isPublic ? null : '/onboarding';
      case AuthStatus.roleUnavailable:
        return location == '/role-unavailable' ? null : '/role-unavailable';
      case AuthStatus.authenticated:
        final home = authController.workspaceHomePath;
        if (home == null) return '/role-unavailable';
        if (isPublic ||
            location == '/splash' ||
            location == '/role-unavailable') {
          return home;
        }
        // Mobile exposes only Citizen and Repair Personnel workspaces. This
        // is a presentation guard; the backend remains authoritative for
        // access and every API request.
        if (authController.isCitizen) {
          return isCitizenLocation ? null : home;
        }
        if (authController.isRepairPersonnel) {
          return isRepairLocation ? null : home;
        }
        return '/role-unavailable';
    }
  },
  routes: [
    GoRoute(path: '/splash', builder: (_, _) => const AppSplashScreen()),
    GoRoute(path: '/onboarding', builder: (_, _) => const OnboardingScreen()),
    GoRoute(path: '/login', builder: (_, _) => const CitizenLoginScreen()),
    GoRoute(
      path: '/register',
      builder: (_, _) => const CitizenRegistrationScreen(),
    ),
    GoRoute(
      path: '/register/verify',
      builder: (_, _) => const OtpVerificationScreen(),
    ),
    GoRoute(
      path: '/forgot-password',
      builder: (_, _) => const PasswordRecoveryScreen(),
    ),
    GoRoute(
      path: '/reset-password',
      builder: (_, state) => ResetPasswordWithTokenScreen(
        initialToken: state.uri.queryParameters['token'],
      ),
    ),
    GoRoute(
      path: '/role-unavailable',
      builder: (_, _) => const RoleUnavailableScreen(),
    ),
    ShellRoute(
      builder: (context, state, child) => Scaffold(
        body: child,
        bottomNavigationBar: const CitizenBottomNavigation(),
      ),
      routes: [
        GoRoute(
          path: '/citizen',
          builder: (_, state) => CitizenDashboardScreen(
            key: ValueKey(
              state.extra is IncidentReport
                  ? (state.extra as IncidentReport).id
                  : 'home',
            ),
            submittedReport: state.extra is IncidentReport
                ? state.extra as IncidentReport
                : null,
          ),
        ),
        GoRoute(path: '/reports', builder: (_, _) => const MyReportsScreen()),
        GoRoute(
          path: '/reports/new',
          builder: (_, _) => const NewCitizenReportScreen(),
        ),
        GoRoute(
          path: '/reports/evidence',
          builder: (_, _) => const EvidencePickerScreen(),
        ),
        GoRoute(
          path: '/reports/barangays',
          builder: (_, state) => state.extra is List<String>
              ? BarangayPickerScreen(barangays: state.extra as List<String>)
              : const _MissingRouteDataScreen(
                  message: 'Start a new report before selecting a barangay.',
                ),
        ),
        GoRoute(
          path: '/reports/categories',
          builder: (_, state) => CategoryPickerScreen(
            selected: state.extra is CategoryOption
                ? state.extra as CategoryOption
                : null,
          ),
        ),
        GoRoute(
          path: '/reports/location',
          builder: (_, state) => MapPickerScreen(
            showLocationConfirmation:
                state.uri.queryParameters['mode'] == 'picker',
            initialLocation: state.extra is SelectedLocation
                ? state.extra as SelectedLocation
                : null,
          ),
        ),
        GoRoute(
          path: '/reports/review',
          builder: (_, state) {
            final draft = state.extra;
            return draft is CitizenReportDraft
                ? ReportReviewScreen(draft: draft)
                : const _MissingRouteDataScreen(
                    message: 'Start a new report before reviewing it.',
                  );
          },
        ),
        GoRoute(
          path: '/reports/drafts',
          builder: (_, _) => const MyDraftsScreen(),
        ),
        GoRoute(
          path: '/reports/:id/timeline',
          builder: (_, state) =>
              ReportTimelineScreen(reportId: state.pathParameters['id'] ?? ''),
        ),
        GoRoute(
          path: '/reports/:id',
          builder: (_, state) => CitizenReportDetailScreen(
            reportId: state.pathParameters['id'] ?? '',
          ),
        ),
        GoRoute(
          path: '/profile',
          builder: (_, _) => const CitizenProfileScreen(),
        ),
        GoRoute(
          path: '/notifications',
          builder: (_, _) => const NotificationsScreen(),
        ),
        GoRoute(
          path: '/notifications/details',
          builder: (_, state) => NotificationDetailsScreen(
            item: state.extra is NotificationData
                ? state.extra as NotificationData
                : null,
          ),
        ),
      ],
    ),
    GoRoute(path: '/repair', builder: (_, _) => const RepairDashboardScreen()),
    GoRoute(
      path: '/repair/work-orders',
      builder: (_, state) => AssignedWorkOrdersScreen(
        initialFilter: state.uri.queryParameters['filter'],
      ),
    ),
    GoRoute(
      path: '/repair/work-orders/:id/progress',
      builder: (_, state) => UpdateRepairProgressScreen(
        workOrderId: state.pathParameters['id'] ?? '',
      ),
    ),
    GoRoute(
      path: '/repair/work-orders/:id/location',
      builder: (_, state) => RepairWorkOrderLocationScreen(
        workOrderId: state.pathParameters['id'] ?? '',
      ),
    ),
    GoRoute(
      path: '/repair/work-orders/:id',
      builder: (_, state) =>
          WorkOrderDetailsScreen(workOrderId: state.pathParameters['id'] ?? ''),
    ),
    GoRoute(
      path: '/repair/notifications',
      builder: (_, _) => const NotificationsScreen(repairWorkspace: true),
    ),
    GoRoute(
      path: '/repair/notifications/details',
      builder: (_, state) => NotificationDetailsScreen(
        repairWorkspace: true,
        item: state.extra is NotificationData
            ? state.extra as NotificationData
            : null,
      ),
    ),
    GoRoute(
      path: '/repair/profile',
      builder: (_, _) => const RepairProfileScreen(),
    ),
  ],
  errorBuilder: (_, state) =>
      Scaffold(body: Center(child: Text('Page not found: ${state.uri.path}'))),
);

bool isCitizenWorkspaceLocation(String location) =>
    location == '/citizen' ||
    location == '/profile' ||
    location == '/notifications' ||
    location.startsWith('/notifications/') ||
    location == '/reports' ||
    location.startsWith('/reports/');

bool isRepairWorkspaceLocation(String location) =>
    location == '/repair' || location.startsWith('/repair/');

class _MissingRouteDataScreen extends StatelessWidget {
  const _MissingRouteDataScreen({required this.message});
  final String message;

  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: const Text('Report')),
    body: Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.info_outline_rounded, size: 48),
            const SizedBox(height: 16),
            Text(message, textAlign: TextAlign.center),
            const SizedBox(height: 16),
            FilledButton(
              onPressed: () => context.go('/reports/new'),
              child: const Text('Start a report'),
            ),
          ],
        ),
      ),
    ),
  );
}
