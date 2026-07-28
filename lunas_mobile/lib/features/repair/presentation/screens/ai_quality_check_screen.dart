import 'package:flutter/material.dart';
import 'package:lunas_mobile/core/theme/app_colors.dart';
import 'package:lunas_mobile/core/theme/app_radius.dart';
import 'package:lunas_mobile/core/theme/app_spacing.dart';
import 'package:lunas_mobile/core/widgets/lunas_card.dart';
import 'package:lunas_mobile/features/repair/presentation/screens/repair_routes.dart';
import 'package:lunas_mobile/features/repair/presentation/screens/repair_widgets.dart';

/// Assistive evidence-quality review. The result is explicitly presented as a
/// suggestion; it does not autonomously accept a repair or replace human review.
class AiQualityCheckScreen extends StatelessWidget {
  const AiQualityCheckScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return RepairPage(
      appBar: const RepairAppBar(
        title: 'LUNAS Repair',
        subtitle: 'Evidence quality review',
        showBackButton: true,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Stack(
            children: [
              const RepairPlaceholderImage(
                label: 'Repair evidence preview',
                detail: 'AI visual review overlay',
                icon: Icons.photo_outlined,
                height: 270,
                accentColor: AppColorsLight.brandBase,
              ),
              Positioned(
                left: AppSpacing.sm,
                top: AppSpacing.sm,
                child: RepairStatusChip(
                  label: 'AI analysis active',
                  color: theme.colorScheme.primary,
                  icon: Icons.auto_awesome_outlined,
                ),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.xl),
          Text(
            'Image quality check',
            style: theme.textTheme.headlineLarge?.copyWith(
              fontSize: 26,
              fontWeight: FontWeight.w800,
            ),
          ),
          const SizedBox(height: AppSpacing.xs),
          Text(
            'Review AI-generated diagnostics before submitting the evidence.',
            style: theme.textTheme.bodyMedium,
          ),
          const SizedBox(height: AppSpacing.md),
          const _AssistantNotice(),
          const SizedBox(height: AppSpacing.lg),
          const _QualityMetrics(),
          const SizedBox(height: AppSpacing.lg),
          const _PrivacyScanCard(),
          const SizedBox(height: AppSpacing.xxxl),
          RepairPrimaryButton(
            label: 'Accept photo',
            icon: Icons.upload_outlined,
            onPressed: () =>
                Navigator.pushNamed(context, RepairRoutes.confirmCompletion),
          ),
          const SizedBox(height: AppSpacing.sm),
          RepairSecondaryButton(
            label: 'Retake or replace',
            icon: Icons.replay_rounded,
            onPressed: () =>
                Navigator.pushNamed(context, RepairRoutes.uploadEvidence),
          ),
        ],
      ),
    );
  }
}

class _AssistantNotice extends StatelessWidget {
  const _AssistantNotice();

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Container(
      padding: const EdgeInsets.all(AppSpacing.sm),
      decoration: BoxDecoration(
        color: theme.colorScheme.primaryContainer.withValues(alpha: .48),
        borderRadius: BorderRadius.circular(AppRadius.sm),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(Icons.info_outline_rounded, color: theme.colorScheme.primary),
          const SizedBox(width: AppSpacing.sm),
          Expanded(
            child: Text(
              'AI suggestions only. Confirm that this evidence accurately represents the repair before continuing.',
              style: theme.textTheme.bodySmall?.copyWith(
                color: theme.colorScheme.onSurface,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _QualityMetrics extends StatelessWidget {
  const _QualityMetrics();

  @override
  Widget build(BuildContext context) {
    const metrics = [
      (label: 'Sharpness', value: 'High', icon: Icons.center_focus_strong),
      (label: 'Lighting', value: 'Optimal', icon: Icons.light_mode_outlined),
      (label: 'Blur', value: 'Not detected', icon: Icons.blur_on),
    ];
    return LayoutBuilder(
      builder: (context, constraints) {
        final columns = constraints.maxWidth < 440 ? 1 : 2;
        final width =
            (constraints.maxWidth - AppSpacing.sm * (columns - 1)) / columns;
        return Wrap(
          spacing: AppSpacing.sm,
          runSpacing: AppSpacing.sm,
          children: [
            for (final metric in metrics)
              SizedBox(
                width: width,
                child: LunasCard(
                  color: Theme.of(context).colorScheme.primaryContainer.withValues(
                    alpha: .38,
                  ),
                  padding: const EdgeInsets.all(AppSpacing.md),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Icon(
                            metric.icon,
                            size: 20,
                            color: Theme.of(context).colorScheme.primary,
                          ),
                          const SizedBox(width: AppSpacing.xs),
                          Expanded(
                            child: Text(
                              metric.label,
                              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                color: Theme.of(context).colorScheme.primary,
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: AppSpacing.md),
                      Row(
                        children: [
                          Expanded(
                            child: Text(
                              metric.value,
                              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                color: Theme.of(context).colorScheme.onSurface,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                          ),
                          const Icon(
                            Icons.check_circle_outline_rounded,
                            color: AppColorsLight.success,
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
          ],
        );
      },
    );
  }
}

class _PrivacyScanCard extends StatelessWidget {
  const _PrivacyScanCard();

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return LunasCard(
      color: theme.colorScheme.primaryContainer.withValues(alpha: .30),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              Icon(Icons.privacy_tip_outlined, color: theme.colorScheme.primary),
              const SizedBox(width: AppSpacing.sm),
              Text('Privacy scan', style: theme.textTheme.titleMedium),
            ],
          ),
          const SizedBox(height: AppSpacing.md),
          _PrivacyResult(
            icon: Icons.face_outlined,
            label: 'Face detection',
            result: 'Clear',
            color: AppColorsLight.success,
          ),
          const SizedBox(height: AppSpacing.sm),
          _PrivacyResult(
            icon: Icons.directions_car_outlined,
            label: 'License plate',
            result: 'Blurred (auto)',
            color: theme.colorScheme.primary,
          ),
        ],
      ),
    );
  }
}

class _PrivacyResult extends StatelessWidget {
  const _PrivacyResult({
    required this.icon,
    required this.label,
    required this.result,
    required this.color,
  });

  final IconData icon;
  final String label;
  final String result;
  final Color color;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Container(
      padding: const EdgeInsets.all(AppSpacing.sm),
      decoration: BoxDecoration(
        color: theme.colorScheme.surface,
        borderRadius: BorderRadius.circular(AppRadius.xs),
      ),
      child: Row(
        children: [
          Icon(icon, size: 19, color: theme.colorScheme.onSurfaceVariant),
          const SizedBox(width: AppSpacing.sm),
          Expanded(child: Text(label, style: theme.textTheme.bodyMedium)),
          Text(
            result,
            style: theme.textTheme.bodySmall?.copyWith(
              color: color,
              fontWeight: FontWeight.w800,
            ),
          ),
        ],
      ),
    );
  }
}
