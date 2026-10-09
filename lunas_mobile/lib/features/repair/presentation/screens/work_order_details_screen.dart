import 'package:lunas_mobile/core/widgets/quiet_data_refresh.dart';
import 'package:flutter/material.dart';
import 'package:lunas_mobile/features/reporting/data/models/category_option.dart';
import 'package:go_router/go_router.dart';
import 'package:lunas_mobile/core/app_services.dart';
import 'package:lunas_mobile/core/network/api_exception.dart';
import 'package:lunas_mobile/core/theme/app_colors.dart';
import 'package:lunas_mobile/core/theme/app_spacing.dart';
import 'package:lunas_mobile/core/widgets/lunas_card.dart';
import 'package:lunas_mobile/core/widgets/lunas_state_view.dart';
import 'package:lunas_mobile/features/repair/data/models/repair_models.dart';
import 'package:lunas_mobile/features/repair/presentation/screens/repair_routes.dart';
import 'package:lunas_mobile/features/repair/presentation/screens/repair_widgets.dart';
import 'package:lunas_mobile/features/reporting/data/models/incident_report.dart';
import 'package:lunas_mobile/features/reporting/presentation/widgets/evidence_preview.dart';
import 'package:lunas_mobile/features/reporting/presentation/widgets/report_status_timeline.dart';

/// Private detail view for the authenticated assignee. The server validates
/// ownership on every load and action; the page only presents the safe data it
/// returns for field maintenance.
class WorkOrderDetailsScreen extends StatefulWidget {
  const WorkOrderDetailsScreen({required this.workOrderId, super.key});

  final String workOrderId;

  @override
  State<WorkOrderDetailsScreen> createState() => _WorkOrderDetailsScreenState();
}

