import 'package:flutter/material.dart';
import 'package:lunas_mobile/core/theme/app_spacing.dart';
import 'package:lunas_mobile/core/widgets/lunas_button.dart';
import 'package:lunas_mobile/features/auth/presentation/screens/citizen_login_screen.dart';
import 'package:lunas_mobile/features/auth/presentation/screens/citizen_registration_screen.dart';
import 'package:lunas_mobile/features/auth/presentation/widgets/auth_layout.dart';
import 'package:lunas_mobile/features/auth/presentation/widgets/auth_scope.dart';

class ResetPasswordWithTokenScreen extends StatefulWidget {
  const ResetPasswordWithTokenScreen({this.initialToken, super.key});
  final String? initialToken;

  @override
  State<ResetPasswordWithTokenScreen> createState() =>
      _ResetPasswordWithTokenScreenState();
}

class _ResetPasswordWithTokenScreenState
    extends State<ResetPasswordWithTokenScreen> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _tokenController;
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  bool _obscurePassword = true;

  @override
  void initState() {
    super.initState();
    _tokenController = TextEditingController(text: widget.initialToken ?? '');
  }

  @override
  void dispose() {
    _tokenController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    final auth = AuthScope.of(context);
    final success = await auth.resetPassword(
      token: _tokenController.text.trim(),
      password: _passwordController.text,
    );
    if (!success && mounted && auth.message != null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(auth.message!)),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = AuthScope.of(context);
    return AuthLayout(
      showBackButton: true,
      child: Form(
        key: _formKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const AuthHeading(
              title: 'Choose a new password',
              description:
                  'Use the secure reset token from your LUNAS reset link.',
            ),
            const SizedBox(height: AppSpacing.xxl),
            TextFormField(
              controller: _tokenController,
              autocorrect: false,
              enableSuggestions: false,
              decoration: const InputDecoration(labelText: 'Reset token'),
              validator: (value) => value == null || value.trim().isEmpty
                  ? 'Enter the reset token from your link.'
                  : null,
            ),
            const SizedBox(height: AppSpacing.md),
            TextFormField(
              controller: _passwordController,
              obscureText: _obscurePassword,
              autofillHints: const [AutofillHints.newPassword],
              decoration: InputDecoration(
                labelText: 'New password',
                suffixIcon: IconButton(
                  onPressed: () => setState(
                    () => _obscurePassword = !_obscurePassword,
                  ),
                  icon: Icon(
                    _obscurePassword
                        ? Icons.visibility_off_outlined
                        : Icons.visibility_outlined,
                  ),
                ),
              ),
              validator: validatePassword,
            ),
            const SizedBox(height: AppSpacing.md),
            TextFormField(
              controller: _confirmPasswordController,
              obscureText: _obscurePassword,
              autofillHints: const [AutofillHints.newPassword],
              decoration: const InputDecoration(labelText: 'Confirm new password'),
              validator: (value) => value != _passwordController.text
                  ? 'Passwords do not match.'
                  : null,
            ),
            const SizedBox(height: AppSpacing.lg),
            if (auth.message != null) ...[
              AuthMessage(message: auth.message!),
              const SizedBox(height: AppSpacing.md),
            ],
            LunasButton(
              label: 'Reset password',
              isLoading: auth.isSubmitting,
              onPressed: auth.isSubmitting ? null : _submit,
            ),
          ],
        ),
      ),
    );
  }
}
