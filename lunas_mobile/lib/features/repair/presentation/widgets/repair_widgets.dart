import 'package:lunas_mobile/core/widgets/lunas_navigation_bar.dart';
import 'package:lunas_mobile/features/reporting/presentation/widgets/reporting_widgets.dart';
import 'package:flutter/material.dart';
import 'package:lunas_mobile/core/utils/display_labels.dart';
import 'package:go_router/go_router.dart';
import 'package:lunas_mobile/core/theme/app_colors.dart';
import 'package:lunas_mobile/core/theme/app_radius.dart';
import 'package:lunas_mobile/core/theme/app_spacing.dart';
import 'package:lunas_mobile/core/theme/text_styles.dart';
import 'package:lunas_mobile/core/widgets/lunas_card.dart';
import 'package:lunas_mobile/core/widgets/lunas_app_bar.dart';
import 'package:lunas_mobile/core/widgets/lunas_state_view.dart';
import 'package:lunas_mobile/features/repair/data/models/repair_models.dart';
import 'package:lunas_mobile/features/reporting/data/models/category_option.dart';
import 'package:lunas_mobile/features/repair/routes/repair_routes.dart';

/// Shared components for the authenticated Utility Personnel / Committee Staff workspace.
/// Data and workflow actions are supplied by the API-backed inspection screens.
class RepairAppBar extends StatelessWidget implements PreferredSizeWidget {
  const RepairAppBar({
    this.title = 'LUNAS Repair',
    this.subtitle,
    this.showBackButton = false,
    this.onBack,
    this.actions,
    super.key,
  });

  final String title;
  final String? subtitle;
  final bool showBackButton;
  final VoidCallback? onBack;
  final List<Widget>? actions;

  @override
  Size get preferredSize => Size.fromHeight(subtitle == null ? 72 : 84);

  @override
  Widget build(BuildContext context) => LunasAppBar(
    title: title,
    subtitle: subtitle,
    showBackButton: showBackButton,
    onBack: onBack,
    actions: actions,
  );
}

class RepairPage extends StatelessWidget {
  const RepairPage({
    required this.child,
    this.appBar,
    this.backgroundColor,
    this.selectedNavigationIndex,
    this.notificationUnreadCount = 0,
    this.bottomActionBar,
    this.floatingActionButton,
    this.fillAvailableHeight = false,
    this.padding = const EdgeInsets.fromLTRB(
      AppSpacing.xl,
      AppSpacing.md,
      AppSpacing.xl,
      AppSpacing.xxl,
    ),
    super.key,
  });

  final Widget child;
  final Color? backgroundColor;
  final PreferredSizeWidget? appBar;
  final int? selectedNavigationIndex;
  final int notificationUnreadCount;
  final Widget? bottomActionBar;
  final Widget? floatingActionButton;
  final bool fillAvailableHeight;
  final EdgeInsetsGeometry padding;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: backgroundColor,
      appBar: appBar,
      body: SafeArea(
        top: false,
        child: LayoutBuilder(
          builder: (context, constraints) {
            final horizontalPadding = constraints.maxWidth < 360
                ? AppSpacing.md
                : AppSpacing.xl;
            final resolvedPadding = padding.resolve(Directionality.of(context));
            return SingleChildScrollView(
              padding: EdgeInsets.fromLTRB(
                horizontalPadding,
                resolvedPadding.top,
                horizontalPadding,
                resolvedPadding.bottom,
              ),
              child: Align(
                alignment: Alignment.topCenter,
                child: ConstrainedBox(
                  constraints: BoxConstraints(
                    maxWidth: 820,
                    minHeight: (fillAvailableHeight || child is LunasStateView)
                        ? (constraints.maxHeight - resolvedPadding.vertical)
                              .clamp(0.0, double.infinity)
                        : 0,
                  ),
                  child: (fillAvailableHeight || child is LunasStateView)
                      ? IntrinsicHeight(child: child)
                      : child,
                ),
              ),
            );
          },
        ),
      ),
      floatingActionButton: floatingActionButton,
      bottomNavigationBar: bottomActionBar != null
          ? ColoredBox(
              color: Theme.of(context).colorScheme.surface,
              child: bottomActionBar!,
            )
          : (selectedNavigationIndex == null
                ? null
                : RepairBottomNavigation(
                    selectedIndex: selectedNavigationIndex!,
                    notificationUnreadCount: notificationUnreadCount,
                  )),
    );
  }
}

