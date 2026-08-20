import 'package:flutter/material.dart';
import 'package:lunas_mobile/core/app_services.dart';
import 'package:lunas_mobile/core/network/api_exception.dart';
import 'package:lunas_mobile/core/theme/app_colors.dart';
import 'package:lunas_mobile/core/theme/app_spacing.dart';
import 'package:lunas_mobile/core/widgets/lunas_app_bar.dart';
import 'package:lunas_mobile/core/widgets/lunas_card.dart';
import 'package:lunas_mobile/core/widgets/lunas_state_view.dart';
import 'package:lunas_mobile/features/repair/data/models/repair_models.dart';
import 'package:lunas_mobile/features/repair/presentation/screens/repair_widgets.dart';

/// Read-only, server-scoped work-order monitoring for officials. Assignment
/// management and completion verification intentionally remain outside mobile
/// scope; the API enforces which records this account can see.
class OfficialWorkOrdersScreen extends StatefulWidget {
  const OfficialWorkOrdersScreen({super.key});

  @override
  State<OfficialWorkOrdersScreen> createState() => _OfficialWorkOrdersScreenState();
}

class _OfficialWorkOrdersScreenState extends State<OfficialWorkOrdersScreen> {
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

  Future<void> _load({int page = 1}) async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final result = await repairService.getWorkOrders(
        page: page,
        limit: _pageSize,
        status: _status,
      );
      if (mounted) setState(() => _page = result);
    } on ApiException catch (error) {
      if (mounted) setState(() => _error = error.message);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: LunasAppBar(
      title: 'Work orders',
      subtitle: 'Read-only monitoring in your server-authorized scope',
      showBackButton: true,
      actions: [
        IconButton(
          tooltip: 'Refresh work orders',
          onPressed: _loading ? null : () => _load(page: _page?.page ?? 1),
          icon: const Icon(Icons.refresh_rounded),
        ),
        const SizedBox(width: AppSpacing.sm),
      ],
    ),
    body: SafeArea(
      top: false,
      child: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(
          AppSpacing.xl,
          AppSpacing.md,
          AppSpacing.xl,
          AppSpacing.hero,
        ),
        child: Align(
          alignment: Alignment.topCenter,
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 960),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                _StatusFilters(
                  selected: _status,
                  onSelected: (status) {
                    if (_status == status) return;
                    setState(() => _status = status);
                    _load();
                  },
                ),
                const SizedBox(height: AppSpacing.lg),
                _body(),
              ],
            ),
          ),
        ),
      ),
    ),
  );

  Widget _body() {
    if (_loading) {
      return const LunasStateView(
        state: LunasViewState.loading,
        title: 'Loading work orders',
        message: 'Retrieving only records in your permitted scope.',
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
        title: 'No work orders found',
        message: 'No work orders match the selected status in your scope.',
      );
    }
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const LunasCard(
          child: Text(
            'This mobile view is read-only. Assignment, reassignment, and formal completion verification are not exposed here.',
          ),
        ),
        const SizedBox(height: AppSpacing.md),
        for (final workOrder in page.items) ...[
          _OfficialWorkOrderCard(workOrder: workOrder),
          const SizedBox(height: AppSpacing.sm),
        ],
        if (page.pages > 1) ...[
          const SizedBox(height: AppSpacing.md),
          Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: page.hasPreviousPage ? () => _load(page: page.page - 1) : null,
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
                  onPressed: page.hasNextPage ? () => _load(page: page.page + 1) : null,
                  icon: const Icon(Icons.chevron_right_rounded),
                  label: const Text('Next'),
                ),
              ),
            ],
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
    const filters = <(RepairWorkOrderStatus?, String)>[
      (null, 'All'),
      (RepairWorkOrderStatus.pending, 'Pending'),
      (RepairWorkOrderStatus.accepted, 'Accepted'),
      (RepairWorkOrderStatus.inProgress, 'In progress'),
      (RepairWorkOrderStatus.completed, 'Ready'),
    ];
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: Row(
        children: [
          for (final filter in filters)
            Padding(
              padding: const EdgeInsets.only(right: AppSpacing.xs),
              child: ChoiceChip(
                label: Text(filter.$2),
                selected: selected == filter.$1,
                onSelected: (_) => onSelected(filter.$1),
              ),
            ),
        ],
      ),
    );
  }
}

class _OfficialWorkOrderCard extends StatelessWidget {
  const _OfficialWorkOrderCard({required this.workOrder});

  final RepairWorkOrder workOrder;

  Color get _statusColor => switch (workOrder.status) {
    RepairWorkOrderStatus.pending => AppColorsLight.info,
    RepairWorkOrderStatus.accepted => AppColorsLight.success,
    RepairWorkOrderStatus.inProgress => AppColorsLight.alert,
    RepairWorkOrderStatus.completed => AppColorsLight.success,
    RepairWorkOrderStatus.unknown => AppColorsLight.brandBase,
  };

  @override
  Widget build(BuildContext context) => LunasCard(
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Row(
          children: [
            Expanded(
              child: Text(
                workOrder.orderNumber,
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  fontFamily: 'RobotoMono',
                  fontWeight: FontWeight.w800,
                ),
              ),
            ),
            RepairStatusChip(label: workOrder.status.label, color: _statusColor),
          ],
        ),
        const SizedBox(height: AppSpacing.sm),
        Text(workOrder.category, style: Theme.of(context).textTheme.titleLarge),
        const SizedBox(height: AppSpacing.xs),
        Text(workOrder.location.displayAddress),
        const SizedBox(height: AppSpacing.md),
        LinearProgressIndicator(value: workOrder.progressPercent / 100),
        const SizedBox(height: AppSpacing.xs),
        Text('${workOrder.progressPercent}% · ${workOrder.progressStage.label}'),
        if (workOrder.sla.isOverdue || workOrder.sla.isApproaching) ...[
          const SizedBox(height: AppSpacing.sm),
          RepairStatusChip(
            label: workOrder.sla.isOverdue ? 'Overdue SLA' : 'Approaching SLA deadline',
            color: workOrder.sla.isOverdue ? AppColorsLight.critical : AppColorsLight.alert,
            icon: Icons.timer_outlined,
          ),
        ],
      ],
    ),
  );
}
