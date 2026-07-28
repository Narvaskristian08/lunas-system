import 'package:flutter/material.dart';
import 'package:lunas_mobile/core/theme/app_spacing.dart';
import 'package:lunas_mobile/core/widgets/lunas_button.dart';
import 'package:lunas_mobile/core/widgets/lunas_text_field.dart';
import 'package:lunas_mobile/features/auth/presentation/widgets/auth_layout.dart';

class ForgotPasswordScreen extends StatefulWidget {
  const ForgotPasswordScreen({super.key});

  @override
  State<ForgotPasswordScreen> createState() => _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends State<ForgotPasswordScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();

  @override
  void dispose() {
    _emailController.dispose();
    super.dispose();
  }

  void _sendResetLink() {
    if (_formKey.currentState!.validate()) {
      final email = _emailController.text.trim();
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Reset instructions sent to $email.')),
      );
      Navigator.pushNamed(context, '/otp-verification', arguments: email);
    }
  }

  @override
  Widget build(BuildContext context) {
    return AuthLayout(
      showBrand: false,
      showBackButton: true,
      child: Form(
        key: _formKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Align(
              alignment: Alignment.center,
              child: LunasBrand(centered: true),
            ),
            const SizedBox(height: AppSpacing.xxl),
            const AuthHeading(
              title: 'Forgot Password?',
              description:
                  'Enter your registered email address and we’ll send you a verification code.',
              centered: true,
            ),
            const SizedBox(height: AppSpacing.xxl),
            LunasTextField(
              controller: _emailController,
              label: 'Email Address',
              hint: 'name@example.com',
              prefixIcon: Icons.mail_outline_rounded,
              keyboardType: TextInputType.emailAddress,
              textInputAction: TextInputAction.done,
              onSubmitted: (_) => _sendResetLink(),
              validator: (value) {
                final email = value?.trim() ?? '';
                return RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$').hasMatch(email)
                    ? null
                    : 'Enter a valid email address';
              },
            ),
            const SizedBox(height: AppSpacing.xl),
            LunasButton(label: 'Continue', onPressed: _sendResetLink),
            const SizedBox(height: AppSpacing.lg),
            TextButton.icon(
              onPressed: () => Navigator.pop(context),
              icon: const Icon(Icons.arrow_back_rounded, size: 18),
              label: const Text('Back to Login'),
            ),
          ],
        ),
      ),
    );
  }
}