class RepairBottomNavigation extends StatelessWidget {
  const RepairBottomNavigation({
    required this.selectedIndex,
    this.notificationUnreadCount = 0,
    super.key,
  });

  final int selectedIndex;
  final int notificationUnreadCount;

  // Keep this list aligned with the destinations below. Committee Staff has
  // no camera destination; photo capture remains available only inside the
  // authorized work-verification evidence flow.
  static const _routes = <String>[
    RepairRoutes.dashboard,
    RepairRoutes.workOrders,
    RepairRoutes.notifications,
    RepairRoutes.profile,
  ];

  Widget _notificationIcon(IconData icon) {
    final child = Icon(icon, size: 22);
    if (notificationUnreadCount <= 0) return child;
    return Badge(
      label: Text(
        notificationUnreadCount > 99 ? '99+' : '$notificationUnreadCount',
      ),
      child: child,
    );
  }

  @override
  Widget build(BuildContext context) {
    return LunasNavigationBar(
      selectedIndex: selectedIndex,
      onDestinationSelected: (index) {
        if (index == selectedIndex) return;
        if (index < 0 || index >= _routes.length) return;
        context.go(_routes[index]);
      },
      destinations: [
        const NavigationDestination(
          icon: Icon(Icons.home_outlined, size: 22),
          selectedIcon: Icon(Icons.home_rounded, size: 22),
          label: 'Home',
        ),
        const NavigationDestination(
          icon: Icon(Icons.assignment_outlined, size: 22),
          selectedIcon: Icon(Icons.assignment_rounded, size: 22),
          label: 'Work Verification',
        ),
        NavigationDestination(
          icon: _notificationIcon(Icons.notifications_outlined),
          selectedIcon: _notificationIcon(Icons.notifications_rounded),
          label: 'Notifications',
        ),
        const NavigationDestination(
          icon: Icon(Icons.person_outline_rounded, size: 22),
          selectedIcon: Icon(Icons.person_rounded, size: 22),
          label: 'Profile',
        ),
      ],
    );
  }
}

class RepairSectionTitle extends StatelessWidget {
  const RepairSectionTitle({
    required this.title,
    this.actionLabel,
    this.onAction,
    super.key,
  });

  final String title;
  final String? actionLabel;
  final VoidCallback? onAction;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Row(
      children: [
        Expanded(
          child: Text(
            title,
            style: theme.textTheme.titleLarge?.copyWith(
              fontWeight: FontWeight.w700,
            ),
          ),
        ),
        if (actionLabel != null)
          TextButton(onPressed: onAction, child: Text(actionLabel!)),
      ],
    );
  }
}

Color repairWorkOrderStatusColor(
  BuildContext context,
  RepairWorkOrderStatus status,
) => switch (status) {
  RepairWorkOrderStatus.reworkRequired => AppColorsLight.alert,
  RepairWorkOrderStatus.completed ||
  RepairWorkOrderStatus.cityCorrectionRequired ||
  RepairWorkOrderStatus.pending => AppColorsLight.alert,
  RepairWorkOrderStatus.verified => AppColorsLight.success,
  RepairWorkOrderStatus.unknown => Theme.of(
    context,
  ).colorScheme.onSurfaceVariant,
  _ => Theme.of(context).colorScheme.primary,
};

class RepairStatusChip extends StatelessWidget {
  const RepairStatusChip({
    required this.label,
    required this.color,
    this.icon,
    super.key,
  });

  final String label;
  final Color color;
  final IconData? icon;