class _WorkOrderDetailsScreenState extends State<WorkOrderDetailsScreen>
    with WidgetsBindingObserver, QuietDataRefresh<WorkOrderDetailsScreen> {
  bool _loading = true;
  bool _submitting = false;
  String? _error;
  RepairWorkOrder? _workOrder;

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  Future<void> refreshVisibleData() => _load(quiet: true);

  @override
  bool get canRefreshData => !_submitting;

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
      final workOrder = await repairService.getWorkOrder(widget.workOrderId);
      if (mounted) {
        setState(() {
          if (isQuietRefresh && !canRefreshData) return;
          _workOrder = workOrder;
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

  Future<void> _accept() async {
    final workOrder = _workOrder;
    if (workOrder == null) return;
    await _runAction(
      () => repairService.accept(workOrder.id, version: workOrder.version),
      successMessage: 'Assignment accepted. You can now start repair work.',
    );
  }

  Future<void> _decline() async {
    final workOrder = _workOrder;
    if (workOrder == null) return;
    final request = await _showDeclineDialog();
    if (request == null || !mounted) return;
    await _runAction(
      () => repairService.decline(
        workOrder.id,
        reason: request.reason,
        notes: request.notes,
        version: workOrder.version,
      ),
      successMessage:
          'Assignment declined. The responsible official can reassign it.',
      returnToList: true,
    );
  }

  Future<void> _runAction(
    Future<RepairWorkOrder> Function() action, {
    required String successMessage,
    bool returnToList = false,
  }) async {
    setState(() => _submitting = true);
    await waitForDataRequest();
    if (!mounted) return;
    try {
      final updated = await action();
      if (!mounted) return;
      setState(() => _workOrder = updated);
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text(successMessage)));
      if (returnToList) {
        context.go(RepairRoutes.workOrders);
        return;
      }
      await _load();
    } on ApiException catch (error) {
      if (!mounted) return;
      if (error.isConflict) {
        await _load();
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text(
              'This work order changed on the server. The latest record is shown.',
            ),
          ),
        );
      } else {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text(error.message)));
      }
    } finally {
      if (mounted) {
        setState(() => _submitting = false);
      }
    }
  }

  Future<_DeclineRequest?> _showDeclineDialog() async {
    final reasonController = TextEditingController();
    final notesController = TextEditingController();
    String? validationError;
    final result = await showDialog<_DeclineRequest>(
      context: context,
      builder: (dialogContext) => StatefulBuilder(
        builder: (context, setDialogState) => AlertDialog(
          title: const Text('Decline Assignment'),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Text(
                  'A reason is required so the official can safely reassign this work order.',
                ),
                const SizedBox(height: AppSpacing.md),
                TextField(
                  controller: reasonController,
                  maxLength: 500,
                  textCapitalization: TextCapitalization.sentences,
                  decoration: InputDecoration(
                    labelText: 'Decline reason',
                    errorText: validationError,
                  ),
                ),
                TextField(
                  controller: notesController,
                  maxLength: 2000,
                  maxLines: 3,
                  textCapitalization: TextCapitalization.sentences,
                  decoration: const InputDecoration(
                    labelText: 'Additional notes (optional)',
                    alignLabelWithHint: true,
                  ),
                ),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(dialogContext),
              child: const Text('Cancel'),
            ),
            FilledButton(
              onPressed: () {
                final reason = reasonController.text.trim();
                if (reason.length < 2) {
                  setDialogState(
                    () => validationError =
                        'Enter at least 2 characters for the reason.',
                  );
                  return;
                }
                Navigator.pop(
                  dialogContext,
                  _DeclineRequest(
                    reason: reason,
                    notes: notesController.text.trim(),
                  ),
                );
              },
              child: const Text('Decline Assignment'),
            ),
          ],
        ),
      ),
    );
    reasonController.dispose();
    notesController.dispose();
    return result;
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Scaffold(
        body: SafeArea(
          child: LunasStateView(
            state: LunasViewState.loading,
            title: 'Loading work order',
            message: 'Getting assignment, progress, evidence, and SLA details.',
          ),
        ),
      );
    }
    if (_error != null || _workOrder == null) {
      return Scaffold(
        appBar: const RepairAppBar(title: 'Work Order', showBackButton: true),
        body: SafeArea(
          child: LunasStateView(
            state: LunasViewState.error,
            title: 'Could not open this work order',
            message: _error ?? 'This work order is unavailable.',
            actionLabel: 'Try again',
            onAction: _load,
          ),
        ),
      );
    }
    final workOrder = _workOrder!;
    return RepairPage(
      appBar: RepairAppBar(
        title: 'Work Order',
        subtitle: workOrder.orderNumber,
        showBackButton: true,
        actions: [
          IconButton(
            tooltip: 'Refresh work order',
            onPressed: _submitting ? null : _load,
            icon: const Icon(Icons.refresh_rounded),
          ),
          const SizedBox(width: AppSpacing.sm),
        ],
      ),
      bottomActionBar: _ActionBar(
        workOrder: workOrder,
        submitting: _submitting,
        onAccept: _accept,
        onDecline: _decline,
        onStart: () => context.push(RepairRoutes.start(workOrder.id)),
        onProgress: () => context.push(RepairRoutes.progress(workOrder.id)),
      ),
      padding: const EdgeInsets.fromLTRB(
        AppSpacing.xl,
        AppSpacing.lg,
        AppSpacing.xl,
        AppSpacing.xxxl,
      ),
      child: _WorkOrderBody(
        workOrder: workOrder,
        onOpenLocation: () => context.push(RepairRoutes.location(workOrder.id)),
      ),
    );
  }
}

class _DeclineRequest {
  const _DeclineRequest({required this.reason, required this.notes});

  final String reason;
  final String notes;
}

class _ActionBar extends StatelessWidget {
  const _ActionBar({
    required this.workOrder,
    required this.submitting,
    required this.onAccept,
    required this.onDecline,
    required this.onStart,
    required this.onProgress,
  });

  final RepairWorkOrder workOrder;
  final bool submitting;
  final VoidCallback onAccept;
  final VoidCallback onDecline;
  final VoidCallback onStart;
  final VoidCallback onProgress;

  @override
  Widget build(BuildContext context) {
    if (workOrder.isReadyForCompletion) {
      return _ActionContainer(
        child: const Text(
          'Repair Personnel submitted completion. The Utility Provider must review it before City Engineering performs final verification.',
          textAlign: TextAlign.center,
        ),
      );
    }
    if (workOrder.isPendingAcceptance) {
      return _ActionContainer(
        child: Row(
          children: [
            Expanded(
              child: OutlinedButton(
                onPressed: submitting ? null : onDecline,
                child: const Text('Decline'),
              ),
            ),
            const SizedBox(width: AppSpacing.sm),
            Expanded(
              flex: 2,
              child: FilledButton.icon(
                onPressed: submitting ? null : onAccept,
                icon: const Icon(Icons.assignment_turned_in_outlined),
                label: const Text('Accept Assignment'),
              ),
            ),
          ],
        ),
      );
    }
    if (workOrder.canStart) {
      return _ActionContainer(
        child: FilledButton.icon(
          onPressed: submitting ? null : onStart,
          icon: const Icon(Icons.play_circle_outline_rounded),
          label: const Text('Start Repair'),
        ),
      );
    }
    if (workOrder.canUpdateProgress) {
      return _ActionContainer(
        child: FilledButton.icon(
          onPressed: submitting ? null : onProgress,
          icon: const Icon(Icons.edit_note_rounded),
          label: const Text('Update Repair Progress'),
        ),
      );
    }
    return const SizedBox.shrink();
  }
}

