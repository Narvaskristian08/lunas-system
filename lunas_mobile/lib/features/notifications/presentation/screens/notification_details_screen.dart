import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:lunas_mobile/core/theme/app_colors.dart';
import 'package:lunas_mobile/core/theme/app_radius.dart';
import 'package:lunas_mobile/core/theme/app_spacing.dart';
import 'package:lunas_mobile/core/widgets/lunas_app_bar.dart';
import 'package:lunas_mobile/core/widgets/lunas_button.dart';
import 'package:lunas_mobile/core/widgets/lunas_card.dart';
import 'package:lunas_mobile/features/notifications/presentation/widgets/notification_widgets.dart';
import 'package:lunas_mobile/features/repair/presentation/screens/repair_routes.dart';
import 'package:lunas_mobile/features/repair/presentation/screens/repair_widgets.dart';

/// Returns a role-safe destination derived only from a server resource ID.
/// Notification-provided URL strings are intentionally ignored.
String? notificationDestination(
  NotificationData item, {
  required bool repairWorkspace,
}) {
  final resourceId = repairWorkspace ? item.workOrderId : item.incidentId;
  if (resourceId == null || resourceId.trim().isEmpty) return null;
  final encodedId = Uri.encodeComponent(resourceId);
  return repairWorkspace
      ? RepairRoutes.workOrder(encodedId)
      : '/reports/$encodedId';
}

class NotificationDetailsScreen extends StatelessWidget {
  const NotificationDetailsScreen({
    this.item,
    this.repairWorkspace = false,
    super.key,
  });

  final NotificationData? item;
  final bool repairWorkspace;

  @override
  Widget build(BuildContext context) {
    final resolvedItem =
        item ??
        GoRouterState.of(context).extra as NotificationData? ??
        const NotificationData(
          id: 'notification',
          title: 'LUNAS update',
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
    return Scaffold(
      appBar: repairWorkspace
          ? const RepairAppBar(
              title: 'Notification details',
              showBackButton: true,
            )
          : const LunasAppBar(
              title: 'Notification Details',
              showBackButton: true,
            ),
      body: SafeArea(
        top: false,
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(
            AppSpacing.xl,
            AppSpacing.md,
            AppSpacing.xl,
            AppSpacing.hero,
          ),
          child: Align(
            alignment: Alignment.topCenter,
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 560),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Center(
                    child: Container(
                      width: 72,
                      height: 72,
                      decoration: BoxDecoration(
                        color: resolvedItem.color.withValues(alpha: .1),
                        borderRadius: BorderRadius.circular(AppRadius.lg),
                      ),
                      child: Icon(
                        resolvedItem.icon,
                        color: resolvedItem.color,
                        size: 35,
                      ),
                    ),
                  ),
                  const SizedBox(height: AppSpacing.xl),
                  Text(
                    resolvedItem.title,
                    textAlign: TextAlign.center,
                    style: Theme.of(context).textTheme.headlineLarge?.copyWith(
                      fontSize: 27,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  const SizedBox(height: AppSpacing.xs),
                  Text(
                    resolvedItem.time,
                    textAlign: TextAlign.center,
                    style: Theme.of(context).textTheme.bodySmall,
                  ),
                  const SizedBox(height: AppSpacing.xxl),
                  LunasCard(
                    child: Text(
                      resolvedItem.message,
                      style: Theme.of(
                        context,
                      ).textTheme.bodyMedium?.copyWith(height: 1.6),
                    ),
                  ),
                  if (_hasContext(resolvedItem)) ...[
                    const SizedBox(height: AppSpacing.md),
                    LunasCard(
                      child: Column(
                        children: [
                          if (repairWorkspace &&
                              resolvedItem.workOrderId != null)
                            const _DetailRow(
                              icon: Icons.engineering_outlined,
                              label: 'Work order',
                              value: 'Linked assigned work',
                            ),
                          if (!repairWorkspace &&
                              resolvedItem.incidentId != null)
                            _DetailRow(
                              icon: Icons.description_outlined,
                              label: 'Report ID',
                              value:
                                  resolvedItem.reportNumber ?? 'Linked report',
                            ),
                          if (_hasResource(resolvedItem) &&
                              resolvedItem.location != null)
                            const Divider(height: AppSpacing.xl),
                          if (resolvedItem.location != null)
                            _DetailRow(
                              icon: Icons.location_on_outlined,
                              label: 'Location',
                              value: resolvedItem.location!,
                            ),
                        ],
                      ),
                    ),
                  ],
                  if (destination != null) ...[
                    const SizedBox(height: AppSpacing.xl),
                    LunasButton(
                      label: repairWorkspace
                          ? 'View Assigned Work'
                          : 'View Report',
                      icon: Icons.arrow_forward_rounded,
                      onPressed: () => context.push(destination),
                    ),
                  ] else if (repairWorkspace) ...[
                    const SizedBox(height: AppSpacing.xl),
                    Text(
                      'This notification is not linked to an accessible assigned work order.',
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
  }

  bool _hasResource(NotificationData value) =>
      repairWorkspace ? value.workOrderId != null : value.incidentId != null;

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
