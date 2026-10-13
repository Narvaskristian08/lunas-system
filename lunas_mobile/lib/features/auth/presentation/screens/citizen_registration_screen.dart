import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:lunas_mobile/features/auth/presentation/screens/registration_password_screen.dart';
export 'package:lunas_mobile/features/auth/presentation/screens/registration_password_screen.dart'
    show validatePassword;
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
  bool _noMiddleName = false;
  final _formKey = GlobalKey<FormState>();
  final _firstNameController = TextEditingController();
  final _middleNameController = TextEditingController();
  final _suffixController = TextEditingController();
  final _lastNameController = TextEditingController();
  final _emailController = TextEditingController();

  @override
  void dispose() {
    _firstNameController.dispose();
    _middleNameController.dispose();
    _suffixController.dispose();
    _lastNameController.dispose();
    _emailController.dispose();
    super.dispose();
  }

  Future<void> _submit(String password) async {
    final auth = AuthScope.of(context);
    final challenge = await auth.register(
      firstName: _firstNameController.text.trim(),
      noMiddleName: _noMiddleName,
      middleName: _noMiddleName ? '' : _middleNameController.text.trim(),
      suffix: _suffixController.text.trim(),
      lastName: _lastNameController.text.trim(),
      email: _emailController.text.trim(),
      password: password,
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
      headerSpacing: AppSpacing.sm,
      child: Column(
        children: [
          AuthPanel(
            padding: EdgeInsets.zero,
            child: Form(
              key: _formKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const AuthHeading(
                    title: 'Create Account',
                    description:
                        'Enter your name and email. Create a password next.',
                  ),
                  const SizedBox(height: AppSpacing.xl),
                  _NameField(
                    label: 'First Name',
                    controller: _firstNameController,
                    autofillHint: AutofillHints.givenName,
                    validator: _required('Enter your first name.'),
                  ),
                  const SizedBox(height: AppSpacing.md),
                  _NameField(
                    label: 'Middle Name',
                    optional: true,
                    enabled: !_noMiddleName,
                    validator: (value) => _noMiddleName
                        ? null
                        : _required(
                            'Enter your middle name or select the checkbox.',
                          )(value),
                    controller: _middleNameController,
                  ),
                  Material(
                    color: Colors.transparent,
                    child: CheckboxListTile(
                      value: _noMiddleName,
                      onChanged: (value) =>
                          setState(() => _noMiddleName = value ?? false),
                      title: Text(
                        "I don't have a middle name",
                        style: Theme.of(context).textTheme.bodySmall,
                      ),
                      controlAffinity: ListTileControlAffinity.leading,
                      contentPadding: EdgeInsets.zero,
                      dense: true,
                      visualDensity: VisualDensity.compact,
                    ),
                  ),
                  const SizedBox(height: AppSpacing.sm),
                  _NameField(
                    label: 'Last Name',
                    controller: _lastNameController,
                    autofillHint: AutofillHints.familyName,
                    validator: _required('Enter your last name.'),
                  ),
                  const SizedBox(height: AppSpacing.md),
                  _NameField(
                    label: 'Suffix',
                    optional: true,
                    controller: _suffixController,
                    maxLength: 20,
                    hint: 'Jr., Sr., III',
                  ),
                  const SizedBox(height: AppSpacing.md),
                  TextFormField(
                    controller: _emailController,
                    keyboardType: TextInputType.emailAddress,
                    autofillHints: const [AutofillHints.email],
                    decoration: const InputDecoration(
                      isDense: true,
                      contentPadding: EdgeInsets.symmetric(
                        horizontal: 16,
                        vertical: 16,
                      ),
                      labelText: 'Email Address',
                      hintText: 'you@example.com',
                    ),
                    validator: validateEmail,
                  ),
                  const SizedBox(height: AppSpacing.xl),
                  LunasButton(
                    label: 'Continue',
                    onPressed: () {
                      if (!_formKey.currentState!.validate()) return;
                      FocusScope.of(context).unfocus();
                      Navigator.of(context).push(
                        MaterialPageRoute<void>(
                          builder: (_) =>
                              RegistrationPasswordScreen(onSubmit: _submit),
                        ),
                      );
                    },
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: AppSpacing.md),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Text('Already have an account?'),
              TextButton(
                onPressed: auth.isSubmitting
                    ? null
                    : () => context.go('/login'),
                child: const Text('Log In'),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

FormFieldValidator<String> _required(String message) =>
    (value) => value == null || value.trim().isEmpty ? message : null;

class _NameField extends StatelessWidget {
  const _NameField({
    required this.label,
    required this.controller,
    this.optional = false,
    this.enabled = true,
    this.autofillHint,
    this.validator,
    this.maxLength = 80,
    this.hint,
  });
  final String label;
  final TextEditingController controller;
  final bool optional;
  final bool enabled;
  final String? autofillHint;
  final FormFieldValidator<String>? validator;
  final int maxLength;
  final String? hint;
  @override
  Widget build(BuildContext context) => TextFormField(
    enabled: enabled,
    controller: controller,
    textCapitalization: TextCapitalization.words,
    autofillHints: autofillHint == null ? null : [autofillHint!],
    maxLength: maxLength,
    decoration: InputDecoration(
      isDense: true,
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
      labelText: label == 'Middle Name'
          ? label
          : (optional ? '$label (Optional)' : label),
      hintText: hint,
      counterText: '',
    ),
    validator: validator,
  );
}
