import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:lunas_mobile/core/theme/app_colors.dart';
import 'package:lunas_mobile/core/theme/app_radius.dart';
import 'package:lunas_mobile/core/theme/app_spacing.dart';
import 'package:lunas_mobile/core/widgets/lunas_card.dart';
import 'package:lunas_mobile/features/engineering/presentation/screens/engineering_routes.dart';
import 'package:lunas_mobile/features/engineering/presentation/screens/engineering_widgets.dart';

/// Engineering view of a priority incident, including human-reviewed AI context.
class IncidentDetailsEngineeringScreen extends StatelessWidget {
  const IncidentDetailsEngineeringScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return EngineeringPage(
      title: 'Incident details',
      subtitle: 'INC-2026-089',
      actions: [
        IconButton(
          tooltip: 'Notifications',
          onPressed: () => context.push('/notifications'),
          icon: const Icon(Icons.notifications_none_rounded),
        ),
        const SizedBox(width: AppSpacing.sm),
      ],
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Wrap(
            spacing: AppSpacing.xs,
            runSpacing: AppSpacing.xs,
            children: const [
              EngineeringBadge(
                label: 'Critical',
                color: AppColorsLight.critical,
                icon: Icons.priority_high_rounded,
              ),
              EngineeringBadge(label: 'Open', color: AppColorsLight.brandBase),
            ],
          ),
          const SizedBox(height: AppSpacing.md),
          Text(
            'Water main rupture',
            style: Theme.of(
              context,
            ).textTheme.headlineLarge?.copyWith(fontWeight: FontWeight.w800),
          ),
          const SizedBox(height: AppSpacing.xs),
          Text(
            'A ruptured line is flooding the A.B. Fernandez Avenue intersection in Barangay Pantal.',
            style: Theme.of(
              context,
            ).textTheme.bodyMedium?.copyWith(height: 1.45),
          ),
          const SizedBox(height: AppSpacing.lg),
          ElevatedButton.icon(
            onPressed: () => showEngineeringNotice(
              context,
              'Reassignment is a static control in this prototype.',
            ),
            icon: const Icon(Icons.assignment_ind_outlined),
            label: const Text('Reassign incident'),
          ),
          const SizedBox(height: AppSpacing.sm),
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
                    child: OutlinedButton.icon(
                      onPressed: () => context.push(EngineeringRoutes.utilityAssignment,
                      ),
                      icon: const Icon(Icons.handshake_outlined),
                      label: const Text('Assign provider'),
                    ),
                  ),
                  SizedBox(
                    width: width,
                    child: OutlinedButton.icon(
                      onPressed: () =>
                          context.push(EngineeringRoutes.sla),
                      icon: const Icon(Icons.timer_outlined),
                      label: const Text('View SLA'),
                    ),
                  ),
                ],
              );
            },
          ),
          const SizedBox(height: AppSpacing.xxl),
          _InformationCard(
            title: 'General information',
            icon: Icons.info_outline_rounded,
            child: const Column(
              children: [
                EngineeringInfoRow(
                  icon: Icons.category_outlined,
                  label: 'Category',
                  value: 'Water infrastructure',
                ),
                SizedBox(height: AppSpacing.md),
                EngineeringInfoRow(
                  icon: Icons.water_drop_outlined,
                  label: 'Sub-category',
                  value: 'Main line rupture',
                ),
                SizedBox(height: AppSpacing.md),
                EngineeringInfoRow(
                  icon: Icons.schedule_outlined,
                  label: 'Reported',
                  value: 'Today, 8:42 AM',
                ),
                SizedBox(height: AppSpacing.md),
                EngineeringInfoRow(
                  icon: Icons.traffic_outlined,
                  label: 'Estimated impact',
                  value: 'High traffic disruption',
                ),
              ],
            ),
          ),
          const SizedBox(height: AppSpacing.md),
          _InformationCard(
            title: 'Evidence and AI analysis',
            icon: Icons.auto_awesome_outlined,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const EngineeringVisualPanel(
                  icon: Icons.water_damage_outlined,
                  label: 'Reported water-flow evidence',
                  detail: 'Static visual placeholder — no remote image loaded',
                  accent: AppColorsLight.brandBase,
                  markerLabel: 'AI: Water leak · 98%',
                ),
                const SizedBox(height: AppSpacing.md),
                Text(
                  'AI suggestion',
                  style: Theme.of(
                    context,
                  ).textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.w800),
                ),
                const SizedBox(height: AppSpacing.xxs),
                Text(
                  'The model suggests a main-line leak based on the submitted evidence. This confidence score is advisory and must be confirmed by an engineer before dispatch.',
                  style: Theme.of(
                    context,
                  ).textTheme.bodySmall?.copyWith(height: 1.45),
                ),
              ],
            ),
          ),
          const SizedBox(height: AppSpacing.md),
          _InformationCard(
            title: 'Assignment and jurisdiction',
            icon: Icons.engineering_outlined,
            child: const Column(
              children: [
                EngineeringInfoRow(
                  icon: Icons.person_outline_rounded,
                  label: 'Lead field engineer',
                  value: 'Engr. Santos',
                ),
                SizedBox(height: AppSpacing.md),
                EngineeringInfoRow(
                  icon: Icons.location_city_outlined,
                  label: 'Jurisdiction',
                  value: 'Dagupan City Engineering Office',
                ),
                SizedBox(height: AppSpacing.md),
                EngineeringInfoRow(
                  icon: Icons.location_on_outlined,
                  label: 'Location',
                  value: 'A.B. Fernandez Ave. at the Pantal intersection',
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
                const EngineeringTimelineItem(
                  title: 'Assigned to Engr. Santos',
                  description:
                      'Field review was requested after initial validation.',
                  time: 'Today, 9:15 AM',
                  color: AppColorsLight.brandBase,
                ),
                const EngineeringTimelineItem(
                  title: 'AI analysis completed',
                  description:
                      'A water-infrastructure category suggestion was generated.',
                  time: 'Today, 8:45 AM',
                  color: AppColorsLight.success,
                ),
                const EngineeringTimelineItem(
                  title: 'Incident reported',
                  description: 'Citizen submission was received through LUNAS.',
                  time: 'Today, 8:42 AM',
                  color: AppColorsLight.alert,
                  isLast: true,
                ),
              ],
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
            child: const EngineeringInfoRow(
              icon: Icons.gavel_outlined,
              label: 'Human review required',
              value:
                  'Only an authorized engineer can approve routing, provider dispatch, and resolution status.',
              color: AppColorsLight.alert,
            ),
          ),
        ],
      ),
    );
  }
}

class _InformationCard extends StatelessWidget {
  const _InformationCard({
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
