import 'package:flutter/material.dart';
import 'package:lunas_mobile/core/theme/app_colors.dart';
import 'package:lunas_mobile/core/theme/app_radius.dart';
import 'package:lunas_mobile/core/theme/app_spacing.dart';
import 'package:lunas_mobile/core/widgets/lunas_app_scaffold.dart';
import 'package:lunas_mobile/core/widgets/lunas_button.dart';
import 'package:lunas_mobile/core/widgets/lunas_card.dart';
import 'package:lunas_mobile/features/citizen_extra/presentation/screens/citizen_extra_widgets.dart';

/// Alternate citizen home ported from the second Stitch dashboard concept.
class CitizenDashboardAltScreen extends StatelessWidget {
  const CitizenDashboardAltScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return LunasAppScaffold(
      title: 'LUNAS',
      subtitle: 'Citizen dashboard',
      selectedIndex: 0,
      actions: [
        IconButton(
          tooltip: 'Notifications',
          onPressed: () => Navigator.pushNamed(context, '/notifications'),
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
            'Good morning, Alex!',
            style: theme.textTheme.headlineLarge?.copyWith(
              fontSize: 28,
              fontWeight: FontWeight.w800,
            ),
          ),
          const SizedBox(height: AppSpacing.xxs),
          Text(
            'Here is an overview of your neighborhood.',
            style: theme.textTheme.bodyMedium,
          ),
          const SizedBox(height: AppSpacing.lg),
          TextField(
            readOnly: true,
            onTap: () => ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text(
                  'Search is a visual control in this static dashboard.',
                ),
              ),
            ),
            decoration: const InputDecoration(
              hintText: 'Search reports, locations, or topics...',
              prefixIcon: Icon(Icons.search_rounded),
            ),
          ),
          const SizedBox(height: AppSpacing.lg),
          Container(
            padding: const EdgeInsets.all(AppSpacing.lg),
            decoration: BoxDecoration(
              color: theme.colorScheme.primary,
              borderRadius: AppRadius.card,
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
                  'See an infrastructure issue?',
                  style: theme.textTheme.titleLarge?.copyWith(
                    color: Colors.white,
                    fontWeight: FontWeight.w800,
                  ),
                ),
                const SizedBox(height: AppSpacing.xs),
                Text(
                  'Submit a report and follow human-reviewed response updates.',
                  style: theme.textTheme.bodyMedium?.copyWith(
                    color: Colors.white.withValues(alpha: .88),
                  ),
                ),
                const SizedBox(height: AppSpacing.lg),
                FilledButton.icon(
                  onPressed: () => Navigator.pushNamed(context, '/reports/new'),
                  icon: const Icon(Icons.add_circle_outline_rounded),
                  label: const Text('Create a Report'),
                  style: FilledButton.styleFrom(
                    backgroundColor: Colors.white,
                    foregroundColor: theme.colorScheme.primary,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: AppSpacing.xxl),
          _MetricGrid(),
          const SizedBox(height: AppSpacing.xxl),
          Row(
            children: [
              Expanded(
                child: Text(
                  'Recent Reports',
                  style: theme.textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ),
              TextButton(
                onPressed: () =>
                    Navigator.pushNamed(context, '/reports/history'),
                child: const Text('View All'),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.sm),
          _RecentReportCard(
            icon: Icons.add_road_rounded,
            title: 'Pothole near A.B. Fernandez Ave.',
            detail: 'Reported 2 hours ago • Barangay Pantal',
            status: 'In progress',
            statusColor: AppColorsLight.alert,
            onTap: () => Navigator.pushNamed(context, '/reports/timeline'),
          ),
          const SizedBox(height: AppSpacing.sm),
          _RecentReportCard(
            icon: Icons.lightbulb_outline_rounded,
            title: 'Broken streetlight',
            detail: 'Reported yesterday • Barangay 5',
            status: 'Validated',
            statusColor: AppColorsLight.brandBase,
            onTap: () => Navigator.pushNamed(context, '/reports/timeline'),
          ),
          const SizedBox(height: AppSpacing.xxl),
          LunasButton(
            label: 'Track My Reports',
            expand: false,
            icon: Icons.assignment_outlined,
            onPressed: () => Navigator.pushNamed(context, '/reports/history'),
          ),
        ],
      ),
    );
  }
}

class _MetricGrid extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        const columns = 3;
        final width =
            (constraints.maxWidth - AppSpacing.sm * (columns - 1)) / columns;
        return Wrap(
          spacing: AppSpacing.sm,
          runSpacing: AppSpacing.sm,
          children: [
            SizedBox(
              width: width,
              child: const CitizenExtraMetricCard(
                label: 'Active',
                value: '3',
                icon: Icons.pending_actions_outlined,
                color: AppColorsLight.brandBase,
              ),
            ),
            SizedBox(
              width: width,
              child: const CitizenExtraMetricCard(
                label: 'Resolved',
                value: '12',
                icon: Icons.check_circle_outline_rounded,
                color: AppColorsLight.success,
              ),
            ),
            SizedBox(
              width: width,
              child: const CitizenExtraMetricCard(
                label: 'Pending',
                value: '1',
                icon: Icons.hourglass_empty_rounded,
                color: AppColorsLight.alert,
              ),
            ),
          ],
        );
      },
    );
  }
}

class _RecentReportCard extends StatelessWidget {
  const _RecentReportCard({
    required this.icon,
    required this.title,
    required this.detail,
    required this.status,
    required this.statusColor,
    required this.onTap,
  });

  final IconData icon;
  final String title;
  final String detail;
  final String status;
  final Color statusColor;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return LunasCard(
      onTap: onTap,
      padding: const EdgeInsets.all(AppSpacing.md),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              color: statusColor.withValues(alpha: .13),
              shape: BoxShape.circle,
            ),
            child: Icon(icon, color: statusColor),
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
                Text(detail, style: Theme.of(context).textTheme.bodySmall),
                const SizedBox(height: AppSpacing.sm),
                CitizenExtraStatusChip(label: status, color: statusColor),
              ],
            ),
          ),
          const SizedBox(width: AppSpacing.xs),
          Icon(
            Icons.chevron_right_rounded,
            color: Theme.of(context).colorScheme.onSurfaceVariant,
          ),
        ],
      ),
    );
  }
}
