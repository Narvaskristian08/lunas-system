import 'package:flutter/material.dart';
import 'package:lunas_mobile/core/theme/app_colors.dart';
import 'package:lunas_mobile/core/theme/app_spacing.dart';
import 'package:lunas_mobile/core/widgets/lunas_card.dart';
import 'package:lunas_mobile/features/analytics/presentation/widgets/analytics_widgets.dart';

class PerformanceSummaryScreen extends StatelessWidget {
  const PerformanceSummaryScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return AnalyticsLayout(
      title: 'Performance Summary',
      subtitle: 'Service delivery and SLA performance',
      activeRoute: '/analytics/performance',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const AnalyticsMetricGrid(
            items: [
              AnalyticsMetric(
                value: '92%',
                label: 'SLA Compliance',
                change: '+3.4%',
                icon: Icons.speed_rounded,
                color: AppColorsLight.success,
              ),
              AnalyticsMetric(
                value: '2.4h',
                label: 'Avg. Resolution',
                change: '22 min faster',
                icon: Icons.schedule_rounded,
                color: AppColorsLight.info,
              ),
              AnalyticsMetric(
                value: '88%',
                label: 'First Response',
                change: '+5.1%',
                icon: Icons.bolt_rounded,
                color: AppColorsLight.alert,
              ),
              AnalyticsMetric(
                value: '4.6/5',
                label: 'Satisfaction',
                change: '+0.3 points',
                icon: Icons.sentiment_satisfied_alt_rounded,
                color: Color(0xFF7C3AED),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.xxl),
          Text(
            'Department Performance',
            style: Theme.of(
              context,
            ).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w800),
          ),
          const SizedBox(height: AppSpacing.md),
          const LunasCard(
            child: Column(
              children: [
                PerformanceRow(
                  label: 'Road Maintenance',
                  value: '94%',
                  progress: .94,
                  color: AppColorsLight.success,
                ),
                SizedBox(height: AppSpacing.lg),
                PerformanceRow(
                  label: 'Public Lighting',
                  value: '89%',
                  progress: .89,
                  color: AppColorsLight.info,
                ),
                SizedBox(height: AppSpacing.lg),
                PerformanceRow(
                  label: 'Drainage Services',
                  value: '82%',
                  progress: .82,
                  color: AppColorsLight.alert,
                ),
                SizedBox(height: AppSpacing.lg),
                PerformanceRow(
                  label: 'Waste Management',
                  value: '91%',
                  progress: .91,
                  color: AppColorsLight.brandBase,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
