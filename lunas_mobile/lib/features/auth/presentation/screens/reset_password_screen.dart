import 'package:flutter/material.dart';
import 'package:lunas_mobile/core/theme/app_spacing.dart';
import 'package:lunas_mobile/core/widgets/lunas_button.dart';
import 'package:lunas_mobile/core/widgets/lunas_text_field.dart';
import 'package:lunas_mobile/features/auth/presentation/widgets/auth_layout.dart';

class ResetPasswordScreen extends StatefulWidget {
  const ResetPasswordScreen({super.key});

  @override
  State<ResetPasswordScreen> createState() => _ResetPasswordScreenState();
}

class _ResetPasswordScreenState extends State<ResetPasswordScreen> {
  final _formKey = GlobalKey<FormState>();
  final _passwordController = TextEditingController();
  final _confirmController = TextEditingController();
  bool _obscure = true;

  @override
  void dispose() {
    _passwordController.dispose();
    _confirmController.dispose();
    super.dispose();
  }

  void _reset() {
    if (_formKey.currentState!.validate()) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Your password has been reset.')),
      );
      Navigator.pushNamedAndRemoveUntil(context, '/login', (_) => false);
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
              title: 'Reset Password',
              description:
                  'Create a strong new password for your LUNAS account.',
              centered: true,
            ),
            const SizedBox(height: AppSpacing.xxl),
            LunasTextField(
              controller: _passwordController,
              label: 'New Password',
              prefixIcon: Icons.lock_outline_rounded,
              obscureText: _obscure,
              textInputAction: TextInputAction.next,
              suffixIcon: IconButton(
                onPressed: () => setState(() => _obscure = !_obscure),
                icon: Icon(
                  _obscure
                      ? Icons.visibility_outlined
                      : Icons.visibility_off_outlined,
                ),
              ),
              validator: (value) =>
                  (value?.length ?? 0) < 8 ? 'Use at least 8 characters' : null,
            ),
            const SizedBox(height: AppSpacing.md),
            LunasTextField(
              controller: _confirmController,
              label: 'Confirm New Password',
              prefixIcon: Icons.lock_reset_rounded,
              obscureText: _obscure,
              textInputAction: TextInputAction.done,
              onSubmitted: (_) => _reset(),
              validator: (value) => value != _passwordController.text
                  ? 'Passwords do not match'
                  : null,
            ),
            const SizedBox(height: AppSpacing.sm),
            const SecurityNotice(
              text:
                  'Use at least 8 characters. Avoid passwords used on other accounts.',
            ),
            const SizedBox(height: AppSpacing.xl),
            LunasButton(label: 'Reset Password', onPressed: _reset),
          ],
        ),
      ),
    );
  }
}