class _ActionContainer extends StatelessWidget {
  const _ActionContainer({required this.child});

  final Widget child;

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
      child: child,
    ),
  );
}

class _WorkOrderBody extends StatelessWidget {
  const _WorkOrderBody({required this.workOrder, required this.onOpenLocation});

  final RepairWorkOrder workOrder;
  final VoidCallback onOpenLocation;

  Color get _priorityColor => switch (workOrder.priority) {
    'critical' => AppColorsLight.critical,
    'high' => AppColorsLight.alert,
    'medium' => AppColorsLight.info,
    _ => AppColorsLight.brandBase,
  };

  @override
  Widget build(BuildContext context) => Column(
    crossAxisAlignment: CrossAxisAlignment.stretch,
    children: [
      Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  categoryFromCode(workOrder.category).label,
                  style: Theme.of(
                    context,
                  ).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w700),
                ),
                const SizedBox(height: AppSpacing.xs),
                Text(
                  workOrder.incidentReference,
                  style: Theme.of(context).textTheme.bodySmall,
                ),
              ],
            ),
          ),
          RepairStatusChip(
            label: workOrder.priority ?? 'Priority unavailable',
            color: _priorityColor,
            icon: Icons.priority_high_rounded,
          ),
        ],
      ),
      const SizedBox(height: AppSpacing.lg),
      _ProgressCard(workOrder: workOrder),
      const SizedBox(height: AppSpacing.md),
      _SlaCard(sla: workOrder.sla),
      const SizedBox(height: AppSpacing.lg),
      _Section(
        title: 'Incident Details',
        child: LunasCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              _WorkOrderField(
                label: 'Category',
                value: categoryFromCode(workOrder.category).label,
              ),
              const SizedBox(height: AppSpacing.sm),
              _WorkOrderField(
                label: 'Incident Reference',
                value: workOrder.incidentReference,
              ),
              if (workOrder.description.isNotEmpty) ...[
                const Padding(
                  padding: EdgeInsets.symmetric(vertical: AppSpacing.md),
                  child: Divider(),
                ),
                Text(workOrder.description),
              ],
              if (workOrder.instructions?.isNotEmpty == true) ...[
                const Padding(
                  padding: EdgeInsets.symmetric(vertical: AppSpacing.md),
                  child: Divider(),
                ),
                Text(
                  'Repair Instructions',
                  style: Theme.of(context).textTheme.titleSmall,
                ),
                const SizedBox(height: AppSpacing.xs),
                Text(workOrder.instructions!),
              ],
              for (final event in workOrder.history.where(
                (event) =>
                    event.type == 'provider_correction_requested' ||
                    event.type == 'city_returned',
              )) ...[
                const Padding(
                  padding: EdgeInsets.symmetric(vertical: AppSpacing.md),
                  child: Divider(),
                ),
                Text(
                  event.type == 'city_returned'
                      ? 'City Engineering Correction'
                      : 'Utility Provider Correction',
                  style: Theme.of(context).textTheme.titleSmall,
                ),
                const SizedBox(height: AppSpacing.xs),
                Text(
                  event.notes ??
                      'No additional correction instructions were provided.',
                ),
                if (event.createdAt != null) ...[
                  const SizedBox(height: AppSpacing.xs),
                  Text(
                    formatReportDateTime(event.createdAt),
                    style: Theme.of(context).textTheme.bodySmall,
                  ),
                ],
              ],
            ],
          ),
        ),
      ),
      const SizedBox(height: AppSpacing.lg),
      _Section(
        title: 'Location and Directions',
        child: LunasCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Icon(Icons.location_on_outlined),
                  const SizedBox(width: AppSpacing.md),
                  Expanded(child: Text(workOrder.location.displayAddress)),
                ],
              ),
              const SizedBox(height: AppSpacing.md),
              OutlinedButton.icon(
                onPressed: onOpenLocation,
                icon: const Icon(Icons.map_outlined),
                label: const Text('Open Location Map'),
              ),
            ],
          ),
        ),
      ),
      const SizedBox(height: AppSpacing.lg),
      _Section(
        title: 'Assignment',
        child: _AssignmentCard(workOrder: workOrder),
      ),
      const SizedBox(height: AppSpacing.lg),
      _Section(
        title: 'Citizen Evidence',
        child: _CitizenEvidence(images: workOrder.citizenEvidence),
      ),
      const SizedBox(height: AppSpacing.lg),
      if (workOrder.repairEvidence.isNotEmpty) ...[
        _Section(
          title: 'Repair Evidence',
          child: _RepairEvidence(evidence: workOrder.repairEvidence),
        ),
        const SizedBox(height: AppSpacing.lg),
      ],
      _Section(
        title: 'Repair Progress Timeline',
        child: _ProgressTimeline(items: workOrder.progressUpdates),
      ),
    ],
  );
}

