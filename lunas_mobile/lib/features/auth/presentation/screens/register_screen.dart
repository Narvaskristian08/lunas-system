import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:lunas_mobile/core/theme/app_spacing.dart';
import 'package:lunas_mobile/core/widgets/lunas_button.dart';
import 'package:lunas_mobile/core/widgets/lunas_text_field.dart';
import 'package:lunas_mobile/features/auth/presentation/widgets/auth_layout.dart';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _phoneController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  bool _obscurePassword = true;
  bool _acceptedTerms = false;

  @override
  void dispose() {
    _nameController.dispose();
    _phoneController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  void _register() {
    if (!_acceptedTerms) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please accept the terms to continue.')),
      );
      return;
    }
    if (_formKey.currentState!.validate()) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            'Creating account for ${_nameController.text.trim()}...',
          ),
        ),
      );
      Navigator.pushNamed(
        context,
        '/otp-verification',
        arguments: _phoneController.text.trim(),
      );
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
            const LunasBrand(),
            const SizedBox(height: AppSpacing.xl),
            const AuthHeading(
              title: 'Create Citizen Account',
              description:
                  'Fill in your information to create your LUNAS account.',
            ),
            const SizedBox(height: AppSpacing.xxl),
            LunasTextField(
              controller: _nameController,
              label: 'Full Name',
              hint: 'Juan Dela Cruz',
              prefixIcon: Icons.person_outline_rounded,
              textInputAction: TextInputAction.next,
              validator: (value) => (value?.trim().length ?? 0) < 2
                  ? 'Enter your full name'
                  : null,
            ),
            const SizedBox(height: AppSpacing.md),
            LunasTextField(
              controller: _phoneController,
              label: 'Mobile Number',
              hint: '9XX XXX XXXX',
              prefixIcon: Icons.phone_iphone_rounded,
              keyboardType: TextInputType.phone,
              textInputAction: TextInputAction.next,
              maxLength: 10,
              inputFormatters: [FilteringTextInputFormatter.digitsOnly],
              validator: (value) {
                final phone = value?.trim() ?? '';
                return phone.length == 10 && phone.startsWith('9')
                    ? null
                    : 'Enter a valid Philippine mobile number';
              },
            ),
            const SizedBox(height: AppSpacing.md),
            LunasTextField(
              controller: _emailController,
              label: 'Email Address',
              hint: 'name@example.com',
              prefixIcon: Icons.alternate_email_rounded,
              keyboardType: TextInputType.emailAddress,
              textInputAction: TextInputAction.next,
              validator: _validateEmail,
            ),
            const SizedBox(height: AppSpacing.md),
            LunasTextField(
              controller: _passwordController,
              label: 'Create Password',
              prefixIcon: Icons.lock_outline_rounded,
              obscureText: _obscurePassword,
              textInputAction: TextInputAction.next,
              suffixIcon: IconButton(
                onPressed: () =>
                    setState(() => _obscurePassword = !_obscurePassword),
                tooltip: _obscurePassword ? 'Show password' : 'Hide password',
                icon: Icon(
                  _obscurePassword
                      ? Icons.visibility_outlined
                      : Icons.visibility_off_outlined,
                ),
              ),
              validator: (value) =>
                  (value?.length ?? 0) < 8 ? 'Use at least 8 characters' : null,
            ),
            const SizedBox(height: AppSpacing.md),
            LunasTextField(
              controller: _confirmPasswordController,
              label: 'Confirm Password',
              prefixIcon: Icons.lock_reset_rounded,
              obscureText: _obscurePassword,
              textInputAction: TextInputAction.done,
              onSubmitted: (_) => _register(),
              validator: (value) => value != _passwordController.text
                  ? 'Passwords do not match'
                  : null,
            ),
            const SizedBox(height: AppSpacing.sm),
            CheckboxListTile(
              value: _acceptedTerms,
              onChanged: (value) =>
                  setState(() => _acceptedTerms = value ?? false),
              controlAffinity: ListTileControlAffinity.leading,
              contentPadding: EdgeInsets.zero,
              title: Text(
                'I agree to the Terms of Service and Privacy Policy.',
                style: Theme.of(context).textTheme.bodySmall,
              ),
            ),
            const SizedBox(height: AppSpacing.lg),
            LunasButton(
              label: 'Create Account',
              icon: Icons.arrow_forward_rounded,
              onPressed: _register,
            ),
            const SizedBox(height: AppSpacing.md),
            const SecurityNotice(
              text: 'Your personal information is encrypted and protected.',
            ),
            const SizedBox(height: AppSpacing.md),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  'Already have an account?',
                  style: Theme.of(context).textTheme.bodySmall,
                ),
                TextButton(
                  onPressed: () =>
                      Navigator.pushReplacementNamed(context, '/login'),
                  child: const Text('Log In'),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  String? _validateEmail(String? value) {
    final email = value?.trim() ?? '';
    final valid = RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$').hasMatch(email);
    return valid ? null : 'Enter a valid email address';
  }
}
