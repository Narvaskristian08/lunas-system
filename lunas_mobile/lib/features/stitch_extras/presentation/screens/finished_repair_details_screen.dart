import 'package:flutter/material.dart';
import 'package:lunas_mobile/core/theme/app_colors.dart';
import 'package:lunas_mobile/core/theme/app_spacing.dart';
import 'package:lunas_mobile/core/widgets/lunas_app_scaffold.dart';
import 'package:lunas_mobile/core/widgets/lunas_card.dart';
import 'package:lunas_mobile/features/stitch_extras/presentation/screens/stitch_extra_widgets.dart';

class FinishedRepairDetailsScreen extends StatelessWidget {
  const FinishedRepairDetailsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return LunasAppScaffold(
      title: 'Finished repair',
      subtitle: 'WO-2026-0142',
      showBackButton: true,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  'Pothole repair',
                  style: Theme.of(context).textTheme.headlineLarge?.copyWith(
                    fontSize: 28,
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ),
              const StitchStatusPill(
                label: 'Verified',
                color: AppColorsLight.success,
                icon: Icons.verified_outlined,
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.xs),
          Text(
            'A.B. Fernandez Avenue, Dagupan City',
            style: Theme.of(context).textTheme.bodyMedium,
          ),
          const SizedBox(height: AppSpacing.lg),
          const StitchEvidenceComparison(),
          const SizedBox(height: AppSpacing.lg),
          LunasCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Repair notes',
                  style: Theme.of(context).textTheme.titleMedium,
                ),
                const SizedBox(height: AppSpacing.sm),
                Text(
                  'The damaged pavement was cleared, the base compacted, and a hot-mix asphalt patch was applied and sealed. The area was cleaned before reopening.',
                  style: Theme.of(
                    context,
                  ).textTheme.bodyMedium?.copyWith(height: 1.5),
                ),
              ],
            ),
          ),
          const SizedBox(height: AppSpacing.md),
          LunasCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Verification',
                  style: Theme.of(context).textTheme.titleMedium,
                ),
                const SizedBox(height: AppSpacing.md),
                const _DetailRow(
                  icon: Icons.verified_user_outlined,
                  label: 'Verified by',
                  value: 'Dagupan City Engineering Office',
                ),
                const SizedBox(height: AppSpacing.md),
                const _DetailRow(
                  icon: Icons.schedule_outlined,
                  label: 'Verified on',
                  value: 'Today, 3:15 PM',
                ),
                const SizedBox(height: AppSpacing.md),
                const _DetailRow(
                  icon: Icons.comment_outlined,
                  label: 'Remarks',
                  value: 'Repair meets the documented site requirements.',
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _DetailRow extends StatelessWidget {
  const _DetailRow({
    required this.icon,
    required this.label,
    required this.value,
  });

  final IconData icon;
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, color: Theme.of(context).colorScheme.primary),
        const SizedBox(width: AppSpacing.sm),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(label, style: Theme.of(context).textTheme.labelSmall),
              const SizedBox(height: AppSpacing.xxs),
              Text(value, style: Theme.of(context).textTheme.bodyMedium),
            ],
          ),
        ),
      ],
    );
  }
}
