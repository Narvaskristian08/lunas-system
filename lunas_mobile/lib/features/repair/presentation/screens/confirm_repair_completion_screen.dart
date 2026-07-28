import 'package:flutter/material.dart';
import 'package:lunas_mobile/core/theme/app_colors.dart';
import 'package:lunas_mobile/core/theme/app_spacing.dart';
import 'package:lunas_mobile/core/widgets/lunas_card.dart';
import 'package:lunas_mobile/features/repair/presentation/screens/repair_routes.dart';
import 'package:lunas_mobile/features/repair/presentation/screens/repair_widgets.dart';

/// Final technician certification prior to human official verification.
class ConfirmRepairCompletionScreen extends StatefulWidget {
  const ConfirmRepairCompletionScreen({super.key});

  @override
  State<ConfirmRepairCompletionScreen> createState() =>
      _ConfirmRepairCompletionScreenState();
}

class _ConfirmRepairCompletionScreenState
    extends State<ConfirmRepairCompletionScreen> {
  bool _isCertified = false;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return RepairPage(
      appBar: const RepairAppBar(showBackButton: true),
      bottomActionBar: _CompletionActionBar(
        canSubmit: _isCertified,
        onCancel: () => Navigator.of(context).maybePop(),
        onSubmit: () => Navigator.pushReplacementNamed(
          context,
          RepairRoutes.submitted,
        ),
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
          Text(
            'Submit repair completion',
            style: theme.textTheme.headlineLarge?.copyWith(
              fontSize: 28,
              fontWeight: FontWeight.w800,
            ),
          ),
          const SizedBox(height: AppSpacing.xs),
          Text(
            'Review the summary for Work Order #WO-2026-0142.',
            style: theme.textTheme.bodyMedium,
          ),
          const SizedBox(height: AppSpacing.xl),
          LunasCard(
            padding: EdgeInsets.zero,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Container(
                  padding: const EdgeInsets.all(AppSpacing.md),
                  color: theme.colorScheme.primaryContainer.withValues(alpha: .43),
                  child: Row(
                    children: [
                      Expanded(
                        child: Text(
                          'Visual evidence',
                          style: theme.textTheme.titleLarge?.copyWith(
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                      ),
                      const Icon(Icons.photo_library_outlined),
                    ],
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.all(AppSpacing.md),
                  child: _EvidenceComparison(),
                ),
              ],
            ),
          ),
          const SizedBox(height: AppSpacing.md),
          LunasCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Row(
                  children: [
                    const Icon(Icons.notes_rounded),
                    const SizedBox(width: AppSpacing.sm),
                    Text('Repair notes', style: theme.textTheme.titleLarge),
                  ],
                ),
                const SizedBox(height: AppSpacing.md),
                Container(
                  padding: const EdgeInsets.all(AppSpacing.md),
                  decoration: BoxDecoration(
                    color: theme.colorScheme.primaryContainer.withValues(
                      alpha: .36,
                    ),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    'Cleared debris, compacted the base layer, applied the cold patch, and sealed the repair edges to reduce water ingress.',
                    style: theme.textTheme.bodyMedium?.copyWith(
                      color: theme.colorScheme.onSurface,
                      height: 1.45,
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: AppSpacing.md),
          const _CompletionMetadata(),
          const SizedBox(height: AppSpacing.lg),
          LunasCard(
            color: theme.colorScheme.primaryContainer.withValues(alpha: .33),
            padding: const EdgeInsets.symmetric(
              horizontal: AppSpacing.sm,
              vertical: AppSpacing.xs,
            ),
            child: CheckboxListTile(
              value: _isCertified,
              onChanged: (value) => setState(() => _isCertified = value ?? false),
              controlAffinity: ListTileControlAffinity.leading,
              contentPadding: const EdgeInsets.symmetric(
                horizontal: AppSpacing.xs,
              ),
              title: Text(
                'I certify that this repair meets city engineering standards and the provided information is accurate.',
                style: theme.textTheme.bodyMedium?.copyWith(
                  color: theme.colorScheme.onSurface,
                  height: 1.4,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _EvidenceComparison extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final before = const _EvidencePane(
          label: 'Before',
          detail: 'Original surface damage',
          icon: Icons.report_problem_outlined,
          color: AppColorsLight.critical,
        );
        final after = const _EvidencePane(
          label: 'After',
          detail: 'Repair evidence accepted',
          icon: Icons.check_circle_outline_rounded,
          color: AppColorsLight.success,
        );
        if (constraints.maxWidth < 430) {
          return Column(
            children: [
              before,
              const SizedBox(height: AppSpacing.sm),
              after,
            ],
          );
        }
        return Row(
          children: [
            const Expanded(
              child: _EvidencePane(
                label: 'Before',
                detail: 'Original surface damage',
                icon: Icons.report_problem_outlined,
                color: AppColorsLight.critical,
              ),
            ),
            const SizedBox(width: AppSpacing.sm),
            const Expanded(
              child: _EvidencePane(
                label: 'After',
                detail: 'Repair evidence accepted',
                icon: Icons.check_circle_outline_rounded,
                color: AppColorsLight.success,
              ),
            ),
          ],
        );
      },
    );
  }
}

class _EvidencePane extends StatelessWidget {
  const _EvidencePane({
    required this.label,
    required this.detail,
    required this.icon,
    required this.color,
  });

  final String label;
  final String detail;
  final IconData icon;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label.toUpperCase(), style: Theme.of(context).textTheme.labelSmall),
        const SizedBox(height: AppSpacing.xs),
        RepairPlaceholderImage(
          label: label,
          detail: detail,
          icon: icon,
          height: 130,
          accentColor: color,
        ),
      ],
    );
  }
}

class _CompletionMetadata extends StatelessWidget {
  const _CompletionMetadata();

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return LunasCard(
      child: Column(
        children: [
          _MetadataRow(
            icon: Icons.schedule_outlined,
            title: 'Completion time',
            value: '11:45 AM',
            color: theme.colorScheme.primary,
          ),
          const Padding(
            padding: EdgeInsets.symmetric(vertical: AppSpacing.md),
            child: Divider(),
          ),
          const _MetadataRow(
            icon: Icons.gps_fixed_rounded,
            title: 'GPS location',
            value: 'Verified',
            color: AppColorsLight.success,
          ),
        ],
      ),
    );
  }
}

class _MetadataRow extends StatelessWidget {
  const _MetadataRow({
    required this.icon,
    required this.title,
    required this.value,
    required this.color,
  });

  final IconData icon;
  final String title;
  final String value;
  final Color color;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Row(
      children: [
        CircleAvatar(
          radius: 25,
          backgroundColor: color.withValues(alpha: .14),
          foregroundColor: color,
          child: Icon(icon),
        ),
        const SizedBox(width: AppSpacing.md),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(title, style: theme.textTheme.bodyMedium),
            const SizedBox(height: AppSpacing.xxs),
            Text(
              value,
              style: theme.textTheme.titleLarge?.copyWith(
                color: color,
                fontWeight: FontWeight.w800,
              ),
            ),
          ],
        ),
      ],
    );
  }
}

class _CompletionActionBar extends StatelessWidget {
  const _CompletionActionBar({
    required this.canSubmit,
    required this.onCancel,
    required this.onSubmit,
  });

  final bool canSubmit;
  final VoidCallback onCancel;
  final VoidCallback onSubmit;

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
        child: Row(
          children: [
            Expanded(
              child: OutlinedButton(
                onPressed: onCancel,
                child: const Text('Back'),
              ),
            ),
            const SizedBox(width: AppSpacing.sm),
            Expanded(
              flex: 2,
              child: FilledButton.icon(
                onPressed: canSubmit ? onSubmit : null,
                icon: const Icon(Icons.send_outlined),
                label: const Text('Submit completion'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
