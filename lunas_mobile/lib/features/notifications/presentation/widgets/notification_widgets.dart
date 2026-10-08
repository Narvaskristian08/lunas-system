import 'package:flutter/material.dart';
import 'package:lunas_mobile/core/theme/app_colors.dart';
import 'package:lunas_mobile/core/theme/app_radius.dart';
import 'package:lunas_mobile/core/theme/app_spacing.dart';
import 'package:lunas_mobile/core/widgets/lunas_card.dart';
import 'package:lunas_mobile/features/notifications/data/models/notification_data.dart';
export 'package:lunas_mobile/features/notifications/data/models/notification_data.dart';

class NotificationCard extends StatelessWidget {
  const NotificationCard({
    required this.item,
    required this.isRead,
    required this.onTap,
    super.key,
  });

  final NotificationData item;
  final bool isRead;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;
    final titleStyle = textTheme.titleMedium?.copyWith(
      height: 1.4,
      fontWeight: isRead ? FontWeight.w600 : FontWeight.w700,
    );
    final messageStyle = textTheme.bodySmall?.copyWith(height: 1.4);
    final hasResource = item.workOrderId != null || item.incidentId != null;
    return LunasCard(
      onTap: onTap,
      color: isRead ? Colors.white : const Color(0xFFF1F7FD),
      padding: const EdgeInsets.all(AppSpacing.md),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(
                  color: item.color.withValues(alpha: .1),
                  borderRadius: BorderRadius.circular(AppRadius.sm),
                ),
                child: Icon(item.icon, color: item.color, size: 20),
              ),
              const SizedBox(width: AppSpacing.sm),
              Expanded(
                child: Text(
                  switch (item.kind) {
                    NotificationKind.update => 'Update',
                    NotificationKind.activity => 'Activity',
                    NotificationKind.alert => 'Alert',
                  },
                  style: textTheme.labelMedium?.copyWith(
                    color: item.color,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
              Text(item.time, style: textTheme.bodySmall),
              if (!isRead) ...[
                const SizedBox(width: AppSpacing.xs),
                Container(
                  width: 7,
                  height: 7,
                  decoration: const BoxDecoration(
                    shape: BoxShape.circle,
                    color: AppColorsLight.brandBase,
                  ),
                ),
              ],
            ],
          ),
          const SizedBox(height: AppSpacing.sm),
          Text(
            item.title,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
            style: titleStyle,
          ),
          const SizedBox(height: AppSpacing.xs),
          Text(
            item.message,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
            style: messageStyle,
          ),
          if (hasResource) ...[
            const SizedBox(height: AppSpacing.sm),
            Row(
              children: [
                Expanded(
                  child: Text(
                    item.reportNumber ??
                        (item.workOrderId != null
                            ? 'Linked Work Order'
                            : 'Linked Report'),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: textTheme.labelSmall?.copyWith(
                      color: AppColorsLight.brandBase,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
                const Icon(
                  Icons.chevron_right_rounded,
                  size: 18,
                  color: AppColorsLight.brandBase,
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }
}
