import 'package:flutter/material.dart';
import 'package:lunas_mobile/core/theme/app_colors.dart';
import 'package:lunas_mobile/core/theme/app_spacing.dart';
import 'package:lunas_mobile/core/widgets/lunas_card.dart';
import 'package:lunas_mobile/features/engineering/presentation/screens/engineering_routes.dart';
import 'package:lunas_mobile/features/engineering/presentation/screens/engineering_widgets.dart';

/// Static city-wide insights screen derived from the Stitch analytics export.
class InfrastructureAnalyticsScreen extends StatelessWidget {
  const InfrastructureAnalyticsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return EngineeringPage(
      title: 'Infrastructure analytics',
      subtitle: 'City-wide engineering insights',
      actions: [
        IconButton(
          tooltip: 'Download analytics',
          onPressed: () => showEngineeringNotice(
            context,
            'Analytics export will be connected to approved reporting data.',
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
              final columns = constraints.maxWidth >= 640 ? 3 : 1;
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
                      label: 'Infrastructure health',
                      value: '88 / 100',
                      detail: '+2.4% vs. last month',
                      icon: Icons.health_and_safety_outlined,
                      color: AppColorsLight.success,
                    ),
                  ),
                  SizedBox(
                    width: width,
                    child: const EngineeringMetricCard(
                      label: 'Avg. resolution time',
                      value: '1.4 days',
                      detail: '−0.3 days vs. SLA',
                      icon: Icons.timer_outlined,
                      color: AppColorsLight.brandBase,
                    ),
                  ),
                  SizedBox(
                    width: width,
                    child: const EngineeringMetricCard(
                      label: 'Critical incidents',
                      value: '12',
                      detail: '3 road · 9 water',
                      icon: Icons.warning_amber_rounded,
                      color: AppColorsLight.critical,
                      emphasized: true,
                    ),
                  ),
                ],
              );
            },
          ),
          const SizedBox(height: AppSpacing.xxl),
          const EngineeringSectionHeading(
            title: 'Incident heat map',
            description:
                'Static regional intensity view for the current reporting period.',
          ),
          const SizedBox(height: AppSpacing.sm),
          const EngineeringVisualPanel(
            icon: Icons.location_searching_outlined,
            label: 'Dagupan incident concentration',
            detail:
                'Higher intensity near Pantal, Downtown, and Bonuan corridors',
            accent: AppColorsLight.critical,
            height: 240,
            markerLabel: '12 critical incidents',
          ),
          const SizedBox(height: AppSpacing.xxl),
          const EngineeringSectionHeading(title: 'Hazard categories'),
          const SizedBox(height: AppSpacing.sm),
          LunasCard(
            child: const Column(
              children: [
                _CategoryRow(
                  icon: Icons.add_road_outlined,
                  label: 'Road',
                  percent: 80,
                  color: AppColorsLight.brandBase,
                ),
                SizedBox(height: AppSpacing.lg),
                _CategoryRow(
                  icon: Icons.water_drop_outlined,
                  label: 'Water',
                  percent: 65,
                  color: AppColorsLight.success,
                ),
                SizedBox(height: AppSpacing.lg),
                _CategoryRow(
                  icon: Icons.bolt_outlined,
                  label: 'Power',
                  percent: 30,
                  color: AppColorsLight.alert,
                ),
                SizedBox(height: AppSpacing.lg),
                _CategoryRow(
                  icon: Icons.water_outlined,
                  label: 'Drainage',
                  percent: 45,
                  color: AppColorsLight.critical,
                ),
              ],
            ),
          ),
          const SizedBox(height: AppSpacing.xxl),
          EngineeringSectionHeading(
            title: 'Barangay comparison',
            trailing: TextButton(
              onPressed: () =>
                  Navigator.pushNamed(context, EngineeringRoutes.performance),
              child: const Text('View performance'),
            ),
          ),
          const SizedBox(height: AppSpacing.sm),
          LunasCard(
            padding: EdgeInsets.zero,
            child: Column(
              children: const [
                _BarangayRow(
                  name: 'Pantal',
                  score: '92',
                  incidents: '14',
                  trend: Icons.trending_up_rounded,
                  trendColor: AppColorsLight.success,
                ),
                Divider(height: 1),
                _BarangayRow(
                  name: 'Poblacion Oeste',
                  score: '75',
                  incidents: '32',
                  trend: Icons.trending_flat_rounded,
                  trendColor: AppColorsLight.alert,
                ),
                Divider(height: 1),
                _BarangayRow(
                  name: 'Bonuan Gueset',
                  score: '62',
                  incidents: '45',
                  trend: Icons.trending_down_rounded,
                  trendColor: AppColorsLight.critical,
                ),
              ],
            ),
          ),
          const SizedBox(height: AppSpacing.xl),
          LunasCard(
            color: Theme.of(
              context,
            ).colorScheme.primaryContainer.withValues(alpha: .42),
            child: const EngineeringInfoRow(
              icon: Icons.privacy_tip_outlined,
              label: 'Responsible analytics',
              value:
                  'Insights are operational summaries. They should support, not replace, site inspection and accountable engineering judgment.',
            ),
          ),
        ],
      ),
    );
  }
}

class _CategoryRow extends StatelessWidget {
  const _CategoryRow({
    required this.icon,
    required this.label,
    required this.percent,
    required this.color,
  });

  final IconData icon;
  final String label;
  final int percent;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(icon, color: color),
        const SizedBox(width: AppSpacing.sm),
        SizedBox(
          width: 70,
          child: Text(
            label,
            style: Theme.of(
              context,
            ).textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.w700),
          ),
        ),
        Expanded(
          child: EngineeringProgressBar(value: percent / 100, color: color),
        ),
        const SizedBox(width: AppSpacing.sm),
        Text('$percent%', style: Theme.of(context).textTheme.bodySmall),
      ],
    );
  }
}

class _BarangayRow extends StatelessWidget {
  const _BarangayRow({
    required this.name,
    required this.score,
    required this.incidents,
    required this.trend,
    required this.trendColor,
  });

  final String name;
  final String score;
  final String incidents;
  final IconData trend;
  final Color trendColor;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(AppSpacing.md),
      child: Row(
        children: [
          Expanded(
            flex: 2,
            child: Text(
              name,
              style: Theme.of(
                context,
              ).textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.w700),
            ),
          ),
          _Stat(label: 'Health', value: score),
          const SizedBox(width: AppSpacing.sm),
          _Stat(label: 'Open', value: incidents),
          const SizedBox(width: AppSpacing.sm),
          Icon(trend, color: trendColor),
        ],
      ),
    );
  }
}

class _Stat extends StatelessWidget {
  const _Stat({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.end,
      children: [
        Text(
          value,
          style: Theme.of(
            context,
          ).textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.w800),
        ),
        Text(label, style: Theme.of(context).textTheme.bodySmall),
      ],
    );
  }
}
