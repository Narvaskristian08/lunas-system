import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:lunas_mobile/core/theme/app_colors.dart';
import 'package:lunas_mobile/core/theme/app_spacing.dart';
import 'package:lunas_mobile/core/widgets/lunas_app_scaffold.dart';
import 'package:lunas_mobile/core/widgets/lunas_state_view.dart';
import 'package:lunas_mobile/features/notifications/presentation/widgets/notification_widgets.dart';

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  final Set<String> _readItems = {'notification-3'};
  NotificationKind? _filter;

  static const _items = [
    NotificationData(
      id: 'notification-1',
      title: 'Your report is now in progress',
      message:
          'A repair team has been assigned to the broken streetlight you reported.',
      time: '12 min',
      icon: Icons.engineering_outlined,
      color: AppColorsLight.alert,
      kind: NotificationKind.update,
      reportId: 'RPT-2026-0142',
      location: 'Rizal Avenue, Barangay 5',
    ),
    NotificationData(
      id: 'notification-2',
      title: 'Report verified',
      message: 'A LUNAS review team verified your road surface damage report.',
      time: '45 min',
      icon: Icons.verified_outlined,
      color: AppColorsLight.info,
      kind: NotificationKind.activity,
      reportId: 'RPT-2026-0118',
      location: 'Mabini Street, Barangay 8',
    ),
    NotificationData(
      id: 'notification-3',
      title: 'Report resolved',
      message:
          'The clogged drainage on Quezon Street has been repaired and closed.',
      time: '2 hr',
      icon: Icons.check_circle_outline_rounded,
      color: AppColorsLight.success,
      kind: NotificationKind.update,
      reportId: 'RPT-2026-0093',
      location: 'Quezon Street, Barangay 6',
    ),
    NotificationData(
      id: 'notification-4',
      title: 'Flooding advisory nearby',
      message:
          'Heavy rainfall may affect low-lying streets in Barangay 4. Travel carefully.',
      time: 'Today',
      icon: Icons.warning_amber_rounded,
      color: AppColorsLight.critical,
      kind: NotificationKind.alert,
      location: 'Barangay 4',
    ),
    NotificationData(
      id: 'notification-5',
      title: 'Community activity',
      message:
          'Three new public-safety reports were submitted within two kilometers.',
      time: 'Yesterday',
      icon: Icons.groups_outlined,
      color: AppColorsLight.brandBase,
      kind: NotificationKind.activity,
    ),
  ];

  void _markAllRead() {
    setState(() => _readItems.addAll(_items.map((item) => item.id)));
  }

  void _open(NotificationData item) {
    setState(() => _readItems.add(item.id));
    context.push('/notifications/details', extra: item);
  }

  @override
  Widget build(BuildContext context) {
    final visible = _filter == null
        ? _items
        : _items.where((item) => item.kind == _filter).toList();
    final unread = _items.where((item) => !_readItems.contains(item.id)).length;
    return LunasAppScaffold(
      title: 'Notifications',
      subtitle: '$unread unread updates',
      selectedIndex: null,
      showBackButton: true,
      actions: [
        TextButton(onPressed: _markAllRead, child: const Text('Mark all read')),
        const SizedBox(width: AppSpacing.sm),
      ],
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: [
                _FilterChip(
                  label: 'All',
                  selected: _filter == null,
                  onTap: () => setState(() => _filter = null),
                ),
                _FilterChip(
                  label: 'Updates',
                  selected: _filter == NotificationKind.update,
                  onTap: () =>
                      setState(() => _filter = NotificationKind.update),
                ),
                _FilterChip(
                  label: 'Activity',
                  selected: _filter == NotificationKind.activity,
                  onTap: () =>
                      setState(() => _filter = NotificationKind.activity),
                ),
                _FilterChip(
                  label: 'Alerts',
                  selected: _filter == NotificationKind.alert,
                  onTap: () => setState(() => _filter = NotificationKind.alert),
                ),
              ],
            ),
          ),
          const SizedBox(height: AppSpacing.xl),
          Text(
            _filter == NotificationKind.activity
                ? 'Activity Feed'
                : _filter == NotificationKind.alert
                ? 'Alerts'
                : 'Recent Updates',
            style: Theme.of(
              context,
            ).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w800),
          ),
          const SizedBox(height: AppSpacing.md),
          if (visible.isEmpty)
            const LunasStateView(
              state: LunasViewState.empty,
              title: 'No notifications yet',
              message: 'Updates, activities, and alerts will appear here.',
            )
          else
            for (final item in visible) ...[
              NotificationCard(
                item: item,
                isRead: _readItems.contains(item.id),
                onTap: () => _open(item),
              ),
              const SizedBox(height: AppSpacing.sm),
            ],
        ],
      ),
    );
  }
}

class _FilterChip extends StatelessWidget {
  const _FilterChip({
    required this.label,
    required this.selected,
    required this.onTap,
  });

  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(right: AppSpacing.xs),
      child: ChoiceChip(
        label: Text(label),
        selected: selected,
        onSelected: (_) => onTap(),
      ),
    );
  }
}
