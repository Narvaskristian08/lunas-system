import 'package:lunas_mobile/features/notifications/presentation/screens/notification_details_screen.dart';
import 'package:lunas_mobile/core/widgets/lunas_filter_button.dart';
import 'package:lunas_mobile/core/widgets/quiet_data_refresh.dart';
import 'package:flutter/material.dart';
import 'package:lunas_mobile/app/app_services.dart';
import 'package:lunas_mobile/core/theme/app_spacing.dart';
import 'package:lunas_mobile/core/widgets/lunas_app_scaffold.dart';
import 'package:lunas_mobile/core/widgets/lunas_state_view.dart';
import 'package:lunas_mobile/features/notifications/data/services/notification_service.dart';
import 'package:lunas_mobile/features/notifications/presentation/widgets/notification_widgets.dart';
import 'package:lunas_mobile/features/repair/presentation/widgets/repair_widgets.dart';

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
  int _total = 0;

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
    final requestedFilter = _filter;
    try {
      final loadedPages = isQuietRefresh ? (_page < 1 ? 1 : _page) : 1;
      final pages = <NotificationPage>[];
      for (var index = 1; index <= loadedPages; index++) {
        pages.add(
          await _repository.getNotifications(
            page: index,
            limit: _pageSize,
            kind: requestedFilter,
          ),
        );
        if (index >= pages.first.pages) break;
      }
      if (_filter != requestedFilter) return;
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
        _total = page.total;
        _loading = false;
      });
    } catch (error) {
      if (!mounted || isQuietRefresh) return;
      setState(() {
        _loading = false;
        debugPrint('Notification loading failed (${error.runtimeType}).');
        _error =
            'Could not load notifications. Please check your connection and try again.';
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
    final requestedFilter = _filter;
    try {
      final page = await _repository.getNotifications(
        page: _page + 1,
        limit: _pageSize,
        kind: requestedFilter,
      );
      if (!mounted || requestedFilter != _filter) return;
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
        _total = page.total;
        _loadingMore = false;
      });
    } catch (error) {
      if (!mounted) return;
      setState(() {
        _loadingMore = false;
        debugPrint('Notification pagination failed (${error.runtimeType}).');
        _loadMoreError = 'Could not load more notifications. Please try again.';
      });
    }
  }

  void _selectFilter(NotificationKind? kind) {
    if (_filter == kind) return;
    setState(() {
      _filter = kind;
      _page = 1;
    });
    _load();
  }

  Future<void> _markAllRead() async {
    if (_unreadCount == 0 || _mutating) return;
    _mutating = true;
    await waitForDataRequest();
    try {
      if (_filter == null) {
        await _repository.markAllAsRead();
      } else {
        for (final item in _items.where(
          (item) => !_readItems.contains(item.id),
        )) {
          await _repository.markAsRead(item.id);
        }
      }
      if (mounted) {
        setState(() {
          final newlyRead = _items
              .where((item) => !_readItems.contains(item.id))
              .length;
          _readItems.addAll(_items.map((item) => item.id));
          _unreadCount = _filter == null
              ? 0
              : (_unreadCount - newlyRead).clamp(0, _unreadCount);
        });
      }
    } catch (error) {
      await _load();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: const Text(
              'Could not update read status. Please try again.',
            ),
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
        if (mounted) {
          setState(() {
            _readItems.remove(item.id);
            _unreadCount += 1;
          });
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text(
                'Read status could not be saved. This notification remains unread.',
              ),
            ),
          );
        }
      }
    }
    _mutating = false;
    if (!mounted) return;
    await showModalBottomSheet<void>(
      context: context,
      useRootNavigator: true,
      isScrollControlled: true,
      useSafeArea: true,
      showDragHandle: true,
      constraints: BoxConstraints(
        maxHeight: MediaQuery.sizeOf(context).height * .85,
      ),
      builder: (_) => NotificationDetailsScreen(
        item: item,
        repairWorkspace: widget.repairWorkspace,
        asSheet: true,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final fillEmpty =
        !_loading &&
        _error == null &&
        !_items.any((item) => _filter == null || item.kind == _filter);
    final body = _body(context, fillEmpty: fillEmpty);
    final refreshAction = IconButton(
      tooltip: 'Refresh Notifications',
      onPressed: _loading ? null : _load,
      icon: const Icon(Icons.refresh_rounded),
    );
    if (widget.repairWorkspace) {
      return RepairPage(
        fillAvailableHeight: _loading || _error != null || fillEmpty,
        appBar: RepairAppBar(
          title: 'Notifications',
          subtitle: _unreadCount == 0
              ? 'Stay updated on your work orders.'
              : '$_unreadCount Unread Update${_unreadCount == 1 ? '' : 's'}',
          actions: [
            refreshAction,
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
      fillAvailableHeight: _loading || _error != null || fillEmpty,
      subtitle: _unreadCount == 0
          ? 'Stay updated on your reports.'
          : '$_unreadCount Unread Update${_unreadCount == 1 ? '' : 's'}',
      selectedIndex: null,
      showBackButton: false,
      actions: [
        refreshAction,
        const SizedBox(width: AppSpacing.sm),
      ],
      child: body,
    );
  }

  Widget _body(BuildContext context, {bool fillEmpty = false}) {
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
                onTap: () => _selectFilter(null),
              ),
            ),
            const SizedBox(width: AppSpacing.xs),
            Expanded(
              child: LunasFilterButton(
                label: 'Updates',
                selected: _filter == NotificationKind.update,
                onTap: () => _selectFilter(NotificationKind.update),
              ),
            ),
            const SizedBox(width: AppSpacing.xs),
            Expanded(
              child: LunasFilterButton(
                label: 'Activity',
                selected: _filter == NotificationKind.activity,
                onTap: () => _selectFilter(NotificationKind.activity),
              ),
            ),
            const SizedBox(width: AppSpacing.xs),
            Expanded(
              child: LunasFilterButton(
                label: 'Alerts',
                selected: _filter == NotificationKind.alert,
                onTap: () => _selectFilter(NotificationKind.alert),
              ),
            ),
          ],
        ),
        const SizedBox(height: AppSpacing.xl),
        Row(
          children: [
            Expanded(
              child: Text(
                _filter == NotificationKind.activity
                    ? 'Activity · $_total'
                    : _filter == NotificationKind.alert
                    ? 'Alerts · $_total'
                    : 'Recent Updates · $_total',
                style: Theme.of(
                  context,
                ).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w700),
              ),
            ),
            TextButton(
              onPressed: _loading || _unreadCount == 0 ? null : _markAllRead,
              style: TextButton.styleFrom(
                textStyle: const TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                ),
                padding: const EdgeInsets.symmetric(horizontal: AppSpacing.xs),
              ),
              child: Text(
                _filter == null ? 'Mark All As Read' : 'Mark Visible As Read',
              ),
            ),
          ],
        ),
        const SizedBox(height: AppSpacing.md),
        if (_loading)
          const Expanded(
            child: LunasStateView(
              state: LunasViewState.loading,
              title: 'Loading notifications',
              message: 'Getting your latest LUNAS updates.',
            ),
          )
        else if (_error != null)
          Expanded(
            child: LunasStateView(
              state: LunasViewState.error,
              title: 'Could not load notifications',
              message: _error!,
              actionLabel: 'Try Again',
              onAction: _load,
            ),
          )
        else if (visible.isEmpty)
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
        if (!_loading && _error == null && _page < _pages) ...[
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
            'Could not load more notifications. Please try again.',
            textAlign: TextAlign.center,
            style: TextStyle(color: Theme.of(context).colorScheme.error),
          ),
          TextButton(onPressed: _loadMore, child: const Text('Try Again')),
        ],
      ],
    );
  }
}
