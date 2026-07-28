import 'dart:async';

import 'package:flutter/material.dart';
import 'package:lunas_mobile/core/theme/app_colors.dart';
import 'package:lunas_mobile/core/theme/app_spacing.dart';
import 'package:lunas_mobile/features/auth/presentation/widgets/auth_layout.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> {
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _timer = Timer(const Duration(milliseconds: 1800), () {
      if (mounted) Navigator.pushReplacementNamed(context, '/welcome');
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AuthLayout(
      showBrand: false,
      scrollable: false,
      child: Column(
        children: [
          const Spacer(flex: 5),
          const LunasBrand(centered: true, large: true),
          const SizedBox(height: AppSpacing.xl),
          Text(
            'Your city. Your voice. Your LUNAS.',
            textAlign: TextAlign.center,
            style: Theme.of(context).textTheme.bodyMedium,
          ),
          const Spacer(flex: 4),
          const SizedBox(
            width: 25,
            height: 25,
            child: CircularProgressIndicator(
              strokeWidth: 2.5,
              color: AppColorsLight.brandBase,
            ),
          ),
          const SizedBox(height: AppSpacing.sm),
          Text('Loading...', style: Theme.of(context).textTheme.bodySmall),
          const Spacer(),
        ],
      ),
    );
  }
}
