import 'dart:async';

import 'package:flutter/material.dart';
import 'package:lunas_mobile/core/theme/app_colors.dart';
import 'package:lunas_mobile/core/theme/app_spacing.dart';
import 'package:lunas_mobile/core/widgets/lunas_button.dart';
import 'package:lunas_mobile/features/auth/presentation/widgets/auth_layout.dart';
import 'package:lunas_mobile/features/auth/presentation/widgets/otp_code_field.dart';

class OtpVerificationScreen extends StatefulWidget {
  const OtpVerificationScreen({super.key});

  @override
  State<OtpVerificationScreen> createState() => _OtpVerificationScreenState();
}

class _OtpVerificationScreenState extends State<OtpVerificationScreen> {
  late final List<TextEditingController> _controllers;
  late final List<FocusNode> _focusNodes;
  Timer? _timer;
  int _seconds = 60;

  @override
  void initState() {
    super.initState();
    _controllers = List.generate(6, (_) => TextEditingController());
    _focusNodes = List.generate(6, (_) => FocusNode());
    _startTimer();
  }

  void _startTimer() {
    _timer?.cancel();
    _seconds = 60;
    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (!mounted) return;
      if (_seconds == 0) {
        timer.cancel();
      } else {
        setState(() => _seconds--);
      }
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    for (final controller in _controllers) {
      controller.dispose();
    }
    for (final node in _focusNodes) {
      node.dispose();
    }
    super.dispose();
  }

  void _verify() {
    final code = _controllers.map((item) => item.text).join();
    if (code.length != 6) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Enter the complete 6-digit code.')),
      );
      return;
    }
    Navigator.pushReplacementNamed(context, '/reset-password');
  }

  @override
  Widget build(BuildContext context) {
    final destination =
        ModalRoute.of(context)?.settings.arguments as String? ??
        'your registered contact';
    return AuthLayout(
      showBrand: false,
      showBackButton: true,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const Align(
            alignment: Alignment.center,
            child: LunasBrand(centered: true),
          ),
          const SizedBox(height: AppSpacing.xxl),
          const AuthHeading(
            title: 'Verify Your Contact',
            description: 'Enter the 6-digit verification code we sent to you.',
            centered: true,
          ),
          const SizedBox(height: AppSpacing.sm),
          Text(
            destination,
            textAlign: TextAlign.center,
            style: Theme.of(
              context,
            ).textTheme.titleMedium?.copyWith(color: AppColorsLight.brandBase),
          ),
          const SizedBox(height: AppSpacing.xxl),
          OtpCodeField(
            controllers: _controllers,
            focusNodes: _focusNodes,
            onCompleted: _verify,
          ),
          const SizedBox(height: AppSpacing.xl),
          LunasButton(label: 'Verify Code', onPressed: _verify),
          const SizedBox(height: AppSpacing.lg),
          Text(
            _seconds > 0
                ? 'Resend code in 00:${_seconds.toString().padLeft(2, '0')}'
                : 'Didn’t receive the code?',
            textAlign: TextAlign.center,
            style: Theme.of(context).textTheme.bodySmall,
          ),
          if (_seconds == 0)
            TextButton(
              onPressed: () {
                setState(_startTimer);
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('A new code has been sent.')),
                );
              },
              child: const Text('Resend Code'),
            ),
        ],
      ),
    );
  }
}
