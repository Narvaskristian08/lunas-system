import 'package:flutter/material.dart';
import 'package:lunas_mobile/core/theme/app_colors.dart';
import 'package:lunas_mobile/core/theme/app_radius.dart';
import 'package:lunas_mobile/core/theme/app_spacing.dart';
import 'package:lunas_mobile/core/widgets/lunas_app_scaffold.dart';
import 'package:lunas_mobile/core/widgets/lunas_card.dart';
import 'package:lunas_mobile/features/dashboard/presentation/widgets/dashboard_widgets.dart';

class DashboardScreen extends StatelessWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return LunasAppScaffold(
      title: 'Dashboard',
      subtitle: 'Community overview',
      selectedIndex: 1,
      actions: [
        IconButton(
          onPressed: () => Navigator.pushNamed(context, '/analytics'),
          tooltip: 'Analytics',
          icon: const Icon(Icons.analytics_outlined),
        ),
        IconButton(
          onPressed: () => Navigator.pushNamed(context, '/notifications'),
          tooltip: 'Notifications',
          icon: const Badge(
            smallSize: 8,
            child: Icon(Icons.notifications_none_rounded),
          ),
        ),
        const SizedBox(width: AppSpacing.sm),
      ],
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Container(
            padding: const EdgeInsets.all(AppSpacing.lg),
            decoration: BoxDecoration(
              color: AppColorsLight.brandBase,
              borderRadius: AppRadius.card,
            ),
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Community Response',
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: Colors.white.withValues(alpha: .8),
                        ),
                      ),
                      const SizedBox(height: AppSpacing.xs),
                      Text(
                        '86%',
                        style: Theme.of(context).textTheme.displayMedium
                            ?.copyWith(
                              color: Colors.white,
                              fontWeight: FontWeight.w800,
                            ),
                      ),
                      Text(
                        'Reports resolved this month',
                        style: Theme.of(
                          context,
                        ).textTheme.bodySmall?.copyWith(color: Colors.white),
                      ),
                    ],
                  ),
                ),
                SizedBox(
                  width: 76,
                  height: 76,
                  child: Stack(
                    alignment: Alignment.center,
                    children: [
                      const CircularProgressIndicator(
                        value: .86,
                        strokeWidth: 8,
                        color: Colors.white,
                        backgroundColor: Color(0xFF4D91C7),
                      ),
                      Text(
                        '+6%',
                        style: Theme.of(
                          context,
                        ).textTheme.labelLarge?.copyWith(color: Colors.white),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: AppSpacing.xxl),
          const DashboardSectionHeader(title: 'City Report Overview'),
          const SizedBox(height: AppSpacing.sm),
          const _MetricsGrid(),
          const SizedBox(height: AppSpacing.xxl),
          const DashboardSectionHeader(title: 'Priority Updates'),
          const SizedBox(height: AppSpacing.sm),
          LunasCard(
            padding: const EdgeInsets.all(AppSpacing.md),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: AppSpacing.sm,
                        vertical: AppSpacing.xs,
                      ),
                      decoration: BoxDecoration(
                        color: AppColorsLight.critical.withValues(alpha: .1),
                        borderRadius: BorderRadius.circular(AppRadius.pill),
                      ),
                      child: Text(
                        'HIGH PRIORITY',
                        style: Theme.of(context).textTheme.labelSmall?.copyWith(
                          color: AppColorsLight.critical,
                          fontSize: 9,
                        ),
                      ),
                    ),
                    const Spacer(),
                    Text(
                      '2 hours ago',
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                  ],
                ),
                const SizedBox(height: AppSpacing.md),
                Text(
                  'Flooding near Mabini Bridge',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: AppSpacing.xs),
                Text(
                  'Barangay response teams have been notified. Avoid the affected route.',
                  style: Theme.of(context).textTheme.bodySmall,
                ),
                const SizedBox(height: AppSpacing.md),
                OutlinedButton.icon(
                  onPressed: () => Navigator.pushNamed(context, '/maps'),
                  icon: const Icon(Icons.map_outlined, size: 18),
                  label: const Text('View on Map'),
                ),
              ],
            ),
          ),
          const SizedBox(height: AppSpacing.xxl),
          DashboardSectionHeader(
            title: 'Latest Activity',
            actionLabel: 'View Reports',
            onAction: () => Navigator.pushNamed(context, '/reports/history'),
          ),
          const SizedBox(height: AppSpacing.sm),
          DashboardReportCard(
            title: 'Damaged Sidewalk',
            location: 'Bonifacio Drive, Barangay 3',
            status: 'NEW',
            statusColor: AppColorsLight.brandBase,
            icon: Icons.warning_amber_rounded,
            onTap: () => Navigator.pushNamed(context, '/reports/details'),
          ),
          const SizedBox(height: AppSpacing.sm),
          DashboardReportCard(
            title: 'Clogged Drainage',
            location: 'Quezon Street, Barangay 6',
            status: 'ASSIGNED',
            statusColor: AppColorsLight.alert,
            icon: Icons.water_damage_outlined,
            onTap: () => Navigator.pushNamed(context, '/reports/details'),
          ),
          const SizedBox(height: AppSpacing.xxl),
          const DashboardSectionHeader(title: 'Quick Actions'),
          const SizedBox(height: AppSpacing.sm),
          Row(
            children: [
              Expanded(
                child: DashboardQuickAction(
                  label: 'New Report',
                  icon: Icons.add_circle_outline_rounded,
                  onTap: () => Navigator.pushNamed(context, '/reports/new'),
                ),
              ),
              const SizedBox(width: AppSpacing.sm),
              Expanded(
                child: DashboardQuickAction(
                  label: 'Report Map',
                  icon: Icons.map_outlined,
                  color: AppColorsLight.success,
                  onTap: () => Navigator.pushNamed(context, '/maps'),
                ),
              ),
              const SizedBox(width: AppSpacing.sm),
              Expanded(
                child: DashboardQuickAction(
                  label: 'Notifications',
                  icon: Icons.notifications_none_rounded,
                  color: AppColorsLight.alert,
                  onTap: () => Navigator.pushNamed(context, '/notifications'),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _MetricsGrid extends StatelessWidget {
  const _MetricsGrid();

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final itemWidth = (constraints.maxWidth - AppSpacing.sm) / 2;
        return Wrap(
          spacing: AppSpacing.sm,
          runSpacing: AppSpacing.sm,
          children: [
            SizedBox(
              width: itemWidth,
              child: const DashboardSummaryCard(
                value: '124',
                label: 'Total Reports',
                icon: Icons.description_outlined,
                color: AppColorsLight.brandBase,
              ),
            ),
            SizedBox(
              width: itemWidth,
              child: const DashboardSummaryCard(
                value: '18',
                label: 'Under Review',
                icon: Icons.rate_review_outlined,
                color: AppColorsLight.alert,
              ),
            ),
            SizedBox(
              width: itemWidth,
              child: const DashboardSummaryCard(
                value: '92',
                label: 'Resolved',
                icon: Icons.check_circle_outline_rounded,
                color: AppColorsLight.success,
              ),
            ),
            SizedBox(
              width: itemWidth,
              child: const DashboardSummaryCard(
                value: '14',
                label: 'In Progress',
                icon: Icons.engineering_outlined,
                color: Color(0xFF7C3AED),
              ),
            ),
          ],
        );
      },
    );
  }
}
