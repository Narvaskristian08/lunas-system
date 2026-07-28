import 'package:flutter/material.dart';
import 'package:lunas_mobile/core/theme/app_colors.dart';
import 'package:lunas_mobile/core/theme/app_spacing.dart';
import 'package:lunas_mobile/core/widgets/lunas_card.dart';
import 'package:lunas_mobile/features/engineering/presentation/screens/engineering_routes.dart';
import 'package:lunas_mobile/features/engineering/presentation/screens/engineering_widgets.dart';

/// Static engineering workspace based on the Stitch engineering dashboard.
class EngineeringDashboardScreen extends StatelessWidget {
  const EngineeringDashboardScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return EngineeringPage(
      title: 'LUNAS Engineering',
      subtitle: 'Dagupan infrastructure oversight',
      showBackButton: true,
      actions: [
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
            'Engineering dashboard',
            style: Theme.of(context).textTheme.headlineLarge?.copyWith(
              fontWeight: FontWeight.w800,
            ),
          ),
          const SizedBox(height: AppSpacing.xs),
          Text(
            'City-wide incident and SLA overview.',
            style: Theme.of(context).textTheme.bodyMedium,
          ),
          const SizedBox(height: AppSpacing.lg),
          ElevatedButton.icon(
            onPressed: () => Navigator.pushNamed(
              context,
              EngineeringRoutes.incidents,
            ),
            icon: const Icon(Icons.add_rounded),
            label: const Text('Create work order'),
          ),
          const SizedBox(height: AppSpacing.lg),
          const Divider(),
          const SizedBox(height: AppSpacing.lg),
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
                    child: const EngineeringMetricCard(
                      label: 'Active',
                      value: '142',
                      icon: Icons.warning_amber_rounded,
                      color: AppColorsLight.brandBase,
                    ),
                  ),
                  SizedBox(
                    width: width,
                    child: const EngineeringMetricCard(
                      label: 'Critical',
                      value: '18',
                      icon: Icons.error_outline_rounded,
                      color: AppColorsLight.critical,
                      emphasized: true,
                    ),
                  ),
                  SizedBox(
                    width: width,
                    child: const EngineeringMetricCard(
                      label: 'Overdue',
                      value: '7',
                      icon: Icons.schedule_outlined,
                      color: AppColorsLight.alert,
                    ),
                  ),
                  SizedBox(
                    width: width,
                    child: const EngineeringMetricCard(
                      label: 'Completed today',
                      value: '24',
                      icon: Icons.check_circle_outline_rounded,
                      color: AppColorsLight.success,
                    ),
                  ),
                ],
              );
            },
          ),
          const SizedBox(height: AppSpacing.xxl),
          EngineeringSectionHeading(
            title: 'High-priority incidents',
            trailing: TextButton(
              onPressed: () => Navigator.pushNamed(
                context,
                EngineeringRoutes.incidents,
              ),
              child: const Text('View all'),
            ),
          ),
          const SizedBox(height: AppSpacing.sm),
          _PriorityIncidentCard(
            title: 'Water main rupture — Sector 7',
            description:
                'Water pressure is dropping rapidly. Immediate field dispatch is required.',
            address: 'Barangay Pantal, Dagupan',
            elapsed: '15m ago',
            severity: 'Critical',
            icon: Icons.water_drop_outlined,
            color: AppColorsLight.critical,
            onAssign: () => Navigator.pushNamed(
              context,
              EngineeringRoutes.utilityAssignment,
            ),
          ),
          const SizedBox(height: AppSpacing.sm),
          _PriorityIncidentCard(
            title: 'Substation 4 offline',
            description:
                'Reported outage is affecting residential blocks near the public market.',
            address: 'Downtown service area',
            elapsed: '42m ago',
            severity: 'High',
            icon: Icons.electrical_services_outlined,
            color: AppColorsLight.alert,
            onAssign: () => Navigator.pushNamed(
              context,
              EngineeringRoutes.utilityAssignment,
            ),
          ),
          const SizedBox(height: AppSpacing.xxl),
          LunasCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        'SLA compliance',
                        style: Theme.of(context).textTheme.titleLarge?.copyWith(
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                    ),
                    IconButton(
                      tooltip: 'Open SLA dashboard',
                      onPressed: () => Navigator.pushNamed(
                        context,
                        EngineeringRoutes.sla,
                      ),
                      icon: const Icon(Icons.more_horiz_rounded),
                    ),
                  ],
                ),
                const SizedBox(height: AppSpacing.sm),
                Row(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text(
                      '94%',
                      style: Theme.of(context).textTheme.headlineLarge?.copyWith(
                        color: AppColorsLight.brandBase,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                    const SizedBox(width: AppSpacing.xs),
                    Padding(
                      padding: const EdgeInsets.only(bottom: AppSpacing.xs),
                      child: Text(
                        '↑ 2.1%',
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: AppColorsLight.success,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: AppSpacing.xxs),
                Text(
                  'Overall compliance in the last 30 days',
                  style: Theme.of(context).textTheme.bodySmall,
                ),
                const SizedBox(height: AppSpacing.lg),
                const _SlaTrend(),
              ],
            ),
          ),
          const SizedBox(height: AppSpacing.xxl),
          const EngineeringSectionHeading(title: 'Quick actions'),
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
                    child: _QuickActionCard(
                      icon: Icons.list_alt_outlined,
                      label: 'View incidents',
                      color: AppColorsLight.brandBase,
                      onTap: () => Navigator.pushNamed(
                        context,
                        EngineeringRoutes.incidents,
                      ),
                    ),
                  ),
                  SizedBox(
                    width: width,
                    child: _QuickActionCard(
                      icon: Icons.handshake_outlined,
                      label: 'Assign provider',
                      color: AppColorsLight.success,
                      onTap: () => Navigator.pushNamed(
                        context,
                        EngineeringRoutes.utilityAssignment,
                      ),
                    ),
                  ),
                  SizedBox(
                    width: width,
                    child: _QuickActionCard(
                      icon: Icons.timer_outlined,
                      label: 'SLA dashboard',
                      color: AppColorsLight.alert,
                      onTap: () => Navigator.pushNamed(
                        context,
                        EngineeringRoutes.sla,
                      ),
                    ),
                  ),
                  SizedBox(
                    width: width,
                    child: _QuickActionCard(
                      icon: Icons.verified_user_outlined,
                      label: 'Verify repairs',
                      color: AppColorsLight.brandBase,
                      onTap: () => Navigator.pushNamed(
                        context,
                        EngineeringRoutes.verifyRepair,
                      ),
                    ),
                  ),
                ],
              );
            },
          ),
        ],
      ),
    );
  }
}

