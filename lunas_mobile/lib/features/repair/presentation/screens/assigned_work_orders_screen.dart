import 'package:lunas_mobile/core/widgets/quiet_data_refresh.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:lunas_mobile/core/app_services.dart';
import 'package:lunas_mobile/core/network/api_exception.dart';
import 'package:lunas_mobile/core/theme/app_spacing.dart';
import 'package:lunas_mobile/core/widgets/lunas_state_view.dart';
import 'package:lunas_mobile/features/repair/data/models/repair_models.dart';
import 'package:lunas_mobile/features/repair/presentation/screens/repair_routes.dart';
import 'package:lunas_mobile/features/repair/presentation/screens/repair_widgets.dart';

/// Paginated, assignee-scoped work-order list. Filters are sent to the server
/// with the authenticated repair-personnel request.
class AssignedWorkOrdersScreen extends StatefulWidget {
  const AssignedWorkOrdersScreen({super.key});

  @override
  State<AssignedWorkOrdersScreen> createState() =>
      _AssignedWorkOrdersScreenState();
}

class _AssignedWorkOrdersScreenState extends State<AssignedWorkOrdersScreen>
    with WidgetsBindingObserver, QuietDataRefresh<AssignedWorkOrdersScreen> {
  static const _pageSize = 20;
  bool _loading = true;
  String? _error;
  RepairWorkOrderPage? _page;
  RepairWorkOrderStatus? _status;

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  Future<void> refreshVisibleData() =>
      _load(quiet: true, page: _page?.page ?? 1);

  Future<void> _load({int page = 1, bool quiet = false}) =>
      loadScreenData(() => _loadData(page: page), quiet: quiet);

  Future<void> _loadData({int page = 1}) async {
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
        status: _status,
      );
      if (mounted) {
        setState(() {
          _page = result;
          _error = null;
        });
      }
    } on ApiException catch (error) {
      if (mounted && !isQuietRefresh) {
        setState(() => _error = error.message);
      }
    } finally {
      if (mounted) {
        setState(() => _loading = false);
      }
    }
  }

  void _selectStatus(RepairWorkOrderStatus? status) {
    if (_status == status) return;
    setState(() => _status = status);
    _load();
  }

  @override
  Widget build(BuildContext context) => RepairPage(
    appBar: RepairAppBar(
      title: 'LUNAS Repair',
      subtitle: 'Assigned work orders',
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
        _StatusFilters(selected: _status, onSelected: _selectStatus),
        const SizedBox(height: AppSpacing.lg),
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
        actionLabel: 'Try again',
        onAction: _load,
      );
    }
    final page = _page;
    if (page == null || page.items.isEmpty) {
      return const LunasStateView(
        state: LunasViewState.empty,
        title: 'No assigned work orders',
        message: 'No work orders match the selected status.',
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
  const _StatusFilters({required this.selected, required this.onSelected});

  final RepairWorkOrderStatus? selected;
  final ValueChanged<RepairWorkOrderStatus?> onSelected;

  @override
  Widget build(BuildContext context) {
    const statuses = <(RepairWorkOrderStatus?, String)>[
      (null, 'All'),
      (RepairWorkOrderStatus.pending, 'Pending'),
      (RepairWorkOrderStatus.accepted, 'Accepted'),
      (RepairWorkOrderStatus.inProgress, 'In progress'),
      (RepairWorkOrderStatus.completed, 'Provider review'),
      (RepairWorkOrderStatus.reworkRequired, 'Correction'),
    ];
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: Row(
        children: [
          for (final status in statuses)
            Padding(
              padding: const EdgeInsets.only(right: AppSpacing.xs),
              child: ChoiceChip(
                label: Text(status.$2),
                selected: selected == status.$1,
                onSelected: (_) => onSelected(status.$1),
              ),
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
