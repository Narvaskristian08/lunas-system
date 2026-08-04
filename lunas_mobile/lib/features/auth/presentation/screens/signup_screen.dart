import 'package:flutter/material.dart';
import 'package:lunas_mobile/core/theme/app_colors.dart';
import 'package:lunas_mobile/core/theme/text_styles.dart';

class SignUpScreen extends StatefulWidget {
  const SignUpScreen({super.key});

  @override
  State<SignUpScreen> createState() => _SignUpScreenState();
}

class _SignUpScreenState extends State<SignUpScreen> {
  final _formKey = GlobalKey<FormState>();

  final _firstNameController = TextEditingController();
  final _middleNameController = TextEditingController();
  final _lastNameController = TextEditingController();
  final _emailController = TextEditingController();

  bool _hasNoMiddleName = false;

  final _emailRegex = RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$');

  @override
  void dispose() {
    _firstNameController.dispose();
    _middleNameController.dispose();
    _lastNameController.dispose();
    _emailController.dispose();
    super.dispose();
  }

  void _submitForm() {
    if (_formKey.currentState!.validate()) {
      final firstName = _firstNameController.text.trim();
      final lastName = _lastNameController.text.trim();

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Processing registration for $firstName $lastName...'),
          duration: const Duration(seconds: 2),
        ),
      );