class _ProgressCard extends StatelessWidget {
  const _ProgressCard({required this.workOrder});

  final RepairWorkOrder workOrder;

  @override
  Widget build(BuildContext context) => LunasCard(
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Row(
          children: [
            Expanded(
              child: Text(
                'Repair Progress',
                style: Theme.of(context).textTheme.titleMedium,
              ),
            ),
            RepairStatusChip(
              label: workOrder.status.label,
              color: switch (workOrder.status) {
                RepairWorkOrderStatus.pending => AppColorsLight.info,
                RepairWorkOrderStatus.accepted => AppColorsLight.success,
                RepairWorkOrderStatus.inProgress => AppColorsLight.alert,
                RepairWorkOrderStatus.completed => AppColorsLight.alert,
                RepairWorkOrderStatus.reworkRequired => AppColorsLight.critical,
                RepairWorkOrderStatus.unknown => AppColorsLight.brandBase,
              },
            ),
          ],
        ),
        const SizedBox(height: AppSpacing.lg),
        if (workOrder.isPendingAcceptance &&
            workOrder.status == RepairWorkOrderStatus.inProgress) ...[
          const SizedBox(height: AppSpacing.sm),
          const Text(
            'This is an in-progress handoff awaiting your acceptance. Existing progress and evidence are preserved; accept to resume work.',
          ),
        ],
        if (workOrder.isReadyForCompletion) ...[
          const SizedBox(height: AppSpacing.sm),
          const Text(
            'Your completion is awaiting Utility Provider review. This repair is not yet verified or resolved.',
          ),
        ],
      ],
    ),
  );
}

class _SlaCard extends StatelessWidget {
  const _SlaCard({required this.sla});

  final RepairSla sla;

  @override
  Widget build(BuildContext context) {
    final color = sla.isOverdue
        ? AppColorsLight.critical
        : sla.isApproaching
        ? AppColorsLight.alert
        : AppColorsLight.info;
    final title = sla.isOverdue
        ? 'Overdue'
        : sla.isApproaching
        ? 'Approaching Deadline'
        : 'SLA Status';
    final deadline = sla.deadline == null
        ? 'No deadline returned by the server.'
        : 'Deadline: ${formatReportDateTime(sla.deadline)}';
    return LunasCard(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(Icons.timer_outlined, color: color),
          const SizedBox(width: AppSpacing.sm),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: Theme.of(
                    context,
                  ).textTheme.titleMedium?.copyWith(color: color),
                ),
                const SizedBox(height: AppSpacing.xxs),
                Text(deadline),
                if (sla.timeRemaining != null) ...[
                  const SizedBox(height: AppSpacing.xxs),
                  Text('Time Remaining: ${sla.timeRemaining}'),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _Section extends StatelessWidget {
  const _Section({required this.title, required this.child});

  final String title;
  final Widget child;

  @override
  Widget build(BuildContext context) => Column(
    crossAxisAlignment: CrossAxisAlignment.stretch,
    children: [
      Text(title, style: Theme.of(context).textTheme.titleLarge),
      const SizedBox(height: AppSpacing.sm),
      child,
    ],
  );
}

class _AssignmentCard extends StatelessWidget {
  const _AssignmentCard({required this.workOrder});

  final RepairWorkOrder workOrder;

  @override
  Widget build(BuildContext context) {
    final assignment = workOrder.currentAssignment;
    final person = assignment?.assignee;
    return LunasCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          _WorkOrderField(
            label: 'Assignment Status',
            value: formatRepairLabel(
              assignment?.status ??
                  workOrder.assignmentState ??
                  workOrder.status.label,
            ),
          ),
          if (person != null) ...[
            const SizedBox(height: AppSpacing.sm),
            _WorkOrderField(label: 'Assigned Personnel', value: person.name),
          ],
          if (assignment?.assignedAt != null) ...[
            const SizedBox(height: AppSpacing.sm),
            _WorkOrderField(
              label: 'Assigned At',
              value: formatReportDateTime(assignment!.assignedAt),
            ),
          ],
          if (assignment?.acceptedAt != null) ...[
            const SizedBox(height: AppSpacing.sm),
            _WorkOrderField(
              label: 'Accepted At',
              value: formatReportDateTime(assignment!.acceptedAt),
            ),
          ],
        ],
      ),
    );
  }
}

