import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:lunas_mobile/app/app_services.dart';
import 'package:lunas_mobile/core/network/api_exception.dart';
import 'package:lunas_mobile/core/theme/app_spacing.dart';
import 'package:lunas_mobile/core/widgets/lunas_card.dart';
import 'package:lunas_mobile/core/widgets/lunas_state_view.dart';
import 'package:lunas_mobile/features/repair/data/models/repair_models.dart';
import 'package:lunas_mobile/features/repair/routes/repair_routes.dart';
import 'package:lunas_mobile/features/repair/presentation/widgets/repair_widgets.dart';

/// Explicit start-work action. The app does not begin background personnel
/// tracking when a repair is started.
class StartRepairScreen extends StatefulWidget {
  const StartRepairScreen({required this.workOrderId, super.key});

  final String workOrderId;

  @override
  State<StartRepairScreen> createState() => _StartRepairScreenState();
}

class _StartRepairScreenState extends State<StartRepairScreen> {
  bool _loading = true;
  bool _starting = false;
  String? _error;
  RepairWorkOrder? _workOrder;

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
      final workOrder = await repairService.getWorkOrder(widget.workOrderId);
      if (mounted) setState(() => _workOrder = workOrder);
    } on ApiException catch (error) {
      if (mounted) setState(() => _error = error.message);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _start() async {
    final workOrder = _workOrder;
    if (workOrder == null) return;
    setState(() => _starting = true);
    try {
      await repairService.start(workOrder.id, version: workOrder.version);
      if (!mounted) return;
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('Repair work started.')));
      context.go(RepairRoutes.progress(workOrder.id));
    } on ApiException catch (error) {
      if (!mounted) return;
      if (error.isConflict) {
        await _load();
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text(
              'This work order changed on the server. Please review it again.',
            ),
          ),
        );
      } else {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text(error.message)));
      }
    } finally {
      if (mounted) setState(() => _starting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Scaffold(
        body: SafeArea(
          child: LunasStateView(
            state: LunasViewState.loading,
            title: 'Loading work order',
            message: 'Confirming that this accepted assignment can start.',
          ),
        ),
      );
    }
    if (_error != null || _workOrder == null) {
      return Scaffold(
        appBar: const RepairAppBar(title: 'Start Repair', showBackButton: true),
        body: SafeArea(
          child: LunasStateView(
            state: LunasViewState.error,
            title: 'Could not start repair',
            message: _error ?? 'This work order is unavailable.',
            actionLabel: 'Try again',
            onAction: _load,
          ),
        ),
      );
    }
    final workOrder = _workOrder!;
    return RepairPage(
      appBar: const RepairAppBar(title: 'Start Repair', showBackButton: true),
      bottomActionBar: _StartActionBar(
        starting: _starting,
        canStart: workOrder.canStart,
        onStart: _start,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(
            workOrder.orderNumber,
            style: Theme.of(
              context,
            ).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w700),
          ),
          const SizedBox(height: AppSpacing.md),
          LunasCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text(
                  'Confirm Site',
                  style: Theme.of(context).textTheme.titleLarge,
                ),
                const SizedBox(height: AppSpacing.sm),
                Text(workOrder.location.displayAddress),
                const SizedBox(height: AppSpacing.md),
                Text(
                  workOrder.description.isEmpty
                      ? 'No citizen description was returned.'
                      : workOrder.description,
                ),
              ],
            ),
          ),
          const SizedBox(height: AppSpacing.md),
          if (!workOrder.canStart) ...[
            const SizedBox(height: AppSpacing.lg),
            const Text(
              'This work order is no longer in the accepted state. Refresh the detail page before taking another action.',
            ),
          ],
        ],
      ),
    );
  }
}

class _StartActionBar extends StatelessWidget {
  const _StartActionBar({
    required this.starting,
    required this.canStart,
    required this.onStart,
  });

  final bool starting;
  final bool canStart;
  final VoidCallback onStart;

  @override
  Widget build(BuildContext context) => SafeArea(
    top: false,
    child: Container(
      padding: const EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface,
        border: Border(
          top: BorderSide(color: Theme.of(context).colorScheme.outlineVariant),
        ),
      ),
      child: FilledButton.icon(
        onPressed: starting || !canStart ? null : onStart,
        icon: starting
            ? const SizedBox(
                width: 18,
                height: 18,
                child: CircularProgressIndicator(strokeWidth: 2),
              )
            : const Icon(Icons.play_circle_outline_rounded),
        label: Text(starting ? 'Starting repair…' : 'Confirm and Start Repair'),
      ),
    ),
  );
}
