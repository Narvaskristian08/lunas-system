import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:lunas_mobile/core/theme/app_colors.dart';
import 'package:lunas_mobile/core/theme/app_spacing.dart';
import 'package:lunas_mobile/core/widgets/lunas_button.dart';
import 'package:lunas_mobile/features/auth/presentation/controllers/auth_controller.dart';
import 'package:lunas_mobile/features/auth/presentation/widgets/auth_layout.dart';
import 'package:lunas_mobile/features/auth/presentation/widgets/auth_scope.dart';

class AppSplashScreen extends StatelessWidget {
  const AppSplashScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final auth = AuthScope.of(context);
    final failed = auth.status == AuthStatus.restoreFailed;
    return AuthLayout(
      showBrand: false,
      scrollable: false,
      child: Column(
        children: [
          const Spacer(flex: 4),
          const LunasBrand(
            centered: true,
            large: true,
            showTitle: false,
            showSubtitle: false,
          ),
          const SizedBox(height: AppSpacing.xl),
          Text(
            'LUNAS',
            style: Theme.of(context).textTheme.displayMedium?.copyWith(
              color: AppColorsLight.brandBase,
              fontWeight: FontWeight.w800,
              letterSpacing: 1.2,
            ),
          ),
          const SizedBox(height: AppSpacing.md),
          Text(
            failed
                ? 'Could not restore your session.'
                : 'AI-Assisted Urban Infrastructure\nMaintenance and Monitoring System',
            textAlign: TextAlign.center,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(height: 1.5),
          ),
          const Spacer(flex: 3),
          if (failed) ...[
            Text(auth.message ?? 'Please try again.', textAlign: TextAlign.center),
            const SizedBox(height: AppSpacing.md),
            LunasButton(label: 'Try again', onPressed: auth.restoreSession),
            TextButton(
              onPressed: () => context.go('/login'),
              child: const Text('Sign in instead'),
            ),
          ] else ...[
            const SizedBox(
              width: 28,
              height: 28,
              child: CircularProgressIndicator(
                strokeWidth: 2.5,
                color: AppColorsLight.brandBase,
              ),
            ),
            const SizedBox(height: AppSpacing.md),
            const Text('Loading your account…'),
          ],
          const Spacer(flex: 2),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.verified_outlined, size: 18),
              const SizedBox(width: AppSpacing.xs),
              Flexible(
                child: Text(
                  'Government Standard Infrastructure Secure',
                  textAlign: TextAlign.center,
                  style: Theme.of(context).textTheme.bodySmall,
                ),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.sm),
          Container(
            padding: const EdgeInsets.symmetric(
              horizontal: AppSpacing.md,
              vertical: AppSpacing.xxs,
            ),
            decoration: BoxDecoration(
              border: Border.all(color: Theme.of(context).colorScheme.outline),
              borderRadius: BorderRadius.circular(999),
            ),
            child: const Text('v1.0.0'),
          ),
        ],
      ),
    );
  }
}
