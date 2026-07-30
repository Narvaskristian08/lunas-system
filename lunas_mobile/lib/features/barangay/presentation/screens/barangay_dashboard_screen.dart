import 'package:flutter/material.dart';
import 'package:lunas_mobile/core/theme/app_colors.dart';
import 'package:lunas_mobile/core/theme/app_spacing.dart';
import 'package:lunas_mobile/core/widgets/lunas_card.dart';
import 'package:lunas_mobile/features/barangay/presentation/screens/barangay_routes.dart';
import 'package:lunas_mobile/features/barangay/presentation/screens/barangay_widgets.dart';

/// Static Barangay official dashboard inspired by the Stitch export.
class BarangayDashboardScreen extends StatelessWidget {
  const BarangayDashboardScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return BarangayPage(
      title: 'LUNAS Barangay',
      subtitle: 'Local response workspace',
      actions: [
        IconButton(
          tooltip: 'Search local incidents',
          onPressed: () => showBarangayNotice(
            context,
            'Search will be connected to the verified incident queue.',
          ),
          icon: const Icon(Icons.search_rounded),
        ),
        IconButton(
          tooltip: 'Notifications',
          onPressed: () => Navigator.pushNamed(context, '/notifications'),
          icon: const Icon(Icons.notifications_none_rounded),
        ),
        const SizedBox(width: AppSpacing.sm),
      ],
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(
            'Good morning, Kagawad!',
            style: Theme.of(
              context,
            ).textTheme.headlineLarge?.copyWith(fontWeight: FontWeight.w800),
          ),
          const SizedBox(height: AppSpacing.xs),
          Text(
            'Here is your Barangay Pantal overview for today.',
            style: Theme.of(context).textTheme.bodyMedium,
          ),
          const SizedBox(height: AppSpacing.xxl),
          const BarangaySectionHeading(title: 'Today’s summary'),
          const SizedBox(height: AppSpacing.sm),
          LayoutBuilder(
            builder: (context, constraints) {
              final columns = constraints.maxWidth >= 640 ? 4 : 2;
              final width =
                  (constraints.maxWidth - (columns - 1) * AppSpacing.sm) /
                  columns;
              return Wrap(
                spacing: AppSpacing.sm,
                runSpacing: AppSpacing.sm,
                children: [
                  SizedBox(
                    width: width,
                    child: const BarangayMetricCard(
                      label: 'Pending validation',
                      value: '12',
                      icon: Icons.assignment_late_outlined,
                      color: AppColorsLight.alert,
                      emphasized: true,
                    ),
                  ),
                  SizedBox(
                    width: width,
                    child: const BarangayMetricCard(
                      label: 'Active incidents',
                      value: '28',
                      icon: Icons.warning_amber_rounded,
                      color: AppColorsLight.brandBase,
                    ),
                  ),
                  SizedBox(
                    width: width,
                    child: const BarangayMetricCard(
                      label: 'Overdue',
                      value: '3',
                      icon: Icons.schedule_outlined,
                      color: AppColorsLight.critical,
                      emphasized: true,
                    ),
                  ),
                  SizedBox(
                    width: width,
                    child: const BarangayMetricCard(
                      label: 'Completed today',
                      value: '9',
                      icon: Icons.check_circle_outline_rounded,
                      color: AppColorsLight.success,
                    ),
                  ),
                ],
              );
            },
          ),
          const SizedBox(height: AppSpacing.xxl),
          LunasCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Service level agreement',
                  style: Theme.of(
                    context,
                  ).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w800),
                ),
                const SizedBox(height: AppSpacing.xs),
                Text(
                  'Overall compliance for incident resolution within 24 hours.',
                  style: Theme.of(context).textTheme.bodySmall,
                ),
                const SizedBox(height: AppSpacing.lg),
                Row(
                  children: [
                    Text(
                      '85%',
                      style: Theme.of(context).textTheme.displayMedium
                          ?.copyWith(
                            color: AppColorsLight.success,
                            fontWeight: FontWeight.w800,
                          ),
                    ),
                    const SizedBox(width: AppSpacing.sm),
                    const BarangayBadge(
                      label: 'On track',
                      color: AppColorsLight.success,
                      icon: Icons.trending_up_rounded,
                    ),
                  ],
                ),
                const SizedBox(height: AppSpacing.md),
                const BarangayProgressBar(
                  value: .85,
                  color: AppColorsLight.success,
                  label: '+2% from last week',
                ),
              ],
            ),
          ),
          const SizedBox(height: AppSpacing.xxl),
          BarangaySectionHeading(
            title: 'High-priority incidents',
            trailing: TextButton(
              onPressed: () =>
                  Navigator.pushNamed(context, BarangayRoutes.incidentDetails),
              child: const Text('View all'),
            ),
          ),
          const SizedBox(height: AppSpacing.sm),
          _PriorityIncident(
            icon: Icons.water_drop_outlined,
            title: 'Water main leak',
            severity: 'Critical',
            detail: 'Zone 3, Rizal Street · reported 2 hours ago',
            color: AppColorsLight.critical,
            onTap: () =>
                Navigator.pushNamed(context, BarangayRoutes.incidentDetails),
          ),
          const SizedBox(height: AppSpacing.sm),
          _PriorityIncident(
            icon: Icons.construction_outlined,
            title: 'Road pothole',
            severity: 'High',
            detail: 'Zone 1, Mabini Avenue · reported 5 hours ago',
            color: AppColorsLight.alert,
            onTap: () =>
                Navigator.pushNamed(context, BarangayRoutes.incidentDetails),
          ),
          const SizedBox(height: AppSpacing.xxl),
          const BarangaySectionHeading(title: 'Quick actions'),
          const SizedBox(height: AppSpacing.sm),
          LayoutBuilder(
            builder: (context, constraints) {
              final width = constraints.maxWidth >= 560
                  ? (constraints.maxWidth - AppSpacing.sm) / 2
                  : constraints.maxWidth;
              return Wrap(
                spacing: AppSpacing.sm,
                runSpacing: AppSpacing.sm,
                children: [
                  SizedBox(
                    width: width,
                    child: _QuickAction(
                      icon: Icons.fact_check_outlined,
                      title: 'Validate reports',
                      detail: 'Review new citizen submissions.',
                      color: AppColorsLight.brandBase,
                      onTap: () =>
                          Navigator.pushNamed(context, '/official/incoming'),
                    ),
                  ),
                  SizedBox(
                    width: width,
                    child: _QuickAction(
                      icon: Icons.person_add_alt_1_outlined,
                      title: 'Assign personnel',
                      detail: 'Dispatch teams to active issues.',
                      color: AppColorsLight.success,
                      onTap: () =>
                          Navigator.pushNamed(context, '/official/assign'),
                    ),
                  ),
                  SizedBox(
                    width: width,
                    child: _QuickAction(
                      icon: Icons.monitor_heart_outlined,
                      title: 'Monitor incidents',
                      detail: 'Review local operational insights.',
                      color: AppColorsLight.alert,
                      onTap: () => Navigator.pushNamed(
                        context,
                        BarangayRoutes.statistics,
                      ),
                    ),
                  ),
                  SizedBox(
                    width: width,
                    child: _QuickAction(
                      icon: Icons.verified_outlined,
                      title: 'Verify repairs',
                      detail: 'Approve completed work orders.',
                      color: AppColorsLight.brandBase,
                      onTap: () =>
                          Navigator.pushNamed(context, '/official/verify'),
                    ),
                  ),
                ],
              );
            },
          ),
          const SizedBox(height: AppSpacing.xl),
          LunasCard(
            color: Theme.of(
              context,
            ).colorScheme.primaryContainer.withValues(alpha: .40),
            child: const BarangayInfoRow(
              icon: Icons.verified_user_outlined,
              label: 'Approval safeguard',
              value:
                  'Barangay officials review and confirm actions; AI suggestions do not automatically validate, route, or close an incident.',
            ),
          ),
        ],
      ),
    );
  }
}

