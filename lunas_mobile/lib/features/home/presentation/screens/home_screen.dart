import 'package:flutter/material.dart';
import 'package:lunas_mobile/core/theme/app_colors.dart';
import 'package:lunas_mobile/core/theme/app_radius.dart';
import 'package:lunas_mobile/core/theme/app_spacing.dart';
import 'package:lunas_mobile/core/widgets/lunas_app_scaffold.dart';
import 'package:lunas_mobile/core/widgets/lunas_button.dart';
import 'package:lunas_mobile/features/dashboard/presentation/widgets/dashboard_widgets.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return LunasAppScaffold(
      title: 'LUNAS',
      subtitle: 'Citizen Portal',
      selectedIndex: 0,
      actions: [
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
          Text(
            'Good Morning, Alex!',
            style: Theme.of(context).textTheme.headlineLarge?.copyWith(
              fontSize: 26,
              fontWeight: FontWeight.w800,
            ),
          ),
          const SizedBox(height: AppSpacing.xxs),
          Text(
            'Here’s what’s happening in your community.',
            style: Theme.of(context).textTheme.bodyMedium,
          ),
          const SizedBox(height: AppSpacing.xl),
          Container(
            padding: const EdgeInsets.all(AppSpacing.lg),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFF005DAA), Color(0xFF087CC7)],
              ),
              borderRadius: AppRadius.card,
              boxShadow: [
                BoxShadow(
                  color: AppColorsLight.brandBase.withValues(alpha: .18),
                  blurRadius: 22,
                  offset: const Offset(0, 10),
                ),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Icon(
                  Icons.campaign_outlined,
                  color: Colors.white,
                  size: 30,
                ),
                const SizedBox(height: AppSpacing.md),
                Text(
                  'Spot a problem in your area?',
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    color: Colors.white,
                    fontWeight: FontWeight.w800,
                  ),
                ),
                const SizedBox(height: AppSpacing.xs),
                Text(
                  'Report it in a few simple steps and track every update.',
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: Colors.white.withValues(alpha: .88),
                  ),
                ),
                const SizedBox(height: AppSpacing.lg),
                LunasButton(
                  label: 'Create a Report',
                  icon: Icons.add_rounded,
                  onPressed: () => Navigator.pushNamed(context, '/reports/new'),
                ),
              ],
            ),
          ),
          const SizedBox(height: AppSpacing.xxl),
          DashboardSectionHeader(
            title: 'My Report Summary',
            actionLabel: 'View All',
            onAction: () => Navigator.pushNamed(context, '/reports/history'),
          ),
          const SizedBox(height: AppSpacing.sm),
          const _SummaryGrid(),
          const SizedBox(height: AppSpacing.xxl),
          const DashboardSectionHeader(title: 'Quick Actions'),
          const SizedBox(height: AppSpacing.sm),
          Row(
            children: [
              Expanded(
                child: DashboardQuickAction(
                  label: 'Report Issue',
                  icon: Icons.add_a_photo_outlined,
                  onTap: () => Navigator.pushNamed(context, '/reports/new'),
                ),
              ),
              const SizedBox(width: AppSpacing.sm),
              Expanded(
                child: DashboardQuickAction(
                  label: 'Track Reports',
                  icon: Icons.fact_check_outlined,
                  onTap: () => Navigator.pushNamed(context, '/reports/history'),
                  color: AppColorsLight.success,
                ),
              ),
              const SizedBox(width: AppSpacing.sm),
              Expanded(
                child: DashboardQuickAction(
                  label: 'View Map',
                  icon: Icons.map_outlined,
                  onTap: () => Navigator.pushNamed(context, '/maps'),
                  color: AppColorsLight.alert,
                ),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.xxl),
          DashboardSectionHeader(
            title: 'Recent Reports',
            actionLabel: 'See All',
            onAction: () => Navigator.pushNamed(context, '/reports/history'),
          ),
          const SizedBox(height: AppSpacing.sm),
          DashboardReportCard(
            title: 'Broken Streetlight',
            location: 'Rizal Avenue, Barangay 5',
            status: 'IN PROGRESS',
            statusColor: AppColorsLight.alert,
            icon: Icons.lightbulb_outline_rounded,
            onTap: () => Navigator.pushNamed(context, '/reports/details'),
          ),
          const SizedBox(height: AppSpacing.sm),
          DashboardReportCard(
            title: 'Road Surface Damage',
            location: 'Mabini Street, Barangay 8',
            status: 'VERIFIED',
            statusColor: AppColorsLight.success,
            icon: Icons.add_road_rounded,
            onTap: () => Navigator.pushNamed(context, '/reports/details'),
          ),
        ],
      ),
    );
  }
}

class _SummaryGrid extends StatelessWidget {
  const _SummaryGrid();

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final width = (constraints.maxWidth - AppSpacing.sm) / 2;
        return Wrap(
          spacing: AppSpacing.sm,
          runSpacing: AppSpacing.sm,
          children: [
            SizedBox(
              width: width,
              child: const DashboardSummaryCard(
                value: '12',
                label: 'Total Reports',
                icon: Icons.description_outlined,
                color: AppColorsLight.brandBase,
              ),
            ),
            SizedBox(
              width: width,
              child: const DashboardSummaryCard(
                value: '3',
                label: 'In Progress',
                icon: Icons.sync_rounded,
                color: AppColorsLight.alert,
              ),
            ),
            SizedBox(
              width: width,
              child: const DashboardSummaryCard(
                value: '8',
                label: 'Resolved',
                icon: Icons.check_circle_outline_rounded,
                color: AppColorsLight.success,
              ),
            ),
            SizedBox(
              width: width,
              child: const DashboardSummaryCard(
                value: '1',
                label: 'Needs Action',
                icon: Icons.error_outline_rounded,
                color: AppColorsLight.critical,
              ),
            ),
          ],
        );
      },
    );
  }
}
