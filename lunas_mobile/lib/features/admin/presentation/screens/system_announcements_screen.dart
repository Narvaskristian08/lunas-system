import 'package:flutter/material.dart';
import 'package:lunas_mobile/core/theme/app_colors.dart';
import 'package:lunas_mobile/core/theme/app_spacing.dart';
import 'package:lunas_mobile/core/widgets/lunas_card.dart';
import 'package:lunas_mobile/features/admin/presentation/screens/admin_routes.dart';
import 'package:lunas_mobile/features/admin/presentation/screens/admin_widgets.dart';

/// Broadcast management screen for system-wide LUNAS announcements.
class SystemAnnouncementsScreen extends StatelessWidget {
  const SystemAnnouncementsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return AdminPage(
      title: 'System announcements',
      subtitle: 'Manage and broadcast critical system alerts',
      selectedNavigationIndex: 3,
      actions: [
        IconButton(
          tooltip: 'Create announcement',
          onPressed: () =>
              Navigator.pushNamed(context, AdminRoutes.createAnnouncement),
          icon: const Icon(Icons.add_rounded),
        ),
        const SizedBox(width: AppSpacing.sm),
      ],
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              Expanded(
                child: TextField(
                  decoration: const InputDecoration(
                    hintText: 'Search announcements',
                    prefixIcon: Icon(Icons.search_rounded),
                  ),
                ),
              ),
              const SizedBox(width: AppSpacing.sm),
              IconButton.outlined(
                tooltip: 'Filter announcements',
                onPressed: () => showAdminMessage(
                  context,
                  'Announcement filters are a static prototype control.',
                ),
                icon: const Icon(Icons.filter_list_rounded),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.lg),
          for (final announcement in _announcements) ...[
            _AnnouncementCard(
              announcement: announcement,
              onMore: () => showAdminMessage(
                context,
                'Announcement actions are a static prototype control.',
              ),
            ),
            const SizedBox(height: AppSpacing.sm),
          ],
          const SizedBox(height: AppSpacing.sm),
          OutlinedButton.icon(
            onPressed: () =>
                Navigator.pushNamed(context, AdminRoutes.createAnnouncement),
            icon: const Icon(Icons.add_rounded),
            label: const Text('Create system announcement'),
          ),
        ],
      ),
    );
  }
}

const _announcements = [
  _Announcement(
    state: 'Published',
    date: '24 Oct 2026',
    title: 'Scheduled maintenance — Dagupan services',
    message:
        'Routine maintenance will affect report synchronization for a short scheduled window. Field submissions will remain queued safely.',
    icon: Icons.groups_outlined,
    color: AppColorsLight.brandBase,
  ),
  _Announcement(
    state: 'Draft',
    date: '26 Oct 2026',
    title: 'New security protocol rollout',
    message:
        'Draft guidance for the upcoming account security review and required administrator actions.',
    icon: Icons.admin_panel_settings_outlined,
    color: AppColorsLight.alert,
  ),
  _Announcement(
    state: 'Urgent',
    date: '23 Oct 2026',
    title: 'Utility response update',
    message:
        'Utility response teams should check the active incident queue before dispatching to the central market area.',
    icon: Icons.campaign_outlined,
    color: AppColorsLight.critical,
  ),
];

class _Announcement {
  const _Announcement({
    required this.state,
    required this.date,
    required this.title,
    required this.message,
    required this.icon,
    required this.color,
  });

  final String state;
  final String date;
  final String title;
  final String message;
  final IconData icon;
  final Color color;
}

class _AnnouncementCard extends StatelessWidget {
  const _AnnouncementCard({required this.announcement, required this.onMore});

  final _Announcement announcement;
  final VoidCallback onMore;

  @override
  Widget build(BuildContext context) {
    return LunasCard(
      padding: const EdgeInsets.all(AppSpacing.md),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          CircleAvatar(
            backgroundColor: announcement.color.withValues(alpha: .12),
            foregroundColor: announcement.color,
            child: Icon(announcement.icon),
          ),
          const SizedBox(width: AppSpacing.md),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    AdminStatusPill(
                      label: announcement.state,
                      color: announcement.color,
                    ),
                    const SizedBox(width: AppSpacing.sm),
                    Expanded(
                      child: Text(
                        announcement.date,
                        style: Theme.of(context).textTheme.bodySmall,
                      ),
                    ),
                    IconButton(
                      tooltip: 'Announcement actions',
                      onPressed: onMore,
                      icon: const Icon(Icons.more_vert_rounded),
                    ),
                  ],
                ),
                const SizedBox(height: AppSpacing.xs),
                Text(
                  announcement.title,
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w800,
                  ),
                ),
                const SizedBox(height: AppSpacing.xxs),
                Text(
                  announcement.message,
                  style: Theme.of(
                    context,
                  ).textTheme.bodySmall?.copyWith(height: 1.4),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
