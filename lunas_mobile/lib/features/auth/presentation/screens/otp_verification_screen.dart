import 'dart:async';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:lunas_mobile/core/routes/auth_routes.dart';
import 'package:flutter/services.dart';
import 'package:lunas_mobile/core/theme/app_colors.dart';
import 'package:lunas_mobile/core/theme/text_styles.dart';

class OtpVerificationScreen extends StatefulWidget {
  final String email;

  const OtpVerificationScreen({super.key, this.email = 'example@domain.com'});

  @override
  State<OtpVerificationScreen> createState() => _OtpVerificationScreenState();
}

class _OtpVerificationScreenState extends State<OtpVerificationScreen> {
  final _formKey = GlobalKey<FormState>();

  // 6 controllers and focus nodes for each OTP box
  final List<TextEditingController> _otpControllers = List.generate(
    6,
    (_) => TextEditingController(),
  );
  final List<FocusNode> _focusNodes = List.generate(6, (_) => FocusNode());

  // Resend Timer Logic
  Timer? _timer;
  int _secondsRemaining = 60;
  bool _canResend = false;

  @override
  void initState() {
    super.initState();
    _startResendTimer();
  }

  @override
  void dispose() {
    _timer?.cancel();
    for (var controller in _otpControllers) {
      controller.dispose();
    }
    for (var node in _focusNodes) {
      node.dispose();
    }
    super.dispose();
  }

  void _startResendTimer() {
    setState(() {
      _secondsRemaining = 60;
      _canResend = false;
    });

    _timer?.cancel();
    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (_secondsRemaining > 0) {
        setState(() {
          _secondsRemaining--;
        });
      } else {
        setState(() {
          _canResend = true;
        });
        timer.cancel();
      }
    });
  }

  String get _otpValue => _otpControllers.map((c) => c.text.trim()).join();

  void _onOtpChanged(int index, String value) {
    // Handle pasting multi-digit code into any field
    if (value.length > 1) {
      final digits = value.replaceAll(RegExp(r'\D'), '');
      for (int i = 0; i < 6; i++) {
        if (i < digits.length) {
          _otpControllers[i].text = digits[i];
        }
      }
      if (digits.length >= 6) {
        _focusNodes[5].unfocus();
      } else {
        _focusNodes[digits.length].requestFocus();
      }
      return;
    }

    // Move to next field automatically
    if (value.isNotEmpty && index < 5) {
      _focusNodes[index + 1].requestFocus();
    }
  }

  void _resendOtp() {
    if (!_canResend) return;

    // Clear existing values
    for (var controller in _otpControllers) {
      controller.clear();
    }
    _focusNodes[0].requestFocus();

    _startResendTimer();

    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('A new OTP has been sent to your email.')),
    );
  }

