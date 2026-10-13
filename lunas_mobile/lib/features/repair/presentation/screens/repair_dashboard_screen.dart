import 'package:lunas_mobile/core/widgets/lunas_card.dart';
import 'package:lunas_mobile/core/widgets/quiet_data_refresh.dart';
import 'package:flutter/material.dart';
import 'package:lunas_mobile/core/widgets/lunas_app_bar.dart';
import 'package:go_router/go_router.dart';
import 'package:lunas_mobile/app/app_services.dart';
import 'package:lunas_mobile/core/network/api_exception.dart';
import 'package:lunas_mobile/core/theme/app_colors.dart';
import 'package:lunas_mobile/core/theme/app_spacing.dart';
import 'package:lunas_mobile/core/widgets/lunas_state_view.dart';
import 'package:lunas_mobile/features/auth/presentation/widgets/auth_scope.dart';
import 'package:lunas_mobile/features/repair/data/models/repair_models.dart';
import 'package:lunas_mobile/features/repair/routes/repair_routes.dart';
import 'package:lunas_mobile/features/repair/presentation/widgets/repair_widgets.dart';

/// The repair-personnel landing page. Counts and priority work orders always
/// come from the authenticated account's server-scoped endpoints.
class RepairDashboardScreen extends StatefulWidget {
  const RepairDashboardScreen({super.key});

  @override
  State<RepairDashboardScreen> createState() => _RepairDashboardScreenState();
}

class _RepairDashboardScreenState extends State<RepairDashboardScreen>
    with WidgetsBindingObserver, QuietDataRefresh<RepairDashboardScreen> {
  bool _loading = true;
  String? _error;
  RepairDashboardSummary? _summary;
  List<RepairWorkOrder> _workOrders = const [];

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  Future<void> refreshVisibleData() => _load(quiet: true);

  Future<void> _load({bool quiet = false}) =>
      loadScreenData(_loadData, quiet: quiet);

  Future<void> _loadData() async {
    if (!isQuietRefresh) {
      setState(() {
        _loading = true;
        _error = null;
      });
    }
    try {
      final summary = await repairService.getDashboardSummary();
      final workOrders = await repairService.getMyWorkOrders(limit: 3);
      if (!mounted) return;
      setState(() {
        _error = null;
        _summary = summary;
        _workOrders = workOrders.items;
      });
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

  @override
  Widget build(BuildContext context) {
    final name = AuthScope.of(context).user?.firstName.trim();
    return RepairPage(
      appBar: LunasAppBar(
        title: 'LUNAS',
        titleWidget: Image.asset(
          'assets/icons/lunas_logo.png',
          height: 30,
          width: 30,
          fit: BoxFit.contain,
          semanticLabel: 'LUNAS',
        ),
        actions: [
          IconButton(
            tooltip: 'Refresh dashboard',
            onPressed: _loading ? null : _load,
            icon: const Icon(Icons.refresh_rounded),
          ),
          const SizedBox(width: AppSpacing.sm),
        ],
      ),
      selectedNavigationIndex: 0,
      fillAvailableHeight: _loading,
      child: _body(context, name),
    );
  }

  Widget _body(BuildContext context, String? firstName) {
    if (_loading) {
      return const LunasHomeLoadingView();
    }
    if (_error != null) {
      return LunasStateView(
        state: LunasViewState.error,
        title: 'Could not load repair work',
        message: _error!,
        actionLabel: 'Try Again',
        onAction: _load,
      );
    }
    final summary = _summary;
    if (summary == null) {
      return LunasStateView(
        state: LunasViewState.error,
        title: 'Repair summary unavailable',
        message: 'The server did not return a repair dashboard summary.',
        actionLabel: 'Try Again',
        onAction: _load,
      );
    }
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text(
          'Hello${firstName == null || firstName.isEmpty ? '' : ', $firstName'}',
          style: Theme.of(context).textTheme.headlineLarge?.copyWith(
            fontSize: 28,
            fontWeight: FontWeight.w700,
          ),
        ),
        const SizedBox(height: AppSpacing.xs),
        const Text(
          'Review assignments, update field progress, and watch SLA deadlines.',
        ),
        const SizedBox(height: AppSpacing.xl),
        _RepairMetrics(summary: summary),
        if (summary.overdue > 0 || summary.approachingDeadline > 0) ...[
          const SizedBox(height: AppSpacing.lg),
          _SlaNotice(
            overdue: summary.overdue,
            approaching: summary.approachingDeadline,
            onOpenTasks: () => context.go(
              summary.overdue > 0
                  ? RepairRoutes.filteredWorkOrders('overdue')
                  : RepairRoutes.filteredWorkOrders('approaching'),
            ),
          ),
        ],
        const SizedBox(height: AppSpacing.xl),
        RepairSectionTitle(
          title: 'Assigned Work Orders',
          actionLabel: 'View All',
          onAction: () => context.go(RepairRoutes.workOrders),
        ),
        const SizedBox(height: AppSpacing.sm),
        if (_workOrders.isEmpty)
          const _DashboardEmptyWorkOrders()
        else
          for (final workOrder in _workOrders) ...[
            LiveRepairWorkOrderCard(
              workOrder: workOrder,
              onTap: () => context.push(RepairRoutes.workOrder(workOrder.id)),
            ),
            const SizedBox(height: AppSpacing.sm),
          ],
      ],
    );
  }
}

