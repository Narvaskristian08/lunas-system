import 'package:flutter/material.dart';
import 'package:lunas_mobile/core/theme/app_colors.dart';
import 'package:lunas_mobile/core/theme/app_radius.dart';
import 'package:lunas_mobile/core/theme/app_spacing.dart';
import 'package:lunas_mobile/core/widgets/lunas_card.dart';
import 'package:lunas_mobile/features/barangay/presentation/screens/barangay_widgets.dart';

/// Barangay official's validation view of a submitted LUNAS incident.
class IncidentDetailsOfficialScreen extends StatelessWidget {
  const IncidentDetailsOfficialScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return BarangayPage(
      title: 'Incident validation',
      subtitle: 'INC-2026-089',
      bottomAction: BarangayActionBar(
        secondaryLabel: 'Assign team',
        onSecondary: () => Navigator.pushNamed(context, '/official/assign'),
        primaryLabel: 'Validate report',
        primaryIcon: Icons.check_circle_outline_rounded,
        onPrimary: () => showBarangayNotice(
          context,
          'Validation requires an authorized Barangay official in the live workflow.',
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Wrap(
            spacing: AppSpacing.xs,
            runSpacing: AppSpacing.xs,
            children: const [
              BarangayBadge(
                label: 'Validation required',
                color: AppColorsLight.alert,
                icon: Icons.pending_actions_outlined,
              ),
              BarangayBadge(
                label: 'High severity',
                color: AppColorsLight.critical,
                icon: Icons.priority_high_rounded,
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.md),
          Text(
            'Road hazard on A.B. Fernandez Ave.',
            style: Theme.of(
              context,
            ).textTheme.headlineLarge?.copyWith(fontWeight: FontWeight.w800),
          ),
          const SizedBox(height: AppSpacing.sm),
          Wrap(
            spacing: AppSpacing.xs,
            runSpacing: AppSpacing.xs,
            children: const [
              BarangayBadge(
                label: 'Infrastructure damage',
                color: AppColorsLight.brandBase,
                icon: Icons.category_outlined,
              ),
              BarangayBadge(
                label: '15 minutes ago',
                color: AppColorsLight.brandBase,
                icon: Icons.schedule_outlined,
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.xxl),
          _OfficialDetailCard(
            title: 'Incident description',
            icon: Icons.description_outlined,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'A severe road surface failure was reported on a main arterial route. The pothole is approximately three feet wide and six inches deep in the center lane, creating a hazard for passing vehicles.',
                  style: Theme.of(
                    context,
                  ).textTheme.bodyMedium?.copyWith(height: 1.48),
                ),
                const SizedBox(height: AppSpacing.md),
                LayoutBuilder(
                  builder: (context, constraints) {
                    final compact = constraints.maxWidth < 480;
                    final width = compact
                        ? constraints.maxWidth
                        : (constraints.maxWidth - AppSpacing.sm) / 2;
                    return Wrap(
                      spacing: AppSpacing.sm,
                      runSpacing: AppSpacing.sm,
                      children: [
                        SizedBox(
                          width: width,
                          child: const _MiniDetail(
                            icon: Icons.person_outline_rounded,
                            label: 'Reported by',
                            value: 'Anonymous citizen',
                          ),
                        ),
                        SizedBox(
                          width: width,
                          child: const _MiniDetail(
                            icon: Icons.construction_outlined,
                            label: 'Category',
                            value: 'Road hazard',
                          ),
                        ),
                      ],
                    );
                  },
                ),
              ],
            ),
          ),
          const SizedBox(height: AppSpacing.md),
          _OfficialDetailCard(
            title: 'Evidence and AI triage',
            icon: Icons.auto_awesome_outlined,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const BarangayVisualPanel(
                  icon: Icons.report_problem_outlined,
                  label: 'Reported road damage',
                  detail: 'Native visual placeholder — no remote photo used',
                  accent: AppColorsLight.brandBase,
                  badge: 'AI match: 98%',
                ),
                const SizedBox(height: AppSpacing.md),
                Text(
                  'AI vision analysis',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w800,
                  ),
                ),
                const SizedBox(height: AppSpacing.xxs),
                Text(
                  'The model suggests a structural anomaly consistent with Category 3 road deterioration. This is an advisory recommendation, not automated dispatch approval.',
                  style: Theme.of(
                    context,
                  ).textTheme.bodySmall?.copyWith(height: 1.45),
                ),
              ],
            ),
          ),
          const SizedBox(height: AppSpacing.md),
          _OfficialDetailCard(
            title: 'Location context',
            icon: Icons.location_on_outlined,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const BarangayVisualPanel(
                  icon: Icons.map_outlined,
                  label: 'Barangay Pantal location',
                  detail: 'A.B. Fernandez Ave. near the public market',
                  accent: AppColorsLight.critical,
                  height: 180,
                  badge: 'Incident pin',
                ),
                const SizedBox(height: AppSpacing.md),
                const BarangayInfoRow(
                  icon: Icons.location_on_outlined,
                  label: 'Reported location',
                  value: 'A.B. Fernandez Ave., Barangay Pantal, Dagupan City',
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
                  'Incident timeline',
                  style: Theme.of(
                    context,
                  ).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w800),
                ),
                const SizedBox(height: AppSpacing.lg),
                const BarangayTimelineItem(
                  title: 'AI triage completed',
                  description:
                      'System evaluated the report and suggested a priority.',
                  time: '10:45 AM',
                  color: AppColorsLight.brandBase,
                ),
                const BarangayTimelineItem(
                  title: 'Initial report logged',
                  description:
                      'Submission received through the citizen portal.',
                  time: '10:42 AM',
                  color: AppColorsLight.alert,
                  isLast: true,
                ),
              ],
            ),
          ),
          const SizedBox(height: AppSpacing.md),
          OutlinedButton.icon(
            onPressed: () => showBarangayNotice(
              context,
              'A rejection reason would be required before declining a report.',
            ),
            icon: const Icon(Icons.close_rounded),
            label: const Text('Reject report'),
            style: OutlinedButton.styleFrom(
              foregroundColor: AppColorsLight.critical,
              side: const BorderSide(color: AppColorsLight.critical),
            ),
          ),
          const SizedBox(height: AppSpacing.xl),
          Container(
            padding: const EdgeInsets.all(AppSpacing.md),
            decoration: BoxDecoration(
              color: AppColorsLight.alert.withValues(alpha: .10),
              borderRadius: AppRadius.input,
              border: Border.all(
                color: AppColorsLight.alert.withValues(alpha: .35),
              ),
            ),
            child: const BarangayInfoRow(
              icon: Icons.gavel_outlined,
              label: 'Action required',
              value:
                  'Please confirm the evidence, category, and location before validating or assigning this incident.',
              color: AppColorsLight.alert,
            ),
          ),
        ],
      ),
    );
  }
}

class _OfficialDetailCard extends StatelessWidget {
  const _OfficialDetailCard({
    required this.title,
    required this.icon,
    required this.child,
  });

  final String title;
  final IconData icon;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return LunasCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, color: AppColorsLight.brandBase),
              const SizedBox(width: AppSpacing.sm),
              Text(
                title,
                style: Theme.of(
                  context,
                ).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w800),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.md),
          const Divider(),
          const SizedBox(height: AppSpacing.md),
          child,
        ],
      ),
    );
  }
}

class _MiniDetail extends StatelessWidget {
  const _MiniDetail({
    required this.icon,
    required this.label,
    required this.value,
  });

  final IconData icon;
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(AppSpacing.sm),
      decoration: BoxDecoration(
        color: Theme.of(
          context,
        ).colorScheme.primaryContainer.withValues(alpha: .36),
        borderRadius: AppRadius.input,
      ),
      child: Row(
        children: [
          Icon(icon, color: AppColorsLight.brandBase),
          const SizedBox(width: AppSpacing.xs),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(label, style: Theme.of(context).textTheme.bodySmall),
                const SizedBox(height: AppSpacing.xxs),
                Text(
                  value,
                  style: Theme.of(
                    context,
                  ).textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.w700),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