      // TODO: Connect to authentication repository/provider logic here
    }
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
                          'Create Account',
                          textAlign: TextAlign.left,
                          style: AppTextStyles.displayLarge.copyWith(
                            color: AppColorsLight.textPrimary,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'Please fill in your details to get started.',
                          textAlign: TextAlign.left,
                          style: AppTextStyles.bodyLarge.copyWith(
                            fontWeight: FontWeight.w500,
                            fontSize: 14,
                            color: AppColorsLight.textSecondary,
                          ),
                        ),
                        const SizedBox(height: 32),

                        // First Name Input Field
                        TextFormField(
                          controller: _firstNameController,
                          textCapitalization: TextCapitalization.words,
                          style: AppTextStyles.bodySmall.copyWith(
                            fontWeight: FontWeight.w600,
                            color: AppColorsLight.textPrimary,
                          ),
                          decoration: const InputDecoration(
                            hintText: 'First Name',
                            hintStyle: AppTextStyles.bodySmallItalic,
                            errorMaxLines: 1,
                            prefix: SizedBox(width: 12.0),
                            prefixIconConstraints: BoxConstraints(
                              minWidth: 0,
                              minHeight: 0,
                            ),
                            contentPadding: EdgeInsets.only(
                              left: 0.0,
                              top: 12.0,
                              bottom: 12.0,
                              right: 12.0,
                            ),
                            counterText: '',
                            border: OutlineInputBorder(),
                          ),
                          validator: (value) {
                            if (value == null || value.trim().isEmpty) {
                              return 'Please enter your first name';
                            }
                            return null;
                          },
                        ),
                        const SizedBox(height: 16),

                        // Middle Name Input Field
                        TextFormField(
                          controller: _middleNameController,
                          enabled: !_hasNoMiddleName,
                          textCapitalization: TextCapitalization.words,
                          style: AppTextStyles.bodySmall.copyWith(
                            fontWeight: FontWeight.w600,
                            color: _hasNoMiddleName
                                ? AppColorsLight.textSecondary
                                : AppColorsLight.textPrimary,
                          ),
                          decoration: const InputDecoration(
                            hintText: 'Middle Name',
                            hintStyle: AppTextStyles.bodySmallItalic,
                            errorMaxLines: 1,
                            prefix: SizedBox(width: 12.0),
                            prefixIconConstraints: BoxConstraints(
                              minWidth: 0,
                              minHeight: 0,
                            ),
                            contentPadding: EdgeInsets.only(
                              left: 0.0,
                              top: 12.0,
                              bottom: 12.0,
                              right: 12.0,
                            ),
                            counterText: '',
                            border: OutlineInputBorder(),
                          ),
                          validator: (value) {
                            if (!_hasNoMiddleName &&
                                (value == null || value.trim().isEmpty)) {
                              return 'Please enter your middle name or check the box below';
                            }
                            return null;
                          },
                        ),

                        // Checkbox
                        const SizedBox(height: 4),
                        Align(
                          alignment: Alignment.centerRight,
                          child: InkWell(
                            borderRadius: BorderRadius.circular(4),
                            onTap: () {
                              setState(() {
                                _hasNoMiddleName = !_hasNoMiddleName;
                                if (_hasNoMiddleName) {
                                  _middleNameController.clear();
                                }
                              });
                            },
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              crossAxisAlignment: CrossAxisAlignment.center,
                              children: [
                                SizedBox(
                                  height: 24,
                                  width: 24,
                                  child: Checkbox(
                                    value: _hasNoMiddleName,
                                    activeColor: AppColorsLight.brandBase,
                                    materialTapTargetSize:
                                        MaterialTapTargetSize.shrinkWrap,
                                    visualDensity: VisualDensity.compact,
                                    onChanged: (bool? value) {
                                      setState(() {
                                        _hasNoMiddleName = value ?? false;
                                        if (_hasNoMiddleName) {
                                          _middleNameController.clear();
                                        }
                                      });
                                    },
                                  ),
                                ),
                                const SizedBox(width: 8),
                                Text(
                                  'I have no middle name',
                                  style: AppTextStyles.bodySmall.copyWith(
                                    color: AppColorsLight.textSecondary,
                                    fontWeight: FontWeight.w500,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                        const SizedBox(height: 16),

                        // Last Name Input Field
                        TextFormField(
                          controller: _lastNameController,
                          textCapitalization: TextCapitalization.words,
                          style: AppTextStyles.bodySmall.copyWith(
                            fontWeight: FontWeight.w600,
                            color: AppColorsLight.textPrimary,
                          ),
                          decoration: const InputDecoration(
                            hintText: 'Last Name',
                            hintStyle: AppTextStyles.bodySmallItalic,
                            errorMaxLines: 1,
                            prefix: SizedBox(width: 12.0),
                            prefixIconConstraints: BoxConstraints(
                              minWidth: 0,
                              minHeight: 0,
                            ),
                            contentPadding: EdgeInsets.only(
                              left: 0.0,
                              top: 12.0,
                              bottom: 12.0,
                              right: 12.0,
                            ),
                            counterText: '',
                            border: OutlineInputBorder(),
                          ),
                          validator: (value) {
                            if (value == null || value.trim().isEmpty) {
                              return 'Please enter your last name';
                            }
                            return null;
                          },
                        ),
                        const SizedBox(height: 16),

                        // ✉️ Email Address Input Field
                        TextFormField(
                          controller: _emailController,
                          keyboardType: TextInputType.emailAddress,
                          style: AppTextStyles.bodySmall.copyWith(
                            fontWeight: FontWeight.w600,
                            color: AppColorsLight.textPrimary,
                          ),
                          decoration: const InputDecoration(
                            hintText: 'Email Address',
                            hintStyle: AppTextStyles.bodySmallItalic,
                            errorMaxLines: 1,
                            prefix: SizedBox(width: 12.0),
                            prefixIconConstraints: BoxConstraints(
                              minWidth: 0,
                              minHeight: 0,
                            ),
                            contentPadding: EdgeInsets.only(
                              left: 0.0,
                              top: 12.0,
                              bottom: 12.0,
                              right: 12.0,
                            ),
                            counterText: '',
                            border: OutlineInputBorder(),
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
                            'Create Account',
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
                          'Already have a LUNAS account?',
                          textAlign: TextAlign.center,
                          style: AppTextStyles.bodySmall.copyWith(
                            fontWeight: FontWeight.w500,
                            fontSize: 13,
                            color: AppColorsLight.textPrimary,
                          ),
                        ),
                        const SizedBox(height: 12),

                        OutlinedButton(
                          onPressed: () => Navigator.pop(context),
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
                            'Login',
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
