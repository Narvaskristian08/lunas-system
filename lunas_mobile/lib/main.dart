import 'package:flutter/material.dart';
import 'package:lunas_mobile/core/theme/app_theme.dart';
import 'package:lunas_mobile/core/widgets/lunas_state_view.dart';
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
import 'package:lunas_mobile/features/dashboard/presentation/screens/dashboard_screen.dart';
import 'package:lunas_mobile/features/home/presentation/screens/home_screen.dart';
import 'package:lunas_mobile/features/maps/presentation/screens/map_screen.dart';
import 'package:lunas_mobile/features/maps/presentation/screens/location_confirmation_screen.dart';
import 'package:lunas_mobile/features/notifications/presentation/screens/notifications_screen.dart';
import 'package:lunas_mobile/features/notifications/presentation/screens/notification_details_screen.dart';
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
import 'package:lunas_mobile/features/settings/presentation/screens/settings_screen.dart';
import 'package:lunas_mobile/features/settings/presentation/screens/settings_detail_screens.dart';

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
        '/login': (context) => const LoginScreen(),
        '/register': (context) => const RegisterScreen(),
        '/forgot-password': (context) => const ForgotPasswordScreen(),
        '/otp-verification': (context) => const OtpVerificationScreen(),
        '/reset-password': (context) => const ResetPasswordScreen(),
        '/home': (context) => const HomeScreen(),
        '/dashboard': (context) => const DashboardScreen(),
        '/analytics': (context) => const StatisticsScreen(),
        '/analytics/charts': (context) => const ChartsScreen(),
        '/analytics/reports': (context) => const ReportsDashboardScreen(),
        '/analytics/trends': (context) => const TrendsScreen(),
        '/analytics/performance': (context) => const PerformanceSummaryScreen(),
        '/notifications': (context) => const NotificationsScreen(),
        '/notifications/details': (context) =>
            const NotificationDetailsScreen(),
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
