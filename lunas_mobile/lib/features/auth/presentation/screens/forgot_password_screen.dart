import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:lunas_mobile/core/routes/auth_routes.dart';
import 'package:lunas_mobile/core/theme/app_colors.dart';
import 'package:lunas_mobile/core/theme/text_styles.dart';

class ForgotPasswordScreen extends StatefulWidget {
  const ForgotPasswordScreen({super.key});

  @override
  State<ForgotPasswordScreen> createState() => _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends State<ForgotPasswordScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();

  // Basic regular expression for validating emails
  final _emailRegex = RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$');

  @override
  void dispose() {
    _emailController.dispose();
    super.dispose();
  }

  void _submitForm() {
    if (_formKey.currentState!.validate()) {
      final email = _emailController.text.trim();

      // Show confirmation feedback
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Password reset code sent to $email'),
          duration: const Duration(seconds: 2),
        ),
      );

      // Navigate using GoRouter passing the email via extra map
      context.push(AuthRoutes.otpVerification, extra: {'destination': email});
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColorsLight.surface,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: AppColorsLight.textPrimary),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: SafeArea(
        child: LayoutBuilder(
          builder: (context, constraints) {
            return SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 24.0),
              child: ConstrainedBox(
                constraints: BoxConstraints(
                  minHeight: constraints.maxHeight - kToolbarHeight,
                ),
                child: IntrinsicHeight(
                  child: Form(
                    key: _formKey,
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.start,
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        const SizedBox(height: 20),

                        Text(
                          'Forgot Password',
                          textAlign: TextAlign.left,
                          style: AppTextStyles.displayLarge.copyWith(
                            color: AppColorsLight.textPrimary,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          "Enter your registered email address and we'll send you instructions to reset your password.",
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
                            hintText: 'Email Address',
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

                        const Spacer(),
                        const SizedBox(height: 24),

                        // 📩 Send Reset Link Button
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
                            'Send Reset Link',
                            style: AppTextStyles.labelButton.copyWith(
                              fontWeight: FontWeight.w700,
                              color: AppColorsLight.surface,
                            ),
                          ),
                        ),
                        const SizedBox(height: 24),
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
