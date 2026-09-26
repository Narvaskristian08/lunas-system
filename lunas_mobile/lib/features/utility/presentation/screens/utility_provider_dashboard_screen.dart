import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:lunas_mobile/core/app_services.dart';
import 'package:lunas_mobile/core/network/api_exception.dart';
import 'package:lunas_mobile/core/theme/app_colors.dart';
import 'package:lunas_mobile/core/theme/app_spacing.dart';
import 'package:lunas_mobile/core/widgets/lunas_app_bar.dart';
import 'package:lunas_mobile/core/widgets/lunas_card.dart';
import 'package:lunas_mobile/core/widgets/lunas_state_view.dart';
import 'package:lunas_mobile/features/auth/presentation/widgets/auth_scope.dart';
import 'package:lunas_mobile/features/repair/data/models/repair_models.dart';
import 'package:lunas_mobile/features/repair/presentation/screens/repair_widgets.dart';
import 'package:lunas_mobile/features/utility/presentation/screens/utility_routes.dart';

/// Provider-facing overview for work that the API has routed to the
/// authenticated utility organization. It intentionally has no validation or
/// repair-personnel actions; those remain separate, server-enforced roles.
class UtilityProviderDashboardScreen extends StatefulWidget {
  const UtilityProviderDashboardScreen({super.key});

  @override
  State<UtilityProviderDashboardScreen> createState() =>
      _UtilityProviderDashboardScreenState();
}

class _UtilityProviderDashboardScreenState
    extends State<UtilityProviderDashboardScreen> {
  bool _loading = true;
  String? _error;
  RepairDashboardSummary? _summary;
  List<RepairWorkOrder> _workOrders = const [];

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
      final result = await Future.wait([
        repairService.getDashboardSummary(),
        repairService.getWorkOrders(page: 1, limit: 3),
      ]);
      if (!mounted) return;
      setState(() {
        _summary = result[0] as RepairDashboardSummary;
        _workOrders = (result[1] as RepairWorkOrderPage).items;
      });
    } on ApiException catch (error) {
      if (mounted) setState(() => _error = error.message);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _signOut() => AuthScope.of(context).logout();

  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: LunasAppBar(
      title: 'Utility operations',
      subtitle: 'Provider work orders in your authorized scope',
      actions: [
        IconButton(
          tooltip: 'Refresh provider dashboard',
          onPressed: _loading ? null : _load,
          icon: const Icon(Icons.refresh_rounded),
        ),
        IconButton(
          tooltip: 'Sign out',
          onPressed: _loading ? null : _signOut,
          icon: const Icon(Icons.logout_rounded),
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
            constraints: const BoxConstraints(maxWidth: 820),
            child: _body(),
          ),
        ),
      ),
    ),
  );

  Widget _body() {
    if (_loading) {
      return const LunasStateView(
        state: LunasViewState.loading,
        title: 'Loading provider operations',
        message: 'Retrieving work orders routed to your utility organization.',
      );
    }
    if (_error != null) {
      return LunasStateView(
        state: LunasViewState.error,
        title: 'Could not load provider operations',
        message: _error!,
        actionLabel: 'Try again',
        onAction: _load,
      );
    }
    final summary = _summary;
    if (summary == null) {
      return LunasStateView(
        state: LunasViewState.error,
        title: 'Provider summary unavailable',
        message: 'The server did not return a provider work-order summary.',
        actionLabel: 'Try again',
        onAction: _load,
      );
    }
    final firstName = AuthScope.of(context).user?.firstName.trim();
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text(
          'Hello${firstName == null || firstName.isEmpty ? '' : ', $firstName'}',
          style: Theme.of(context).textTheme.headlineLarge?.copyWith(
            fontWeight: FontWeight.w800,
          ),
        ),
        const SizedBox(height: AppSpacing.xs),
        const Text(
          'Monitor utility work orders and SLA deadlines assigned to your organization.',
        ),
        const SizedBox(height: AppSpacing.xl),
        _ProviderMetrics(summary: summary),
        const SizedBox(height: AppSpacing.xl),
        LunasCard(
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Icon(Icons.shield_outlined),
              const SizedBox(width: AppSpacing.md),
              const Expanded(
                child: Text(
                  'Only work routed to this utility organization is shown. Validation decisions and on-site repair updates stay with their authorized roles.',
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: AppSpacing.xxl),
        Row(
          children: [
            Expanded(
              child: Text(
                'Recent work orders',
                style: Theme.of(context).textTheme.titleLarge,
              ),
            ),
            TextButton(
              onPressed: () => context.go(UtilityRoutes.workOrders),
              child: const Text('View all'),
            ),
          ],
        ),
        const SizedBox(height: AppSpacing.sm),
        if (_workOrders.isEmpty)
          const LunasCard(
            child: Text(
              'No work orders have been routed to this provider yet.'),
          )
        else
          for (final workOrder in _workOrders) ...[
            LiveRepairWorkOrderCard(
              workOrder: workOrder,
              onTap: () => context.go(UtilityRoutes.workOrders),
            ),
            const SizedBox(height: AppSpacing.sm),
          ],
      ],
    );
  }
}

class _ProviderMetrics extends StatelessWidget {
  const _ProviderMetrics({required this.summary});

  final RepairDashboardSummary summary;

  @override
  Widget build(BuildContext context) {
    final metrics = [
      (
        label: 'Pending',
        value: summary.pendingAssignments,
        icon: Icons.assignment_outlined,
        color: AppColorsLight.info,
        detail: 'Awaiting acceptance',
      ),
      (
        label: 'Active',
        value: summary.inProgress,
        icon: Icons.engineering_outlined,
        color: AppColorsLight.brandBase,
        detail: 'Repairs in progress',
      ),
      (
        label: 'Approaching',
        value: summary.approachingDeadline,
        icon: Icons.schedule_outlined,
        color: AppColorsLight.alert,
        detail: 'SLA warning',
      ),
      (
        label: 'Overdue',
        value: summary.overdue,
        icon: Icons.warning_amber_rounded,
        color: AppColorsLight.critical,
        detail: 'Needs attention',
      ),
      (
        label: 'Ready',
        value: summary.readyForCompletion,
        icon: Icons.pending_actions_outlined,
        color: AppColorsLight.success,
        detail: 'Awaiting verification',
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
                  description: metric.detail,
                ),
              ),
          ],
        );
      },
    );
  }
}
