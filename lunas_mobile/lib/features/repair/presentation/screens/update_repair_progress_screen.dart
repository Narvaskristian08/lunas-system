import 'package:flutter/material.dart';
import 'package:lunas_mobile/core/theme/app_colors.dart';
import 'package:lunas_mobile/core/theme/app_radius.dart';
import 'package:lunas_mobile/core/theme/app_spacing.dart';
import 'package:lunas_mobile/core/widgets/lunas_card.dart';
import 'package:lunas_mobile/features/repair/presentation/screens/repair_routes.dart';
import 'package:lunas_mobile/features/repair/presentation/screens/repair_widgets.dart';

/// Static field-update form for an in-progress repair.
class UpdateRepairProgressScreen extends StatelessWidget {
  const UpdateRepairProgressScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return RepairPage(
      appBar: const RepairAppBar(
        title: 'Update progress',
        showBackButton: true,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(
            'WO-2026-0142',
            style: theme.textTheme.headlineLarge?.copyWith(
              fontSize: 28,
              fontWeight: FontWeight.w800,
            ),
          ),
          const SizedBox(height: AppSpacing.xs),
          Row(
            children: [
              Icon(
                Icons.location_on_outlined,
                color: theme.colorScheme.onSurfaceVariant,
                size: 18,
              ),
              const SizedBox(width: AppSpacing.xs),
              Expanded(
                child: Text(
                  'Pantal drainage outfall, Dagupan City',
                  style: theme.textTheme.bodyMedium,
                ),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.xl),
          const _ProgressSummary(),
          const SizedBox(height: AppSpacing.xl),
          Text('Repair status', style: theme.textTheme.titleMedium),
          const SizedBox(height: AppSpacing.xs),
          DropdownButtonFormField<String>(
            initialValue: 'Resurfacing base layer',
            decoration: const InputDecoration(prefixIcon: Icon(Icons.handyman)),
            items: const [
              DropdownMenuItem(
                value: 'Site preparation',
                child: Text('Site preparation'),
              ),
              DropdownMenuItem(
                value: 'Resurfacing base layer',
                child: Text('Resurfacing base layer'),
              ),
              DropdownMenuItem(
                value: 'Final inspection',
                child: Text('Final inspection'),
              ),
            ],
            onChanged: (_) {},
          ),
          const SizedBox(height: AppSpacing.xl),
          Text('Progress notes', style: theme.textTheme.titleMedium),
          const SizedBox(height: AppSpacing.xs),
          const TextField(
            maxLines: 4,
            maxLength: 500,
            decoration: InputDecoration(
              hintText: 'Enter details about the current progress…',
              prefixIcon: Padding(
                padding: EdgeInsets.only(bottom: 64),
                child: Icon(Icons.edit_note_rounded),
              ),
            ),
          ),
          const SizedBox(height: AppSpacing.lg),
          Text('Visual evidence', style: theme.textTheme.titleMedium),
          const SizedBox(height: AppSpacing.sm),
          _EvidenceRow(
            onUpload: () =>
                Navigator.pushNamed(context, RepairRoutes.uploadEvidence),
          ),
          const SizedBox(height: AppSpacing.xl),
          const Divider(),
          const SizedBox(height: AppSpacing.lg),
          RepairPrimaryButton(
            label: 'Save progress',
            icon: Icons.save_outlined,
            onPressed: () {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Progress saved locally for this UI demo.'),
                ),
              );
            },
          ),
          const SizedBox(height: AppSpacing.sm),
          RepairSecondaryButton(
            label: 'Add or review evidence',
            icon: Icons.add_a_photo_outlined,
            onPressed: () =>
                Navigator.pushNamed(context, RepairRoutes.uploadEvidence),
          ),
        ],
      ),
    );
  }
}