class _PriorityIncident extends StatelessWidget {
  const _PriorityIncident({
    required this.icon,
    required this.title,
    required this.severity,
    required this.detail,
    required this.color,
    required this.onTap,
  });

  final IconData icon;
  final String title;
  final String severity;
  final String detail;
  final Color color;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return LunasCard(
      onTap: onTap,
      child: Row(
        children: [
          Container(
            width: 46,
            height: 46,
            decoration: BoxDecoration(
              color: color.withValues(alpha: .14),
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
                Text(detail, style: Theme.of(context).textTheme.bodySmall),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              BarangayBadge(label: severity, color: color),
              const SizedBox(height: AppSpacing.xs),
              const Icon(Icons.chevron_right_rounded),
            ],
          ),
        ],
      ),
    );
  }
}

class _QuickAction extends StatelessWidget {
  const _QuickAction({
    required this.icon,
    required this.title,
    required this.detail,
    required this.color,
    required this.onTap,
  });

  final IconData icon;
  final String title;
  final String detail;
  final Color color;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return LunasCard(
      onTap: onTap,
      color: Theme.of(
        context,
      ).colorScheme.primaryContainer.withValues(alpha: .48),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 46,
            height: 46,
            decoration: BoxDecoration(
              color: color.withValues(alpha: .14),
              shape: BoxShape.circle,
            ),
            child: Icon(icon, color: color),
          ),
          const SizedBox(height: AppSpacing.md),
          Text(
            title,
            style: Theme.of(
              context,
            ).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w800),
          ),
          const SizedBox(height: AppSpacing.xxs),
          Text(detail, style: Theme.of(context).textTheme.bodySmall),
        ],
      ),
    );
  }
}
