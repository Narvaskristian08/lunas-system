import 'package:flutter/material.dart';
import 'package:lunas_mobile/core/theme/app_colors.dart';
import 'package:lunas_mobile/core/theme/app_spacing.dart';
import 'package:lunas_mobile/core/widgets/lunas_card.dart';
import 'package:lunas_mobile/features/analytics/presentation/widgets/analytics_widgets.dart';

class ReportsDashboardScreen extends StatelessWidget {
  const ReportsDashboardScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return AnalyticsLayout(
      title: 'Reports Dashboard',
      subtitle: 'Citywide reporting overview',
      activeRoute: '/analytics/reports',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const AnalyticsMetricGrid(
            items: [
              AnalyticsMetric(
                value: '342',
                label: 'Open Reports',
                change: '+24 this week',
                icon: Icons.inbox_outlined,
                color: AppColorsLight.brandBase,
              ),
              AnalyticsMetric(
                value: '74%',
                label: 'Resolution Rate',
                change: '+4.2%',
                icon: Icons.task_alt_rounded,
                color: AppColorsLight.success,
              ),
              AnalyticsMetric(
                value: '28',
                label: 'SLA Risk',
                change: '-6 this week',
                icon: Icons.warning_amber_rounded,
                color: AppColorsLight.alert,
              ),
              AnalyticsMetric(
                value: '4.6',
                label: 'Citizen Rating',
                change: '+0.3 points',
                icon: Icons.star_outline_rounded,
                color: Color(0xFF7C3AED),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.xxl),
          Text(
            'Report Distribution',
            style: Theme.of(
              context,
            ).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w800),
          ),
          const SizedBox(height: AppSpacing.md),
          const LunasCard(
            child: Column(
              children: [
                PerformanceRow(
                  label: 'Roads & Sidewalks',
                  value: '38%',
                  progress: .38,
                  color: AppColorsLight.brandBase,
                ),
                SizedBox(height: AppSpacing.lg),
                PerformanceRow(
                  label: 'Streetlights',
                  value: '24%',
                  progress: .24,
                  color: AppColorsLight.alert,
                ),
                SizedBox(height: AppSpacing.lg),
                PerformanceRow(
                  label: 'Drainage & Flooding',
                  value: '19%',
                  progress: .19,
                  color: AppColorsLight.info,
                ),
                SizedBox(height: AppSpacing.lg),
                PerformanceRow(
                  label: 'Waste & Sanitation',
                  value: '12%',
                  progress: .12,
                  color: AppColorsLight.success,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
