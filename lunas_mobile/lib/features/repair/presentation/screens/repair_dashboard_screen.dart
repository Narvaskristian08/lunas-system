import 'package:flutter/material.dart';
import 'package:lunas_mobile/core/theme/app_colors.dart';
import 'package:lunas_mobile/core/theme/app_spacing.dart';
import 'package:lunas_mobile/core/widgets/lunas_card.dart';
import 'package:lunas_mobile/features/repair/presentation/screens/repair_routes.dart';
import 'package:lunas_mobile/features/repair/presentation/screens/repair_widgets.dart';

/// Landing view for assigned repair personnel.
class RepairDashboardScreen extends StatelessWidget {
  const RepairDashboardScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return RepairPage(
      appBar: RepairAppBar(
        actions: [
          IconButton(
            tooltip: 'Notifications',
            onPressed: () => Navigator.pushNamed(context, RepairRoutes.alerts),
            icon: const Badge(
              smallSize: 8,
              child: Icon(Icons.notifications_none_rounded),
            ),
          ),
          const Padding(
            padding: EdgeInsets.only(right: AppSpacing.md),
            child: CircleAvatar(
              radius: 16,
              backgroundColor: Color(0xFFDCE6FF),
              child: Text('RP'),
            ),
          ),
        ],
      ),
      selectedNavigationIndex: 0,
      floatingActionButton: FloatingActionButton(
        tooltip: 'View work orders',
        onPressed: () => Navigator.pushNamed(context, RepairRoutes.workOrders),
        child: const Icon(Icons.add_rounded),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(
            'Good morning, Ramon!',
            style: theme.textTheme.headlineLarge?.copyWith(
              fontSize: 28,
              fontWeight: FontWeight.w800,
            ),
          ),
          const SizedBox(height: AppSpacing.xxs),
          Text(
            'Here’s your repair overview for today.',
            style: theme.textTheme.bodyMedium,
          ),
          const SizedBox(height: AppSpacing.xl),
          _SlaRiskBanner(
            onNavigate: () => Navigator.pushNamed(context, RepairRoutes.map),
          ),
          const SizedBox(height: AppSpacing.xl),
          const _RepairMetrics(),
          const SizedBox(height: AppSpacing.md),
          LunasCard(
            padding: EdgeInsets.zero,
            child: Column(
              children: [
                const Padding(
                  padding: EdgeInsets.fromLTRB(
                    AppSpacing.md,
                    AppSpacing.md,
                    AppSpacing.md,
                    AppSpacing.sm,
                  ),
                  child: RepairPlaceholderImage(
                    label: 'Today’s repair area',
                    detail: 'Map preview is available in the app map.',
                    icon: Icons.map_outlined,
                    height: 112,
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.fromLTRB(
                    AppSpacing.md,
                    0,
                    AppSpacing.md,
                    AppSpacing.md,
                  ),
                  child: RepairPrimaryButton(
                    label: 'View Map',
                    icon: Icons.map_outlined,
                    onPressed: () =>
                        Navigator.pushNamed(context, RepairRoutes.map),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: AppSpacing.xxl),
          RepairSectionTitle(
            title: 'Priority work orders',
            actionLabel: 'View all',
            onAction: () =>
                Navigator.pushNamed(context, RepairRoutes.workOrders),
          ),
          const SizedBox(height: AppSpacing.sm),
          RepairWorkOrderCard(
            workOrderId: 'WO-2026-0142',
            title: 'Road pothole – A.B. Fernandez Ave.',
            location: 'Barangay IV',
            sla: 'SLA: 2h left',
            priority: 'High',
            priorityColor: AppColorsLight.critical,
            status: 'Assigned',
            statusColor: AppColorsLight.info,
            onTap: () =>
                Navigator.pushNamed(context, RepairRoutes.workOrderDetails),
          ),
          const SizedBox(height: AppSpacing.sm),
          RepairWorkOrderCard(
            workOrderId: 'WO-2026-0142',
            title: 'Traffic light malfunction',
            location: 'Pantal intersection',
            sla: 'SLA: 1d left',
            priority: 'Medium',
            priorityColor: AppColorsLight.alert,
            status: 'Accepted',
            statusColor: AppColorsLight.success,
            onTap: () =>
                Navigator.pushNamed(context, RepairRoutes.workOrderDetails),
          ),
          const SizedBox(height: AppSpacing.xxl),
          const RepairSectionTitle(title: 'Quick actions'),
          const SizedBox(height: AppSpacing.sm),
          _QuickActionsGrid(),
        ],
      ),
    );
  }
}

class _SlaRiskBanner extends StatelessWidget {
  const _SlaRiskBanner({required this.onNavigate});

  final VoidCallback onNavigate;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return LunasCard(
      color: AppColorsLight.critical.withValues(alpha: .10),
      padding: const EdgeInsets.all(AppSpacing.md),
      child: Container(
        decoration: const BoxDecoration(
          border: Border(left: BorderSide(color: AppColorsLight.critical, width: 4)),
        ),
        padding: const EdgeInsets.only(left: AppSpacing.sm),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Icon(
                  Icons.warning_amber_rounded,
                  color: AppColorsLight.critical,
                  size: 28,
                ),
                const SizedBox(width: AppSpacing.sm),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Critical: SLA breach risk',
                        style: theme.textTheme.titleMedium?.copyWith(
                          color: AppColorsLight.critical,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                      const SizedBox(height: AppSpacing.xxs),
                      Text(
                        'Drainage obstruction at Barangay Pantal is due in 2 hours.',
                        style: theme.textTheme.bodyMedium,
                      ),
                      const SizedBox(height: AppSpacing.xxs),
                      Text(
                        'WO-2026-0142',
                        style: theme.textTheme.bodySmall?.copyWith(
                          fontFamily: 'RobotoMono',
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: AppSpacing.md),
            Align(
              alignment: Alignment.centerRight,
              child: FilledButton.icon(
                onPressed: onNavigate,
                icon: const Icon(Icons.navigation_outlined, size: 18),
                label: const Text('Navigate now'),
                style: FilledButton.styleFrom(
                  backgroundColor: AppColorsLight.critical,
                  foregroundColor: Colors.white,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _RepairMetrics extends StatelessWidget {
  const _RepairMetrics();

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final columns = constraints.maxWidth >= 560 ? 3 : 2;
        final width =
            (constraints.maxWidth - (AppSpacing.sm * (columns - 1))) / columns;
        return Wrap(
          spacing: AppSpacing.sm,
          runSpacing: AppSpacing.sm,
          children: [
            SizedBox(
              width: width,
              child: const RepairMetricCard(
                label: 'Assigned',
                value: '4',
                icon: Icons.assignment_outlined,
                color: AppColorsLight.brandBase,
                description: 'Today’s total',
              ),
            ),
            SizedBox(
              width: width,
              child: const RepairMetricCard(
                label: 'In progress',
                value: '2',
                icon: Icons.timelapse_outlined,
                color: AppColorsLight.alert,
                description: 'Active now',
              ),
            ),
            SizedBox(
              width: width,
              child: const RepairMetricCard(
                label: 'Completed',
                value: '5',
                icon: Icons.check_circle_outline_rounded,
                color: AppColorsLight.success,
                description: 'Today',
              ),
            ),
          ],
        );
      },
    );
  }
}

class _QuickActionsGrid extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final actions = [
      (
        label: 'Tasks',
        icon: Icons.assignment_outlined,
        route: RepairRoutes.workOrders,
      ),
      (label: 'Navigate', icon: Icons.navigation_outlined, route: RepairRoutes.map),
      (
        label: 'Evidence',
        icon: Icons.add_a_photo_outlined,
        route: RepairRoutes.uploadEvidence,
      ),
      (
        label: 'History',
        icon: Icons.history_rounded,
        route: RepairRoutes.completed,
      ),
    ];
    return LayoutBuilder(
      builder: (context, constraints) {
        final width = (constraints.maxWidth - AppSpacing.sm) / 2;
        return Wrap(
          spacing: AppSpacing.sm,
          runSpacing: AppSpacing.sm,
          children: [
            for (final action in actions)
              SizedBox(
                width: width,
                child: LunasCard(
                  onTap: () => Navigator.pushNamed(context, action.route),
                  padding: const EdgeInsets.symmetric(
                    horizontal: AppSpacing.md,
                    vertical: AppSpacing.lg,
                  ),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        action.icon,
                        color: Theme.of(context).colorScheme.primary,
                        size: 25,
                      ),
                      const SizedBox(height: AppSpacing.xs),
                      Text(
                        action.label,
                        style: Theme.of(context).textTheme.labelLarge?.copyWith(
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
          ],
        );
      },
    );
  }
}
