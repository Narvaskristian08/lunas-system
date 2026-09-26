import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:lunas_mobile/core/app_services.dart';
import 'package:lunas_mobile/core/widgets/citizen_bottom_navigation.dart';
import 'package:lunas_mobile/core/widgets/backend_dependency_screen.dart';
import 'package:lunas_mobile/features/auth/presentation/controllers/auth_controller.dart';
import 'package:lunas_mobile/features/auth/presentation/screens/app_splash_screen.dart';
import 'package:lunas_mobile/features/auth/presentation/screens/citizen_login_screen.dart';
import 'package:lunas_mobile/features/auth/presentation/screens/citizen_registration_screen.dart';
import 'package:lunas_mobile/features/auth/presentation/screens/password_recovery_screen.dart';
import 'package:lunas_mobile/features/auth/presentation/screens/reset_password_with_token_screen.dart';
import 'package:lunas_mobile/features/auth/presentation/screens/role_unavailable_screen.dart';
import 'package:lunas_mobile/features/auth/presentation/screens/onboarding_screen.dart';
import 'package:lunas_mobile/features/citizen/presentation/screens/citizen_dashboard_screen.dart';
import 'package:lunas_mobile/features/citizen/presentation/screens/my_drafts_screen.dart';
import 'package:lunas_mobile/features/citizen_extra/presentation/screens/report_timeline_screen.dart';
import 'package:lunas_mobile/features/maps/domain/models/selected_location.dart';
import 'package:lunas_mobile/features/maps/presentation/screens/map_picker_screen.dart';
import 'package:lunas_mobile/features/notifications/presentation/screens/notifications_screen.dart';
import 'package:lunas_mobile/features/profile/presentation/screens/citizen_profile_screen.dart';
import 'package:lunas_mobile/features/repair/presentation/screens/assigned_work_orders_screen.dart';
import 'package:lunas_mobile/features/repair/presentation/screens/official_work_orders_screen.dart';
import 'package:lunas_mobile/features/repair/presentation/screens/repair_dashboard_screen.dart';
import 'package:lunas_mobile/features/repair/presentation/screens/repair_profile_screen.dart';
import 'package:lunas_mobile/features/repair/presentation/screens/repair_work_order_location_screen.dart';
import 'package:lunas_mobile/features/repair/presentation/screens/start_repair_screen.dart';
import 'package:lunas_mobile/features/repair/presentation/screens/update_repair_progress_screen.dart';
import 'package:lunas_mobile/features/repair/presentation/screens/upload_repair_evidence_screen.dart';
import 'package:lunas_mobile/features/repair/presentation/screens/work_order_details_screen.dart';
import 'package:lunas_mobile/features/reporting/data/models/category_option.dart';
import 'package:lunas_mobile/features/reporting/data/models/incident_report.dart';
import 'package:lunas_mobile/features/reporting/domain/models/citizen_report_draft.dart';
import 'package:lunas_mobile/features/reporting/presentation/screens/category_picker_screen.dart';
import 'package:lunas_mobile/features/reporting/presentation/screens/citizen_report_detail_screen.dart';
import 'package:lunas_mobile/features/reporting/presentation/screens/evidence_picker_screen.dart';
import 'package:lunas_mobile/features/reporting/presentation/screens/my_reports_screen.dart';
import 'package:lunas_mobile/features/reporting/presentation/screens/new_citizen_report_screen.dart';
import 'package:lunas_mobile/features/reporting/presentation/screens/report_review_screen.dart';
import 'package:lunas_mobile/features/reporting/presentation/screens/report_submitted_screen.dart';
import 'package:lunas_mobile/features/validation/presentation/screens/official_dashboard_screen.dart';
import 'package:lunas_mobile/features/validation/presentation/screens/official_profile_screen.dart';
import 'package:lunas_mobile/features/validation/presentation/screens/validation_incident_detail_screen.dart';
import 'package:lunas_mobile/features/validation/presentation/screens/validation_queue_screen.dart';
import 'package:lunas_mobile/features/validation/presentation/screens/official_statistics_screen.dart';
import 'package:lunas_mobile/features/repair/presentation/screens/official_sla_overview_screen.dart';
import 'package:lunas_mobile/features/operations/presentation/screens/assign_personnel_workflow_screen.dart';
import 'package:lunas_mobile/features/engineering/presentation/screens/engineering_dashboard_screen.dart';
import 'package:lunas_mobile/features/engineering/presentation/screens/city_wide_incidents_screen.dart';
import 'package:lunas_mobile/features/engineering/presentation/screens/infrastructure_analytics_screen.dart';
import 'package:lunas_mobile/features/operations/presentation/screens/operations_routes.dart';
import 'package:lunas_mobile/features/engineering/presentation/screens/engineering_routes.dart';
import 'package:lunas_mobile/features/utility/presentation/screens/utility_provider_dashboard_screen.dart';
import 'package:lunas_mobile/features/utility/presentation/screens/utility_routes.dart';
import 'package:lunas_mobile/features/utility/presentation/screens/utility_work_orders_screen.dart';

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
      '/forgot-password',
      '/reset-password',
    };
    final isPublic = publicLocations.contains(location);
    final isCitizenLocation = _isCitizenLocation(location);
    final isOfficialLocation = _isOfficialLocation(location);
    final isEngineeringLocation = _isEngineeringLocation(location);
    final isRepairLocation = _isRepairLocation(location);
    final isUtilityLocation = _isUtilityLocation(location);
    switch (authController.status) {
      case AuthStatus.initializing:
        return location == '/splash' ? null : '/splash';
      case AuthStatus.restoreFailed:
        return location == '/splash' || isPublic ? null : '/splash';
      case AuthStatus.unauthenticated:
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
        // A citizen may never use an official URL, and an official may never
        // use the citizen reporting shell. This guard is presentation-only;
        // every backend request also enforces role and jurisdiction scope.
        if (authController.isCitizen) {
          return isCitizenLocation ? null : home;
        }
        if (authController.isRepairPersonnel) {
          return isRepairLocation ? null : home;
        }
        if (authController.isUtilityProvider) {
          return isUtilityLocation ? null : home;
        }
        if (authController.user?.role == 'city_engineer') {
          return isEngineeringLocation ? null : home;
        }
        if (authController.isValidationOfficial) {
          return isOfficialLocation ? null : home;
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
          builder: (_, _) => const CitizenDashboardScreen(),
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
          path: '/reports/submitted',
          builder: (_, state) {
            final report = state.extra;
            return report is IncidentReport
                ? ReportSubmittedScreen(report: report)
                : const _MissingRouteDataScreen(
                    message: 'The submitted report could not be opened.',
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
      ],
    ),
    GoRoute(
      path: '/official',
      builder: (_, _) => const OfficialDashboardScreen(),
    ),
    GoRoute(
      path: OperationsRoutes.incomingReports,
      builder: (_, _) => const ValidationQueueScreen(),
    ),
    GoRoute(
      path: OperationsRoutes.validateReport,
      builder: (_, _) => const ValidationQueueScreen(),
    ),
    GoRoute(
      path: OperationsRoutes.assignPersonnel,
      builder: (_, _) => const ValidationQueueScreen(),
    ),
    GoRoute(
      path: '/official/assign/:incidentId',
      builder: (_, state) => AssignPersonnelWorkflowScreen(
        incidentId: state.pathParameters['incidentId'] ?? '',
      ),
    ),
    GoRoute(
      path: OperationsRoutes.slaMonitoring,
      builder: (_, _) =>
          const OfficialSlaOverviewScreen(title: 'Barangay SLA monitoring'),
    ),
    GoRoute(
      path: OperationsRoutes.repairVerification,
      builder: (_, _) => const BackendDependencyScreen(
        title: 'Repair verification',
        message:
            'The backend does not currently expose an official approve, reject, or rework endpoint. Repair completion remains pending human review until that workflow is added.',
      ),
    ),
    GoRoute(
      path: '/official/validation',
      builder: (_, _) => const ValidationQueueScreen(),
    ),
    GoRoute(
      path: '/official/validation/:id',
      builder: (_, state) => ValidationIncidentDetailScreen(
        incidentId: state.pathParameters['id'] ?? '',
      ),
    ),
    GoRoute(
      path: '/official/profile',
      builder: (_, _) => const OfficialProfileScreen(),
    ),
    GoRoute(
      path: '/official/statistics',
      builder: (_, _) => const OfficialStatisticsScreen(),
    ),
    GoRoute(
      path: '/official/work-orders',
      builder: (_, _) => const OfficialWorkOrdersScreen(),
    ),
    GoRoute(
      path: EngineeringRoutes.dashboard,
      builder: (_, _) => const EngineeringDashboardScreen(),
    ),
    GoRoute(
      path: EngineeringRoutes.incidents,
      builder: (_, _) => const CityWideIncidentsScreen(),
    ),
    GoRoute(
      path: '/engineering/incidents/:incidentId',
      builder: (_, state) => ValidationIncidentDetailScreen(
        incidentId: state.pathParameters['incidentId'] ?? '',
        isCityEngineering: true,
      ),
    ),
    GoRoute(
      path: '/engineering/assign/:incidentId',
      builder: (_, state) => AssignPersonnelWorkflowScreen(
        incidentId: state.pathParameters['incidentId'] ?? '',
      ),
    ),
    GoRoute(
      path: EngineeringRoutes.incidentDetails,
      builder: (_, _) => const CityWideIncidentsScreen(),
    ),
    GoRoute(
      path: EngineeringRoutes.map,
      builder: (_, _) => const BackendDependencyScreen(
        title: 'Engineering map',
        message:
            'A live city incident map is not connected yet. Open City-wide incidents to review current server-backed records and locations.',
      ),
    ),
    GoRoute(
      path: EngineeringRoutes.utilityAssignment,
      builder: (_, _) => const BackendDependencyScreen(
        title: 'Assign utility provider',
        message:
            'The backend does not currently expose a provider directory or provider assignment workflow. No provider assignment was submitted.',
      ),
    ),
    GoRoute(
      path: EngineeringRoutes.sla,
      builder: (_, _) => const OfficialSlaOverviewScreen(
        title: 'City engineering SLA dashboard',
      ),
    ),
    GoRoute(
      path: EngineeringRoutes.analytics,
      builder: (_, _) => const InfrastructureAnalyticsScreen(),
    ),
    GoRoute(
      path: EngineeringRoutes.performance,
      builder: (_, _) => const InfrastructureAnalyticsScreen(),
    ),
    GoRoute(
      path: EngineeringRoutes.verifyRepair,
      builder: (_, _) => const BackendDependencyScreen(
        title: 'Engineering repair verification',
        message:
            'The backend does not currently expose official approve, reject, or additional-work actions for submitted repairs.',
      ),
    ),
    GoRoute(
      path: UtilityRoutes.dashboard,
      builder: (_, _) => const UtilityProviderDashboardScreen(),
    ),
    GoRoute(
      path: UtilityRoutes.workOrders,
      builder: (_, _) => const UtilityWorkOrdersScreen(),
    ),
    GoRoute(path: '/repair', builder: (_, _) => const RepairDashboardScreen()),
    GoRoute(
      path: '/repair/work-orders',
      builder: (_, _) => const AssignedWorkOrdersScreen(),
    ),
    GoRoute(
      path: '/repair/work-orders/:id/start',
      builder: (_, state) =>
          StartRepairScreen(workOrderId: state.pathParameters['id'] ?? ''),
    ),
    GoRoute(
      path: '/repair/work-orders/:id/progress',
      builder: (_, state) => UpdateRepairProgressScreen(
        workOrderId: state.pathParameters['id'] ?? '',
      ),
    ),
    GoRoute(
      path: '/repair/work-orders/:id/evidence',
      builder: (_, state) => UploadRepairEvidenceScreen(
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
      path: '/repair/profile',
      builder: (_, _) => const RepairProfileScreen(),
    ),
  ],
  errorBuilder: (_, state) =>
      Scaffold(body: Center(child: Text('Page not found: ${state.uri.path}'))),
);

bool _isCitizenLocation(String location) =>
    location == '/citizen' ||
    location == '/profile' ||
    location == '/notifications' ||
    location == '/reports' ||
    location.startsWith('/reports/');

bool _isOfficialLocation(String location) =>
    location == '/official' || location.startsWith('/official/');

bool _isEngineeringLocation(String location) =>
    location == '/engineering' || location.startsWith('/engineering/');

bool _isRepairLocation(String location) =>
    location == '/repair' || location.startsWith('/repair/');

bool _isUtilityLocation(String location) =>
    location == '/utility' || location.startsWith('/utility/');

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
