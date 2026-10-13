import 'package:lunas_mobile/core/widgets/lunas_filter_button.dart';
import 'package:lunas_mobile/core/widgets/quiet_data_refresh.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:lunas_mobile/app/app_services.dart';
import 'package:lunas_mobile/core/network/api_exception.dart';
import 'package:lunas_mobile/core/theme/app_spacing.dart';
import 'package:lunas_mobile/core/widgets/lunas_state_view.dart';
import 'package:lunas_mobile/features/repair/data/models/repair_models.dart';
import 'package:lunas_mobile/features/repair/routes/repair_routes.dart';
import 'package:lunas_mobile/features/repair/presentation/widgets/repair_widgets.dart';

/// Paginated, assignee-scoped work-order list. Filters are sent to the server
/// with the authenticated repair-personnel request.
class AssignedWorkOrdersScreen extends StatefulWidget {
  const AssignedWorkOrdersScreen({super.key, this.initialFilter});

  final String? initialFilter;

  @override
  State<AssignedWorkOrdersScreen> createState() =>
      _AssignedWorkOrdersScreenState();
}

class _AssignedWorkOrdersScreenState extends State<AssignedWorkOrdersScreen>
    with WidgetsBindingObserver, QuietDataRefresh<AssignedWorkOrdersScreen> {
  static const _pageSize = 20;
  int _requestSequence = 0;
  bool _loading = true;
  String? _error;
  RepairWorkOrderPage? _page;
  String? _status;
  bool _overdueOnly = false;

  @override
  void initState() {
    super.initState();
    _overdueOnly = widget.initialFilter == 'overdue';
    _status = _overdueOnly ? null : widget.initialFilter;
    _load();
  }

  @override
  void didUpdateWidget(covariant AssignedWorkOrdersScreen oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.initialFilter != oldWidget.initialFilter) {
      _overdueOnly = widget.initialFilter == 'overdue';
      _status = _overdueOnly ? null : widget.initialFilter;
      _load();
    }
  }

  @override
  Future<void> refreshVisibleData() =>
      _load(quiet: true, page: _page?.page ?? 1);

  Future<void> _load({int page = 1, bool quiet = false}) {
    if (quiet && dataRequestInFlight) return Future.value();
    final sequence = ++_requestSequence;
    final status = _status;
    final overdue = _overdueOnly;
    return loadScreenData(
      () => _loadData(
        page: page,
        sequence: sequence,
        status: status,
        overdue: overdue,
      ),
      quiet: quiet,
    );
  }

  Future<void> _loadData({
    required int page,
    required int sequence,
    required String? status,
    required bool overdue,
  }) async {
    if (!mounted || sequence != _requestSequence) return;
    if (!isQuietRefresh) {
      setState(() {
        _loading = true;
        _error = null;
      });
    }
    try {
      final result = await repairService.getMyWorkOrders(
        page: page,
        limit: _pageSize,
        repairView: status,
        overdueOnly: overdue,
      );
      if (mounted && sequence == _requestSequence) {
        setState(() {
          _page = result;
          _error = null;
        });
      }
    } on ApiException catch (error) {
      if (mounted && sequence == _requestSequence && !isQuietRefresh) {
        setState(() => _error = error.message);
      }
    } finally {
      if (mounted && sequence == _requestSequence) {
        setState(() => _loading = false);
      }
    }
  }

  void _selectStatus(String? status) {
    if (status == 'overdue') {
      setState(() => _overdueOnly = !_overdueOnly);
    } else {
      setState(() {
        _status = status;
        if (status == null) _overdueOnly = false;
      });
    }
    _load();
  }

  @override
  Widget build(BuildContext context) => RepairPage(
    fillAvailableHeight:
        _loading || _error != null || (_page?.items.isEmpty ?? true),
    appBar: RepairAppBar(
      title: 'Work Orders',
      subtitle: 'Manage your assigned repairs.',
      actions: [
        IconButton(
          tooltip: 'Refresh work orders',
          onPressed: _loading ? null : () => _load(page: _page?.page ?? 1),
          icon: const Icon(Icons.refresh_rounded),
        ),
        const SizedBox(width: AppSpacing.sm),
      ],
    ),
    selectedNavigationIndex: 1,
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        _StatusFilters(
          selected: _status,
          overdueOnly: _overdueOnly,
          onSelected: _selectStatus,
        ),
        if (!_loading && _error == null) ...[
          const SizedBox(height: AppSpacing.sm),
          Text(
            '${_page?.total ?? 0} matching work orders',
            style: Theme.of(context).textTheme.bodySmall,
          ),
        ],
        const SizedBox(height: AppSpacing.lg),
        if (_loading || _error != null || (_page?.items.isEmpty ?? true))
          Expanded(
            child: Align(alignment: const Alignment(0, -.18), child: _body()),
          )
        else
          _body(),
      ],
    ),
  );

  Widget _body() {
    if (_loading) {
      return const LunasStateView(
        state: LunasViewState.loading,
        title: 'Loading assigned work orders',
        message: 'Retrieving only the work orders assigned to your account.',
      );
    }
    if (_error != null) {
      return LunasStateView(
        state: LunasViewState.error,
        title: 'Could not load work orders',
        message: _error!,
        actionLabel: 'Try Again',
        onAction: _load,
      );
    }
    final page = _page;
    if (page == null || page.items.isEmpty) {
      return LunasStateView(
        state: LunasViewState.empty,
        title: switch (_status) {
          'assigned' => 'No assigned repairs',
          'active' => 'No active repairs',
          'correction' => 'No repairs need correction',
          'overdue' => 'No overdue repairs',
          'review' => 'No repairs awaiting review',
          _ => 'No work orders',
        },
        message: '',
      );
    }
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        for (final workOrder in page.items) ...[
          LiveRepairWorkOrderCard(
            workOrder: workOrder,
            onTap: () => context.push(RepairRoutes.workOrder(workOrder.id)),
          ),
          const SizedBox(height: AppSpacing.sm),
        ],
        if (page.pages > 1) ...[
          const SizedBox(height: AppSpacing.md),
          _Pagination(
            page: page,
            onPrevious: page.hasPreviousPage
                ? () => _load(page: page.page - 1)
                : null,
            onNext: page.hasNextPage ? () => _load(page: page.page + 1) : null,
          ),
        ],
      ],
    );
  }
}

