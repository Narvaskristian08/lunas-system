import 'package:lunas_mobile/features/auth/presentation/screens/citizen_login_screen.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:lunas_mobile/app/app_services.dart';
import 'package:lunas_mobile/core/theme/app_spacing.dart';
import 'package:lunas_mobile/core/widgets/lunas_button.dart';
import 'package:lunas_mobile/features/auth/presentation/screens/registration_password_screen.dart';
import 'package:lunas_mobile/features/auth/presentation/widgets/auth_layout.dart';
import 'package:lunas_mobile/features/auth/presentation/widgets/auth_scope.dart';

class ResetPasswordWithTokenScreen extends StatefulWidget {
  const ResetPasswordWithTokenScreen({
    this.initialToken,
    this.email,
    super.key,
  });
  final String? initialToken;
  final String? email;

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
  final _codeController = TextEditingController();
  bool _verifying = false;
  String? _verificationError;
  DateTime _resendAt = DateTime.now().add(const Duration(seconds: 60));

  @override
  void initState() {
    super.initState();
    _tokenController = TextEditingController(text: widget.initialToken ?? '');
  }

  @override
  void dispose() {
    _tokenController.dispose();
    _codeController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  Future<void> _verifyCode() async {
    if (_verifying) return;
    setState(() {
      _verifying = true;
      _verificationError = null;
    });
    try {
      final token = await authService.verifyPasswordResetCode(
        widget.email ?? '',
        _codeController.text.trim(),
      );
      if (!mounted) return;
      setState(() => _tokenController.text = token);
    } catch (_) {
      if (mounted) {
        setState(
          () => _verificationError =
              'Code invalid or expired. Check the code or request a new one.',
        );
      }
    } finally {
      if (mounted) setState(() => _verifying = false);
    }
  }

  Future<void> _resendCode() async {
    if (_verifying) return;
    if (DateTime.now().isBefore(_resendAt)) {
      setState(
        () => _verificationError = 'Wait 60 seconds between code requests.',
      );
      return;
    }
    setState(() => _verifying = true);
    try {
      await authService.requestPasswordReset(widget.email ?? '');
      if (mounted) {
        setState(() {
          _resendAt = DateTime.now().add(const Duration(seconds: 60));
          _verificationError =
              'If the account matches, a new code will arrive shortly.';
        });
      }
    } catch (_) {
      if (mounted) {
        setState(
          () => _verificationError = 'Unable to resend. Please try again.',
        );
      }
    } finally {
      if (mounted) setState(() => _verifying = false);
    }
  }

  Widget _buildCodeForm() {
    return AuthLayout(
      showBrand: false,
      showBackButton: true,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const AuthHeading(
            title: 'Verify Reset Code',
            description:
                'Enter the six-digit code sent to your email. The code expires in 10 minutes.',
          ),
          const SizedBox(height: AppSpacing.lg),
          TextFormField(
            controller: _codeController,
            keyboardType: TextInputType.number,
            autofillHints: const [AutofillHints.oneTimeCode],
            maxLength: 6,
            inputFormatters: [FilteringTextInputFormatter.digitsOnly],
            decoration: const InputDecoration(labelText: 'Verification Code'),
            enabled: !_verifying,
          ),
          if (_verificationError != null)
            AuthMessage(message: _verificationError!),
          LunasButton(
            label: 'Verify Code',
            isLoading: _verifying,
            onPressed: _verifying ? null : _verifyCode,
          ),
          TextButton(
            onPressed: _verifying ? null : _resendCode,
            child: const Text('Resend code'),
          ),
        ],
      ),
    );
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
    if (_tokenController.text.isEmpty) return _buildCodeForm();
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
                      'Email verified. Choose your new password.',
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
