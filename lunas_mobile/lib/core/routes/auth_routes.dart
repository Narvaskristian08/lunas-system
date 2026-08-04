import 'package:go_router/go_router.dart';
import 'package:lunas_mobile/features/auth/presentation/screens/email_login_screen.dart';
import 'package:lunas_mobile/features/auth/presentation/screens/forgot_password_screen.dart';
import 'package:lunas_mobile/features/auth/presentation/screens/otp_verification_screen.dart';
import 'package:lunas_mobile/features/auth/presentation/screens/password_screen.dart';
import 'package:lunas_mobile/features/auth/presentation/screens/phone_login_screen.dart';
import 'package:lunas_mobile/features/auth/presentation/screens/signup_screen.dart';

abstract class AuthRoutes {
  static const String phoneLogin = '/phone-login';
  static const String emailLogin = '/email-login';
  static const String signUp = '/sign-up';
  static const String forgotPassword = '/forgot-password';
  static const String otpVerification = '/otp-verification';
  static const String password = '/password';
}

final List<RouteBase> authRoutes = [
  GoRoute(
    path: AuthRoutes.phoneLogin,
    name: 'phoneLogin',
    builder: (context, state) => const PhoneLoginScreen(),
  ),
  GoRoute(
    path: AuthRoutes.emailLogin,
    name: 'emailLogin',
    builder: (context, state) => const EmailLoginScreen(),
  ),
  GoRoute(
    path: AuthRoutes.signUp,
    name: 'signUp',
    builder: (context, state) => const SignUpScreen(),
  ),
  GoRoute(
    path: AuthRoutes.forgotPassword,
    name: 'forgotPassword',
    builder: (context, state) => const ForgotPasswordScreen(),
  ),
  GoRoute(
    path: AuthRoutes.otpVerification,
    name: 'otpVerification',
    builder: (context, state) => const OtpVerificationScreen(),
  ),
  GoRoute(
    path: AuthRoutes.password,
    name: 'password',
    builder: (context, state) => const SetPasswordScreen(),
  ),
];