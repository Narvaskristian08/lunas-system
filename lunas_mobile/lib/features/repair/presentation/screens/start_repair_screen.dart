import 'package:flutter/material.dart';
import 'package:lunas_mobile/core/theme/app_colors.dart';
import 'package:lunas_mobile/core/theme/app_radius.dart';
import 'package:lunas_mobile/core/theme/app_spacing.dart';
import 'package:lunas_mobile/core/widgets/lunas_card.dart';
import 'package:lunas_mobile/features/repair/presentation/screens/repair_routes.dart';
import 'package:lunas_mobile/features/repair/presentation/screens/repair_widgets.dart';

/// Arrival/readiness checkpoint before a repair can be marked in progress.
class StartRepairScreen extends StatelessWidget {
  const StartRepairScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return RepairPage(
      appBar: const RepairAppBar(showBackButton: true),
      bottomActionBar: _StartRepairActionBar(
        onConfirm: () =>
            Navigator.pushNamed(context, RepairRoutes.updateProgress),
        onCancel: () => Navigator.of(context).maybePop(),
      ),
      padding: const EdgeInsets.fromLTRB(
        AppSpacing.xl,
        AppSpacing.lg,
        AppSpacing.xl,
        AppSpacing.xxxl,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              Icon(
                Icons.assignment_outlined,
                color: theme.colorScheme.onSurfaceVariant,
              ),
              const SizedBox(width: AppSpacing.sm),
              Text('Work order readiness', style: theme.textTheme.titleMedium),
            ],
          ),
          const SizedBox(height: AppSpacing.xs),
          Text(
            '#WO-2026-0142',
            style: theme.textTheme.headlineLarge?.copyWith(
              fontSize: 30,
              fontWeight: FontWeight.w800,
            ),
          ),
          const SizedBox(height: AppSpacing.xl),
          LunasCard(
            child: Column(
              children: [
                Text(
                  'SCHEDULED START',
                  style: theme.textTheme.labelSmall,
                ),
                const SizedBox(height: AppSpacing.md),
                Text(
                  '08:45 AM',
                  style: theme.textTheme.displayMedium?.copyWith(
                    fontSize: 42,
                    color: theme.colorScheme.primary,
                    fontWeight: FontWeight.w800,
                  ),
                ),
                const SizedBox(height: AppSpacing.lg),
                const RepairStatusChip(
                  label: 'Current GPS location verified',
                  color: AppColorsLight.success,
                  icon: Icons.verified_outlined,
                ),
              ],
            ),
          ),
          const SizedBox(height: AppSpacing.xl),
          LunasCard(
            padding: EdgeInsets.zero,
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Container(width: 4, color: AppColorsLight.critical),
                Expanded(
                  child: Padding(
                    padding: const EdgeInsets.all(AppSpacing.lg),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        Row(
                          children: [
                            Expanded(
                              child: Text(
                                'Incident summary',
                                style: theme.textTheme.titleLarge?.copyWith(
                                  fontWeight: FontWeight.w800,
                                ),
                              ),
                            ),
                            const RepairStatusChip(
                              label: 'High priority',
                              color: AppColorsLight.critical,
                              icon: Icons.warning_amber_rounded,
                            ),
                          ],
                        ),
                        const SizedBox(height: AppSpacing.lg),
                        Text('Location', style: theme.textTheme.bodySmall),
                        const SizedBox(height: AppSpacing.xs),
                        Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Icon(
                              Icons.location_on_outlined,
                              color: theme.colorScheme.primary,
                            ),
                            const SizedBox(width: AppSpacing.sm),
                            Expanded(
                              child: Text(
                                'A.B. Fernandez Ave., Barangay IV, Dagupan City',
                                style: theme.textTheme.bodyMedium?.copyWith(
                                  color: theme.colorScheme.onSurface,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: AppSpacing.md),
                        const RepairPlaceholderImage(
                          label: 'Incident location',
                          detail: 'Verify the location before beginning work.',
                          icon: Icons.location_searching,
                          height: 126,
                          accentColor: AppColorsLight.critical,
                        ),
                        const SizedBox(height: AppSpacing.lg),
                        Text('Hazard type', style: theme.textTheme.bodySmall),
                        const SizedBox(height: AppSpacing.xs),
                        Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Icon(
                              Icons.add_road_rounded,
                              color: AppColorsLight.critical,
                            ),
                            const SizedBox(width: AppSpacing.sm),
                            Expanded(
                              child: Text(
                                'Road-surface damage. Secure the work zone before applying the cold patch.',
                                style: theme.textTheme.bodyMedium?.copyWith(
                                  color: theme.colorScheme.onSurface,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _StartRepairActionBar extends StatelessWidget {
  const _StartRepairActionBar({
    required this.onConfirm,
    required this.onCancel,
  });

  final VoidCallback onConfirm;
  final VoidCallback onCancel;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return SafeArea(
      top: false,
      child: Container(
        padding: const EdgeInsets.all(AppSpacing.md),
        decoration: BoxDecoration(
          color: theme.colorScheme.surface,
          border: Border(top: BorderSide(color: theme.colorScheme.outlineVariant)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            SizedBox(
              width: double.infinity,
              height: 52,
              child: FilledButton.icon(
                onPressed: onConfirm,
                icon: const Icon(Icons.play_circle_outline_rounded),
                label: const Text('Confirm arrival & start repair'),
              ),
            ),
            const SizedBox(height: AppSpacing.sm),
            SizedBox(
              width: double.infinity,
              height: 48,
              child: OutlinedButton(
                onPressed: onCancel,
                style: OutlinedButton.styleFrom(
                  backgroundColor: theme.colorScheme.primaryContainer.withValues(
                    alpha: .45,
                  ),
                  side: BorderSide.none,
                  shape: RoundedRectangleBorder(borderRadius: AppRadius.button),
                ),
                child: const Text('Cancel'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
