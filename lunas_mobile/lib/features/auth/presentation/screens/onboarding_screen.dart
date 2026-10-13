import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:lunas_mobile/core/theme/app_spacing.dart';
import 'package:lunas_mobile/core/theme/app_radius.dart';
import 'package:lunas_mobile/core/theme/text_styles.dart';
import 'package:lunas_mobile/core/widgets/lunas_button.dart';
import 'package:lunas_mobile/features/auth/presentation/widgets/auth_layout.dart';

class OnboardingScreen extends StatelessWidget {
  const OnboardingScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return AuthLayout(
      showBrand: false,
      centerContent: true,
      footer: Text(
        '© ${DateTime.now().year} LUNAS Urban Infrastructure Management',
        textAlign: TextAlign.center,
        style: theme.textTheme.labelSmall,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const LunasBrand(
            centered: true,
            large: true,
            showTitle: false,
            showSubtitle: false,
          ),
          const SizedBox(height: AppSpacing.xl),
          Text(
            'Welcome to LUNAS',
            textAlign: TextAlign.center,
            style: theme.textTheme.headlineMedium?.copyWith(
              fontWeight: FontWeight.w700,
              fontSize: 28,
            ),
          ),
          const SizedBox(height: AppSpacing.xs),
          Text(
            'Report infrastructure issues in Dagupan City and track repair progress.',
            textAlign: TextAlign.center,
            style: theme.textTheme.bodyMedium?.copyWith(
              color: theme.colorScheme.onSurfaceVariant,
              height: 1.5,
            ),
          ),
          const SizedBox(height: AppSpacing.xl),
          LunasButton(label: 'Login', onPressed: () => context.go('/login')),
          const SizedBox(height: AppSpacing.sm),
          SizedBox(
            height: 54,
            child: OutlinedButton(
              onPressed: () => context.go('/register'),
              style: OutlinedButton.styleFrom(
                foregroundColor: theme.colorScheme.primary,
                side: BorderSide(color: theme.colorScheme.primary),
                textStyle: AppTextStyles.labelButton.copyWith(
                  fontWeight: FontWeight.w700,
                ),
                shape: RoundedRectangleBorder(borderRadius: AppRadius.button),
              ),
              child: const Text('Sign Up'),
            ),
          ),
          const SizedBox(height: AppSpacing.md),
          TextButton(
            onPressed: () => _showUnavailable(context, 'About LUNAS'),
            child: const Text('Learn About LUNAS'),
          ),
        ],
      ),
    );
  }

  void _showUnavailable(BuildContext context, String feature) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('$feature is not available in this build.')),
    );
  }
}
