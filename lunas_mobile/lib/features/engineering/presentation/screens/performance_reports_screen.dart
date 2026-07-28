import 'package:flutter/material.dart';
import 'package:lunas_mobile/core/theme/app_colors.dart';
import 'package:lunas_mobile/core/theme/app_spacing.dart';
import 'package:lunas_mobile/core/widgets/lunas_card.dart';
import 'package:lunas_mobile/features/engineering/presentation/screens/engineering_widgets.dart';

/// Cross-department performance overview for the engineering workspace.
class PerformanceReportsScreen extends StatelessWidget {
  const PerformanceReportsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return EngineeringPage(
      title: 'Performance reports',
      subtitle: 'Key metrics across departments and SLAs',
      actions: [
        IconButton(
          tooltip: 'Download report',
          onPressed: () => showEngineeringNotice(
            context,
            'Report download is a static UI control in this prototype.',
          ),
          icon: const Icon(Icons.download_outlined),
        ),
        const SizedBox(width: AppSpacing.sm),
      ],
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const _PerformanceMetric(
            icon: Icons.engineering_outlined,
            title: 'Repair team',
            label: 'Efficiency score',
            value: '92%',
            change: '+4%',
            color: AppColorsLight.success,
          ),
          const SizedBox(height: AppSpacing.sm),
          const _PerformanceMetric(
            icon: Icons.location_city_outlined,
            title: 'Barangay routing',
            label: 'Avg. resolution',
            value: '2.4h',
            change: '−0.2h',
            color: AppColorsLight.brandBase,
          ),
          const SizedBox(height: AppSpacing.sm),
          const _PerformanceMetric(
            icon: Icons.handshake_outlined,
            title: 'Provider SLA',
            label: 'Compliance rate',
            value: '88%',
            change: 'Stable',
            color: AppColorsLight.alert,
          ),
          const SizedBox(height: AppSpacing.xxl),
          const EngineeringSectionHeading(title: 'Average repair time by zone'),
          const SizedBox(height: AppSpacing.sm),
          const _ZoneChart(),
          const SizedBox(height: AppSpacing.xxl),
          const EngineeringSectionHeading(title: 'Completion rate'),
          const SizedBox(height: AppSpacing.sm),
          LunasCard(
            child: Column(
              children: [
                Text(
                  '89%',
                  style: Theme.of(context).textTheme.displayMedium?.copyWith(
                    color: AppColorsLight.success,
                    fontWeight: FontWeight.w800,
                  ),
                ),
                const SizedBox(height: AppSpacing.xs),
                Text(
                  'Completed within the target period',
                  style: Theme.of(context).textTheme.bodyMedium,
                ),
                const SizedBox(height: AppSpacing.lg),
                const EngineeringProgressBar(
                  value: .89,
                  color: AppColorsLight.success,
                  label: 'Current monthly completion',
                ),
                const SizedBox(height: AppSpacing.md),
                Text(
                  'Target: 95%',
                  style: Theme.of(context).textTheme.bodySmall,
                ),
              ],
            ),
          ),
          const SizedBox(height: AppSpacing.xxl),
          const EngineeringSectionHeading(title: 'Response trend'),
          const SizedBox(height: AppSpacing.sm),
          const _ResponseTrendCard(),
          const SizedBox(height: AppSpacing.xl),
          LunasCard(
            color: Theme.of(context).colorScheme.primaryContainer.withValues(alpha: .40),
            child: const EngineeringInfoRow(
              icon: Icons.assessment_outlined,
              label: 'Report scope',
              value:
                  'Displayed values illustrate UI behavior only. Production reports need validated operational records and role-based access.',
            ),
          ),
        ],
      ),
    );
  }
}

class _PerformanceMetric extends StatelessWidget {
  const _PerformanceMetric({
    required this.icon,
    required this.title,
    required this.label,
    required this.value,
    required this.change,
    required this.color,
  });

  final IconData icon;
  final String title;
  final String label;
  final String value;
  final String change;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return LunasCard(
      child: Row(
        children: [
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              color: color.withValues(alpha: .13),
              shape: BoxShape.circle,
            ),
            child: Icon(icon, color: color),
          ),
          const SizedBox(width: AppSpacing.md),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w800,
                  ),
                ),
                const SizedBox(height: AppSpacing.xxs),
                Text(label, style: Theme.of(context).textTheme.bodySmall),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                value,
                style: Theme.of(context).textTheme.titleLarge?.copyWith(
                  color: color,
                  fontWeight: FontWeight.w800,
                ),
              ),
              const SizedBox(height: AppSpacing.xxs),
              Text(
                change,
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: color,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _ZoneChart extends StatelessWidget {
  const _ZoneChart();

  @override
  Widget build(BuildContext context) {
    const zones = ['North', 'East', 'Central', 'West', 'South'];
    const values = [2.4, 3.6, 1.8, 4.1, 2.9];
    return LunasCard(
      child: SizedBox(
        height: 190,
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.end,
          children: List.generate(values.length, (index) {
            final height = values[index] / 4.5 * 104;
            return Expanded(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  Text('${values[index]}h', style: Theme.of(context).textTheme.bodySmall),
                  const SizedBox(height: AppSpacing.xs),
                  Container(
                    height: height,
                    margin: const EdgeInsets.symmetric(horizontal: 5),
                    decoration: BoxDecoration(
                      color: index == 3
                          ? AppColorsLight.alert
                          : AppColorsLight.brandBase,
                      borderRadius: const BorderRadius.vertical(top: Radius.circular(5)),
                    ),
                  ),
                  const SizedBox(height: AppSpacing.sm),
                  Text(
                    zones[index],
                    textAlign: TextAlign.center,
                    style: Theme.of(context).textTheme.bodySmall,
                  ),
                ],
              ),
            );
          }),
        ),
      ),
    );
  }
}

class _ResponseTrendCard extends StatelessWidget {
  const _ResponseTrendCard();

  @override
  Widget build(BuildContext context) {
    const values = [0.35, 0.46, 0.39, 0.62, 0.66, 0.78, 0.82];
    return LunasCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Response-time improvement',
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.w800,
            ),
          ),
          const SizedBox(height: AppSpacing.xxs),
          Text(
            '7-week operational trend',
            style: Theme.of(context).textTheme.bodySmall,
          ),
          const SizedBox(height: AppSpacing.lg),
          SizedBox(
            height: 90,
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: values
                  .map(
                    (value) => Expanded(
                      child: Container(
                        height: 16 + value * 62,
                        margin: const EdgeInsets.symmetric(horizontal: 3),
                        decoration: BoxDecoration(
                          color: AppColorsLight.success.withValues(alpha: .35 + value * .6),
                          borderRadius: const BorderRadius.vertical(top: Radius.circular(4)),
                        ),
                      ),
                    ),
                  )
                  .toList(),
            ),
          ),
        ],
      ),
    );
  }
}
