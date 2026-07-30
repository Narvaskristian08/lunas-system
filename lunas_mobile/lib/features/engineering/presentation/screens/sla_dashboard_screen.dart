import 'package:flutter/material.dart';
import 'package:lunas_mobile/core/theme/app_colors.dart';
import 'package:lunas_mobile/core/theme/app_spacing.dart';
import 'package:lunas_mobile/core/widgets/lunas_card.dart';
import 'package:lunas_mobile/features/engineering/presentation/screens/engineering_routes.dart';
import 'package:lunas_mobile/features/engineering/presentation/screens/engineering_widgets.dart';

/// Engineering-facing SLA performance dashboard.
class SlaDashboardScreen extends StatelessWidget {
  const SlaDashboardScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return EngineeringPage(
      title: 'SLA dashboard',
      subtitle: 'Real-time performance monitoring',
      actions: [
        IconButton(
          tooltip: 'Filter SLAs',
          onPressed: () => showEngineeringNotice(
            context,
            'SLA filters are visual-only in this prototype.',
          ),
          icon: const Icon(Icons.filter_list_rounded),
        ),
        IconButton(
          tooltip: 'Download report',
          onPressed: () => showEngineeringNotice(
            context,
            'Export will be available with the reporting service.',
          ),
          icon: const Icon(Icons.download_outlined),
        ),
        const SizedBox(width: AppSpacing.sm),
      ],
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          LayoutBuilder(
            builder: (context, constraints) {
              final columns = constraints.maxWidth >= 640 ? 4 : 2;
              final width =
                  (constraints.maxWidth - (columns - 1) * AppSpacing.sm) /
                  columns;
              return Wrap(
                spacing: AppSpacing.sm,
                runSpacing: AppSpacing.sm,
                children: [
                  SizedBox(
                    width: width,
                    child: const EngineeringMetricCard(
                      label: 'Active SLAs',
                      value: '142',
                      detail: '↑ 12%',
                      icon: Icons.receipt_long_outlined,
                      color: AppColorsLight.brandBase,
                    ),
                  ),
                  SizedBox(
                    width: width,
                    child: const EngineeringMetricCard(
                      label: 'Near deadline',
                      value: '12',
                      detail: 'within 4 hrs',
                      icon: Icons.timer_outlined,
                      color: AppColorsLight.alert,
                      emphasized: true,
                    ),
                  ),
                  SizedBox(
                    width: width,
                    child: const EngineeringMetricCard(
                      label: 'Overdue',
                      value: '2',
                      detail: 'requires review',
                      icon: Icons.warning_amber_rounded,
                      color: AppColorsLight.critical,
                      emphasized: true,
                    ),
                  ),
                  SizedBox(
                    width: width,
                    child: const EngineeringMetricCard(
                      label: 'Compliance rate',
                      value: '94%',
                      detail: 'target: 98%',
                      icon: Icons.verified_outlined,
                      color: AppColorsLight.success,
                    ),
                  ),
                ],
              );
            },
          ),
          const SizedBox(height: AppSpacing.xxl),
          LayoutBuilder(
            builder: (context, constraints) {
              if (constraints.maxWidth < 620) {
                return Column(
                  children: const [
                    _MonthlyComplianceCard(),
                    SizedBox(height: AppSpacing.sm),
                    _ResolutionTimeCard(),
                  ],
                );
              }
              return const Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(child: _MonthlyComplianceCard()),
                  SizedBox(width: AppSpacing.sm),
                  Expanded(child: _ResolutionTimeCard()),
                ],
              );
            },
          ),
          const SizedBox(height: AppSpacing.xxl),
          EngineeringSectionHeading(
            title: 'Critical active incidents',
            description: 'Items closest to their SLA response deadline.',
            trailing: IconButton(
              tooltip: 'Open incident queue',
              onPressed: () =>
                  Navigator.pushNamed(context, EngineeringRoutes.incidents),
              icon: const Icon(Icons.search_rounded),
            ),
          ),
          const SizedBox(height: AppSpacing.sm),
          const _SlaIncidentCard(
            id: 'WO-8921',
            issue: 'Water main break — A.B. Fernandez Ave.',
            department: 'Utilities',
            remaining: '00:45:00',
            priority: 'Critical',
            icon: Icons.water_drop_outlined,
            color: AppColorsLight.critical,
          ),
          const SizedBox(height: AppSpacing.sm),
          const _SlaIncidentCard(
            id: 'WO-8933',
            issue: 'Traffic signal sync failure',
            department: 'Transit',
            remaining: '02:15:30',
            priority: 'High',
            icon: Icons.traffic_outlined,
            color: AppColorsLight.alert,
          ),
          const SizedBox(height: AppSpacing.sm),
          const _SlaIncidentCard(
            id: 'WO-8945',
            issue: 'Pothole repair — Main St.',
            department: 'Public Works',
            remaining: '14:20:00',
            priority: 'Normal',
            icon: Icons.add_road_outlined,
            color: AppColorsLight.brandBase,
          ),
          const SizedBox(height: AppSpacing.xl),
          LunasCard(
            color: AppColorsLight.alert.withValues(alpha: .10),
            child: const EngineeringInfoRow(
              icon: Icons.info_outline_rounded,
              label: 'SLA interpretation',
              value:
                  'Live escalation rules and notifications will be connected to backend policy; values shown are static sample data.',
              color: AppColorsLight.alert,
            ),
          ),
        ],
      ),
    );
  }
}

