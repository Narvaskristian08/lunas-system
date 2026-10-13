import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:lunas_mobile/features/auth/presentation/screens/citizen_login_screen.dart';
import 'package:lunas_mobile/core/theme/app_colors.dart';
import 'package:lunas_mobile/core/theme/app_spacing.dart';
import 'package:lunas_mobile/core/widgets/lunas_button.dart';
import 'package:lunas_mobile/features/auth/presentation/widgets/auth_layout.dart';
import 'package:lunas_mobile/features/auth/presentation/widgets/auth_scope.dart';

class RegistrationPasswordScreen extends StatefulWidget {
  const RegistrationPasswordScreen({super.key, required this.onSubmit});
  final Future<void> Function(String password) onSubmit;
  @override
  State<RegistrationPasswordScreen> createState() =>
      _RegistrationPasswordScreenState();
}

class _RegistrationPasswordScreenState
    extends State<RegistrationPasswordScreen> {
  final _formKey = GlobalKey<FormState>();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  bool _obscurePassword = true;
  bool _obscureConfirmPassword = true;
  @override
  void dispose() {
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final auth = AuthScope.of(context);
    return PopScope(
      canPop: !auth.isSubmitting,
      child: AuthLayout(
        showBrand: false,
        showBackButton: !auth.isSubmitting,
        headerSpacing: AppSpacing.sm,
        child: AuthPanel(
          padding: EdgeInsets.zero,
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const AuthHeading(
                  title: 'Create Password',
                  description:
                      'Choose a secure password. Next, verify your email to finish registration.',
                ),
                const SizedBox(height: AppSpacing.xl),
                TextFormField(
                  controller: _passwordController,
                  obscureText: _obscurePassword,
                  autofillHints: const [AutofillHints.newPassword],
                  decoration: InputDecoration(
                    isDense: true,
                    contentPadding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 16,
                    ),
                    labelText: 'Password',
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
                  onChanged: (_) => setState(() {}),
                  validator: validatePassword,
                ),
                const SizedBox(height: AppSpacing.md),
                TextFormField(
                  controller: _confirmPasswordController,
                  obscureText: _obscureConfirmPassword,
                  autofillHints: const [AutofillHints.newPassword],
                  decoration: InputDecoration(
                    isDense: true,
                    contentPadding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 16,
                    ),
                    labelText: 'Confirm Password',
                    suffixIcon: IconButton(
                      onPressed: () => setState(
                        () =>
                            _obscureConfirmPassword = !_obscureConfirmPassword,
                      ),
                      tooltip: _obscureConfirmPassword
                          ? 'Show confirm password'
                          : 'Hide confirm password',
                      icon: Icon(
                        _obscureConfirmPassword
                            ? Icons.visibility_off_outlined
                            : Icons.visibility_outlined,
                      ),
                    ),
                  ),
                  validator: (value) => value != _passwordController.text
                      ? 'Passwords do not match.'
                      : null,
                ),

                const SizedBox(height: AppSpacing.xl),
                PasswordRequirements(password: _passwordController.text),
                const SizedBox(height: AppSpacing.xl),
                if (auth.message != null) ...[
                  AuthMessage(message: auth.message!),
                  const SizedBox(height: AppSpacing.md),
                ],
                LunasButton(
                  label: 'Continue to Verification',
                  isLoading: auth.isSubmitting,
                  onPressed: auth.isSubmitting
                      ? null
                      : () async {
                          if (!_formKey.currentState!.validate()) return;
                          FocusScope.of(context).unfocus();
                          await widget.onSubmit(_passwordController.text);
                        },
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class PasswordRequirements extends StatelessWidget {
  const PasswordRequirements({required this.password, super.key});

  final String password;

  @override
  Widget build(BuildContext context) {
    final rules = <(bool, String)>[
      (
        password.length >= 8 &&
            password.length <= 128 &&
            utf8.encode(password).length <= 72,
        'At least 8 characters',
      ),
      (RegExp(r'[A-Z]').hasMatch(password), 'One uppercase letter'),
      (RegExp(r'[a-z]').hasMatch(password), 'One lowercase letter'),
      (RegExp(r'\d').hasMatch(password), 'One number'),
    ];
    final met = rules.where((rule) => rule.$1).length;
    final score = password.isEmpty ? 0 : met;
    const labels = ['Not Entered', 'Weak', 'Fair', 'Good', 'Strong'];
    const colors = [
      Color(0xFFE2E8F0),
      Color(0xFFDC2626),
      Color(0xFFD97706),
      Color(0xFF0284C7),
      Color(0xFF15803D),
    ];
    final ordered = [rules[0], rules[3], rules[2], rules[1]];
    return Container(
      padding: const EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        color: const Color(0xFFF8FAFC),
        border: Border.all(color: const Color(0xFFE2E8F0)),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Password Strength',
                style: Theme.of(context).textTheme.labelSmall,
              ),
              Text(
                password.isEmpty ? '' : labels[score],
                style: Theme.of(context).textTheme.labelSmall?.copyWith(
                  color: Theme.of(context).colorScheme.onSurfaceVariant,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              for (var index = 0; index < 4; index++) ...[
                if (index > 0) const SizedBox(width: 6),
                Expanded(
                  child: Container(
                    height: 5,
                    decoration: BoxDecoration(
                      color: index < score ? colors[score] : colors[0],
                      borderRadius: BorderRadius.circular(3),
                    ),
                  ),
                ),
              ],
            ],
          ),
          const SizedBox(height: 12),
          LayoutBuilder(
            builder: (context, constraints) {
              final twoColumns =
                  constraints.maxWidth >= 300 &&
                  MediaQuery.textScalerOf(context).scale(12) <= 16;
              return Wrap(
                spacing: 12,
                runSpacing: 10,
                children: [
                  for (final rule in ordered)
                    SizedBox(
                      width: twoColumns
                          ? (constraints.maxWidth - 12) / 2
                          : constraints.maxWidth,
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Icon(
                            rule.$1
                                ? Icons.check_rounded
                                : Icons.circle_outlined,
                            size: 14,
                            color: rule.$1
                                ? AppColorsLight.success
                                : const Color(0xFF64748B),
                          ),
                          const SizedBox(width: 6),
                          Expanded(
                            child: Text(
                              rule.$2,
                              style: Theme.of(context).textTheme.bodySmall
                                  ?.copyWith(
                                    fontSize: 12,
                                    height: 1.4,
                                    color: rule.$1
                                        ? AppColorsLight.success
                                        : Theme.of(
                                            context,
                                          ).colorScheme.onSurfaceVariant,
                                  ),
                            ),
                          ),
                        ],
                      ),
                    ),
                ],
              );
            },
          ),
        ],
      ),
    );
  }
}

String? validatePassword(String? value) {
  final password = value ?? '';
  if (password.length > 128 || utf8.encode(password).length > 72) {
    return 'Use no more than 72 UTF-8 bytes (72 basic characters).';
  }
  if (password.length < 8 ||
      !RegExp(r'[A-Z]').hasMatch(password) ||
      !RegExp(r'[a-z]').hasMatch(password) ||
      !RegExp(r'\d').hasMatch(password)) {
    return 'Use at least 8 characters with uppercase, lowercase, and a number.';
  }
  return null;
}
