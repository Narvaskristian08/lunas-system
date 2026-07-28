import 'package:flutter/material.dart';
import 'package:lunas_mobile/core/theme/app_colors.dart';
import 'package:lunas_mobile/core/theme/app_radius.dart';
import 'package:lunas_mobile/core/theme/app_spacing.dart';
import 'package:lunas_mobile/core/widgets/lunas_card.dart';

enum NotificationKind { update, activity, alert }

class NotificationData {
  const NotificationData({
    required this.id,
    required this.title,
    required this.message,
    required this.time,
    required this.icon,
    required this.color,
    required this.kind,
    this.reportId,
    this.location,
  });

  final String id;
  final String title;
  final String message;
  final String time;
  final IconData icon;
  final Color color;
  final NotificationKind kind;
  final String? reportId;
  final String? location;
}

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
                      child: Text(
                        item.title,
                        style: Theme.of(context).textTheme.titleMedium
                            ?.copyWith(
                              fontWeight: isRead
                                  ? FontWeight.w600
                                  : FontWeight.w800,
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
                Text(
                  item.message,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: Theme.of(context).textTheme.bodySmall,
                ),
                if (item.reportId != null) ...[
                  const SizedBox(height: AppSpacing.xs),
                  Text(
                    item.reportId!,
                    style: Theme.of(context).textTheme.labelSmall?.copyWith(
                      color: AppColorsLight.brandBase,
                    ),
                  ),
                ],
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
