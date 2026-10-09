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
            onOpenTasks: () => context.go(RepairRoutes.workOrders),
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
        label: 'Pending',
        value: summary.pendingAssignments,
        icon: Icons.assignment_outlined,
        color: AppColorsLight.info,
      ),
      (
        label: 'Accepted',
        value: summary.accepted,
        icon: Icons.task_alt_outlined,
        color: AppColorsLight.success,
      ),
      (
        label: 'In Progress',
        value: summary.inProgress,
        icon: Icons.timelapse_outlined,
        color: AppColorsLight.alert,
      ),
      (
        label: 'Approaching',
        value: summary.approachingDeadline,
        icon: Icons.schedule_outlined,
        color: AppColorsLight.alert,
      ),
      (
        label: 'Overdue',
        value: summary.overdue,
        icon: Icons.warning_amber_rounded,
        color: AppColorsLight.critical,
      ),
      (
        label: 'Ready',
        value: summary.readyForCompletion,
        icon: Icons.pending_actions_outlined,
        color: AppColorsLight.success,
      ),
    ];
    return LayoutBuilder(
      builder: (context, constraints) {
        final columns = constraints.maxWidth >= 600 ? 3 : 2;
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
    final message = isOverdue
        ? 'CRITICAL: SLA Breach Risk\n$overdue assigned work order${overdue == 1 ? ' is' : 's are'} overdue.'
        : '$approaching assigned work order${approaching == 1 ? ' is' : 's are'} approaching the SLA deadline.';
    return Container(
      padding: const EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        color: color.withValues(alpha: .10),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withValues(alpha: .35)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(Icons.warning_amber_rounded, color: color),
          const SizedBox(width: AppSpacing.sm),
          Expanded(
            child: Text(
              message,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: color,
                fontWeight: isOverdue ? FontWeight.w700 : FontWeight.w600,
              ),
            ),
          ),
          TextButton(onPressed: onOpenTasks, child: const Text('Open tasks')),
        ],
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