class _RepairMetrics extends StatelessWidget {
  const _RepairMetrics({required this.summary});

  final RepairDashboardSummary summary;

  @override
  Widget build(BuildContext context) {
    final metrics = [
      (
        label: 'Assigned Repairs',
        filter: 'assigned',
        value:
            summary.assignedRepairs ??
            (summary.pendingAssignments + summary.accepted),
        icon: Icons.assignment_outlined,
        color: AppColorsLight.info,
      ),
      (
        label: 'Active Repairs',
        filter: 'active',
        value: summary.inProgress,
        icon: Icons.build_outlined,
        color: AppColorsLight.brandBase,
      ),
      (
        label: 'Needs Correction',
        filter: 'correction',
        value: summary.needsCorrection,
        icon: Icons.build_circle_outlined,
        color: AppColorsLight.alert,
      ),
      (
        label: 'Overdue',
        filter: 'overdue',
        value: summary.overdue,
        icon: Icons.warning_amber_rounded,
        color: AppColorsLight.critical,
      ),
      (
        label: 'Awaiting Review',
        filter: 'review',
        value: summary.readyForCompletion,
        icon: Icons.fact_check_outlined,
        color: AppColorsLight.brandBase,
      ),
    ];
    return LayoutBuilder(
      builder: (context, constraints) {
        if (constraints.maxWidth < 600) {
          return Column(
            children: [
              for (var index = 0; index < metrics.length; index++) ...[
                if (index > 0) const SizedBox(height: AppSpacing.sm),
                LunasCard(
                  onTap: () => context.go(
                    RepairRoutes.filteredWorkOrders(metrics[index].filter),
                  ),
                  padding: const EdgeInsets.all(AppSpacing.md),
                  child: Row(
                    children: [
                      Icon(
                        metrics[index].icon,
                        color: metrics[index].color,
                        size: 24,
                      ),
                      const SizedBox(width: AppSpacing.md),
                      Expanded(
                        child: Text(
                          metrics[index].label,
                          style: Theme.of(context).textTheme.titleSmall,
                        ),
                      ),
                      const SizedBox(width: AppSpacing.sm),
                      Text(
                        '${metrics[index].value}',
                        style: Theme.of(context).textTheme.titleLarge?.copyWith(
                          color: metrics[index].color,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ],
          );
        }
        final columns = constraints.maxWidth >= 900 ? 4 : 2;
        final width =
            (constraints.maxWidth - (AppSpacing.sm * (columns - 1))) / columns;
        return Wrap(
          spacing: AppSpacing.sm,
          runSpacing: AppSpacing.sm,
          children: [
            for (final metric in metrics)
              SizedBox(
                width: width,
                child: RepairMetricCard(
                  label: metric.label,
                  value: '${metric.value}',
                  icon: metric.icon,
                  color: metric.color,
                  onTap: () => context.go(
                    RepairRoutes.filteredWorkOrders(metric.filter),
                  ),
                ),
              ),
          ],
        );
      },
    );
  }
}

class _SlaNotice extends StatelessWidget {
  const _SlaNotice({
    required this.overdue,
    required this.approaching,
    required this.onOpenTasks,
  });

  final int overdue;
  final int approaching;
  final VoidCallback onOpenTasks;

  @override
  Widget build(BuildContext context) {
    final isOverdue = overdue > 0;
    final color = isOverdue ? AppColorsLight.critical : AppColorsLight.alert;
    final title = isOverdue
        ? 'SLA Deadline Breached'
        : 'SLA Deadline Approaching';
    final message = isOverdue
        ? '$overdue assigned work order${overdue == 1 ? ' is' : 's are'} overdue.'
        : '$approaching assigned work order${approaching == 1 ? ' is' : 's are'} nearing the deadline.';
    return Material(
      color: color.withValues(alpha: .05),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(color: color.withValues(alpha: .25)),
      ),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: onOpenTasks,
        child: Padding(
          padding: const EdgeInsets.all(AppSpacing.md),
          child: Row(
            children: [
              Icon(
                isOverdue
                    ? Icons.warning_amber_rounded
                    : Icons.schedule_rounded,
                color: color,
                size: 22,
              ),
              const SizedBox(width: AppSpacing.sm),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      title,
                      style: Theme.of(context).textTheme.titleSmall?.copyWith(
                        color: color,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: AppSpacing.xxs),
                    Text(
                      message,
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: Theme.of(context).colorScheme.onSurfaceVariant,
                        height: 1.4,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: AppSpacing.xs),
              Icon(Icons.chevron_right_rounded, color: color, size: 22),
            ],
          ),
        ),
      ),
    );
  }
}

class _DashboardEmptyWorkOrders extends StatelessWidget {
  const _DashboardEmptyWorkOrders();

  @override
  Widget build(BuildContext context) => const Padding(
    padding: EdgeInsets.symmetric(vertical: AppSpacing.xl),
    child: Center(child: Text('No assigned work orders.')),
  );
}