class _ProgressSummary extends StatelessWidget {
  const _ProgressSummary();

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return LunasCard(
      child: LayoutBuilder(
        builder: (context, constraints) {
          final stacked = constraints.maxWidth < 390;
          final ring = const _ProgressRing(value: .65, label: '65%');
          final details = Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Current completion',
                style: theme.textTheme.titleLarge?.copyWith(
                  fontWeight: FontWeight.w800,
                ),
              ),
              const SizedBox(height: AppSpacing.xs),
              Text(
                'Last updated 10 minutes ago',
                style: theme.textTheme.bodyMedium,
              ),
            ],
          );
          return Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              if (stacked) ...[
                Center(child: ring),
                const SizedBox(height: AppSpacing.md),
                details,
              ] else
                Row(
                  children: [
                    ring,
                    const SizedBox(width: AppSpacing.lg),
                    Expanded(child: details),
                  ],
                ),
              const SizedBox(height: AppSpacing.lg),
              Container(
                padding: const EdgeInsets.all(AppSpacing.md),
                decoration: BoxDecoration(
                  color: theme.colorScheme.primaryContainer.withValues(
                    alpha: .62,
                  ),
                  borderRadius: BorderRadius.circular(AppRadius.sm),
                ),
                child: Row(
                  children: [
                    CircleAvatar(
                      backgroundColor: theme.colorScheme.primary,
                      foregroundColor: theme.colorScheme.onPrimary,
                      child: const Icon(Icons.timer_outlined),
                    ),
                    const SizedBox(width: AppSpacing.sm),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Estimated remaining time',
                          style: theme.textTheme.bodySmall,
                        ),
                        Text(
                          '45 minutes',
                          style: theme.textTheme.titleMedium?.copyWith(
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}

class _ProgressRing extends StatelessWidget {
  const _ProgressRing({required this.value, required this.label});

  final double value;
  final String label;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 112,
      height: 112,
      child: Stack(
        alignment: Alignment.center,
        children: [
          CircularProgressIndicator(
            value: value,
            strokeWidth: 10,
            backgroundColor: Theme.of(
              context,
            ).colorScheme.primary.withValues(alpha: .16),
          ),
          Text(
            label,
            style: Theme.of(context).textTheme.titleLarge?.copyWith(
              color: Theme.of(context).colorScheme.primary,
              fontWeight: FontWeight.w800,
            ),
          ),
        ],
      ),
    );
  }
}

class _EvidenceRow extends StatelessWidget {
  const _EvidenceRow({required this.onUpload});

  final VoidCallback onUpload;

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final isNarrow = constraints.maxWidth < 460;
        final preview = const RepairPlaceholderImage(
          label: 'Latest field photo',
          detail: 'Photo attached',
          icon: Icons.construction_rounded,
          height: 132,
          accentColor: AppColorsLight.success,
        );
        final upload = InkWell(
          onTap: onUpload,
          borderRadius: BorderRadius.circular(AppRadius.sm),
          child: Container(
            height: 132,
            decoration: BoxDecoration(
              border: Border.all(
                color: Theme.of(context).colorScheme.outline,
                style: BorderStyle.solid,
              ),
              borderRadius: BorderRadius.circular(AppRadius.sm),
            ),
            child: Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(
                    Icons.add_a_photo_outlined,
                    color: Theme.of(context).colorScheme.primary,
                    size: 30,
                  ),
                  const SizedBox(height: AppSpacing.xs),
                  Text(
                    'Upload photo',
                    style: Theme.of(context).textTheme.labelLarge?.copyWith(
                      color: Theme.of(context).colorScheme.primary,
                    ),
                  ),
                ],
              ),
            ),
          ),
        );
        if (isNarrow) {
          return Column(
            children: [
              preview,
              const SizedBox(height: AppSpacing.sm),
              SizedBox(width: double.infinity, child: upload),
            ],
          );
        }
        return Row(
          children: [
            const Expanded(
              child: RepairPlaceholderImage(
                label: 'Latest field photo',
                detail: 'Photo attached',
                icon: Icons.construction_rounded,
                height: 132,
                accentColor: AppColorsLight.success,
              ),
            ),
            const SizedBox(width: AppSpacing.sm),
            Expanded(child: upload),
          ],
        );
      },
    );
  }
}
