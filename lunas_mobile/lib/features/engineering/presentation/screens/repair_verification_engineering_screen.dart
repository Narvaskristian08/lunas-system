import 'package:flutter/material.dart';
import 'package:lunas_mobile/core/theme/app_colors.dart';
import 'package:lunas_mobile/core/theme/app_radius.dart';
import 'package:lunas_mobile/core/theme/app_spacing.dart';
import 'package:lunas_mobile/core/widgets/lunas_card.dart';
import 'package:lunas_mobile/features/engineering/presentation/screens/engineering_widgets.dart';

/// Engineering repair-verification screen with an asset-free evidence comparison.
class RepairVerificationEngineeringScreen extends StatefulWidget {
  const RepairVerificationEngineeringScreen({super.key});

  @override
  State<RepairVerificationEngineeringScreen> createState() =>
      _RepairVerificationEngineeringScreenState();
}

class _RepairVerificationEngineeringScreenState
    extends State<RepairVerificationEngineeringScreen> {
  double _comparison = .5;

  @override
  Widget build(BuildContext context) {
    return EngineeringPage(
      title: 'Repair verification',
      subtitle: 'Engineering approval required',
      bottomAction: EngineeringActionBar(
        secondaryLabel: 'Request work',
        onSecondary: () => showEngineeringNotice(
          context,
          'Additional-work request recorded as a static prototype action.',
        ),
        primaryLabel: 'Approve repair',
        primaryIcon: Icons.thumb_up_outlined,
        onPrimary: () => showEngineeringNotice(
          context,
          'Repair approval requires an authorized engineering reviewer in production.',
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Wrap(
            spacing: AppSpacing.xs,
            runSpacing: AppSpacing.xs,
            children: const [
              EngineeringBadge(
                label: 'Verification required',
                color: AppColorsLight.alert,
                icon: Icons.pending_actions_outlined,
              ),
              EngineeringBadge(
                label: 'INC-2026-0849',
                color: AppColorsLight.brandBase,
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.md),
          Text(
            'Bridge expansion joint repair',
            style: Theme.of(context).textTheme.headlineLarge?.copyWith(
              fontWeight: FontWeight.w800,
            ),
          ),
          const SizedBox(height: AppSpacing.xs),
          Text(
            'Submitted by City Repair Team Alpha today at 2:30 PM.',
            style: Theme.of(context).textTheme.bodyMedium,
          ),
          const SizedBox(height: AppSpacing.lg),
          LunasCard(
            color: AppColorsLight.success.withValues(alpha: .10),
            child: const EngineeringInfoRow(
              icon: Icons.auto_awesome_rounded,
              label: 'AI verification',
              value: '98% structural match — advisory evidence only',
              color: AppColorsLight.success,
            ),
          ),
          const SizedBox(height: AppSpacing.xxl),
          const EngineeringSectionHeading(title: 'Visual evidence'),
          const SizedBox(height: AppSpacing.sm),
          _EvidenceComparison(value: _comparison),
          Slider(
            value: _comparison,
            onChanged: (value) => setState(() => _comparison = value),
            semanticFormatterCallback: (value) =>
                '${(value * 100).round()} percent before-repair evidence',
          ),
          Text(
            'Slide to compare the submitted before and after states. Visuals are native placeholders rather than remote images.',
            style: Theme.of(context).textTheme.bodySmall,
          ),
          const SizedBox(height: AppSpacing.xxl),
          LunasCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Incident summary',
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.w800,
                  ),
                ),
                const SizedBox(height: AppSpacing.lg),
                const EngineeringInfoRow(
                  icon: Icons.report_problem_outlined,
                  label: 'Issue reported',
                  value:
                      'Severe spalling and exposed rebar at the expansion joint on Main Street.',
                  color: AppColorsLight.critical,
                ),
                const SizedBox(height: AppSpacing.md),
                const Divider(),
                const SizedBox(height: AppSpacing.md),
                const EngineeringInfoRow(
                  icon: Icons.construction_outlined,
                  label: 'Repair protocol executed',
                  value:
                      'Milling, rust removal, epoxy bonding, and high-early-strength concrete placement.',
                ),
                const SizedBox(height: AppSpacing.md),
                const Divider(),
                const SizedBox(height: AppSpacing.md),
                Wrap(
                  spacing: AppSpacing.xs,
                  runSpacing: AppSpacing.xs,
                  children: [
                    EngineeringBadge(
                      label: 'HESC Class C',
                      color: AppColorsLight.brandBase,
                    ),
                    EngineeringBadge(
                      label: 'Epoxy resin',
                      color: AppColorsLight.brandBase,
                    ),
                    EngineeringBadge(
                      label: 'Rebar #4',
                      color: AppColorsLight.brandBase,
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: AppSpacing.md),
          LunasCard(
            color: Theme.of(context).colorScheme.primaryContainer.withValues(alpha: .38),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Field notes',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w800,
                  ),
                ),
                const SizedBox(height: AppSpacing.sm),
                Text(
                  '“Additional rust was found on secondary rebar and treated with inhibitor before the pour. Curing conditions were acceptable.”',
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    fontStyle: FontStyle.italic,
                    height: 1.45,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: AppSpacing.md),
          OutlinedButton.icon(
            onPressed: () => showEngineeringNotice(
              context,
              'A rejection reason would be required in the live workflow.',
            ),
            style: OutlinedButton.styleFrom(
              foregroundColor: AppColorsLight.critical,
              side: const BorderSide(color: AppColorsLight.critical),
            ),
            icon: const Icon(Icons.cancel_outlined),
            label: const Text('Reject repair'),
          ),
          const SizedBox(height: AppSpacing.xl),
          Container(
            padding: const EdgeInsets.all(AppSpacing.md),
            decoration: BoxDecoration(
              color: AppColorsLight.alert.withValues(alpha: .10),
              borderRadius: AppRadius.input,
              border: Border.all(color: AppColorsLight.alert.withValues(alpha: .35)),
            ),
            child: const EngineeringInfoRow(
              icon: Icons.gavel_outlined,
              label: 'Decision control',
              value:
                  'AI comparison is advisory. An authorized engineering official must inspect the evidence before approval or rejection.',
              color: AppColorsLight.alert,
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
          height: 230,
          child: LayoutBuilder(
            builder: (context, constraints) {
              final dividerX = constraints.maxWidth * value;
              return Stack(
                children: [
                  const _EvidenceSurface(
                    label: 'After repair',
                    detail: 'Completed joint surface',
                    icon: Icons.task_alt_rounded,
                    color: AppColorsLight.success,
                  ),
                  ClipRect(
                    child: Align(
                      alignment: Alignment.centerLeft,
                      widthFactor: value,
                      child: const SizedBox(
                        width: double.infinity,
                        child: _EvidenceSurface(
                          label: 'Before repair',
                          detail: 'Reported structural damage',
                          icon: Icons.report_problem_outlined,
                          color: AppColorsLight.critical,
                        ),
                      ),
                    ),
                  ),
                  Positioned(
                    top: 0,
                    bottom: 0,
                    left: dividerX - 2,
                    child: Container(width: 4, color: Colors.white),
                  ),
                  Positioned(
                    left: dividerX - 19,
                    top: 95,
                    child: Container(
                      width: 38,
                      height: 38,
                      decoration: const BoxDecoration(
                        color: Colors.white,
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(
                        Icons.compare_arrows_rounded,
                        color: AppColorsLight.brandBase,
                      ),
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

class _EvidenceSurface extends StatelessWidget {
  const _EvidenceSurface({
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
          colors: [color.withValues(alpha: .30), color.withValues(alpha: .08)],
        ),
      ),
      child: Stack(
        children: [
          Positioned(
            top: AppSpacing.sm,
            left: AppSpacing.sm,
            child: EngineeringBadge(label: label, color: color),
          ),
          Center(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(icon, size: 46, color: color),
                const SizedBox(height: AppSpacing.xs),
                Text(
                  detail,
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    fontWeight: FontWeight.w800,
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
