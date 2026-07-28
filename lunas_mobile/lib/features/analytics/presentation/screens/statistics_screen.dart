import 'package:flutter/material.dart';
import 'package:lunas_mobile/core/theme/app_colors.dart';
import 'package:lunas_mobile/core/theme/app_spacing.dart';
import 'package:lunas_mobile/features/analytics/presentation/widgets/analytics_widgets.dart';

class StatisticsScreen extends StatelessWidget {
  const StatisticsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const AnalyticsLayout(
      title: 'Statistics',
      subtitle: 'Barangay report performance',
      activeRoute: '/analytics',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          AnalyticsMetricGrid(
            items: [
              AnalyticsMetric(
                value: '124',
                label: 'Total Reports',
                change: '+12% this month',
                icon: Icons.description_outlined,
                color: AppColorsLight.brandBase,
              ),
              AnalyticsMetric(
                value: '92',
                label: 'Resolved',
                change: '+8% this month',
                icon: Icons.check_circle_outline,
                color: AppColorsLight.success,
              ),
              AnalyticsMetric(
                value: '18',
                label: 'In Progress',
                change: '-3% this month',
                icon: Icons.sync_rounded,
                color: AppColorsLight.alert,
              ),
              AnalyticsMetric(
                value: '3.2h',
                label: 'Avg. Response',
                change: '18 min faster',
                icon: Icons.timer_outlined,
                color: AppColorsLight.info,
              ),
            ],
          ),
          SizedBox(height: AppSpacing.xxl),
          AnalyticsChartCard(
            title: 'Monthly Reports',
            subtitle: 'Reports received over the last six months',
            child: LunasBarChart(
              values: [48, 62, 57, 83, 96, 124],
              labels: ['Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
            ),
          ),
        ],
      ),
    );
  }
}