  @override
  Widget build(BuildContext context) {
    return Container(
      constraints: const BoxConstraints(minHeight: 32),
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.sm,
        vertical: AppSpacing.xs,
      ),
      decoration: BoxDecoration(
        color: color.withValues(alpha: .12),
        borderRadius: BorderRadius.circular(AppRadius.pill),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          if (icon != null) ...[
            Icon(icon, size: 15, color: color),
            const SizedBox(width: AppSpacing.xs),
          ],
          Flexible(
            child: Text(
              formatRepairLabel(label),
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.labelSmall?.copyWith(
                color: color,
                fontWeight: FontWeight.w700,
                letterSpacing: .2,
                height: 1.2,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class RepairMetricCard extends StatelessWidget {
  const RepairMetricCard({
    required this.label,
    required this.value,
    required this.icon,
    required this.color,
    this.onTap,
    super.key,
  });

  final String label;
  final String value;
  final IconData icon;
  final Color color;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return LunasCard(
      onTap: onTap,
      padding: const EdgeInsets.all(AppSpacing.md),
      child: Container(
        decoration: BoxDecoration(
          border: Border(left: BorderSide(color: color, width: 3)),
        ),
        padding: const EdgeInsets.only(left: AppSpacing.sm),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(
                    label,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: theme.textTheme.bodyMedium?.copyWith(height: 1.4),
                  ),
                ),
                const SizedBox(width: AppSpacing.xs),
                Icon(icon, color: color, size: 20),
              ],
            ),
            const SizedBox(height: AppSpacing.md),
            Text(
              value,
              style: theme.textTheme.displayMedium?.copyWith(
                color: color,
                fontSize: 32,
                fontWeight: FontWeight.w700,
                height: 1.2,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class RepairWorkOrderCard extends StatelessWidget {
  const RepairWorkOrderCard({
    required this.workOrderId,
    required this.title,
    required this.location,
    required this.sla,
    required this.priority,
    required this.priorityColor,
    required this.status,
    required this.statusColor,
    required this.onTap,
    super.key,
  });

  final String workOrderId;
  final String title;
  final String location;
  final String sla;
  final String priority;
  final Color priorityColor;
  final String status;
  final Color statusColor;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return LunasCard(
      onTap: onTap,
      padding: EdgeInsets.zero,
      child: ClipRRect(
        borderRadius: AppRadius.card,
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Container(width: 4, color: priorityColor),
            Expanded(
              child: Padding(
                padding: const EdgeInsets.all(AppSpacing.md),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Expanded(
                          child: Text(
                            workOrderId,
                            style: AppTextStyles.technicalHash.copyWith(
                              color: theme.colorScheme.onSurfaceVariant,
                            ),
                          ),
                        ),
                        RepairStatusChip(
                          label: priority,
                          color: priorityColor,
                          icon: Icons.priority_high_rounded,
                        ),
                      ],
                    ),
                    const SizedBox(height: AppSpacing.xs),
                    Text(
                      title,
                      style: theme.textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const SizedBox(height: AppSpacing.sm),
                    Wrap(
                      spacing: AppSpacing.lg,
                      runSpacing: AppSpacing.xs,
                      children: [
                        _CompactDetail(
                          icon: Icons.location_on_outlined,
                          label: location,
                        ),
                        _CompactDetail(
                          icon: Icons.timer_outlined,
                          label: sla,
                          color: sla.contains('2h')
                              ? AppColorsLight.critical
                              : null,
                        ),
                      ],
                    ),
                    const Padding(
                      padding: EdgeInsets.symmetric(vertical: AppSpacing.sm),
                      child: Divider(),
                    ),
                    Row(
                      children: [
                        RepairStatusChip(label: status, color: statusColor),
                        const Spacer(),
                        TextButton(
                          onPressed: onTap,
                          child: const Text('View Details'),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Server-backed work-order card used in the Repair Personnel workspace. It accepts
/// only a parsed API model, keeping dashboard/list screens free of fixtures.
class LiveRepairWorkOrderCard extends StatelessWidget {
  const LiveRepairWorkOrderCard({
    required this.workOrder,
    required this.onTap,
    super.key,
  });

  final RepairWorkOrder workOrder;
  final VoidCallback onTap;

  Color _priorityColor(BuildContext context) => switch (workOrder.priority) {
    'critical' => AppColorsLight.critical,
    'high' => AppColorsLight.alert,
    'medium' => AppColorsLight.info,
    _ => Theme.of(context).colorScheme.primary,
  };

  String _slaLabel() {
    if (workOrder.sla.isOverdue) return 'Overdue';
    if (workOrder.sla.isApproaching) return 'Approaching Deadline';
    if (workOrder.sla.timeRemaining != null) {
      return '${workOrder.sla.timeRemaining} remaining';
    }
    if (workOrder.sla.deadline != null) {
      final deadline = workOrder.sla.deadline!;
      final hour = deadline.hour == 0 || deadline.hour == 12
          ? 12
          : deadline.hour % 12;
      final period = deadline.hour >= 12 ? 'PM' : 'AM';
      return 'Due ${deadline.month}/${deadline.day}, $hour:${deadline.minute.toString().padLeft(2, '0')} $period';
    }
    return 'Deadline unavailable';
  }

  @override
  Widget build(BuildContext context) {
    final priorityColor = _priorityColor(context);
    final statusColor = repairWorkOrderStatusColor(context, workOrder.status);
    final slaColor = workOrder.sla.isOverdue
        ? AppColorsLight.critical
        : workOrder.sla.isApproaching
        ? AppColorsLight.alert
        : null;
    final theme = Theme.of(context);
    return LunasCard(
      onTap: onTap,
      padding: const EdgeInsets.all(AppSpacing.xl),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              Icon(
                reportCategoryIcon(workOrder.category),
                size: 24,
                color: theme.colorScheme.primary,
              ),
              const SizedBox(width: AppSpacing.sm),
              Expanded(
                child: Text(
                  categoryFromCode(workOrder.category).label,
                  style: theme.textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
              const SizedBox(width: AppSpacing.sm),
              RepairStatusChip(
                label: workOrder.priority ?? 'Priority unavailable',
                color: priorityColor,
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.sm),
          Text(
            workOrder.orderNumber,
            style: AppTextStyles.technicalHash.copyWith(
              color: theme.colorScheme.onSurfaceVariant,
            ),
          ),
          const SizedBox(height: AppSpacing.lg),
          _CompactDetail(
            icon: Icons.location_on_outlined,
            label:
                [workOrder.location.barangay, workOrder.location.city]
                    .whereType<String>()
                    .where((part) => part.trim().isNotEmpty)
                    .join(', ')
                    .isNotEmpty
                ? [workOrder.location.barangay, workOrder.location.city]
                      .whereType<String>()
                      .where((part) => part.trim().isNotEmpty)
                      .join(', ')
                : workOrder.location.displayAddress,
          ),
          const SizedBox(height: AppSpacing.sm),
          _CompactDetail(
            icon: Icons.timer_outlined,
            label: _slaLabel(),
            color: slaColor,
          ),
          const SizedBox(height: AppSpacing.lg),
          const Divider(height: 1),
          const SizedBox(height: AppSpacing.md),
          Row(
            children: [
              Expanded(
                child: Align(
                  alignment: Alignment.centerLeft,
                  child: RepairStatusChip(
                    label: workOrder.isPendingAcceptance
                        ? 'Pending Acceptance'
                        : workOrder.status.label,
                    color: statusColor,
                    icon: Icons.work_outline_rounded,
                  ),
                ),
              ),
              const SizedBox(width: AppSpacing.sm),
              Icon(
                Icons.chevron_right_rounded,
                size: 22,
                color: theme.colorScheme.primary,
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _CompactDetail extends StatelessWidget {
  const _CompactDetail({required this.icon, required this.label, this.color});

  final IconData icon;
  final String label;
  final Color? color;

  @override
  Widget build(BuildContext context) {
    final resolvedColor =
        color ?? Theme.of(context).colorScheme.onSurfaceVariant;
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 17, color: resolvedColor),
        const SizedBox(width: AppSpacing.xs),
        Flexible(
          child: Text(
            label,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
              color: resolvedColor,
              fontWeight: color == null ? FontWeight.w500 : FontWeight.w700,
            ),
          ),
        ),
      ],
    );
  }
}

class RepairInfoRow extends StatelessWidget {
  const RepairInfoRow({
    required this.label,
    required this.value,
    this.icon,
    this.valueColor,
    super.key,
  });

  final String label;
  final String value;
  final IconData? icon;
  final Color? valueColor;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (icon != null) ...[
          Icon(icon, size: 20, color: theme.colorScheme.primary),
          const SizedBox(width: AppSpacing.sm),
        ],
        Expanded(child: Text(label, style: theme.textTheme.bodyMedium)),
        const SizedBox(width: AppSpacing.md),
        Flexible(
          child: Text(
            value,
            textAlign: TextAlign.end,
            style: theme.textTheme.titleMedium?.copyWith(
              color: valueColor,
              fontWeight: FontWeight.w700,
            ),
          ),
        ),
      ],
    );
  }
}

class RepairPrimaryButton extends StatelessWidget {
  const RepairPrimaryButton({
    required this.label,
    required this.onPressed,
    this.icon,
    super.key,
  });

  final String label;
  final VoidCallback? onPressed;
  final IconData? icon;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: double.infinity,
      height: 52,
      child: FilledButton.icon(
        onPressed: onPressed,
        icon: icon == null ? const SizedBox.shrink() : Icon(icon),
        label: Text(label),
        style: FilledButton.styleFrom(
          backgroundColor: Theme.of(context).colorScheme.primary,
          foregroundColor: Theme.of(context).colorScheme.onPrimary,
          textStyle: Theme.of(
            context,
          ).textTheme.labelLarge?.copyWith(fontWeight: FontWeight.w700),
          shape: RoundedRectangleBorder(borderRadius: AppRadius.button),
        ),
      ),
    );
  }
}

class RepairSecondaryButton extends StatelessWidget {
  const RepairSecondaryButton({
    required this.label,
    required this.onPressed,
    this.icon,
    super.key,
  });

  final String label;
  final VoidCallback? onPressed;
  final IconData? icon;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: double.infinity,
      height: 52,
      child: OutlinedButton.icon(
        onPressed: onPressed,
        icon: icon == null ? const SizedBox.shrink() : Icon(icon),
        label: Text(label),
        style: OutlinedButton.styleFrom(
          foregroundColor: Theme.of(context).colorScheme.primary,
          backgroundColor: Theme.of(
            context,
          ).colorScheme.primaryContainer.withValues(alpha: .48),
          side: BorderSide(color: Colors.transparent),
          textStyle: Theme.of(
            context,
          ).textTheme.labelLarge?.copyWith(fontWeight: FontWeight.w700),
          shape: RoundedRectangleBorder(borderRadius: AppRadius.button),
        ),
      ),
    );
  }
}

class RepairFilterChips extends StatelessWidget {
  const RepairFilterChips({
    required this.labels,
    this.selectedIndex = 0,
    super.key,
  });

  final List<String> labels;
  final int selectedIndex;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: Row(
        children: [
          for (var index = 0; index < labels.length; index++) ...[
            ChoiceChip(
              label: Text(labels[index]),
              selected: index == selectedIndex,
              onSelected: (_) {},
              selectedColor: theme.colorScheme.primaryContainer,
              labelStyle: theme.textTheme.labelLarge?.copyWith(
                color: index == selectedIndex
                    ? theme.colorScheme.onPrimaryContainer
                    : theme.colorScheme.onSurfaceVariant,
              ),
            ),
            if (index != labels.length - 1)
              const SizedBox(width: AppSpacing.xs),
          ],
        ],
      ),
    );
  }
}

String formatRepairLabel(String value) => humanizeCodeLabel(value);
