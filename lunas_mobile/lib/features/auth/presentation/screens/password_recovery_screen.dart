import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:lunas_mobile/app/app_services.dart';
import 'package:lunas_mobile/core/network/api_exception.dart';
import 'package:lunas_mobile/core/theme/app_spacing.dart';
import 'package:lunas_mobile/core/widgets/lunas_button.dart';
import 'package:lunas_mobile/features/auth/presentation/screens/citizen_login_screen.dart';
import 'package:lunas_mobile/features/auth/presentation/widgets/auth_layout.dart';

class PasswordRecoveryScreen extends StatefulWidget {
  const PasswordRecoveryScreen({super.key});

  @override
  State<PasswordRecoveryScreen> createState() => _PasswordRecoveryScreenState();
}

class _PasswordRecoveryScreenState extends State<PasswordRecoveryScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  bool _sending = false;
  bool _sent = false;
  String? _message;

  @override
  void dispose() {
    _emailController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() {
      _sending = true;
      _message = null;
      _sent = false;
    });
    try {
      await authService.requestPasswordReset(_emailController.text.trim());
      if (!mounted) return;
      setState(() {
        _sent = true;
        _message =
            'If an account exists for this email, you will receive password reset instructions. Check your inbox and spam folder.';
      });
    } on ApiException catch (error) {
      if (!mounted) return;
      setState(() => _message = error.message);
    } finally {
      if (mounted) setState(() => _sending = false);
    }
  }

  @override
  Widget build(BuildContext context) => AuthLayout(
    showBrand: false,
    showBackButton: true,
    centerContent: true,
    centerTopFlex: 1,
    centerBottomFlex: 2,
    headerSpacing: AppSpacing.sm,
    child: Column(
      children: [
        const LunasBrand(
          centered: true,
          large: true,
          showTitle: false,
          showSubtitle: false,
        ),
        const SizedBox(height: AppSpacing.xl),
        Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const AuthHeading(
                title: 'Reset Password',
                centered: true,
                description:
                    'Enter the email address linked to your account to request a password reset link.',
              ),
              const SizedBox(height: AppSpacing.xl),
              TextFormField(
                controller: _emailController,
                decoration: const InputDecoration(
                  labelText: 'Email Address',
                  hintText: 'you@example.com',
                  isDense: true,
                  contentPadding: EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 16,
                  ),
                ),
                autofillHints: const [AutofillHints.email],
                textInputAction: TextInputAction.done,
                onFieldSubmitted: (_) {
                  if (!_sending) _submit();
                },
                keyboardType: TextInputType.emailAddress,
                validator: validateEmail,
              ),
              const SizedBox(height: AppSpacing.xl),
              if (_message != null) ...[
                AuthMessage(message: _message!, isError: !_sent),
                const SizedBox(height: AppSpacing.md),
              ],
              LunasButton(
                label: 'Send Reset Link',
                isLoading: _sending,
                onPressed: _sending ? null : _submit,
              ),
              const SizedBox(height: AppSpacing.sm),
              TextButton(
                onPressed: () => context.go('/login'),
                child: const Text('Back to Login'),
              ),
            ],
          ),
        ),
      ],
    ),
  );
}