void _submitForm() {
  if (_formKey.currentState!.validate()) {
    // final otp = _otpValue;

    // TODO: Call your backend API here to verify the OTP before navigating

    // Navigate to Set Password Screen using GoRouter
    context.push(
      AuthRoutes.password, // or '/password'
      extra: {
      //  'email': widget.email,
      //  'otp': otp,
      },
    );
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
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        const SizedBox(height: 20),

                        Text(
                          'OTP Verification',
                          textAlign: TextAlign.left,
                          style: AppTextStyles.displayLarge.copyWith(
                            color: AppColorsLight.textPrimary,
                          ),
                        ),
                        const SizedBox(height: 8),
                        RichText(
                          text: TextSpan(
                            style: AppTextStyles.bodyLarge.copyWith(
                              fontWeight: FontWeight.w500,
                              fontSize: 14,
                              color: AppColorsLight.textSecondary,
                            ),
                            children: [
                              const TextSpan(
                                text:
                                    'We have sent a 6-digit verification code to ',
                              ),
                              TextSpan(
                                text: widget.email,
                                style: AppTextStyles.bodyLarge.copyWith(
                                  fontWeight: FontWeight.w600,
                                  fontSize: 14,
                                  color: AppColorsLight.textPrimary,
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 32),

                        // 🔢 6-Digit OTP Box Grid
                        FormField<String>(
                          validator: (_) {
                            if (_otpValue.length < 6) {
                              return 'Please enter complete 6-digit OTP';
                            }
                            return null;
                          },
                          builder: (state) {
                            return Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  mainAxisAlignment:
                                      MainAxisAlignment.spaceBetween,
                                  children: List.generate(6, (index) {
                                    return SizedBox(
                                      width: 44,
                                      height: 52,
                                      child: KeyboardListener(
                                        focusNode: FocusNode(),
                                        onKeyEvent: (event) {
                                          // Move back to previous box on Backspace if empty
                                          if (event is KeyDownEvent &&
                                              event.logicalKey ==
                                                  LogicalKeyboardKey
                                                      .backspace &&
                                              _otpControllers[index]
                                                  .text
                                                  .isEmpty &&
                                              index > 0) {
                                            _focusNodes[index - 1]
                                                .requestFocus();
                                          }
                                        },
                                        child: TextFormField(
                                          controller: _otpControllers[index],
                                          focusNode: _focusNodes[index],
                                          keyboardType: TextInputType.number,
                                          textAlign: TextAlign.center,
                                          style: AppTextStyles.bodySmall
                                              .copyWith(
                                                fontSize: 18,
                                                fontWeight: FontWeight.w700,
                                                color:
                                                    AppColorsLight.textPrimary,
                                              ),
                                          inputFormatters: [
                                            FilteringTextInputFormatter
                                                .digitsOnly,
                                          ],
                                          decoration: InputDecoration(
                                            isDense: true,
                                            contentPadding:
                                                const EdgeInsets.symmetric(
                                                  vertical: 12,
                                                ),
                                            counterText: '',
                                            enabledBorder: OutlineInputBorder(
                                              borderRadius:
                                                  BorderRadius.circular(8),
                                              borderSide: BorderSide(
                                                color: state.hasError
                                                    ? Colors.red
                                                    : AppColorsLight
                                                          .textSecondary,
                                              ),
                                            ),
                                            focusedBorder: OutlineInputBorder(
                                              borderRadius:
                                                  BorderRadius.circular(8),
                                              borderSide: const BorderSide(
                                                color: AppColorsLight.brandBase,
                                                width: 2,
                                              ),
                                            ),
                                            errorBorder: OutlineInputBorder(
                                              borderRadius:
                                                  BorderRadius.circular(8),
                                              borderSide: const BorderSide(
                                                color: Colors.red,
                                              ),
                                            ),
                                            focusedErrorBorder:
                                                OutlineInputBorder(
                                                  borderRadius:
                                                      BorderRadius.circular(8),
                                                  borderSide: const BorderSide(
                                                    color: Colors.red,
                                                    width: 2,
                                                  ),
                                                ),
                                          ),
                                          onChanged: (value) {
                                            _onOtpChanged(index, value);
                                            state.didChange(_otpValue);
                                          },
                                        ),
                                      ),
                                    );
                                  }),
                                ),
                                if (state.hasError) ...[
                                  const SizedBox(height: 8),
                                  Text(
                                    state.errorText!,
                                    style: AppTextStyles.bodySmall.copyWith(
                                      color: Colors.red,
                                      fontSize: 12,
                                    ),
                                  ),
                                ],
                              ],
                            );
                          },
                        ),
                        const SizedBox(height: 24),

                        // ⏱️ Resend Code / Timer Row
                        Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Text(
                              "Didn't receive the code? ",
                              style: AppTextStyles.bodySmall.copyWith(
                                color: AppColorsLight.textSecondary,
                              ),
                            ),
                            TextButton(
                              onPressed: _canResend ? _resendOtp : null,
                              style: TextButton.styleFrom(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 4,
                                ),
                                minimumSize: Size.zero,
                                tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                              ),
                              child: Text(
                                _canResend
                                    ? 'Resend Code'
                                    : 'Resend in ${_secondsRemaining}s',
                                style: AppTextStyles.bodySmall.copyWith(
                                  fontWeight: FontWeight.w600,
                                  color: _canResend
                                      ? AppColorsLight.brandBase
                                      : AppColorsLight.textSecondary,
                                ),
                              ),
                            ),
                          ],
                        ),

                        const Spacer(),
                        const SizedBox(height: 24),

                        // 🔑 Verify Button
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
                            'Verify & Continue',
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
