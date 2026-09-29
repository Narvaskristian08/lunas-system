import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:lunas_mobile/core/app_services.dart';
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
  List<NotificationData> _items = const [];
  final Set<String> _readItems = {};
  NotificationKind? _filter;
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final page = await notificationService.getNotifications();
      if (!mounted) return;
      setState(() {
        _items = page.items;
        _readItems
          ..clear()
          ..addAll(page.items.where((item) => item.isRead).map((item) => item.id));
        _loading = false;
      });
    } catch (error) {
      if (!mounted) return;
      setState(() {
        _loading = false;
        _error = error.toString();
      });
    }
  }

  Future<void> _markAllRead() async {
    try {
      await notificationService.markAllAsRead();
      if (mounted) {
        setState(() => _readItems.addAll(_items.map((item) => item.id)));
      }
    } catch (error) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Could not mark notifications as read: $error')),
        );
      }
    }
  }

  Future<void> _open(NotificationData item) async {
    setState(() => _readItems.add(item.id));
    if (!item.isRead) {
      try {
        await notificationService.markAsRead(item.id);
      } catch (_) {
        // Opening the notification remains useful even if read-state sync is
        // temporarily unavailable.
      }
    }
    if (!mounted) return;
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
          if (_loading)
            const LunasStateView(
              state: LunasViewState.loading,
              title: 'Loading notifications',
              message: 'Getting your latest LUNAS updates.',
            )
          else if (_error != null)
            LunasStateView(
              state: LunasViewState.error,
              title: 'Could not load notifications',
              message: _error!,
              actionLabel: 'Try again',
              onAction: _load,
            )
          else ...[
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