class _PriorityIncidentCard extends StatelessWidget {
  const _PriorityIncidentCard({
    required this.title,
    required this.description,
    required this.address,
    required this.elapsed,
    required this.severity,
    required this.icon,
    required this.color,
    required this.onAssign,
  });

  final String title;
  final String description;
  final String address;
  final String elapsed;
  final String severity;
  final IconData icon;
  final Color color;
  final VoidCallback onAssign;

  @override
  Widget build(BuildContext context) {
    return LunasCard(
      child: Row(
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
                Text(description, style: Theme.of(context).textTheme.bodySmall),
                const SizedBox(height: AppSpacing.sm),
                Wrap(
                  spacing: AppSpacing.xs,
                  runSpacing: AppSpacing.xs,
                  crossAxisAlignment: WrapCrossAlignment.center,
                  children: [
                    EngineeringBadge(label: severity, color: color),
                    _Metadata(icon: Icons.schedule_outlined, value: elapsed),
                    _Metadata(icon: Icons.location_on_outlined, value: address),
                  ],
                ),
                const SizedBox(height: AppSpacing.sm),
                OutlinedButton(
                  onPressed: onAssign,
                  child: const Text('Assign'),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _Metadata extends StatelessWidget {
  const _Metadata({required this.icon, required this.value});

  final IconData icon;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 15, color: Theme.of(context).colorScheme.onSurfaceVariant),
        const SizedBox(width: AppSpacing.xxs),
        Text(value, style: Theme.of(context).textTheme.bodySmall),
      ],
    );
  }
}

class _QuickActionCard extends StatelessWidget {
  const _QuickActionCard({
    required this.icon,
    required this.label,
    required this.color,
    required this.onTap,
  });

  final IconData icon;
  final String label;
  final Color color;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return LunasCard(
      onTap: onTap,
      color: Theme.of(context).colorScheme.primaryContainer.withValues(alpha: .55),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 46,
            height: 46,
            decoration: BoxDecoration(color: color.withValues(alpha: .14), shape: BoxShape.circle),
            child: Icon(icon, color: color),
          ),
          const SizedBox(height: AppSpacing.md),
          Text(
            label,
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.w800,
            ),
          ),
        ],
      ),
    );
  }
}

class _SlaTrend extends StatelessWidget {
  const _SlaTrend();

  @override
  Widget build(BuildContext context) {
    const values = [0.36, 0.42, 0.34, 0.66, 0.51, 0.69, 0.48, 0.75];
    return SizedBox(
      height: 72,
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.end,
        children: values
            .map(
              (value) => Expanded(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 2),
                  child: Container(
                    height: 14 + value * 52,
                    decoration: BoxDecoration(
                      color: AppColorsLight.brandBase.withValues(alpha: .35 + value * .55),
                      borderRadius: const BorderRadius.vertical(top: Radius.circular(4)),
                    ),
                  ),
                ),
              ),
            )
            .toList(),
      ),
    );
  }
}
