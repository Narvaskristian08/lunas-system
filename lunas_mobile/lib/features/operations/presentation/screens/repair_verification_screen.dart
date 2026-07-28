import 'package:flutter/material.dart';
import 'package:lunas_mobile/core/theme/app_colors.dart';
import 'package:lunas_mobile/core/theme/app_radius.dart';
import 'package:lunas_mobile/core/theme/app_spacing.dart';
import 'package:lunas_mobile/core/widgets/lunas_card.dart';
import 'package:lunas_mobile/features/operations/presentation/screens/operations_widgets.dart';

class RepairVerificationScreen extends StatefulWidget {
  const RepairVerificationScreen({super.key});

  @override
  State<RepairVerificationScreen> createState() => _RepairVerificationScreenState();
}

class _RepairVerificationScreenState extends State<RepairVerificationScreen> {
  double _comparison = .5;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    return OperationsPage(
      title: 'Verify repair',
      subtitle: 'Human approval required',
      bottomAction: OperationsActionBar(
        secondaryLabel: 'Request rework',
        secondaryIsDestructive: true,
        onSecondary: () => Navigator.pushNamed(context, '/repair/progress'),
        primaryLabel: 'Approve repair',
        primaryIcon: Icons.verified_outlined,
        onPrimary: () => Navigator.pushNamed(context, '/reports/resolved'),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              Text(
                '#WO-2026-0142',
                style: Theme.of(context).textTheme.headlineLarge?.copyWith(
                  color: colors.primary,
                  fontWeight: FontWeight.w800,
                ),
              ),
              const Spacer(),
              const OperationsBadge(
                label: 'Pending review',
                color: AppColorsLight.alert,
                icon: Icons.pending_actions_outlined,
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.sm),
          const OperationsInfoRow(
            icon: Icons.engineering_outlined,
            label: 'Personnel',
            value: 'Engr. Santos',
          ),
          const SizedBox(height: AppSpacing.xxl),
          OperationsSectionHeading(
            title: 'Site visuals',
            trailing: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(Icons.compare_outlined, size: 18, color: colors.onSurfaceVariant),
                const SizedBox(width: AppSpacing.xxs),
                Text('Compare', style: Theme.of(context).textTheme.bodySmall),
              ],
            ),
          ),
          const SizedBox(height: AppSpacing.sm),
          _EvidenceComparison(value: _comparison),
          Slider(
            value: _comparison,
            onChanged: (value) => setState(() => _comparison = value),
            semanticFormatterCallback: (value) => '${(value * 100).round()} percent before evidence',
          ),
          Text(
            'Slide to compare the submitted before and after evidence.',
            style: Theme.of(context).textTheme.bodySmall,
          ),
          const SizedBox(height: AppSpacing.xxl),
          Container(
            padding: const EdgeInsets.all(AppSpacing.md),
            decoration: BoxDecoration(
              color: AppColorsLight.success.withValues(alpha: .12),
              borderRadius: AppRadius.card,
              border: Border.all(color: AppColorsLight.success.withValues(alpha: .36)),
            ),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  width: 42,
                  height: 42,
                  decoration: const BoxDecoration(
                    shape: BoxShape.circle,
                    color: AppColorsLight.success,
                  ),
                  child: const Icon(Icons.auto_awesome_rounded, color: Colors.white),
                ),
                const SizedBox(width: AppSpacing.md),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'AI verification result',
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      const SizedBox(height: AppSpacing.xxs),
                      Text(
                        'Quality likely matches specifications',
                        style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          color: AppColorsLight.success,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                      const SizedBox(height: AppSpacing.xs),
                      Text(
                        'The visual comparison suggests a 98% match with the planned asphalt patch. Treat this as advisory evidence and inspect the work before approving it.',
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(height: 1.45),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: AppSpacing.xxl),
          const OperationsSectionHeading(title: 'Repair notes'),
          const SizedBox(height: AppSpacing.sm),
          LunasCard(
            color: colors.primaryContainer.withValues(alpha: .36),
            child: Text(
              'Cleared debris from the primary cavity. Applied bonding agent and filled with hot-mix asphalt to a 5 cm depth. Compacted the surface to align with the existing road grade, then kept the area secured during cooling.',
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(height: 1.5),
            ),
          ),
          const SizedBox(height: AppSpacing.xl),
          Container(
            padding: const EdgeInsets.all(AppSpacing.md),
            decoration: BoxDecoration(
              color: colors.primaryContainer.withValues(alpha: .42),
              borderRadius: AppRadius.input,
              border: Border.all(color: colors.primary.withValues(alpha: .22)),
            ),
            child: const OperationsInfoRow(
              icon: Icons.gavel_outlined,
              label: 'Approval control',
              value: 'Only an authorized official can close the work order after reviewing the evidence and site condition.',
            ),
          ),
        ],
      ),
    );
  }
}

class _EvidenceComparison extends StatelessWidget {
  const _EvidenceComparison({required this.value});

  final double value;

  @override
  Widget build(BuildContext context) {
    return LunasCard(
      padding: EdgeInsets.zero,
      child: ClipRRect(
        borderRadius: AppRadius.card,
        child: SizedBox(
          height: 280,
          child: LayoutBuilder(
            builder: (context, constraints) {
              final dividerX = constraints.maxWidth * value;
              return Stack(
                children: [
                  const _EvidencePanel(
                    label: 'After',
                    detail: 'Completed asphalt patch',
                    icon: Icons.task_alt_rounded,
                    color: AppColorsLight.success,
                  ),
                  ClipRect(
                    child: Align(
                      alignment: Alignment.centerLeft,
                      widthFactor: value,
                      child: const SizedBox(
                        width: double.infinity,
                        child: _EvidencePanel(
                          label: 'Before',
                          detail: 'Reported road damage',
                          icon: Icons.report_problem_outlined,
                          color: AppColorsLight.critical,
                        ),
                      ),
                    ),
                  ),
                  Positioned(
                    left: dividerX - 2,
                    top: 0,
                    bottom: 0,
                    child: Container(width: 4, color: Colors.white),
                  ),
                  Positioned(
                    left: dividerX - 20,
                    top: 122,
                    child: Container(
                      width: 40,
                      height: 40,
                      decoration: const BoxDecoration(
                        color: Colors.white,
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(Icons.compare_arrows_rounded, color: AppColorsLight.brandBase),
                    ),
                  ),
                ],
              );
            },
          ),
        ),
      ),
    );
  }
}

class _EvidencePanel extends StatelessWidget {
  const _EvidencePanel({
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
    return Container(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [color.withValues(alpha: .32), color.withValues(alpha: .10)],
        ),
      ),
      child: Stack(
        children: [
          Positioned(
            top: AppSpacing.sm,
            left: AppSpacing.sm,
            child: OperationsBadge(label: label, color: color),
          ),
          Center(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(icon, color: color, size: 44),
                const SizedBox(height: AppSpacing.xs),
                Text(
                  detail,
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    fontWeight: FontWeight.w700,
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
