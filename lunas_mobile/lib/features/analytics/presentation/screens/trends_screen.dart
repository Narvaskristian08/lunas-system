import 'package:flutter/material.dart';
import 'package:lunas_mobile/core/theme/app_colors.dart';
import 'package:lunas_mobile/core/theme/app_spacing.dart';
import 'package:lunas_mobile/core/widgets/lunas_card.dart';
import 'package:lunas_mobile/features/analytics/presentation/widgets/analytics_widgets.dart';

class TrendsScreen extends StatelessWidget {
  const TrendsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return AnalyticsLayout(
      title: 'Trends',
      subtitle: 'Reporting patterns over time',
      activeRoute: '/analytics/trends',
      child: Column(
        children: [
          const AnalyticsChartCard(
            title: 'Six-Month Trend',
            subtitle: 'Total reports compared month to month',
            child: LunasLineChart(values: [52, 68, 61, 88, 97, 124]),
          ),
          const SizedBox(height: AppSpacing.md),
          LunasCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Trend Insights',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w800,
                  ),
                ),
                const SizedBox(height: AppSpacing.md),
                const _Insight(
                  icon: Icons.trending_up_rounded,
                  color: AppColorsLight.critical,
                  title: 'Road reports increased 18%',
                  detail: 'Most reports came from Barangays 5 and 8.',
                ),
                const Divider(height: AppSpacing.xxl),
                const _Insight(
                  icon: Icons.trending_down_rounded,
                  color: AppColorsLight.success,
                  title: 'Response time improved',
                  detail: 'Average response is 18 minutes faster.',
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _Insight extends StatelessWidget {
  const _Insight({
    required this.icon,
    required this.color,
    required this.title,
    required this.detail,
  });
  final IconData icon;
  final Color color;
  final String title;
  final String detail;

  @override
  Widget build(BuildContext context) => Row(
    children: [
      Icon(icon, color: color),
      const SizedBox(width: AppSpacing.md),
      Expanded(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(title, style: Theme.of(context).textTheme.titleMedium),
            Text(detail, style: Theme.of(context).textTheme.bodySmall),
          ],
        ),
      ),
    ],
  );
}
