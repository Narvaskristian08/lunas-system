import 'package:flutter/material.dart';
import 'package:lunas_mobile/core/theme/app_colors.dart';
import 'package:lunas_mobile/core/theme/text_styles.dart';
import 'package:lunas_mobile/features/auth/presentation/screens/phone_login_screen.dart';
import 'package:lunas_mobile/features/auth/presentation/screens/forgot_password_screen.dart';
import 'package:lunas_mobile/features/auth/presentation/screens/signup_screen.dart';

class EmailLoginScreen extends StatefulWidget {
  const EmailLoginScreen({super.key});

  @override
  State<EmailLoginScreen> createState() => _EmailLoginScreenState();
}

class _EmailLoginScreenState extends State<EmailLoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();

  bool _obscurePassword = true;

  // Basic regular expression for validating emails
  final _emailRegex = RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$');

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  void _submitForm() {
    if (_formKey.currentState!.validate()) {
      final email = _emailController.text.trim();
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text('Logging in with $email...')));
    }
  }

  void _loginWithPhone() {
    Navigator.push(
      context,
      MaterialPageRoute(builder: (context) => const PhoneLoginScreen()),
    );
  }

  void _navigateToForgotPassword() {
    Navigator.push(
      context,
      MaterialPageRoute(builder: (context) => const ForgotPasswordScreen()),
    );
  }

  void _navigateToRegister() {
    Navigator.push(
      context,
      MaterialPageRoute(builder: (context) => const SignUpScreen()),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColorsLight.surface,
      body: SafeArea(
        child: LayoutBuilder(
          builder: (context, constraints) {
            return SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 24.0),
              child: ConstrainedBox(
                constraints: BoxConstraints(minHeight: constraints.maxHeight),
                child: IntrinsicHeight(
                  child: Form(
                    key: _formKey,
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.start,
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        const SizedBox(height: 40),

                        Text(
                          'Hello, Welcome!',
                          textAlign: TextAlign.left,
                          style: AppTextStyles.displayLarge.copyWith(
                            color: AppColorsLight.textPrimary,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'Login to LUNAS',
                          textAlign: TextAlign.left,
                          style: AppTextStyles.bodyLarge.copyWith(
                            fontWeight: FontWeight.w500,
                            fontSize: 14,
                            color: AppColorsLight.textSecondary,
                          ),
                        ),
                        const SizedBox(height: 32),

                        // ✉️ Email Address Input Field
                        TextFormField(
                          controller: _emailController,
                          keyboardType: TextInputType.emailAddress,
                          style: AppTextStyles.bodySmall.copyWith(
                            fontWeight: FontWeight.w600,
                            color: AppColorsLight.textPrimary,
                          ),
                          decoration: InputDecoration(
                            hintText: 'Email',
                            hintStyle: AppTextStyles.bodySmallItalic,
                            isDense: true,
                            errorMaxLines: 1,
                            contentPadding: const EdgeInsets.only(
                              left: 0.0,
                              top: 12.0,
                              bottom: 12.0,
                              right: 12.0,
                            ),
                            prefixIcon: const Padding(
                              padding: EdgeInsets.only(left: 12.0, right: 8.0),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [Icon(Icons.email_outlined)],
                              ),
                            ),
                            counterText: '',
                            border: const OutlineInputBorder(),
                          ),
                          validator: (value) {
                            if (value == null || value.trim().isEmpty) {
                              return 'Please enter your email address';
                            }
                            final cleanValue = value.trim();
                            if (!_emailRegex.hasMatch(cleanValue)) {
                              return 'Please enter a valid email address';
                            }
                            return null;
                          },
                        ),
                        const SizedBox(height: 16),

                        // 🔑 Password Input Field
                        TextFormField(
                          controller: _passwordController,
                          obscureText: _obscurePassword,
                          style: AppTextStyles.bodySmall.copyWith(
                            fontWeight: FontWeight.w600,
                            color: AppColorsLight.textPrimary,
                          ),
                          decoration: InputDecoration(
                            hintText: 'Password',
                            hintStyle: AppTextStyles.bodySmallItalic,
                            isDense: true,
                            errorMaxLines: 1,
                            contentPadding: const EdgeInsets.only(
                              left: 0.0,
                              top: 12.0,
                              bottom: 12.0,
                              right: 12.0,
                            ),
                            prefixIcon: const Padding(
                              padding: EdgeInsets.only(left: 12.0, right: 8.0),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [Icon(Icons.lock_outline)],
                              ),
                            ),
                            suffixIcon: IconButton(
                              icon: Icon(
                                _obscurePassword
                                    ? Icons.visibility_off_outlined
                                    : Icons.visibility_outlined,
                                size: 20,
                              ),
                              onPressed: () {
                                setState(() {
                                  _obscurePassword = !_obscurePassword;
                                });
                              },
                            ),
                            counterText: '',
                            border: const OutlineInputBorder(),
                          ),
                          validator: (value) {
                            if (value == null || value.isEmpty) {
                              return 'Please enter your password';
                            }
                            if (value.length < 6) {
                              return 'Password must be at least 6 characters';
                            }
                            return null;
                          },
                        ),
                        const SizedBox(height: 8),

                        // ❓ Forgot Password Button
                        Align(
                          alignment: Alignment.centerRight,
                          child: TextButton(
                            onPressed: _navigateToForgotPassword,
                            style: TextButton.styleFrom(
                              minimumSize: Size.zero,
                              padding: const EdgeInsets.symmetric(
                                vertical: 4,
                                horizontal: 4,
                              ),
                              tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                            ),
                            child: Text(
                              'Forgot Password?',
                              style: AppTextStyles.bodySmall.copyWith(
                                fontWeight: FontWeight.w600,
                                color: AppColorsLight.brandBase,
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(height: 16),

                        Align(
                          alignment: Alignment.center,
                          child: TextButton(
                            onPressed: _loginWithPhone,
                            style: TextButton.styleFrom(
                              minimumSize: Size.zero,
                              padding: const EdgeInsets.symmetric(
                                vertical: 4,
                                horizontal: 8,
                              ),
                              tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                            ),
                            child: Text(
                              'Login via Mobile Number',
                              style: AppTextStyles.labelButton.copyWith(
                                fontWeight: FontWeight.w600,
                                color: AppColorsLight.brandBase,
                              ),
                            ),
                          ),
                        ),

                        const Spacer(),
                        const SizedBox(height: 24),

                        ElevatedButton(
                          onPressed: _submitForm,
                          style: ElevatedButton.styleFrom(
                            padding: const EdgeInsets.symmetric(vertical: 16),
                            backgroundColor: AppColorsLight.brandBase,
                            foregroundColor: AppColorsLight.surface,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(8),
                            ),
                          ),
                          child: Text(
                            'Login',
                            style: AppTextStyles.labelButton.copyWith(
                              fontWeight: FontWeight.w700,
                              color: AppColorsLight.surface,
                            ),
                          ),
                        ),
                        const SizedBox(height: 24),

                        Row(
                          children: [
                            const Expanded(
                              child: Divider(
                                thickness: 1,
                                color: Colors.black12,
                              ),
                            ),
                            Padding(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 16.0,
                              ),
                              child: Text(
                                'or',
                                style: AppTextStyles.bodySmall.copyWith(
                                  color: Colors.black54,
                                ),
                              ),
                            ),
                            const Expanded(
                              child: Divider(
                                thickness: 1,
                                color: Colors.black12,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 24),

                        Text(
                          "Don't have LUNAS account yet?",
                          textAlign: TextAlign.center,
                          style: AppTextStyles.bodySmall.copyWith(
                            fontWeight: FontWeight.w500,
                            fontSize: 13,
                            color: AppColorsLight.textPrimary,
                          ),
                        ),
                        const SizedBox(height: 12),

                        OutlinedButton(
                          onPressed: _navigateToRegister,
                          style: OutlinedButton.styleFrom(
                            padding: const EdgeInsets.symmetric(vertical: 16),
                            side: const BorderSide(
                              color: AppColorsLight.brandBase,
                            ),
                            foregroundColor: AppColorsLight.brandBase,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(8),
                            ),
                          ),
                          child: Text(
                            'Create New Account',
                            style: AppTextStyles.labelButton.copyWith(
                              fontWeight: FontWeight.w600,
                              color: AppColorsLight.brandBase,
                            ),
                          ),
                        ),
                        const SizedBox(height: 16),
                      ],
                    ),
                  ),
                ),
              ),
            );
          },
        ),
      ),
    );
  }
}
