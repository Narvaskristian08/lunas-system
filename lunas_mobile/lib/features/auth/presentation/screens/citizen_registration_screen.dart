import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:lunas_mobile/core/theme/app_colors.dart';
import 'package:lunas_mobile/core/theme/app_spacing.dart';
import 'package:lunas_mobile/core/widgets/lunas_button.dart';
import 'package:lunas_mobile/features/auth/presentation/screens/citizen_login_screen.dart';
import 'package:lunas_mobile/features/auth/presentation/widgets/auth_layout.dart';
import 'package:lunas_mobile/features/auth/presentation/widgets/auth_scope.dart';

class CitizenRegistrationScreen extends StatefulWidget {
  const CitizenRegistrationScreen({super.key});

  @override
  State<CitizenRegistrationScreen> createState() =>
      _CitizenRegistrationScreenState();
}

class _CitizenRegistrationScreenState extends State<CitizenRegistrationScreen> {
  final _formKey = GlobalKey<FormState>();
  final _firstNameController = TextEditingController();
  final _lastNameController = TextEditingController();
  final _emailController = TextEditingController();
  final _phoneController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  bool _obscurePassword = true;

  String get _normalizedPhone =>
      _phoneController.text.replaceAll(RegExp(r'\s+'), '');

  @override
  void dispose() {
    _firstNameController.dispose();
    _lastNameController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    final auth = AuthScope.of(context);
    final challenge = await auth.register(
      firstName: _firstNameController.text.trim(),
      lastName: _lastNameController.text.trim(),
      email: _emailController.text.trim(),
      phone: _normalizedPhone,
      password: _passwordController.text,
    );
    if (challenge != null && mounted) {
      context.go('/register/verify');
      return;
    }
    if (mounted && auth.message != null) {
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
      showBackButton: true,
      child: Column(
        children: [
          AuthPanel(
            padding: const EdgeInsets.all(AppSpacing.lg),
            child: Form(
              key: _formKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const _RegistrationStepHeader(
                    step: 1,
                    title: 'Create Citizen Account',
                    description:
                        'Provide your personal information to begin registration.',
                  ),
                  const SizedBox(height: AppSpacing.xl),
                  Row(
                    children: [
                      Expanded(
                        child: TextFormField(
                          controller: _firstNameController,
                          textCapitalization: TextCapitalization.words,
                          autofillHints: const [AutofillHints.givenName],
                          decoration: const InputDecoration(
                            labelText: 'First name',
                          ),
                          validator: _required('Enter your first name.'),
                        ),
                      ),
                      const SizedBox(width: AppSpacing.sm),
                      Expanded(
                        child: TextFormField(
                          controller: _lastNameController,
                          textCapitalization: TextCapitalization.words,
                          autofillHints: const [AutofillHints.familyName],
                          decoration: const InputDecoration(
                            labelText: 'Last name',
                          ),
                          validator: _required('Enter your last name.'),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: AppSpacing.md),
                  TextFormField(
                    controller: _phoneController,
                    keyboardType: TextInputType.phone,
                    autofillHints: const [AutofillHints.telephoneNumber],
                    decoration: const InputDecoration(
                      labelText: 'Mobile number',
                      hintText: 'e.g. 09171234567',
                      prefixIcon: Icon(Icons.phone_outlined),
                    ),
                    validator: (value) {
                      final phone = value?.replaceAll(RegExp(r'\s+'), '') ?? '';
                      if (!RegExp(r'^(\+639|09)\d{9}$').hasMatch(phone)) {
                        return 'Enter a valid Philippine mobile number.';
                      }
                      return null;
                    },
                  ),
                  const SizedBox(height: AppSpacing.xl),
                  const Divider(),
                  const SizedBox(height: AppSpacing.xl),
                  const _RegistrationStepHeader(
                    step: 2,
                    title: 'Account Security',
                    description:
                        'Add your contact email and create a secure password.',
                  ),
                  const SizedBox(height: AppSpacing.xl),
                  TextFormField(
                    controller: _emailController,
                    keyboardType: TextInputType.emailAddress,
                    autofillHints: const [AutofillHints.email],
                    decoration: const InputDecoration(
                      labelText: 'Email address',
                      prefixIcon: Icon(Icons.email_outlined),
                    ),
                    validator: validateEmail,
                  ),
                  const SizedBox(height: AppSpacing.md),
                  TextFormField(
                    controller: _passwordController,
                    obscureText: _obscurePassword,
                    autofillHints: const [AutofillHints.newPassword],
                    decoration: InputDecoration(
                      labelText: 'Password',
                      helperText:
                          'At least 8 characters with uppercase, lowercase, and a number.',
                      prefixIcon: const Icon(Icons.lock_outline_rounded),
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
                    onChanged: (_) => setState(() {}),
                    validator: validatePassword,
                  ),
                  const SizedBox(height: AppSpacing.sm),
                  _PasswordRequirements(password: _passwordController.text),
                  const SizedBox(height: AppSpacing.md),
                  TextFormField(
                    controller: _confirmPasswordController,
                    obscureText: _obscurePassword,
                    autofillHints: const [AutofillHints.newPassword],
                    decoration: const InputDecoration(
                      labelText: 'Confirm password',
                      prefixIcon: Icon(Icons.lock_outline_rounded),
                    ),
                    validator: (value) => value != _passwordController.text
                        ? 'Passwords do not match.'
                        : null,
                  ),
                  const SizedBox(height: AppSpacing.xl),
                  if (auth.message != null) ...[
                    AuthMessage(message: auth.message!),
                    const SizedBox(height: AppSpacing.md),
                  ],
                  LunasButton(
                    label: 'Create citizen account',
                    isLoading: auth.isSubmitting,
                    onPressed: auth.isSubmitting ? null : _submit,
                  ),
                  const SizedBox(height: AppSpacing.lg),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Text('Already have an account?'),
                      TextButton(
                        onPressed: auth.isSubmitting
                            ? null
                            : () => context.go('/login'),
                        child: const Text('Sign in'),
                      ),
                    ],
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

class _RegistrationStepHeader extends StatelessWidget {
  const _RegistrationStepHeader({
    required this.step,
    required this.title,
    required this.description,
  });

  final int step;
  final String title;
  final String description;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Expanded(
              child: Text(
                'STEP $step OF 2',
                style: Theme.of(context).textTheme.labelLarge?.copyWith(
                  color: AppColorsLight.brandBase,
                  letterSpacing: .8,
                ),
              ),
            ),
            Text('${step * 50}% Complete'),
          ],
        ),
        const SizedBox(height: AppSpacing.xs),
        ClipRRect(
          borderRadius: BorderRadius.circular(999),
          child: LinearProgressIndicator(
            value: step / 2,
            minHeight: 7,
            color: AppColorsLight.brandBase,
            backgroundColor: const Color(0xFFD8E3FB),
          ),
        ),
        const SizedBox(height: AppSpacing.md),
        AuthHeading(title: title, description: description),
      ],
    );
  }
}

class _PasswordRequirements extends StatelessWidget {
  const _PasswordRequirements({required this.password});

  final String password;

  @override
  Widget build(BuildContext context) {
    final rules = <(bool, String)>[
      (password.length >= 8, 'At least 8 characters'),
      (
        RegExp(r'[A-Z]').hasMatch(password) &&
            RegExp(r'[a-z]').hasMatch(password),
        'Uppercase and lowercase letters',
      ),
      (RegExp(r'\d').hasMatch(password), 'At least one number'),
    ];
    return Container(
      padding: const EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        color: const Color(0xFFEFF3FF),
        borderRadius: BorderRadius.circular(14),
      ),
      child: Column(
        children: [
          for (var index = 0; index < rules.length; index++) ...[
            Row(
              children: [
                Icon(
                  rules[index].$1
                      ? Icons.check_circle_outline_rounded
                      : Icons.circle_outlined,
                  size: 18,
                  color: rules[index].$1
                      ? AppColorsLight.success
                      : Theme.of(context).colorScheme.outline,
                ),
                const SizedBox(width: AppSpacing.xs),
                Expanded(child: Text(rules[index].$2)),
              ],
            ),
            if (index != rules.length - 1)
              const SizedBox(height: AppSpacing.xs),
          ],
        ],
      ),
    );
  }
}

FormFieldValidator<String> _required(String message) =>
    (value) => value == null || value.trim().isEmpty ? message : null;

String? validatePassword(String? value) {
  final password = value ?? '';
  if (password.length < 8 ||
      !RegExp(r'[A-Z]').hasMatch(password) ||
      !RegExp(r'[a-z]').hasMatch(password) ||
      !RegExp(r'\d').hasMatch(password)) {
    return 'Use 8+ characters with uppercase, lowercase, and a number.';
  }
  return null;
}
