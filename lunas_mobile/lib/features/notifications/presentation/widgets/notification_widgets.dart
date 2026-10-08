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
    final scaler = MediaQuery.textScalerOf(context);
    final titleHeight = scaler.scale(titleStyle?.fontSize ?? 16) * 1.4 * 2;
    final messageHeight = scaler.scale(messageStyle?.fontSize ?? 12) * 1.4 * 2;
    final linkHeight = scaler.scale(textTheme.labelSmall?.fontSize ?? 11) * 1.4;
    return LunasCard(
      onTap: onTap,
      color: isRead ? Colors.white : const Color(0xFFF1F7FD),
      padding: const EdgeInsets.all(AppSpacing.md),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 46,
            height: 46,
            decoration: BoxDecoration(
              color: item.color.withValues(alpha: .1),
              borderRadius: BorderRadius.circular(AppRadius.sm),
            ),
            child: Icon(item.icon, color: item.color, size: 23),
          ),
          const SizedBox(width: AppSpacing.md),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      child: SizedBox(
                        height: titleHeight,
                        child: Text(
                          item.title,
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                          style: titleStyle,
                        ),
                      ),
                    ),
                    const SizedBox(width: AppSpacing.xs),
                    Text(
                      item.time,
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                  ],
                ),
                const SizedBox(height: AppSpacing.xs),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: AppSpacing.xs,
                    vertical: 2,
                  ),
                  decoration: BoxDecoration(
                    color: item.color.withValues(alpha: .10),
                    borderRadius: BorderRadius.circular(AppRadius.pill),
                  ),
                  child: Text(
                    switch (item.kind) {
                      NotificationKind.update => 'UPDATE',
                      NotificationKind.activity => 'ACTIVITY',
                      NotificationKind.alert => 'ALERT',
                    },
                    style: Theme.of(context).textTheme.labelSmall?.copyWith(
                      color: item.color,
                      fontWeight: FontWeight.w700,
                      letterSpacing: .4,
                    ),
                  ),
                ),
                const SizedBox(height: AppSpacing.xs),
                SizedBox(
                  height: messageHeight,
                  child: Text(
                    item.message,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: messageStyle,
                  ),
                ),
                const SizedBox(height: AppSpacing.xs),
                SizedBox(
                  height: linkHeight,
                  child: item.workOrderId != null || item.incidentId != null
                      ? Text(
                          item.workOrderId != null
                              ? 'Linked work order'
                              : item.reportNumber ?? 'Linked report',
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: textTheme.labelSmall?.copyWith(
                            height: 1.4,
                            color: AppColorsLight.brandBase,
                          ),
                        )
                      : null,
                ),
              ],
            ),
          ),
          if (!isRead) ...[
            const SizedBox(width: AppSpacing.sm),
            Container(
              width: 8,
              height: 8,
              decoration: const BoxDecoration(
                shape: BoxShape.circle,
                color: AppColorsLight.brandBase,
              ),
            ),
          ],
        ],
      ),
    );
  }
}