class _StatusFilters extends StatelessWidget {
  const _StatusFilters({
    required this.selected,
    required this.onSelected,
    this.overdueOnly = false,
  });

  final String? selected;
  final bool overdueOnly;
  final ValueChanged<String?> onSelected;

  @override
  Widget build(BuildContext context) {
    const statuses = <(String?, String)>[
      (null, 'All'),
      ('assigned', 'Assigned'),
      ('active', 'Active Repairs'),
      ('correction', 'Needs Correction'),
      ('overdue', 'Overdue'),
      ('review', 'Awaiting Review'),
    ];
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: Row(
        children: [
          for (var index = 0; index < statuses.length; index++) ...[
            if (index > 0) const SizedBox(width: AppSpacing.xs),
            SizedBox(
              width: statuses[index].$2.length > 16
                  ? 164
                  : statuses[index].$2.length > 10
                  ? 144
                  : 72,
              child: LunasFilterButton(
                label: statuses[index].$2,
                selected: statuses[index].$1 == 'overdue'
                    ? overdueOnly
                    : selected == statuses[index].$1 &&
                          (statuses[index].$1 != null || !overdueOnly),
                onTap: () => onSelected(statuses[index].$1),
              ),
            ),
          ],
          if (selected != null || overdueOnly)
            TextButton(
              onPressed: () => onSelected(null),
              child: const Text('Clear Filters'),
            ),
        ],
      ),
    );
  }
}

class _Pagination extends StatelessWidget {
  const _Pagination({
    required this.page,
    required this.onPrevious,
    required this.onNext,
  });

  final RepairWorkOrderPage page;
  final VoidCallback? onPrevious;
  final VoidCallback? onNext;

  @override
  Widget build(BuildContext context) => Row(
    children: [
      Expanded(
        child: OutlinedButton.icon(
          onPressed: onPrevious,
          icon: const Icon(Icons.chevron_left_rounded),
          label: const Text('Previous'),
        ),
      ),
      Padding(
        padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md),
        child: Text('Page ${page.page} of ${page.pages}'),
      ),
      Expanded(
        child: FilledButton.icon(
          onPressed: onNext,
          icon: const Icon(Icons.chevron_right_rounded),
          label: const Text('Next'),
        ),
      ),
    ],
  );
}
