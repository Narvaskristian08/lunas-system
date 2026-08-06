import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter/services.dart';
import 'package:lunas_mobile/core/theme/app_spacing.dart';
import 'package:lunas_mobile/core/widgets/lunas_button.dart';
import 'package:lunas_mobile/core/widgets/lunas_text_field.dart';
import 'package:lunas_mobile/features/auth/presentation/widgets/auth_layout.dart';

class PhoneLoginScreen extends StatefulWidget {
  const PhoneLoginScreen({super.key});

  @override
  State<PhoneLoginScreen> createState() => _PhoneLoginScreenState();
}

class _PhoneLoginScreenState extends State<PhoneLoginScreen> {
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
    context.pushNamed('emailLogin');
    // OR using path: context.push(AuthRoutes.phoneLogin);
  }

  void _navigateToSignUp() {
    context.pushNamed('signUp');
    // OR using path: context.push(AuthRoutes.signUp);
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

                        // PH Phone Number Input Field
                        TextFormField(
                          controller: _phoneController,
                          keyboardType: TextInputType.number,
                          maxLength: 10,
                          style: AppTextStyles.bodySmall.copyWith(
                            fontWeight: FontWeight.w600,
                            color: AppColorsLight.textPrimary,
                          ),
                          inputFormatters: [
                            FilteringTextInputFormatter.digitsOnly,
                          ],
                          decoration: InputDecoration(
                            hintText: '9XXXXXXXXX',
                            hintStyle: AppTextStyles.bodySmallItalic,
                            isDense: true,
                            errorMaxLines: 1,
                            // 🌟 Removes default padding box bounds so error starts completely left
                            contentPadding: const EdgeInsets.only(
                              left: 0.0,
                              top: 12.0,
                              bottom: 12.0,
                              right: 12.0,
                            ),
                            prefixIcon: Padding(
                              padding: const EdgeInsets.only(
                                left: 12.0,
                                right: 2.0,
                              ),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  const Icon(Icons.phone_outlined),
                                  const SizedBox(width: 8),
                                  Text(
                                    '+63',
                                    style: AppTextStyles.bodySmall.copyWith(
                                      fontWeight: FontWeight.w600,
                                      color: AppColorsLight.textPrimary,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            counterText: '',
                            border: const OutlineInputBorder(),
                          ),
                          validator: (value) {
                            if (value == null || value.trim().isEmpty) {
                              return 'Please enter your mobile number';
                            }
                            final cleanValue = value.trim();
                            if (!cleanValue.startsWith('9') ||
                                cleanValue.length != 10) {
                              return 'Please enter a valid 10-digit mobile number';
                            }
                            return null;
                          },
                        ),
                        const SizedBox(height: 20),

                        Align(
                          alignment: Alignment.center,
                          child: TextButton(
                            onPressed: _loginWithEmail,
                            style: TextButton.styleFrom(
                              minimumSize: Size.zero,
                              padding: const EdgeInsets.symmetric(
                                vertical: 4,
                                horizontal: 8,
                              ),
                              tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                            ),
                            child: Text(
                              'Login via Email',
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
                          onPressed: _navigateToSignUp,
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
