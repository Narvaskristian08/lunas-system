import 'package:flutter/material.dart';
import 'package:lunas_mobile/core/theme/app_colors.dart';
import 'package:lunas_mobile/core/theme/app_spacing.dart';
import 'package:lunas_mobile/core/widgets/lunas_app_scaffold.dart';
import 'package:lunas_mobile/core/widgets/lunas_button.dart';
import 'package:lunas_mobile/core/widgets/lunas_card.dart';
import 'package:lunas_mobile/features/stitch_extras/presentation/screens/stitch_extra_widgets.dart';

class NavigateToIncidentScreen extends StatelessWidget {
  const NavigateToIncidentScreen({super.key});

  void _showMessage(BuildContext context, String message) {
    ScaffoldMessenger.of(
      context,
    ).showSnackBar(SnackBar(content: Text(message)));
  }

  @override
  Widget build(BuildContext context) {
    return LunasAppScaffold(
      title: 'LUNAS Repair',
      subtitle: 'Navigate to incident',
      showBackButton: true,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const StitchMapPlaceholder(
            title: 'A.B. Fernandez Avenue',
            subtitle: 'Water main pressure drop • Priority response',
            showRoute: true,
            height: 340,
          ),
          const SizedBox(height: AppSpacing.lg),
          LunasCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        'WO-2026-0142',
                        style: Theme.of(context).textTheme.titleLarge?.copyWith(
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                    ),
                    const StitchStatusPill(
                      label: 'High priority',
                      color: AppColorsLight.critical,
                      icon: Icons.warning_amber_rounded,
                    ),
                  ],
                ),
                const SizedBox(height: AppSpacing.sm),
                Text(
                  'Estimated arrival: 12 minutes',
                  style: Theme.of(context).textTheme.titleMedium,
                ),
                const SizedBox(height: AppSpacing.xxs),
                Text(
                  '4.2 km away • Light traffic • Bring water-network safety equipment.',
                  style: Theme.of(context).textTheme.bodyMedium,
                ),
              ],
            ),
          ),
          const SizedBox(height: AppSpacing.lg),
          LunasButton(
            label: 'Start Navigation',
            icon: Icons.navigation_rounded,
            onPressed: () => _showMessage(
              context,
              'Turn-by-turn navigation will use the approved map provider when connected.',
            ),
          ),
          const SizedBox(height: AppSpacing.sm),
          OutlinedButton.icon(
            onPressed: () => _showMessage(
              context,
              'External map handoff is available when device integrations are enabled.',
            ),
            icon: const Icon(Icons.map_outlined),
            label: const Text('Open in Maps'),
          ),
        ],
      ),
    );
  }
}