class _MonthlyComplianceCard extends StatelessWidget {
  const _MonthlyComplianceCard();

  @override
  Widget build(BuildContext context) {
    const points = [0.72, 0.78, 0.76, 0.84, 0.88, 0.94];
    return LunasCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Monthly compliance trend',
            style: Theme.of(
              context,
            ).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w800),
          ),
          const SizedBox(height: AppSpacing.lg),
          SizedBox(
            height: 132,
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: List.generate(points.length, (index) {
                const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
                return Expanded(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.end,
                    children: [
                      Text(
                        '${(points[index] * 100).round()}%',
                        style: Theme.of(context).textTheme.bodySmall,
                      ),
                      const SizedBox(height: AppSpacing.xxs),
                      Container(
                        height: points[index] * 72,
                        margin: const EdgeInsets.symmetric(horizontal: 3),
                        decoration: BoxDecoration(
                          color: AppColorsLight.brandBase.withValues(
                            alpha: .45 + points[index] * .5,
                          ),
                          borderRadius: const BorderRadius.vertical(
                            top: Radius.circular(4),
                          ),
                        ),
                      ),
                      const SizedBox(height: AppSpacing.xs),
                      Text(
                        months[index],
                        style: Theme.of(context).textTheme.bodySmall,
                      ),
                    ],
                  ),
                );
              }),
            ),
          ),
        ],
      ),
    );
  }
}

class _ResolutionTimeCard extends StatelessWidget {
  const _ResolutionTimeCard();

  @override
  Widget build(BuildContext context) {
    const values = [4.2, 3.8, 6.1, 4.8, 8.5, 3.2];
    return LunasCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Avg. resolution time',
            style: Theme.of(
              context,
            ).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w800),
          ),
          const SizedBox(height: AppSpacing.xxs),
          Text(
            'Hours per weekly cohort',
            style: Theme.of(context).textTheme.bodySmall,
          ),
          const SizedBox(height: AppSpacing.lg),
          SizedBox(
            height: 132,
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: List.generate(values.length, (index) {
                final height = values[index] / 9 * 72;
                return Expanded(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.end,
                    children: [
                      Text(
                        values[index].toStringAsFixed(1),
                        style: Theme.of(context).textTheme.bodySmall,
                      ),
                      const SizedBox(height: AppSpacing.xxs),
                      Container(
                        height: height,
                        margin: const EdgeInsets.symmetric(horizontal: 3),
                        decoration: const BoxDecoration(
                          color: AppColorsLight.alert,
                          borderRadius: BorderRadius.vertical(
                            top: Radius.circular(4),
                          ),
                        ),
                      ),
                      const SizedBox(height: AppSpacing.xs),
                      Text(
                        'W${index + 1}',
                        style: Theme.of(context).textTheme.bodySmall,
                      ),
                    ],
                  ),
                );
              }),
            ),
          ),
        ],
      ),
    );
  }
}

class _SlaIncidentCard extends StatelessWidget {
  const _SlaIncidentCard({
    required this.id,
    required this.issue,
    required this.department,
    required this.remaining,
    required this.priority,
    required this.icon,
    required this.color,
  });

  final String id;
  final String issue;
  final String department;
  final String remaining;
  final String priority;
  final IconData icon;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return LunasCard(
      onTap: () =>
          Navigator.pushNamed(context, EngineeringRoutes.incidentDetails),
      padding: const EdgeInsets.all(AppSpacing.md),
      child: Row(
        children: [
          Container(
            width: 42,
            height: 42,
            decoration: BoxDecoration(
              color: color.withValues(alpha: .14),
              shape: BoxShape.circle,
            ),
            child: Icon(icon, color: color),
          ),
          const SizedBox(width: AppSpacing.sm),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(id, style: Theme.of(context).textTheme.bodySmall),
                const SizedBox(height: AppSpacing.xxs),
                Text(
                  issue,
                  style: Theme.of(
                    context,
                  ).textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.w800),
                ),
                const SizedBox(height: AppSpacing.xxs),
                Text(department, style: Theme.of(context).textTheme.bodySmall),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              EngineeringBadge(label: priority, color: color),
              const SizedBox(height: AppSpacing.xs),
              Text(
                remaining,
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: color,
                  fontWeight: FontWeight.w800,
                ),
              ),
            ],
          ),
          const SizedBox(width: AppSpacing.xxs),
          const Icon(Icons.chevron_right_rounded),
        ],
      ),
    );
  }
}
