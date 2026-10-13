import 'dart:async';

import 'package:flutter/material.dart';
import 'package:lunas_mobile/features/auth/presentation/widgets/otp_code_field.dart';
import 'package:go_router/go_router.dart';
import 'package:lunas_mobile/core/theme/app_spacing.dart';
import 'package:lunas_mobile/core/widgets/lunas_button.dart';
import 'package:lunas_mobile/features/auth/presentation/screens/citizen_login_screen.dart';
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
  final _codeControllers = List.generate(6, (_) => TextEditingController());
  final _focusNodes = List.generate(6, (_) => FocusNode());
  String get _code => _codeControllers.map((item) => item.text).join();
  Timer? _timer;
  int _secondsRemaining = 0;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_timer == null) {
      final challenge = AuthScope.of(context).pendingRegistration;
      _startTimer(challenge?.resendAfterSeconds ?? 60);
    }
  }

  @override
  void dispose() {
    _timer?.cancel();
    for (final controller in _codeControllers) {
      controller.dispose();
    }
    for (final node in _focusNodes) {
      node.dispose();
    }
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
    final success = await auth.verifyRegistrationMfa(_code);
    if (success && mounted) {
      context.go('/login');
    }
  }

  Future<void> _resend() async {
    final auth = AuthScope.of(context);
    final sent = await auth.resendRegistrationMfa();
    if (!mounted || !sent) return;
    for (final controller in _codeControllers) {
      controller.clear();
    }
    _focusNodes.first.requestFocus();
    _startTimer(auth.pendingRegistration?.resendAfterSeconds ?? 60);
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('A new verification code was sent.')),
    );
  }

  @override
  Widget build(BuildContext context) {
    final auth = AuthScope.of(context);
    final challenge = auth.pendingRegistration;
    final email = challenge?.email ?? widget.email ?? 'your email';
    return AuthLayout(
      showBrand: false,
      showBackButton: true,
      headerSpacing: AppSpacing.sm,
      child: Column(
        children: [
          AuthPanel(
            child: Form(
              key: _formKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  AuthHeading(
                    title: 'Verify OTP',
                    description:
                        'Enter the 6-digit code sent to $email. Check your inbox or spam folder.',
                  ),
                  if (challenge != null && challenge.expiresInSeconds <= 0) ...[
                    const SizedBox(height: AppSpacing.sm),
                    Text(
                      'Your code has expired. Request a new code below.',
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: Theme.of(context).colorScheme.error,
                      ),
                    ),
                  ],
                  const SizedBox(height: AppSpacing.xl),
                  FormField<String>(
                    validator: (_) => RegExp(r'^\d{6}$').hasMatch(_code)
                        ? null
                        : 'Enter the complete 6-digit code.',
                    builder: (field) => Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        OtpCodeField(
                          controllers: _codeControllers,
                          focusNodes: _focusNodes,
                          enabled: !auth.isSubmitting,
                          onChanged: () {
                            field.didChange(_code);
                          },
                        ),
                        if (field.hasError)
                          Padding(
                            padding: const EdgeInsets.only(top: 8),
                            child: Text(
                              field.errorText!,
                              style: TextStyle(
                                color: Theme.of(context).colorScheme.error,
                                fontSize: 12,
                              ),
                            ),
                          ),
                      ],
                    ),
                  ),
                  const SizedBox(height: AppSpacing.xs),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Expanded(
                        child: Text(
                          _secondsRemaining > 0
                              ? 'New code in ${_secondsRemaining}s'
                              : 'You can request a new code.',
                          style: Theme.of(context).textTheme.bodySmall
                              ?.copyWith(
                                color: Theme.of(
                                  context,
                                ).colorScheme.onSurfaceVariant,
                              ),
                        ),
                      ),
                      TextButton(
                        onPressed:
                            challenge != null &&
                                _secondsRemaining == 0 &&
                                !auth.isSubmitting
                            ? _resend
                            : null,
                        child: const Text('Resend Code'),
                      ),
                    ],
                  ),
                  if (challenge?.developmentCode != null) ...[
                    const SizedBox(height: AppSpacing.sm),
                    Text(
                      'Local QA code: ${challenge!.developmentCode}',
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                  ],
                  if (auth.message != null) ...[
                    const SizedBox(height: AppSpacing.md),
                    AuthMessage(message: auth.message!),
                  ],
                  const SizedBox(height: AppSpacing.md),
                  LunasButton(
                    label: 'Verify OTP',
                    isLoading: auth.isSubmitting,
                    onPressed: challenge == null || auth.isSubmitting
                        ? null
                        : _verify,
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