class _CitizenEvidence extends StatelessWidget {
  const _CitizenEvidence({required this.images});

  final List<ReportEvidence> images;

  @override
  Widget build(BuildContext context) {
    if (images.isEmpty) {
      return const LunasCard(
        child: Text('No citizen evidence was returned for this work order.'),
      );
    }
    return Column(
      children: [
        for (final image in images) ...[
          LunasCard(child: RemoteEvidencePreview(url: image.url)),
          const SizedBox(height: AppSpacing.sm),
        ],
      ],
    );
  }
}

class _RepairEvidence extends StatelessWidget {
  const _RepairEvidence({required this.evidence});

  final List<RepairEvidence> evidence;

  @override
  Widget build(BuildContext context) => Column(
    crossAxisAlignment: CrossAxisAlignment.stretch,
    children: [
      if (evidence.isEmpty)
        const LunasCard(child: Text('No repair evidence uploaded yet.'))
      else
        for (final item in evidence) ...[
          LunasCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                RemoteEvidencePreview(url: item.url),
                if (item.caption?.isNotEmpty == true) ...[
                  const SizedBox(height: AppSpacing.sm),
                  Text(item.caption!),
                ],
                if (item.uploadedAt != null) ...[
                  const SizedBox(height: AppSpacing.xs),
                  Text(
                    formatReportDateTime(item.uploadedAt),
                    style: Theme.of(context).textTheme.bodySmall,
                  ),
                ],
              ],
            ),
          ),
          const SizedBox(height: AppSpacing.sm),
        ],
    ],
  );
}

class _ProgressTimeline extends StatelessWidget {
  const _ProgressTimeline({required this.items});

  final List<RepairProgressUpdate> items;

  @override
  Widget build(BuildContext context) {
    if (items.isEmpty) {
      return const LunasCard(child: Text('No repair updates yet.'));
    }
    return LunasCard(
      child: Column(
        children: [
          for (final item in items) ...[
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                CircleAvatar(
                  radius: 16,
                  child: Icon(
                    item.progressPercent == 100 && item.evidence.isNotEmpty
                        ? Icons.task_alt
                        : Icons.edit_note,
                    size: 18,
                  ),
                ),
                const SizedBox(width: AppSpacing.md),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        item.progressPercent == 100 && item.evidence.isNotEmpty
                            ? 'Completion Submitted'
                            : 'Progress Update',
                        style: Theme.of(context).textTheme.titleSmall,
                      ),
                      Text(
                        formatReportDateTime(item.updatedAt),
                        style: Theme.of(context).textTheme.bodySmall,
                      ),
                      if (item.notes?.isNotEmpty == true) ...[
                        const SizedBox(height: AppSpacing.xxs),
                        Text(item.notes!),
                      ],
                    ],
                  ),
                ),
              ],
            ),
            if (item != items.last)
              const Padding(
                padding: EdgeInsets.symmetric(vertical: AppSpacing.md),
                child: Divider(),
              ),
          ],
        ],
      ),
    );
  }
}

class _WorkOrderField extends StatelessWidget {
  const _WorkOrderField({required this.label, required this.value});
  final String label;
  final String value;
  @override
  Widget build(BuildContext context) => Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      Text(
        label,
        style: Theme.of(context).textTheme.labelMedium?.copyWith(
          color: Theme.of(context).colorScheme.onSurfaceVariant,
        ),
      ),
      const SizedBox(height: AppSpacing.xxs),
      Text(
        value,
        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
          color: Theme.of(context).colorScheme.onSurface,
          height: 1.5,
        ),
      ),
    ],
  );
}
