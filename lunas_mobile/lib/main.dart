import 'package:flutter/material.dart';
import 'package:lunas_mobile/core/theme/app_theme.dart';
import 'package:lunas_mobile/core/widgets/lunas_state_view.dart';
import 'package:lunas_mobile/features/admin/presentation/screens/admin_dashboard_screen.dart';
import 'package:lunas_mobile/features/admin/presentation/screens/audit_logs_screen.dart';
import 'package:lunas_mobile/features/admin/presentation/screens/create_system_announcement_screen.dart';
import 'package:lunas_mobile/features/admin/presentation/screens/system_announcements_screen.dart';
import 'package:lunas_mobile/features/admin/presentation/screens/system_settings_screen.dart';
import 'package:lunas_mobile/features/admin/presentation/screens/user_details_screen.dart';
import 'package:lunas_mobile/features/admin/presentation/screens/user_management_screen.dart';
import 'package:lunas_mobile/features/admin/presentation/screens/verify_user_account_screen.dart';
import 'package:lunas_mobile/features/analytics/presentation/screens/charts_screen.dart';
import 'package:lunas_mobile/features/analytics/presentation/screens/performance_summary_screen.dart';
import 'package:lunas_mobile/features/analytics/presentation/screens/reports_dashboard_screen.dart';
import 'package:lunas_mobile/features/analytics/presentation/screens/statistics_screen.dart';
import 'package:lunas_mobile/features/analytics/presentation/screens/trends_screen.dart';
import 'package:lunas_mobile/features/auth/presentation/screens/forgot_password_screen.dart';
import 'package:lunas_mobile/features/auth/presentation/screens/login_screen.dart';
import 'package:lunas_mobile/features/auth/presentation/screens/onboarding_screen.dart';
import 'package:lunas_mobile/features/auth/presentation/screens/otp_verification_screen.dart';
import 'package:lunas_mobile/features/auth/presentation/screens/register_screen.dart';
import 'package:lunas_mobile/features/auth/presentation/screens/reset_password_screen.dart';
import 'package:lunas_mobile/features/auth/presentation/screens/splash_screen.dart';
import 'package:lunas_mobile/features/barangay/presentation/screens/barangay_dashboard_screen.dart';
import 'package:lunas_mobile/features/barangay/presentation/screens/barangay_statistics_screen.dart';
import 'package:lunas_mobile/features/barangay/presentation/screens/incident_details_official_screen.dart';
import 'package:lunas_mobile/features/citizen/presentation/screens/ai_hazard_detection_result_screen.dart';
import 'package:lunas_mobile/features/citizen/presentation/screens/confirm_report_details_screen.dart';
import 'package:lunas_mobile/features/citizen/presentation/screens/my_drafts_screen.dart';
import 'package:lunas_mobile/features/citizen/presentation/screens/repair_evidence_viewer_screen.dart';
import 'package:lunas_mobile/features/citizen/presentation/screens/report_resolved_summary_screen.dart';
import 'package:lunas_mobile/features/citizen_extra/presentation/screens/citizen_dashboard_alt_screen.dart';
import 'package:lunas_mobile/features/citizen_extra/presentation/screens/report_timeline_screen.dart';
import 'package:lunas_mobile/features/dashboard/presentation/screens/dashboard_screen.dart';
import 'package:lunas_mobile/features/engineering/presentation/screens/assign_utility_provider_screen.dart';
import 'package:lunas_mobile/features/engineering/presentation/screens/city_wide_incidents_screen.dart';
import 'package:lunas_mobile/features/engineering/presentation/screens/engineering_dashboard_screen.dart';
import 'package:lunas_mobile/features/engineering/presentation/screens/engineering_map_oversight_screen.dart';
import 'package:lunas_mobile/features/engineering/presentation/screens/incident_details_engineering_screen.dart';
import 'package:lunas_mobile/features/engineering/presentation/screens/infrastructure_analytics_screen.dart';
import 'package:lunas_mobile/features/engineering/presentation/screens/performance_reports_screen.dart';
import 'package:lunas_mobile/features/engineering/presentation/screens/repair_verification_engineering_screen.dart';
import 'package:lunas_mobile/features/engineering/presentation/screens/sla_dashboard_screen.dart';
import 'package:lunas_mobile/features/home/presentation/screens/home_screen.dart';
import 'package:lunas_mobile/features/maps/presentation/screens/map_screen.dart';
import 'package:lunas_mobile/features/maps/presentation/screens/location_confirmation_screen.dart';
import 'package:lunas_mobile/features/notifications/presentation/screens/notifications_screen.dart';
import 'package:lunas_mobile/features/notifications/presentation/screens/notification_details_screen.dart';
import 'package:lunas_mobile/features/operations/presentation/screens/assign_personnel_screen.dart';
import 'package:lunas_mobile/features/operations/presentation/screens/incoming_reports_screen.dart';
import 'package:lunas_mobile/features/operations/presentation/screens/operations_dashboard_screen.dart';
import 'package:lunas_mobile/features/operations/presentation/screens/repair_verification_screen.dart';
import 'package:lunas_mobile/features/operations/presentation/screens/sla_monitoring_screen.dart';
import 'package:lunas_mobile/features/operations/presentation/screens/validate_report_screen.dart';
import 'package:lunas_mobile/features/profile/presentation/screens/profile_screen.dart';
import 'package:lunas_mobile/features/profile/presentation/screens/edit_profile_screen.dart';
import 'package:lunas_mobile/features/reporting/presentation/screens/create_report_screen.dart';
import 'package:lunas_mobile/features/reporting/presentation/screens/edit_report_screen.dart';
import 'package:lunas_mobile/features/reporting/presentation/screens/location_selection_screen.dart';
import 'package:lunas_mobile/features/reporting/presentation/screens/photo_upload_screen.dart';
import 'package:lunas_mobile/features/reporting/presentation/screens/report_details_screen.dart';
import 'package:lunas_mobile/features/reporting/presentation/screens/report_categories_screen.dart';
import 'package:lunas_mobile/features/reporting/presentation/screens/report_history_screen.dart';
import 'package:lunas_mobile/features/reporting/presentation/screens/report_status_screen.dart';
import 'package:lunas_mobile/features/repair/presentation/screens/ai_quality_check_screen.dart';
import 'package:lunas_mobile/features/repair/presentation/screens/assigned_work_orders_screen.dart';
import 'package:lunas_mobile/features/repair/presentation/screens/completed_repairs_screen.dart';
import 'package:lunas_mobile/features/repair/presentation/screens/confirm_repair_completion_screen.dart';
import 'package:lunas_mobile/features/repair/presentation/screens/repair_dashboard_screen.dart';
import 'package:lunas_mobile/features/repair/presentation/screens/repair_submitted_screen.dart';
import 'package:lunas_mobile/features/repair/presentation/screens/start_repair_screen.dart';
import 'package:lunas_mobile/features/repair/presentation/screens/update_repair_progress_screen.dart';
import 'package:lunas_mobile/features/repair/presentation/screens/upload_repair_evidence_screen.dart';
import 'package:lunas_mobile/features/repair/presentation/screens/work_order_details_screen.dart';
import 'package:lunas_mobile/features/roles/presentation/screens/workspace_selector_screen.dart';
import 'package:lunas_mobile/features/settings/presentation/screens/settings_screen.dart';
import 'package:lunas_mobile/features/settings/presentation/screens/settings_detail_screens.dart';
import 'package:lunas_mobile/features/stitch_auth/presentation/screens/citizen_registration_credentials_screen.dart';
import 'package:lunas_mobile/features/stitch_auth/presentation/screens/citizen_registration_personal_info_screen.dart';
import 'package:lunas_mobile/features/stitch_auth/presentation/screens/contact_verification_otp_screen.dart';
import 'package:lunas_mobile/features/stitch_auth/presentation/screens/official_identity_documents_screen.dart';
import 'package:lunas_mobile/features/stitch_auth/presentation/screens/official_role_selection_screen.dart';
import 'package:lunas_mobile/features/stitch_auth/presentation/screens/registration_pending_approval_screen.dart';
import 'package:lunas_mobile/features/stitch_auth/presentation/screens/registration_type_screen.dart';
import 'package:lunas_mobile/features/stitch_auth/presentation/screens/welcome_screen.dart';
import 'package:lunas_mobile/features/stitch_catalog/presentation/screens/stitch_screen_catalog_screen.dart';
import 'package:lunas_mobile/features/stitch_extras/presentation/screens/alternate_report_hazard_form_screen.dart';
import 'package:lunas_mobile/features/stitch_extras/presentation/screens/finished_repair_details_screen.dart';
import 'package:lunas_mobile/features/stitch_extras/presentation/screens/navigate_to_incident_screen.dart';
import 'package:lunas_mobile/features/stitch_extras/presentation/screens/repair_tasks_list_screen.dart';
import 'package:lunas_mobile/features/utility/presentation/screens/accept_assignment_screen.dart';
import 'package:lunas_mobile/features/utility/presentation/screens/assigned_utility_incidents_screen.dart';
import 'package:lunas_mobile/features/utility/presentation/screens/utility_dashboard_screen.dart';
import 'package:lunas_mobile/features/utility/presentation/screens/utility_incident_details_screen.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'LUNAS Mobile',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light,
      darkTheme: AppTheme.dark,
      themeMode: ThemeMode.light,
      initialRoute: '/',
      routes: {
        '/': (context) => const SplashScreen(),
        '/onboarding': (context) => const OnboardingScreen(),
        '/welcome': (context) => const WelcomeScreen(),
        '/login': (context) => const LoginScreen(),
        '/register': (context) => const RegisterScreen(),
        '/forgot-password': (context) => const ForgotPasswordScreen(),
        '/otp-verification': (context) => const OtpVerificationScreen(),
        '/reset-password': (context) => const ResetPasswordScreen(),
        '/registration/type': (context) => const RegistrationTypeScreen(),
        '/registration/citizen/personal': (context) =>
            const CitizenRegistrationPersonalInfoScreen(),
        '/registration/citizen/credentials': (context) =>
            const CitizenRegistrationCredentialsScreen(),
        '/registration/otp': (context) => const ContactVerificationOtpScreen(),
        '/registration/official-role': (context) =>
            const OfficialRoleSelectionScreen(),
        '/registration/official-documents': (context) =>
            const OfficialIdentityDocumentsScreen(),
        '/registration/pending': (context) =>
            const RegistrationPendingApprovalScreen(),
        '/home': (context) => const HomeScreen(),
        '/citizen/dashboard-alt': (context) =>
            const CitizenDashboardAltScreen(),
        '/workspaces': (context) => const WorkspaceSelectorScreen(),
        '/stitch-catalog': (context) => const StitchScreenCatalogScreen(),
        '/dashboard': (context) => const DashboardScreen(),
        '/barangay': (context) => const BarangayDashboardScreen(),
        '/barangay/statistics': (context) => const BarangayStatisticsScreen(),
        '/barangay/incidents/details': (context) =>
            const IncidentDetailsOfficialScreen(),
        '/engineering': (context) => const EngineeringDashboardScreen(),
        '/engineering/incidents': (context) => const CityWideIncidentsScreen(),
        '/engineering/incidents/details': (context) =>
            const IncidentDetailsEngineeringScreen(),
        '/engineering/map': (context) => const EngineeringMapOversightScreen(),
        '/engineering/utility-assignment': (context) =>
            const AssignUtilityProviderScreen(),
        '/engineering/sla': (context) => const SlaDashboardScreen(),
        '/engineering/analytics': (context) =>
            const InfrastructureAnalyticsScreen(),
        '/engineering/performance': (context) =>
            const PerformanceReportsScreen(),
        '/engineering/verify': (context) =>
            const RepairVerificationEngineeringScreen(),
        '/analytics': (context) => const StatisticsScreen(),
        '/analytics/charts': (context) => const ChartsScreen(),
        '/analytics/reports': (context) => const ReportsDashboardScreen(),
        '/analytics/trends': (context) => const TrendsScreen(),
        '/analytics/performance': (context) => const PerformanceSummaryScreen(),
        '/admin': (context) => const AdminDashboardScreen(),
        '/admin/users': (context) => const UserManagementScreen(),
        '/admin/users/details': (context) => const UserDetailsScreen(),
        '/admin/users/verify': (context) => const VerifyUserAccountScreen(),
        '/admin/audit': (context) => const AuditLogsScreen(),
        '/admin/announcements': (context) => const SystemAnnouncementsScreen(),
        '/admin/announcements/create': (context) =>
            const CreateSystemAnnouncementScreen(),
        '/admin/settings': (context) => const SystemSettingsScreen(),
        '/notifications': (context) => const NotificationsScreen(),
        '/notifications/details': (context) =>
            const NotificationDetailsScreen(),
        '/official': (context) => const OperationsDashboardScreen(),
        '/official/incoming': (context) => const IncomingReportsScreen(),
        '/official/validate': (context) => const ValidateReportScreen(),
        '/official/assign': (context) => const AssignPersonnelScreen(),
        '/official/verify': (context) => const RepairVerificationScreen(),
        '/official/sla': (context) => const SlaMonitoringScreen(),
        '/profile': (context) => const ProfileScreen(),
        '/profile/edit': (context) => const EditProfileScreen(),
        '/settings': (context) => const SettingsScreen(),
        '/settings/account': (context) => const AccountScreen(),
        '/settings/security': (context) => const SecurityScreen(),
        '/settings/preferences': (context) => const PreferencesScreen(),
        '/settings/about': (context) => const AboutScreen(),
        '/settings/help': (context) => const HelpScreen(),
        '/maps': (context) => const MapScreen(),
        '/reports/new': (context) => const CreateReportScreen(),
        '/reports/edit': (context) => const EditReportScreen(),
        '/reports/categories': (context) => const ReportCategoriesScreen(),
        '/reports/history': (context) => const ReportHistoryScreen(),
        '/reports/details': (context) => const ReportDetailsScreen(),
        '/reports/status': (context) => const ReportStatusScreen(),
        '/reports/location': (context) => const LocationSelectionScreen(),
        '/reports/location/confirm': (context) =>
            const LocationConfirmationScreen(),
        '/reports/photo': (context) => const PhotoUploadScreen(),
        '/reports/ai-suggestion': (context) =>
            const AiHazardDetectionResultScreen(),
        '/reports/confirm': (context) => const ConfirmReportDetailsScreen(),
        '/reports/drafts': (context) => const MyDraftsScreen(),
        '/reports/evidence': (context) => const RepairEvidenceViewerScreen(),
        '/reports/resolved': (context) => const ReportResolvedSummaryScreen(),
        '/reports/timeline': (context) => const ReportTimelineScreen(),
        '/reports/new/alternate': (context) =>
            const AlternateReportHazardFormScreen(),
        '/repair': (context) => const RepairDashboardScreen(),
        '/repair/tasks': (context) => const AssignedWorkOrdersScreen(),
        '/repair/tasks-list': (context) => const RepairTasksListScreen(),
        '/repair/work-order': (context) => const WorkOrderDetailsScreen(),
        '/repair/start': (context) => const StartRepairScreen(),
        '/repair/navigate': (context) => const NavigateToIncidentScreen(),
        '/repair/progress': (context) => const UpdateRepairProgressScreen(),
        '/repair/evidence': (context) => const UploadRepairEvidenceScreen(),
        '/repair/quality': (context) => const AiQualityCheckScreen(),
        '/repair/confirm': (context) => const ConfirmRepairCompletionScreen(),
        '/repair/submitted': (context) => const RepairSubmittedScreen(),
        '/repair/completed': (context) => const CompletedRepairsScreen(),
        '/repair/finished': (context) => const FinishedRepairDetailsScreen(),
        '/utility': (context) => const UtilityDashboardScreen(),
        '/utility/incidents': (context) => const AssignedUtilityIncidentsScreen(),
        '/utility/incidents/details': (context) =>
            const UtilityIncidentDetailsScreen(),
        '/utility/accept': (context) => const AcceptAssignmentScreen(),
      },
      onUnknownRoute: (_) => MaterialPageRoute<void>(
        builder: (context) => Scaffold(
          appBar: AppBar(),
          body: LunasStateView(
            state: LunasViewState.error,
            title: 'Page not found',
            message: 'This destination is unavailable or has moved.',
            actionLabel: 'Return Home',
            onAction: () => Navigator.pushNamedAndRemoveUntil(
              context,
              '/home',
              (route) => false,
            ),
          ),
        ),
      ),
    );
  }
}
