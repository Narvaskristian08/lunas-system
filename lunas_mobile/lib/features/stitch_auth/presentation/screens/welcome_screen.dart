import 'package:flutter/material.dart';
import 'package:lunas_mobile/core/theme/app_radius.dart';
import 'package:lunas_mobile/core/theme/app_spacing.dart';
import 'package:lunas_mobile/core/widgets/lunas_button.dart';
import 'package:lunas_mobile/features/stitch_auth/presentation/screens/stitch_auth_widgets.dart';

/// Native port of the Stitch welcome screen.
class WelcomeScreen extends StatelessWidget {
  const WelcomeScreen({super.key});

  void _showLanguageMessage(BuildContext context) {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Language selection is a UI preview.')),
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      body: SafeArea(
        child: LayoutBuilder(
          builder: (context, constraints) {
            final horizontal = constraints.maxWidth < 360
                ? AppSpacing.md
                : AppSpacing.xl;
            return SingleChildScrollView(
              padding: EdgeInsets.fromLTRB(
                horizontal,
                AppSpacing.sm,
                horizontal,
                AppSpacing.xxl,
              ),
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 520),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Align(
                      alignment: Alignment.centerRight,
                      child: IconButton(
                        tooltip: 'Language',
                        onPressed: () => _showLanguageMessage(context),
                        icon: const Icon(Icons.language_rounded),
                      ),
                    ),
                    const SizedBox(height: AppSpacing.xxl),
                    const Center(child: StitchBrandMark(large: true)),
                    const SizedBox(height: AppSpacing.lg),
                    Text(
                      'LUNAS',
                      textAlign: TextAlign.center,
                      style: theme.textTheme.displayMedium?.copyWith(
                        fontWeight: FontWeight.w900,
                        letterSpacing: 1.6,
                      ),
                    ),
                    const SizedBox(height: AppSpacing.sm),
                    Center(
                      child: Container(
                        width: 48,
                        height: 4,
                        decoration: BoxDecoration(
                          color: theme.colorScheme.primary,
                          borderRadius: BorderRadius.circular(AppRadius.pill),
                        ),
                      ),
                    ),
                    const SizedBox(height: AppSpacing.xxl),
                    Container(
                      padding: const EdgeInsets.all(AppSpacing.xl),
                      decoration: BoxDecoration(
                        color: theme.colorScheme.primaryContainer.withValues(
                          alpha: .40,
                        ),
                        borderRadius: BorderRadius.circular(28),
                      ),
                      child: Text(
                        'Report infrastructure concerns and track their resolution across Dagupan City.',
                        textAlign: TextAlign.center,
                        style: theme.textTheme.titleMedium?.copyWith(
                          height: 1.45,
                        ),
                      ),
                    ),
                    const SizedBox(height: AppSpacing.xl),
                    _CityPreview(),
                    const SizedBox(height: AppSpacing.xl),
                    LunasButton(
                      label: 'Log In',
                      icon: Icons.login_rounded,
                      onPressed: () => Navigator.pushNamed(context, '/login'),
                    ),
                    const SizedBox(height: AppSpacing.sm),
                    SizedBox(
                      width: double.infinity,
                      child: OutlinedButton.icon(
                        onPressed: () =>
                            Navigator.pushNamed(context, '/registration/type'),
                        icon: const Icon(Icons.person_add_alt_1_outlined),
                        label: const Text('Create Account'),
                      ),
                    ),
                    const SizedBox(height: AppSpacing.lg),
                    TextButton.icon(
                      onPressed: () => ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          content: Text('LUNAS helps residents and offices coordinate infrastructure response.'),
                        ),
                      ),
                      icon: const Icon(Icons.arrow_forward_rounded),
                      label: const Text('Learn About LUNAS'),
                    ),
                  ],
                ),
              ),
            );
          },
        ),
      ),
    );
  }
}

class _CityPreview extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Container(
      height: 176,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(28),
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            theme.colorScheme.primaryContainer,
            theme.colorScheme.surface,
            theme.colorScheme.secondaryContainer,
          ],
        ),
        border: Border.all(color: theme.colorScheme.outlineVariant),
      ),
      child: Stack(
        children: [
          Positioned(
            left: 30,
            right: 30,
            bottom: 30,
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.end,
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: const [
                _Building(height: 56),
                _Building(height: 86),
                _Building(height: 68),
                _Building(height: 104),
                _Building(height: 48),
              ],
            ),
          ),
          Align(
            alignment: const Alignment(0, -.55),
            child: Icon(
              Icons.location_city_rounded,
              size: 42,
              color: theme.colorScheme.primary,
            ),
          ),
        ],
      ),
    );
  }
}

class _Building extends StatelessWidget {
  const _Building({required this.height});

  final double height;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 30,
      height: height,
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.primary.withValues(alpha: .55),
        borderRadius: const BorderRadius.vertical(top: Radius.circular(5)),
      ),
    );
  }
}
