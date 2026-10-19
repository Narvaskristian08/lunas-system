import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:lunas_mobile/core/theme/app_colors.dart';
import 'package:lunas_mobile/core/theme/app_radius.dart';
import 'package:lunas_mobile/core/theme/app_spacing.dart';
import 'package:lunas_mobile/core/widgets/lunas_app_bar.dart';
import 'package:lunas_mobile/core/widgets/lunas_button.dart';
import 'package:lunas_mobile/core/widgets/lunas_card.dart';
import 'package:lunas_mobile/features/notifications/presentation/widgets/notification_widgets.dart';
import 'package:lunas_mobile/features/repair/routes/repair_routes.dart';
import 'package:lunas_mobile/features/repair/presentation/widgets/repair_widgets.dart';

/// Returns a role-safe destination derived only from a server resource ID.
/// Notification-provided URL strings are intentionally ignored.
String? notificationDestination(
  NotificationData item, {
  required bool repairWorkspace,
}) {
  final resourceId = repairWorkspace
      ? (item.incidentId ?? item.workOrderId)
      : item.incidentId;
  if (repairWorkspace) {
    // Utility Personnel work from assigned inspections, not legacy work-order
    // detail/progress screens. Any linked notification returns to that queue.
    return resourceId == null || resourceId.trim().isEmpty
        ? null
        : RepairRoutes.workOrders;
  }
  if (resourceId == null || resourceId.trim().isEmpty) return null;
  return '/reports/${Uri.encodeComponent(resourceId)}';
}

class NotificationDetailsScreen extends StatelessWidget {
  const NotificationDetailsScreen({
    this.item,
    this.repairWorkspace = false,
    this.asSheet = false,
    super.key,
  });

  final NotificationData? item;
  final bool repairWorkspace;
  final bool asSheet;

  @override
  Widget build(BuildContext context) {
    final resolvedItem =
        item ??
        GoRouterState.of(context).extra as NotificationData? ??
        const NotificationData(
          id: 'notification',
          title: 'LUNAS Update',
          message: 'A new update is available for your account.',
          time: 'Just now',
          icon: Icons.notifications_outlined,
          color: AppColorsLight.brandBase,
          kind: NotificationKind.update,
        );
    final destination = notificationDestination(
      resolvedItem,
      repairWorkspace: repairWorkspace,
    );
    final content = SafeArea(
      top: false,
      child: LayoutBuilder(
        builder: (context, constraints) => SingleChildScrollView(
          padding: EdgeInsets.fromLTRB(
            AppSpacing.xl,
            asSheet ? AppSpacing.xs : AppSpacing.xl,
            AppSpacing.xl,
            asSheet ? AppSpacing.xl : AppSpacing.hero,
          ),
          child: Align(
            alignment: Alignment.topCenter,
            child: ConstrainedBox(
              constraints: BoxConstraints(
                maxWidth: 560,
                minHeight: asSheet
                    ? 0
                    : (constraints.maxHeight - AppSpacing.xl - AppSpacing.hero)
                          .clamp(0.0, double.infinity),
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                mainAxisAlignment: MainAxisAlignment.center,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  _detailPanel(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        Row(
                          children: [
                            Container(
                              width: 40,
                              height: 40,
                              decoration: BoxDecoration(
                                color: resolvedItem.color.withValues(alpha: .1),
                                borderRadius: BorderRadius.circular(
                                  AppRadius.sm,
                                ),
                              ),
                              child: Icon(
                                resolvedItem.icon,
                                color: resolvedItem.color,
                                size: 23,
                              ),
                            ),
                            const SizedBox(width: AppSpacing.sm),
                            Expanded(
                              child: Text(
                                switch (resolvedItem.kind) {
                                  NotificationKind.update => 'Update',
                                  NotificationKind.activity => 'Activity',
                                  NotificationKind.alert => 'Alert',
                                },
                                style: Theme.of(context).textTheme.labelLarge
                                    ?.copyWith(color: resolvedItem.color),
                              ),
                            ),
                            Text(
                              resolvedItem.time,
                              style: Theme.of(context).textTheme.bodySmall,
                            ),
                          ],
                        ),
                        const SizedBox(height: AppSpacing.lg),
                        Text(
                          resolvedItem.title,
                          style: Theme.of(context).textTheme.headlineSmall
                              ?.copyWith(
                                fontSize: 22,
                                height: 1.3,
                                fontWeight: FontWeight.w700,
                              ),
                        ),
                        const SizedBox(height: AppSpacing.sm),
                        Text(
                          resolvedItem.message,
                          style: Theme.of(
                            context,
                          ).textTheme.bodyMedium?.copyWith(height: 1.6),
                        ),
                        if (_hasContext(resolvedItem)) ...[
                          const Divider(height: AppSpacing.xxl),
                          if (repairWorkspace &&
                              resolvedItem.workOrderId != null)
                            const _DetailRow(
                              icon: Icons.engineering_outlined,
                              label: 'Work Verification',
                              value: 'Linked Tanod inspection',
                            ),
                          if (!repairWorkspace &&
                              resolvedItem.incidentId != null)
                            _DetailRow(
                              icon: Icons.description_outlined,
                              label: 'Report ID',
                              value:
                                  resolvedItem.reportNumber ?? 'Linked Report',
                            ),
                          if (_hasResource(resolvedItem) &&
                              resolvedItem.location != null)
                            const SizedBox(height: AppSpacing.md),
                          if (resolvedItem.location != null)
                            _DetailRow(
                              icon: Icons.location_on_outlined,
                              label: 'Location',
                              value: resolvedItem.location!,
                            ),
                        ],
                      ],
                    ),
                  ),
                  if (destination != null) ...[
                    const SizedBox(height: AppSpacing.xl),
                    LunasButton(
                      label: repairWorkspace
                          ? 'View Work Verification'
                          : 'View Report',
                      icon: Icons.arrow_forward_rounded,
                      onPressed: () {
                        final router = GoRouter.of(context);
                        if (asSheet) Navigator.of(context).pop();
                        router.push(destination);
                      },
                    ),
                  ] else if (repairWorkspace) ...[
                    const SizedBox(height: AppSpacing.xl),
                    Text(
                      'This notification is not linked to an accessible work verification.',
                      textAlign: TextAlign.center,
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                  ],
                ],
              ),
            ),
          ),
        ),
      ),
    );
    if (asSheet) return content;
    return Scaffold(
      appBar: repairWorkspace
          ? const RepairAppBar(
              title: 'Notification Details',
              showBackButton: true,
            )
          : const LunasAppBar(
              title: 'Notification Details',
              showBackButton: true,
            ),
      body: content,
    );
  }

  bool _hasResource(NotificationData value) =>
      repairWorkspace ? value.workOrderId != null : value.incidentId != null;

  Widget _detailPanel({required Widget child}) =>
      asSheet ? child : LunasCard(child: child);

  bool _hasContext(NotificationData value) =>
      _hasResource(value) || value.location != null;
}

class _DetailRow extends StatelessWidget {
  const _DetailRow({
    required this.icon,
    required this.label,
    required this.value,
  });

  final IconData icon;
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(icon, color: AppColorsLight.brandBase, size: 21),
        const SizedBox(width: AppSpacing.md),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(label, style: Theme.of(context).textTheme.labelSmall),
              Text(value, style: Theme.of(context).textTheme.titleMedium),
            ],
          ),
        ),
      ],
    );
  }
}
