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
          const LunasBrand(centered: true, large: true),
          const SizedBox(height: AppSpacing.xl),
          Text(
            failed ? 'Could not restore your session.' : 'Your city. Your voice. Your LUNAS.',
            textAlign: TextAlign.center,
            style: Theme.of(context).textTheme.bodyMedium,
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
            const Text('Restoring your secure session…'),
          ],
          const Spacer(),
        ],
      ),
    );
  }
}
