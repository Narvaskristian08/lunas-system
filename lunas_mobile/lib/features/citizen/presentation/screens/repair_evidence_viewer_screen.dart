import 'package:flutter/material.dart';
import 'package:lunas_mobile/core/theme/app_colors.dart';
import 'package:lunas_mobile/core/theme/app_spacing.dart';
import 'package:lunas_mobile/core/widgets/lunas_app_scaffold.dart';
import 'package:lunas_mobile/core/widgets/lunas_button.dart';
import 'package:lunas_mobile/core/widgets/lunas_card.dart';
import 'package:lunas_mobile/features/citizen/presentation/screens/citizen_flow_widgets.dart';

/// Citizen-facing evidence view for a completed repair.
class RepairEvidenceViewerScreen extends StatelessWidget {
  const RepairEvidenceViewerScreen({super.key});

  void _showMessage(BuildContext context, String message) {
    ScaffoldMessenger.of(
      context,
    ).showSnackBar(SnackBar(content: Text(message)));
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final scheme = theme.colorScheme;
    return LunasAppScaffold(
      title: 'Repair Evidence',
      subtitle: 'Work order WO-2026-0142',
      selectedIndex: 3,
      showBackButton: true,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Wrap(
            spacing: AppSpacing.sm,
            runSpacing: AppSpacing.sm,
            children: [
              const CitizenStatusPill(
                label: 'Verified',
                color: AppColorsLight.success,
                icon: Icons.check_circle_outline_rounded,
              ),
              OutlinedButton.icon(
                onPressed: () => _showMessage(
                  context,
                  'Evidence export will be available when records are connected.',
                ),
                icon: const Icon(Icons.picture_as_pdf_outlined),
                label: const Text('Export record'),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.lg),
          LunasCard(
            padding: EdgeInsets.zero,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Padding(
                  padding: const EdgeInsets.all(AppSpacing.lg),
                  child: Row(
                    children: [
                      Icon(Icons.compare_outlined, color: scheme.primary),
                      const SizedBox(width: AppSpacing.sm),
                      Expanded(
                        child: Text(
                          'Visual comparison',
                          style: theme.textTheme.titleLarge,
                        ),
                      ),
                      const CitizenStatusPill(
                        label: 'Before / after',
                        color: AppColorsLight.brandBase,
                      ),
                    ],
                  ),
                ),
                const Padding(
                  padding: EdgeInsets.fromLTRB(
                    AppSpacing.lg,
                    0,
                    AppSpacing.lg,
                    AppSpacing.lg,
                  ),
                  child: CitizenPhotoComparison(),
                ),
              ],
            ),
          ),
          const SizedBox(height: AppSpacing.md),
          LunasCard(
            padding: EdgeInsets.zero,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const CitizenMapPreview(locationLabel: 'A.B. Fernandez Avenue'),
                Padding(
                  padding: const EdgeInsets.all(AppSpacing.lg),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Location details',
                        style: theme.textTheme.titleMedium,
                      ),
                      const SizedBox(height: AppSpacing.xs),
                      Text(
                        'A.B. Fernandez Avenue near the public market, Dagupan City',
                        style: theme.textTheme.bodyMedium,
                      ),
                      const SizedBox(height: AppSpacing.xs),
                      Text(
                        '16.0438° N, 120.3330° E',
                        style: theme.textTheme.labelSmall,
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: AppSpacing.md),
          CitizenAccentCard(
            accent: scheme.primary,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Repair notes', style: theme.textTheme.titleMedium),
                const SizedBox(height: AppSpacing.sm),
                Text(
                  'Damaged pavement was cleared, resurfaced, and levelled to restore safe passage. The site was cleaned before completion.',
                  style: theme.textTheme.bodyMedium?.copyWith(
                    fontStyle: FontStyle.italic,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: AppSpacing.md),
          LunasCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Execution details', style: theme.textTheme.titleMedium),
                const SizedBox(height: AppSpacing.md),
                _EvidencePersonRow(
                  icon: Icons.groups_rounded,
                  label: 'Field personnel',
                  value: 'City Engineering road maintenance team',
                  color: scheme.primary,
                ),
                const SizedBox(height: AppSpacing.md),
                _EvidencePersonRow(
                  icon: Icons.verified_user_outlined,
                  label: 'Verified by',
                  value: 'Dagupan City Engineering Office',
                  detail: 'Approved after site inspection',
                  color: AppColorsLight.success,
                ),
              ],
            ),
          ),
          const SizedBox(height: AppSpacing.lg),
          LunasButton(
            label: 'Add Supplemental Note',
            icon: Icons.note_add_outlined,
            onPressed: () => _showMessage(
              context,
              'Supplemental notes will be available when report updates are connected.',
            ),
          ),
          const SizedBox(height: AppSpacing.sm),
          OutlinedButton.icon(
            onPressed: () => _showMessage(
              context,
              'A shareable evidence link will be available when records are connected.',
            ),
            icon: const Icon(Icons.share_outlined),
            label: const Text('Share Evidence Link'),
          ),
        ],
      ),
    );
  }
}

class _EvidencePersonRow extends StatelessWidget {
  const _EvidencePersonRow({
    required this.icon,
    required this.label,
    required this.value,
    required this.color,
    this.detail,
  });

  final IconData icon;
  final String label;
  final String value;
  final String? detail;
  final Color color;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          width: 40,
          height: 40,
          decoration: BoxDecoration(
            color: color.withValues(alpha: .14),
            shape: BoxShape.circle,
          ),
          child: Icon(icon, color: color, size: 21),
        ),
        const SizedBox(width: AppSpacing.sm),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(label.toUpperCase(), style: theme.textTheme.labelSmall),
              const SizedBox(height: AppSpacing.xxs),
              Text(value, style: theme.textTheme.bodyLarge),
              if (detail != null) ...[
                const SizedBox(height: AppSpacing.xxs),
                Text(
                  detail!,
                  style: theme.textTheme.bodySmall?.copyWith(color: color),
                ),
              ],
            ],
          ),
        ),
      ],
    );
  }
}
