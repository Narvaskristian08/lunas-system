import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:lunas_mobile/core/theme/app_spacing.dart';
import 'package:lunas_mobile/core/widgets/lunas_button.dart';
import 'package:lunas_mobile/features/auth/presentation/widgets/auth_layout.dart';
import 'package:lunas_mobile/features/auth/presentation/widgets/auth_scope.dart';

class OtpVerificationScreen extends StatefulWidget {
  const OtpVerificationScreen({super.key, this.email});

  final String? email;

  @override
  State<OtpVerificationScreen> createState() => _OtpVerificationScreenState();
}

class _OtpVerificationScreenState extends State<OtpVerificationScreen> {
  final _formKey = GlobalKey<FormState>();
  final _codeController = TextEditingController();
  Timer? _timer;
  int _secondsRemaining = 0;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_timer == null) {
      final auth = AuthScope.of(context);
      final seconds =
          auth.pendingPrivilegedLogin?.resendAfterSeconds ??
          auth.pendingRegistration?.resendAfterSeconds ??
          60;
      _startTimer(seconds);
    }
  }

  @override
  void dispose() {
    _timer?.cancel();
    _codeController.dispose();
    super.dispose();
  }

  void _startTimer(int seconds) {
    _timer?.cancel();
    setState(() => _secondsRemaining = seconds);
    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (!mounted) return;
      if (_secondsRemaining <= 1) {
        timer.cancel();
        setState(() => _secondsRemaining = 0);
      } else {
        setState(() => _secondsRemaining--);
      }
    });
  }

  Future<void> _verify() async {
    if (!_formKey.currentState!.validate()) return;
    final auth = AuthScope.of(context);
    final isPrivilegedLogin = auth.pendingPrivilegedLogin != null;
    final success = isPrivilegedLogin
        ? await auth.verifyPrivilegedLoginMfa(_codeController.text)
        : await auth.verifyRegistrationMfa(_codeController.text);
    if (success && mounted) {
      context.go(auth.workspaceHomePath ?? '/citizen');
    }
  }

  Future<void> _resend() async {
    final auth = AuthScope.of(context);
    final isPrivilegedLogin = auth.pendingPrivilegedLogin != null;
    final sent = isPrivilegedLogin
        ? await auth.resendPrivilegedLoginMfa()
        : await auth.resendRegistrationMfa();
    if (!mounted || !sent) return;
    _codeController.clear();
    _startTimer(
      auth.pendingPrivilegedLogin?.resendAfterSeconds ??
          auth.pendingRegistration?.resendAfterSeconds ??
          60,
    );
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('A new verification code was sent.')),
    );
  }

  @override
  Widget build(BuildContext context) {
    final auth = AuthScope.of(context);
    final loginChallenge = auth.pendingPrivilegedLogin;
    final registrationChallenge = auth.pendingRegistration;
    final isPrivilegedLogin = loginChallenge != null;
    final hasChallenge =
        loginChallenge != null || registrationChallenge != null;
    final email =
        loginChallenge?.email ??
        registrationChallenge?.email ??
        widget.email ??
        'your email';
    final developmentCode =
        loginChallenge?.developmentCode ??
        registrationChallenge?.developmentCode;
    return AuthLayout(
      showBrand: false,
      showBackButton: true,
      child: Column(
        children: [
          const LunasBrand(centered: true, showSubtitle: false),
          const SizedBox(height: AppSpacing.xl),
          AuthPanel(
            child: Form(
              key: _formKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  AuthHeading(
                    eyebrow: isPrivilegedLogin
                        ? 'Privileged account security'
                        : 'Registration security',
                    title: isPrivilegedLogin
                        ? 'Complete security verification'
                        : 'Verify your email',
                    description: isPrivilegedLogin
                        ? 'Enter the one-time code before LUNAS opens your official workspace.'
                        : 'Enter the one-time code before your citizen account is activated.',
                  ),
                  const SizedBox(height: AppSpacing.md),
                  Text(
                    'Code sent to $email',
                    style: Theme.of(context).textTheme.bodyMedium,
                  ),
                  const SizedBox(height: AppSpacing.lg),
                  TextFormField(
                    controller: _codeController,
                    autofocus: true,
                    keyboardType: TextInputType.number,
                    textInputAction: TextInputAction.done,
                    autofillHints: const [AutofillHints.oneTimeCode],
                    inputFormatters: [
                      FilteringTextInputFormatter.digitsOnly,
                      LengthLimitingTextInputFormatter(6),
                    ],
                    decoration: const InputDecoration(
                      labelText: '6-digit verification code',
                      prefixIcon: Icon(Icons.shield_outlined),
                    ),
                    validator: (value) =>
                        RegExp(r'^\d{6}$').hasMatch(value ?? '')
                        ? null
                        : 'Enter the complete 6-digit code.',
                    onFieldSubmitted: (_) {
                      if (!auth.isSubmitting) _verify();
                    },
                  ),
                  if (developmentCode != null) ...[
                    const SizedBox(height: AppSpacing.sm),
                    Text(
                      'Local QA code: $developmentCode',
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                  ],
                  if (auth.message != null) ...[
                    const SizedBox(height: AppSpacing.md),
                    AuthMessage(message: auth.message!),
                  ],
                  const SizedBox(height: AppSpacing.xl),
                  LunasButton(
                    label: isPrivilegedLogin
                        ? 'Verify and sign in'
                        : 'Verify and create account',
                    icon: Icons.verified_user_outlined,
                    isLoading: auth.isSubmitting,
                    onPressed: !hasChallenge || auth.isSubmitting
                        ? null
                        : _verify,
                  ),
                  const SizedBox(height: AppSpacing.sm),
                  TextButton(
                    onPressed:
                        hasChallenge &&
                            _secondsRemaining == 0 &&
                            !auth.isSubmitting
                        ? _resend
                        : null,
                    child: Text(
                      _secondsRemaining > 0
                          ? 'Resend code in ${_secondsRemaining}s'
                          : 'Resend verification code',
                    ),
                  ),
                  TextButton(
                    onPressed: auth.isSubmitting
                        ? null
                        : () => context.go(
                            isPrivilegedLogin ? '/login' : '/register',
                          ),
                    child: Text(
                      isPrivilegedLogin
                          ? 'Return to sign in'
                          : 'Start registration again',
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
