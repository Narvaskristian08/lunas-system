import 'package:flutter/material.dart';
import 'package:lunas_mobile/core/app_services.dart';
import 'package:lunas_mobile/core/network/api_exception.dart';
import 'package:lunas_mobile/core/theme/app_spacing.dart';
import 'package:lunas_mobile/core/widgets/lunas_card.dart';
import 'package:lunas_mobile/core/widgets/lunas_state_view.dart';
import 'package:lunas_mobile/features/repair/data/models/repair_models.dart';

/// Uses backend SLA classifications and scoped work-order queries.
class OfficialSlaOverviewScreen extends StatefulWidget {
  const OfficialSlaOverviewScreen({required this.title, super.key});
  final String title;

  @override
  State<OfficialSlaOverviewScreen> createState() =>
      _OfficialSlaOverviewScreenState();
}

class _OfficialSlaOverviewScreenState extends State<OfficialSlaOverviewScreen> {
  bool _loading = true;
  String? _error;
  RepairWorkOrderPage? _approaching;
  RepairWorkOrderPage? _overdue;

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
      final pages = await Future.wait([
        repairService.getWorkOrders(slaState: 'approaching', limit: 50),
        repairService.getWorkOrders(slaState: 'overdue', limit: 50),
      ]);
      if (mounted) {
        setState(() {
          _approaching = pages[0];
          _overdue = pages[1];
        });
      }
    } on ApiException catch (error) {
      if (mounted) setState(() => _error = error.message);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(
      title: Text(widget.title),
      actions: [
        IconButton(
          onPressed: _loading ? null : _load,
          icon: const Icon(Icons.refresh_rounded),
          tooltip: 'Refresh SLA data',
        ),
      ],
    ),
    body: _loading
        ? const LunasStateView(
            state: LunasViewState.loading,
            title: 'Loading SLA records',
            message:
                'Getting server-classified deadlines in your authorized scope.',
          )
        : _error != null
        ? LunasStateView(
            state: LunasViewState.error,
            title: 'Could not load SLA records',
            message: _error!,
            actionLabel: 'Retry',
            onAction: _load,
          )
        : ListView(
            padding: const EdgeInsets.all(AppSpacing.lg),
            children: [
              Row(
                children: [
                  Expanded(
                    child: _countCard(
                      context,
                      'Near deadline',
                      _approaching?.total ?? 0,
                      Colors.orange,
                    ),
                  ),
                  const SizedBox(width: AppSpacing.sm),
                  Expanded(
                    child: _countCard(
                      context,
                      'Overdue',
                      _overdue?.total ?? 0,
                      Theme.of(context).colorScheme.error,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: AppSpacing.lg),
              _section(
                context,
                'Near deadline',
                _approaching?.items ?? const [],
                false,
              ),
              const SizedBox(height: AppSpacing.lg),
              _section(context, 'Overdue', _overdue?.items ?? const [], true),
            ],
          ),
  );

  Widget _countCard(
    BuildContext context,
    String title,
    int total,
    Color color,
  ) => LunasCard(
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(title, style: Theme.of(context).textTheme.bodyMedium),
        const SizedBox(height: AppSpacing.sm),
        Text(
          '$total',
          style: Theme.of(context).textTheme.headlineLarge?.copyWith(
            color: color,
            fontWeight: FontWeight.w800,
          ),
        ),
      ],
    ),
  );

  Widget _section(
    BuildContext context,
    String title,
    List<RepairWorkOrder> orders,
    bool isOverdue,
  ) => Column(
    crossAxisAlignment: CrossAxisAlignment.stretch,
    children: [
      Text(
        title,
        style: Theme.of(
          context,
        ).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w800),
      ),
      const SizedBox(height: AppSpacing.sm),
      if (orders.isEmpty)
        LunasCard(child: Text('No ${title.toLowerCase()} work orders.'))
      else
        for (final order in orders)
          Padding(
            padding: const EdgeInsets.only(bottom: AppSpacing.sm),
            child: LunasCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    order.incidentReference.isEmpty
                        ? order.orderNumber
                        : order.incidentReference,
                    style: Theme.of(context).textTheme.bodySmall,
                  ),
                  const SizedBox(height: AppSpacing.xs),
                  Text(
                    order.category,
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const SizedBox(height: AppSpacing.xs),
                  Text(
                    '${order.location.displayAddress} - ${order.currentAssignment?.assignee?.name ?? 'Unassigned'}',
                  ),
                  const SizedBox(height: AppSpacing.xs),
                  Text(
                    order.sla.deadline == null
                        ? 'Deadline unavailable'
                        : '${isOverdue ? 'Overdue' : 'Due'} ${order.sla.deadline!.toLocal()}',
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: isOverdue
                          ? Theme.of(context).colorScheme.error
                          : Colors.orange,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ],
              ),
            ),
          ),
    ],
  );
}
