import 'package:lunas_mobile/core/widgets/lunas_filter_button.dart';
import 'package:lunas_mobile/core/widgets/quiet_data_refresh.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:lunas_mobile/core/app_services.dart';
import 'package:lunas_mobile/core/theme/app_spacing.dart';
import 'package:lunas_mobile/core/widgets/lunas_app_scaffold.dart';
import 'package:lunas_mobile/core/widgets/lunas_state_view.dart';
import 'package:lunas_mobile/features/notifications/data/services/notification_service.dart';
import 'package:lunas_mobile/features/notifications/presentation/widgets/notification_widgets.dart';
import 'package:lunas_mobile/features/repair/presentation/screens/repair_routes.dart';
import 'package:lunas_mobile/features/repair/presentation/screens/repair_widgets.dart';

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({
    this.repairWorkspace = false,
    this.repository,
    super.key,
  });

  final bool repairWorkspace;
  final NotificationRepository? repository;

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen>
    with WidgetsBindingObserver, QuietDataRefresh<NotificationsScreen> {
  static const _pageSize = 20;

  late final NotificationRepository _repository;
  List<NotificationData> _items = const [];
  final Set<String> _readItems = {};
  NotificationKind? _filter;
  bool _loading = true;
  bool _loadingMore = false;
  bool _mutating = false;
  String? _error;
  String? _loadMoreError;
  int _page = 0;
  int _pages = 1;
  int _unreadCount = 0;

  @override
  void initState() {
    super.initState();
    _repository = widget.repository ?? notificationService;
    _load();
  }

  @override
  bool get canRefreshData => !_loadingMore && !_mutating;

  @override
  Future<void> refreshVisibleData() => _load(quiet: true);

  Future<void> _load({bool quiet = false}) =>
      loadScreenData(_loadData, quiet: quiet);

  Future<void> _loadData() async {
    if (!isQuietRefresh) {
      setState(() {
        _loading = true;
        _error = null;
        _loadMoreError = null;
      });
    }
    try {
      final loadedPages = isQuietRefresh ? (_page < 1 ? 1 : _page) : 1;
      final pages = <NotificationPage>[];
      for (var index = 1; index <= loadedPages; index++) {
        pages.add(
          await _repository.getNotifications(page: index, limit: _pageSize),
        );
        if (index >= pages.first.pages) break;
      }
      final page = pages.first;
      final items = pages.expand((entry) => entry.items).toList();
      if (!mounted) return;
      setState(() {
        _items = items;
        _error = null;
        _readItems
          ..clear()
          ..addAll(items.where((item) => item.isRead).map((item) => item.id));
        _page = pages.last.page;
        _pages = page.pages;
        _unreadCount = page.unreadCount;
        _loading = false;
      });
    } catch (error) {
      if (!mounted || isQuietRefresh) return;
      setState(() {
        _loading = false;
        _error = error.toString();
      });
    }
  }

  Future<void> _loadMore() => loadScreenData(_loadMoreData);

  Future<void> _loadMoreData() async {
    if (_loadingMore || _page >= _pages) return;
    setState(() {
      _loadingMore = true;
      _loadMoreError = null;
    });
    try {
      final page = await _repository.getNotifications(
        page: _page + 1,
        limit: _pageSize,
      );
      if (!mounted) return;
      setState(() {
        final existingIds = _items.map((item) => item.id).toSet();
        _items = [
          ..._items,
          ...page.items.where((item) => existingIds.add(item.id)),
        ];
        _readItems.addAll(
          page.items.where((item) => item.isRead).map((item) => item.id),
        );
        _page = page.page;
        _pages = page.pages;
        _unreadCount = page.unreadCount;
        _loadingMore = false;
      });
    } catch (error) {
      if (!mounted) return;
      setState(() {
        _loadingMore = false;
        _loadMoreError = error.toString();
      });
    }
  }

  Future<void> _markAllRead() async {
    if (_unreadCount == 0 || _mutating) return;
    _mutating = true;
    await waitForDataRequest();
    try {
      await _repository.markAllAsRead();
      if (mounted) {
        setState(() {
          _readItems.addAll(_items.map((item) => item.id));
          _unreadCount = 0;
        });
      }
    } catch (error) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Could not mark notifications as read: $error'),
          ),
        );
      }
    } finally {
      _mutating = false;
    }
  }

  Future<void> _open(NotificationData item) async {
    if (_mutating) return;
    _mutating = true;
    await waitForDataRequest();
    if (!mounted) {
      _mutating = false;
      return;
    }
    final wasUnread = !_readItems.contains(item.id);
    if (wasUnread) {
      setState(() {
        _readItems.add(item.id);
        if (_unreadCount > 0) _unreadCount -= 1;
      });
    }
    if (wasUnread) {
      try {
        await _repository.markAsRead(item.id);
      } catch (_) {
        // The notification remains useful when read-state sync is unavailable.
      }
    }
    _mutating = false;
    if (!mounted) return;
    context.push(
      widget.repairWorkspace
          ? RepairRoutes.notificationDetails
          : '/notifications/details',
      extra: item,
    );
  }

  @override
  Widget build(BuildContext context) {
    final fillEmpty =
        !widget.repairWorkspace &&
        !_loading &&
        _error == null &&
        !_items.any((item) => _filter == null || item.kind == _filter);
    final body = _body(context, fillEmpty: fillEmpty);
    final markAllAction = TextButton(
      onPressed: _loading || _unreadCount == 0 ? null : _markAllRead,
      child: const Text('Mark All As Read'),
    );
    if (widget.repairWorkspace) {
      return RepairPage(
        appBar: RepairAppBar(
          title: 'Repair notifications',
          subtitle: '$_unreadCount unread updates',
          actions: [
            markAllAction,
            const SizedBox(width: AppSpacing.sm),
          ],
        ),
        selectedNavigationIndex: 2,
        notificationUnreadCount: _unreadCount,
        child: body,
      );
    }
    return LunasAppScaffold(
      title: 'Notifications',
      fillAvailableHeight: fillEmpty,
      subtitle: '$_unreadCount unread updates',
      selectedIndex: null,
      showBackButton: true,
      actions: [
        markAllAction,
        const SizedBox(width: AppSpacing.sm),
      ],
      child: body,
    );
  }

  Widget _body(BuildContext context, {bool fillEmpty = false}) {
    if (_loading) {
      return const LunasStateView(
        state: LunasViewState.loading,
        title: 'Loading notifications',
        message: 'Getting your latest LUNAS updates.',
      );
    }
    if (_error != null) {
      return LunasStateView(
        state: LunasViewState.error,
        title: 'Could not load notifications',
        message: _error!,
        actionLabel: 'Try again',
        onAction: _load,
      );
    }

    final visible = _filter == null
        ? _items
        : _items.where((item) => item.kind == _filter).toList();
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Row(
          children: [
            Expanded(
              child: LunasFilterButton(
                label: 'All',
                selected: _filter == null,
                onTap: () => setState(() => _filter = null),
              ),
            ),
            const SizedBox(width: AppSpacing.xs),
            Expanded(
              child: LunasFilterButton(
                label: 'Updates',
                selected: _filter == NotificationKind.update,
                onTap: () => setState(() => _filter = NotificationKind.update),
              ),
            ),
            const SizedBox(width: AppSpacing.xs),
            Expanded(
              child: LunasFilterButton(
                label: 'Activity',
                selected: _filter == NotificationKind.activity,
                onTap: () =>
                    setState(() => _filter = NotificationKind.activity),
              ),
            ),
            const SizedBox(width: AppSpacing.xs),
            Expanded(
              child: LunasFilterButton(
                label: 'Alerts',
                selected: _filter == NotificationKind.alert,
                onTap: () => setState(() => _filter = NotificationKind.alert),
              ),
            ),
          ],
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
          ).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w700),
        ),
        const SizedBox(height: AppSpacing.md),
        if (visible.isEmpty)
          if (fillEmpty)
            const Expanded(
              child: Align(
                alignment: Alignment(0, -.18),
                child: LunasStateView(
                  state: LunasViewState.empty,
                  title: 'No notifications yet',
                  message: 'Updates, activities, and alerts will appear here.',
                ),
              ),
            )
          else
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
        if (_page < _pages) ...[
          const SizedBox(height: AppSpacing.sm),
          OutlinedButton.icon(
            onPressed: _loadingMore ? null : _loadMore,
            icon: _loadingMore
                ? const SizedBox.square(
                    dimension: 18,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : const Icon(Icons.expand_more_rounded),
            label: Text(_loadingMore ? 'Loading more' : 'Load more'),
          ),
        ],
        if (_loadMoreError != null) ...[
          const SizedBox(height: AppSpacing.sm),
          Text(
            'Could not load more notifications: $_loadMoreError',
            textAlign: TextAlign.center,
            style: TextStyle(color: Theme.of(context).colorScheme.error),
          ),
          TextButton(onPressed: _loadMore, child: const Text('Try again')),
        ],
      ],
    );
  }
}
