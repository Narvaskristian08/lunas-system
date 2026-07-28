import 'package:flutter/material.dart';
import 'package:lunas_mobile/core/theme/app_colors.dart';
import 'package:lunas_mobile/core/theme/app_radius.dart';
import 'package:lunas_mobile/core/theme/app_spacing.dart';
import 'package:lunas_mobile/core/widgets/lunas_card.dart';
import 'package:lunas_mobile/features/repair/presentation/screens/repair_routes.dart';
import 'package:lunas_mobile/features/repair/presentation/screens/repair_widgets.dart';

/// Evidence capture/review screen. Camera and file-picker actions are visual
/// placeholders until device services are intentionally added.
class UploadRepairEvidenceScreen extends StatelessWidget {
  const UploadRepairEvidenceScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return RepairPage(
      appBar: const RepairAppBar(showBackButton: true),
      selectedNavigationIndex: 1,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(
            'Upload repair evidence',
            style: theme.textTheme.headlineLarge?.copyWith(
              fontSize: 28,
              fontWeight: FontWeight.w800,
            ),
          ),
          const SizedBox(height: AppSpacing.xs),
          Text(
            'Document conditions before and after the intervention.',
            style: theme.textTheme.bodyMedium,
          ),
          const SizedBox(height: AppSpacing.lg),
          const Wrap(
            spacing: AppSpacing.xs,
            runSpacing: AppSpacing.xs,
            children: [
              RepairStatusChip(
                label: 'GPS verified: Barangay IV',
                color: AppColorsLight.info,
                icon: Icons.location_on_outlined,
              ),
              RepairStatusChip(
                label: 'Jul 28, 14:32',
                color: AppColorsLight.info,
                icon: Icons.schedule_outlined,
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.lg),
          _CaptureEvidenceCard(
            onTap: () => Navigator.pushNamed(context, RepairRoutes.qualityCheck),
          ),
          const SizedBox(height: AppSpacing.xxl),
          const RepairSectionTitle(title: 'Uploaded media (2)'),
          const SizedBox(height: AppSpacing.sm),
          const _EvidenceMediaCard(
            label: 'Before repair',
            detail: 'Original condition captured',
            accent: AppColorsLight.critical,
            result: 'Quality check passed',
            resultColor: AppColorsLight.success,
            icon: Icons.image_outlined,
          ),
          const SizedBox(height: AppSpacing.md),
          const _EvidenceMediaCard(
            label: 'After repair',
            detail: 'Ready for final review',
            accent: AppColorsLight.brandBase,
            result: 'Awaiting quality review',
            resultColor: AppColorsLight.alert,
            icon: Icons.add_a_photo_outlined,
          ),
          const SizedBox(height: AppSpacing.xl),
          RepairPrimaryButton(
            label: 'Review image quality',
            icon: Icons.auto_awesome_outlined,
            onPressed: () =>
                Navigator.pushNamed(context, RepairRoutes.qualityCheck),
          ),
        ],
      ),
    );
  }
}

class _CaptureEvidenceCard extends StatelessWidget {
  const _CaptureEvidenceCard({required this.onTap});

  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Semantics(
      button: true,
      label: 'Capture evidence',
      child: InkWell(
        onTap: onTap,
        borderRadius: AppRadius.card,
        child: Container(
          height: 252,
          decoration: BoxDecoration(
            color: theme.colorScheme.primaryContainer.withValues(alpha: .42),
            borderRadius: AppRadius.card,
            border: Border.all(color: theme.colorScheme.outline),
          ),
          child: Center(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: 84,
                  height: 84,
                  decoration: BoxDecoration(
                    color: theme.colorScheme.primary,
                    shape: BoxShape.circle,
                  ),
                  child: Icon(
                    Icons.camera_alt_outlined,
                    color: theme.colorScheme.onPrimary,
                    size: 42,
                  ),
                ),
                const SizedBox(height: AppSpacing.lg),
                Text(
                  'Capture evidence',
                  style: theme.textTheme.titleLarge?.copyWith(
                    color: theme.colorScheme.primary,
                    fontWeight: FontWeight.w800,
                  ),
                ),
                const SizedBox(height: AppSpacing.xs),
                Text(
                  'Tap to open a camera or select files',
                  style: theme.textTheme.bodyMedium,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _EvidenceMediaCard extends StatelessWidget {
  const _EvidenceMediaCard({
    required this.label,
    required this.detail,
    required this.accent,
    required this.result,
    required this.resultColor,
    required this.icon,
  });

  final String label;
  final String detail;
  final Color accent;
  final String result;
  final Color resultColor;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return LunasCard(
      padding: EdgeInsets.zero,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Padding(
            padding: const EdgeInsets.all(AppSpacing.sm),
            child: RepairPlaceholderImage(
              label: label,
              detail: detail,
              icon: icon,
              height: 158,
              accentColor: accent,
            ),
          ),
          const Divider(height: 1),
          Padding(
            padding: const EdgeInsets.symmetric(
              horizontal: AppSpacing.md,
              vertical: AppSpacing.sm,
            ),
            child: Row(
              children: [
                Icon(Icons.circle, size: 12, color: resultColor),
                const SizedBox(width: AppSpacing.xs),
                Expanded(
                  child: Text(
                    result,
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: resultColor,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
                IconButton(
                  tooltip: 'Remove evidence',
                  onPressed: () {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text('Evidence removal is unavailable in this demo.'),
                      ),
                    );
                  },
                  icon: const Icon(Icons.delete_outline_rounded),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
