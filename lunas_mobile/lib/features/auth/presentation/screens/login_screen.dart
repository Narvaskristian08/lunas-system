import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:lunas_mobile/core/theme/app_spacing.dart';
import 'package:lunas_mobile/core/widgets/lunas_button.dart';
import 'package:lunas_mobile/core/widgets/lunas_text_field.dart';
import 'package:lunas_mobile/features/auth/presentation/widgets/auth_layout.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _phoneController = TextEditingController();
  final _phoneFocusNode = FocusNode();
  bool _rememberMe = false;

  @override
  void dispose() {
    _phoneController.dispose();
    _phoneFocusNode.dispose();
    super.dispose();
  }

  void _submitForm() {
    if (_formKey.currentState!.validate()) {
      final phone = '+63${_phoneController.text.trim()}';
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text('Logging in with $phone...')));
      Navigator.pushNamedAndRemoveUntil(context, '/home', (_) => false);
    }
  }

  void _loginWithEmail() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Switching to Email Login...')),
    );
  }

  void _socialLogin(String provider) {
    ScaffoldMessenger.of(
      context,
    ).showSnackBar(SnackBar(content: Text('$provider login selected.')));
  }

  @override
  Widget build(BuildContext context) {
    return AuthLayout(
      showBrand: false,
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
              title: 'Welcome Back',
              description: 'Sign in to continue to your LUNAS account.',
              centered: true,
            ),
            const SizedBox(height: AppSpacing.xxl),
            LunasTextField(
              controller: _phoneController,
              focusNode: _phoneFocusNode,
              label: 'Mobile Number',
              hint: '9XX XXX XXXX',
              prefixIcon: Icons.phone_outlined,
              keyboardType: TextInputType.phone,
              textInputAction: TextInputAction.done,
              maxLength: 10,
              inputFormatters: [FilteringTextInputFormatter.digitsOnly],
              onSubmitted: (_) => _submitForm(),
              validator: (value) {
                final phone = value?.trim() ?? '';
                if (phone.isEmpty) return 'Enter your mobile number';
                if (!phone.startsWith('9') || phone.length != 10) {
                  return 'Enter a valid 10-digit Philippine mobile number';
                }
                return null;
              },
            ),
            Row(
              children: [
                SizedBox(
                  width: 24,
                  height: 24,
                  child: Checkbox(
                    value: _rememberMe,
                    onChanged: (value) =>
                        setState(() => _rememberMe = value ?? false),
                  ),
                ),
                const SizedBox(width: AppSpacing.xs),
                Text(
                  'Remember me',
                  style: Theme.of(context).textTheme.bodySmall,
                ),
                const Spacer(),
                TextButton(
                  onPressed: () =>
                      Navigator.pushNamed(context, '/forgot-password'),
                  child: const Text('Forgot Password?'),
                ),
              ],
            ),
            const SizedBox(height: AppSpacing.md),
            LunasButton(label: 'Log In', onPressed: _submitForm),
            const SizedBox(height: AppSpacing.lg),
            const AuthDivider(),
            const SizedBox(height: AppSpacing.lg),
            Row(
              children: [
                Expanded(
                  child: AuthOutlineButton(
                    label: 'Google',
                    icon: Icons.g_mobiledata_rounded,
                    onPressed: () => _socialLogin('Google'),
                  ),
                ),
                const SizedBox(width: AppSpacing.sm),
                Expanded(
                  child: AuthOutlineButton(
                    label: 'Email',
                    icon: Icons.alternate_email_rounded,
                    onPressed: _loginWithEmail,
                  ),
                ),
              ],
            ),
            const Spacer(),
            const SizedBox(height: AppSpacing.xxl),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  'Don’t have an account?',
                  style: Theme.of(context).textTheme.bodySmall,
                ),
                TextButton(
                  onPressed: () =>
                      Navigator.pushNamed(context, '/registration/type'),
                  child: const Text('Register'),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
