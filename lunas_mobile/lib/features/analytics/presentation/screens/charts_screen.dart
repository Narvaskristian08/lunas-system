import 'package:flutter/material.dart';
import 'package:lunas_mobile/core/theme/app_colors.dart';
import 'package:lunas_mobile/core/theme/app_spacing.dart';
import 'package:lunas_mobile/features/analytics/presentation/widgets/analytics_widgets.dart';

class ChartsScreen extends StatelessWidget {
  const ChartsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const AnalyticsLayout(
      title: 'Charts',
      subtitle: 'Visual report analysis',
      activeRoute: '/analytics/charts',
      child: Column(
        children: [
          AnalyticsChartCard(
            title: 'Reports by Category',
            subtitle: 'Current month',
            child: LunasBarChart(
              values: [38, 29, 21, 18, 12],
              labels: ['Road', 'Light', 'Water', 'Waste', 'Other'],
              color: AppColorsLight.info,
            ),
          ),
          SizedBox(height: AppSpacing.md),
          AnalyticsChartCard(
            title: 'Resolution Rate',
            subtitle: 'Share of reports successfully resolved',
            child: LunasDonutChart(value: .74, label: 'Resolved'),
          ),
        ],
      ),
    );
  }
}
