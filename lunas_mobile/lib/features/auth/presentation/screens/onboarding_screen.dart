import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:lunas_mobile/core/theme/app_colors.dart';
import 'package:lunas_mobile/core/theme/app_spacing.dart';
import 'package:lunas_mobile/core/widgets/lunas_button.dart';
import 'package:lunas_mobile/features/auth/presentation/widgets/auth_layout.dart';

class OnboardingScreen extends StatelessWidget {
  const OnboardingScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8F9FF),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(
            AppSpacing.xl,
            AppSpacing.lg,
            AppSpacing.xl,
            AppSpacing.xxl,
          ),
          child: Column(
            children: [
              Align(
                alignment: Alignment.centerRight,
                child: IconButton(
                  onPressed: () => _showUnavailable(context, 'Language selection'),
                  tooltip: 'Language',
                  icon: const Icon(Icons.language_rounded, size: 18),
                ),
              ),
              const SizedBox(height: AppSpacing.lg),
              const LunasBrand(
                centered: true,
                large: true,
                showSubtitle: false,
              ),
              const SizedBox(height: AppSpacing.xl),
              Container(
                padding: const EdgeInsets.all(AppSpacing.lg),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(22),
                ),
                child: const Text(
                  'Report infrastructure concerns and track their resolution.',
                  textAlign: TextAlign.center,
                ),
              ),
              const SizedBox(height: AppSpacing.lg),
              LunasButton(
                label: 'Log In',
                icon: Icons.login_rounded,
                onPressed: () => context.go('/login'),
              ),
              const SizedBox(height: AppSpacing.sm),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () => context.go('/registration/type'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF9AF29A),
                    foregroundColor: const Color(0xFF164B21),
                    elevation: 0,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                  child: const Text('Create Account'),
                ),
              ),
              const SizedBox(height: AppSpacing.md),
              Container(
                height: 176,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(22),
                  gradient: const LinearGradient(
                    colors: [Color(0xFFDCEBFA), Color(0xFFB9D8EE)],
                  ),
                ),
                child: const Center(
                  child: Icon(
                    Icons.location_city_rounded,
                    size: 64,
                    color: AppColorsLight.brandBase,
                  ),
                ),
              ),
              const SizedBox(height: AppSpacing.lg),
              TextButton.icon(
                onPressed: () => _showUnavailable(context, 'About LUNAS'),
                icon: const Icon(Icons.arrow_forward_rounded, size: 16),
                label: const Text('Learn About LUNAS'),
              ),
              const SizedBox(height: AppSpacing.sm),
              Text(
                '© 2024 LUNAS Urban Infrastructure Management',
                style: Theme.of(context).textTheme.labelSmall,
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _showUnavailable(BuildContext context, String feature) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('$feature is not available in this build.')),
    );
  }
}
