import 'package:lunas_mobile/features/auth/presentation/screens/citizen_login_screen.dart';
import 'package:flutter/material.dart';
import 'package:lunas_mobile/core/theme/app_spacing.dart';
import 'package:lunas_mobile/core/widgets/lunas_button.dart';
import 'package:lunas_mobile/features/auth/presentation/screens/registration_password_screen.dart';
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
  bool _obscureConfirmation = true;

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
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text(auth.message!)));
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = AuthScope.of(context);
    return AuthLayout(
      showBrand: false,
      showBackButton: !auth.isSubmitting,
      headerSpacing: AppSpacing.sm,
      child: Column(
        children: [
          Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const AuthHeading(
                  title: 'Create New Password',
                  description:
                      'Choose a new password to regain access to your account.',
                ),
                const SizedBox(height: AppSpacing.xl),
                if (_tokenController.text.trim().isEmpty)
                  TextFormField(
                    controller: _tokenController,
                    enabled: !auth.isSubmitting,
                    decoration: const InputDecoration(
                      labelText: 'Reset Token',
                      hintText: 'Paste the token from your email',
                      isDense: true,
                      contentPadding: EdgeInsets.all(16),
                    ),
                    validator: (value) => value == null || value.trim().isEmpty
                        ? 'Enter the reset token from your link.'
                        : null,
                  )
                else
                  Container(
                    padding: const EdgeInsets.all(AppSpacing.md),
                    decoration: BoxDecoration(
                      color: Theme.of(context).colorScheme.primaryContainer,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Text(
                      'Secure reset link received from Gmail. Your token is already attached.',
                    ),
                  ),
                const SizedBox(height: AppSpacing.md),
                TextFormField(
                  controller: _passwordController,
                  enabled: !auth.isSubmitting,
                  autofillHints: const [AutofillHints.newPassword],
                  onChanged: (_) => setState(() {}),
                  obscureText: _obscurePassword,
                  decoration: InputDecoration(
                    labelText: 'New Password',
                    isDense: true,
                    contentPadding: const EdgeInsets.all(16),
                    suffixIcon: IconButton(
                      onPressed: () =>
                          setState(() => _obscurePassword = !_obscurePassword),
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
                  enabled: !auth.isSubmitting,
                  autofillHints: const [AutofillHints.newPassword],
                  obscureText: _obscureConfirmation,
                  decoration: InputDecoration(
                    labelText: 'Confirm New Password',
                    isDense: true,
                    contentPadding: const EdgeInsets.all(16),
                    suffixIcon: IconButton(
                      onPressed: () => setState(
                        () => _obscureConfirmation = !_obscureConfirmation,
                      ),
                      icon: Icon(
                        _obscureConfirmation
                            ? Icons.visibility_off_outlined
                            : Icons.visibility_outlined,
                      ),
                    ),
                  ),
                  validator: (value) => value != _passwordController.text
                      ? 'Passwords do not match.'
                      : null,
                ),
                const SizedBox(height: AppSpacing.lg),
                PasswordRequirements(password: _passwordController.text),
                const SizedBox(height: AppSpacing.xl),
                if (auth.message != null) ...[
                  AuthMessage(message: auth.message!),
                  const SizedBox(height: AppSpacing.md),
                ],
                LunasButton(
                  label: 'Reset Password',
                  isLoading: auth.isSubmitting,
                  onPressed: auth.isSubmitting ? null : _submit,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
