import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:lunas_mobile/core/app_services.dart';
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
            'If this email has a LUNAS account, reset instructions will be sent when email delivery is configured.';
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
    showBackButton: true,
    child: Form(
      key: _formKey,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const AuthHeading(
            title: 'Reset your password',
            description:
                'Enter your email address. We will use the secure reset service if it is available.',
          ),
          const SizedBox(height: AppSpacing.xxl),
          TextFormField(
            controller: _emailController,
            keyboardType: TextInputType.emailAddress,
            decoration: const InputDecoration(labelText: 'Email address'),
            validator: validateEmail,
          ),
          const SizedBox(height: AppSpacing.lg),
          if (_message != null) ...[
            AuthMessage(message: _message!, isError: !_sent),
            const SizedBox(height: AppSpacing.md),
          ],
          LunasButton(
            label: 'Request reset link',
            isLoading: _sending,
            onPressed: _sending ? null : _submit,
          ),
          TextButton(
            onPressed: () => context.go('/login'),
            child: const Text('Return to sign in'),
          ),
        ],
      ),
    ),
  );
}
