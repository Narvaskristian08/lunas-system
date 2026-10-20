import 'package:lunas_mobile/core/widgets/lunas_confirmation_dialog.dart';
import 'package:lunas_mobile/features/reporting/presentation/widgets/reporting_widgets.dart';
import 'package:lunas_mobile/core/widgets/timeline_marker.dart';
import 'package:lunas_mobile/core/widgets/quiet_data_refresh.dart';
import 'package:flutter/material.dart';
import 'package:lunas_mobile/features/reporting/data/models/category_option.dart';
import 'package:go_router/go_router.dart';
import 'package:lunas_mobile/app/app_services.dart';
import 'package:lunas_mobile/core/network/api_exception.dart';
import 'package:lunas_mobile/core/theme/app_colors.dart';
import 'package:lunas_mobile/core/theme/app_spacing.dart';
import 'package:lunas_mobile/core/theme/text_styles.dart';
import 'package:lunas_mobile/core/widgets/lunas_card.dart';
import 'package:lunas_mobile/core/widgets/lunas_state_view.dart';
import 'package:lunas_mobile/features/repair/data/models/repair_models.dart';
import 'package:lunas_mobile/features/repair/routes/repair_routes.dart';
import 'package:lunas_mobile/features/repair/presentation/widgets/repair_widgets.dart';
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

  Future<void> _decideAssignment(bool accept) async {
    final order = _workOrder;
    if (_submitting || order == null || !order.isPendingAcceptance) return;
    setState(() => _submitting = true);
    var declineReason = '';
    final reasonKey = GlobalKey<FormFieldState<String>>();
    try {
      final confirmed = await showDialog<bool>(
        context: context,
        builder: (dialogContext) => AlertDialog(
          title: Text(accept ? 'Accept assignment?' : 'Decline assignment?'),
          content: accept
              ? const Text(
                  'Accept this assignment without changing earlier progress or starting new work.',
                )
              : TextFormField(
                  key: reasonKey,
                  validator: (value) => (value?.trim().length ?? 0) < 2
                      ? 'Enter a decline reason of at least 2 characters.'
                      : null,
                  onChanged: (value) => declineReason = value,
                  maxLength: 500,
                  decoration: const InputDecoration(
                    labelText: 'Decline reason',
                  ),
                ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(dialogContext, false),
              child: const Text('Cancel'),
            ),
            FilledButton(
              onPressed: () {
                if (accept || reasonKey.currentState?.validate() == true) {
                  Navigator.pop(dialogContext, true);
                }
              },
              child: Text(accept ? 'Accept' : 'Decline'),
            ),
          ],
        ),
      );
      if (confirmed != true || !mounted) return;
      await waitForDataRequest();
      final updated = accept
          ? await repairService.accept(order.id, version: order.version)
          : await repairService.decline(
              order.id,
              reason: declineReason,
              version: order.version,
            );
      if (!mounted) return;
      if (accept) {
        setState(() => _workOrder = updated);
      } else {
        context.go(RepairRoutes.workOrders);
      }
    } on ApiException catch (error) {
      if (!mounted) return;
      if (error.isConflict) await _load();
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text(error.message)));
      }
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  Future<void> _startRepair() async {
    final workOrder = _workOrder;
    if (_submitting || workOrder == null || !workOrder.canStart) return;
    final resume =
        workOrder.status == RepairWorkOrderStatus.reworkRequired ||
        workOrder.status == RepairWorkOrderStatus.inProgress;
    setState(() => _submitting = true);
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (dialogContext) => LunasConfirmationDialog(
        title: Text(
          workOrder.isPendingAcceptance
              ? 'Accept and Start Repair?'
              : resume
              ? 'Resume Repair?'
              : 'Start Repair?',
        ),
        content: Text(
          '${workOrder.orderNumber}: ${workOrder.isPendingAcceptance
              ? 'Accept responsibility for this assignment and start or resume repair work.'
              : resume
              ? 'Resume the assigned repair and allow field updates.'
              : 'Record the repair start time and mark this work as in progress.'}',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogContext, false),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(dialogContext, true),
            child: Text(
              workOrder.isPendingAcceptance
                  ? 'Accept and Start Repair'
                  : resume
                  ? 'Resume Repair'
                  : 'Start Repair',
            ),
          ),
        ],
      ),
    );
    if (!mounted) return;
    if (confirmed != true) {
      setState(() => _submitting = false);
      return;
    }
    await waitForDataRequest();
    if (!mounted) return;
    try {
      final updated = await repairService.start(
        workOrder.id,
        version: workOrder.version,
      );
      if (!mounted) return;
      setState(() => _workOrder = updated);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(resume ? 'Repair resumed.' : 'Repair started.')),
      );
    } on ApiException catch (error) {
      if (!mounted) return;
      if (error.isConflict) await _load();
      if (!mounted) return;
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text(error.message)));
    } finally {
      if (mounted) setState(() => _submitting = false);
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
            actionLabel: 'Try Again',
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
        onAccept: () => _decideAssignment(true),
        onDecline: () => _decideAssignment(false),
        onStart: _startRepair,
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
      return const SizedBox.shrink();
    }
    if (workOrder.isPendingAcceptance) {
      return _ActionContainer(
        child: Row(
          children: [
            Expanded(
              child: OutlinedButton(
                onPressed: submitting ? null : onDecline,
                child: const Text('Decline assignment'),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: FilledButton(
                onPressed: submitting ? null : onAccept,
                child: const Text('Accept assignment'),
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
          label: Text(
            workOrder.status == RepairWorkOrderStatus.reworkRequired ||
                    workOrder.status == RepairWorkOrderStatus.inProgress
                ? 'Resume Repair'
                : 'Start Repair',
          ),
        ),
      );
    }
    if (workOrder.canUpdateProgress) {
      return _ActionContainer(
        child: FilledButton.icon(
          onPressed: submitting ? null : onProgress,
          icon: const Icon(Icons.edit_note_rounded),
          label: const Text('Update Progress'),
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
  Widget build(BuildContext context) {
    final corrections =
        workOrder.history
            .where(
              (event) =>
                  event.type == 'provider_correction_requested' ||
                  event.type == 'city_returned',
            )
            .toList()
          ..sort(
            (a, b) => (b.createdAt ?? DateTime(1970)).compareTo(
              a.createdAt ?? DateTime(1970),
            ),
          );
    final latestCorrection = corrections.isEmpty ? null : corrections.first;
    final correction = latestCorrection?.type == 'provider_correction_requested'
        ? latestCorrection
        : null;
    final awaitingInstructions = latestCorrection?.type == 'city_returned';
    final instructions = awaitingInstructions
        ? 'Awaiting updated work instructions from the Utility Provider.'
        : workOrder.instructions?.trim().isNotEmpty == true
        ? workOrder.instructions!
        : correction?.notes;
    final theme = Theme.of(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        LunasCard(
          padding: const EdgeInsets.all(AppSpacing.xl),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Icon(
                    reportCategoryIcon(workOrder.category),
                    color: theme.colorScheme.primary,
                    size: 24,
                  ),
                  const SizedBox(width: AppSpacing.md),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          categoryFromCode(workOrder.category).label,
                          style: theme.textTheme.titleLarge?.copyWith(
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                        const SizedBox(height: AppSpacing.xs),
                        Text(
                          workOrder.incidentReference,
                          style: theme.textTheme.bodySmall,
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: AppSpacing.lg),
              Row(
                children: [
                  Expanded(
                    child: RepairStatusChip(
                      label: workOrder.status.label,
                      color: repairWorkOrderStatusColor(
                        context,
                        workOrder.status,
                      ),
                      icon:
                          workOrder.status ==
                              RepairWorkOrderStatus.reworkRequired
                          ? Icons.build_outlined
                          : Icons.work_outline_rounded,
                    ),
                  ),
                  const SizedBox(width: AppSpacing.sm),
                  Expanded(
                    child: RepairStatusChip(
                      label: workOrder.priority == null
                          ? 'Priority Unassigned'
                          : '${formatRepairLabel(workOrder.priority!)} Priority',
                      color: _priorityColor,
                      icon: Icons.priority_high_rounded,
                    ),
                  ),
                ],
              ),
              if (workOrder.status != RepairWorkOrderStatus.reworkRequired) ...[
                const Padding(
                  padding: EdgeInsets.symmetric(vertical: AppSpacing.lg),
                  child: Divider(height: 1),
                ),
                _SlaCard(sla: workOrder.sla),
              ],
            ],
          ),
        ),
        if (instructions?.trim().isNotEmpty == true &&
            correction == null &&
            !awaitingInstructions) ...[
          const SizedBox(height: AppSpacing.md),
          LunasCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  correction != null
                      ? 'Correction Instructions'
                      : 'Work Instructions',
                  style: theme.textTheme.titleSmall,
                ),
                const SizedBox(height: AppSpacing.sm),
                if (correction != null) ...[
                  Text(
                    'From Utility Provider',
                    style: theme.textTheme.labelMedium?.copyWith(
                      color: theme.colorScheme.primary,
                    ),
                  ),
                  const SizedBox(height: AppSpacing.xs),
                ],
                Text(
                  instructions!,
                  style: theme.textTheme.bodyMedium?.copyWith(height: 1.5),
                ),
                if (correction?.createdAt != null) ...[
                  const SizedBox(height: AppSpacing.sm),
                  Text(
                    formatReportDateTime(correction!.createdAt),
                    style: theme.textTheme.bodySmall,
                  ),
                ],
              ],
            ),
          ),
        ],
        if (workOrder.status == RepairWorkOrderStatus.reworkRequired) ...[
          const SizedBox(height: AppSpacing.md),
          LunasCard(child: _SlaCard(sla: workOrder.sla)),
        ],
        const SizedBox(height: AppSpacing.md),
        LunasCard(
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              Icon(
                Icons.location_on_outlined,
                color: theme.colorScheme.primary,
                size: 24,
              ),
              const SizedBox(width: AppSpacing.sm),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      workOrder.location.barangay ?? 'Damage Location',
                      style: theme.textTheme.titleSmall,
                    ),
                    if (workOrder.location.address?.trim().isNotEmpty == true ||
                        workOrder.location.city?.trim().isNotEmpty == true) ...[
                      const SizedBox(height: AppSpacing.xxs),
                      Text(
                        [workOrder.location.address, workOrder.location.city]
                            .whereType<String>()
                            .where((part) => part.trim().isNotEmpty)
                            .join(', '),
                        style: theme.textTheme.bodySmall?.copyWith(height: 1.4),
                      ),
                    ],
                  ],
                ),
              ),
              const SizedBox(width: AppSpacing.sm),
              TextButton(
                onPressed: onOpenLocation,
                child: const Text('View Map'),
              ),
            ],
          ),
        ),
        const SizedBox(height: AppSpacing.lg),
        _Section(
          title: 'Reported Photo',
          child: _CitizenEvidence(images: workOrder.citizenEvidence),
        ),
        if (workOrder.description.trim().isNotEmpty) ...[
          const SizedBox(height: AppSpacing.md),
          LunasCard(
            padding: EdgeInsets.zero,
            child: ExpansionTile(
              key: PageStorageKey('reported-description-${workOrder.id}'),
              initiallyExpanded: false,
              tilePadding: const EdgeInsets.symmetric(
                horizontal: AppSpacing.lg,
              ),
              childrenPadding: const EdgeInsets.fromLTRB(
                AppSpacing.lg,
                0,
                AppSpacing.lg,
                AppSpacing.lg,
              ),
              shape: const Border(),
              collapsedShape: const Border(),
              title: Text(
                'Reported Description',
                style: theme.textTheme.titleSmall,
              ),
              children: [
                Align(
                  alignment: Alignment.centerLeft,
                  child: Text(
                    workOrder.description,
                    style: theme.textTheme.bodyMedium?.copyWith(height: 1.5),
                  ),
                ),
              ],
            ),
          ),
        ],
        const SizedBox(height: AppSpacing.lg),
        if (workOrder.repairEvidence.isNotEmpty) ...[
          _Section(
            title: 'Repair Photos',
            child: _RepairEvidence(evidence: workOrder.repairEvidence),
          ),
        ],
        if (instructions?.trim().isNotEmpty == true &&
            (correction != null || awaitingInstructions)) ...[
          const SizedBox(height: AppSpacing.md),
          LunasCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  correction != null
                      ? 'Correction Instructions'
                      : 'Work Instructions',
                  style: theme.textTheme.titleSmall,
                ),
                const SizedBox(height: AppSpacing.sm),
                if (correction != null) ...[
                  Text(
                    'From Utility Provider',
                    style: theme.textTheme.labelMedium?.copyWith(
                      color: theme.colorScheme.primary,
                    ),
                  ),
                  const SizedBox(height: AppSpacing.xs),
                ],
                Text(
                  instructions!,
                  style: theme.textTheme.bodyMedium?.copyWith(height: 1.5),
                ),
                if (correction?.createdAt != null) ...[
                  const SizedBox(height: AppSpacing.sm),
                  Text(
                    formatReportDateTime(correction!.createdAt),
                    style: theme.textTheme.bodySmall,
                  ),
                ],
              ],
            ),
          ),
        ],
        const SizedBox(height: AppSpacing.lg),
        _Section(
          title: 'Repair Progress Timeline',
          child: _ProgressTimeline(items: workOrder.progressUpdates),
        ),
      ],
    );
  }
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
        : 'Repair Deadline';
    final deadline = sla.deadline == null
        ? 'No deadline returned by the server.'
        : 'Deadline: ${formatReportDateTime(sla.deadline)}';
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(Icons.timer_outlined, color: color, size: 24),
        const SizedBox(width: AppSpacing.md),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if (sla.isOverdue || sla.isApproaching) ...[
                Text(
                  title,
                  style: Theme.of(context).textTheme.labelMedium?.copyWith(
                    color: Theme.of(context).colorScheme.onSurfaceVariant,
                  ),
                ),
                const SizedBox(height: AppSpacing.xxs),
              ],
              if (sla.timeRemaining != null) ...[
                Text(
                  '${sla.timeRemaining}${sla.isOverdue ? "" : " remaining"}',
                  style: AppTextStyles.technicalTimer.copyWith(
                    fontWeight: FontWeight.w700,
                    color: sla.isOverdue || sla.isApproaching
                        ? color
                        : Theme.of(context).colorScheme.onSurface,
                  ),
                ),
              ],
              const SizedBox(height: AppSpacing.xxs),
              Text(deadline, style: Theme.of(context).textTheme.bodySmall),
            ],
          ),
        ),
      ],
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
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        for (final image in images) ...[
          LunasCard(
            padding: EdgeInsets.zero,
            child: ClipRRect(
              borderRadius: BorderRadius.circular(12),
              child: _FullWidthPhoto(url: image.url),
            ),
          ),
          if (image != images.last) const SizedBox(height: AppSpacing.md),
        ],
      ],
    );
  }
}

class _RepairEvidence extends StatelessWidget {
  const _RepairEvidence({required this.evidence});
  final List<RepairEvidence> evidence;

  @override
  Widget build(BuildContext context) {
    if (evidence.isEmpty) {
      return const LunasCard(child: Text('No repair evidence uploaded yet.'));
    }
    return LunasCard(
      padding: EdgeInsets.zero,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          for (final item in evidence.reversed) ...[
            ClipRRect(
              borderRadius: BorderRadius.circular(12),
              child: _FullWidthPhoto(url: item.url),
            ),
            if (item.caption?.isNotEmpty == true)
              Padding(
                padding: const EdgeInsets.all(AppSpacing.md),
                child: Text(item.caption!),
              ),
          ],
        ],
      ),
    );
  }
}

class _FullWidthPhoto extends StatelessWidget {
  const _FullWidthPhoto({required this.url});
  final String url;

  @override
  Widget build(BuildContext context) => Image.network(
    url,
    width: double.infinity,
    fit: BoxFit.fitWidth,
    errorBuilder: (_, _, _) => RemoteEvidencePreview(url: url),
    loadingBuilder: (_, child, progress) => progress == null
        ? child
        : const AspectRatio(
            aspectRatio: 4 / 3,
            child: Center(child: CircularProgressIndicator()),
          ),
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
    // Progress updates are appended oldest first by the API. Preserve that
    // order for equal timestamps, then display the newest entry first.
    final ordered = items.asMap().entries.toList()
      ..sort((a, b) {
        final aTime = a.value.updatedAt;
        final bTime = b.value.updatedAt;
        final comparison = aTime != null && bTime != null
            ? aTime.compareTo(bTime)
            : 0;
        return comparison != 0 ? comparison : a.key.compareTo(b.key);
      });
    final visible = ordered.reversed.map((entry) => entry.value).toList();
    return LunasCard(
      child: Column(
        children: [
          for (var index = 0; index < visible.length; index++)
            IntrinsicHeight(
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  TimelineMarker(
                    latest: index == 0,
                    showLine: index < visible.length - 1,
                  ),
                  const SizedBox(width: AppSpacing.sm),
                  Expanded(
                    child: Padding(
                      padding: EdgeInsets.only(
                        bottom: index < visible.length - 1 ? AppSpacing.xxl : 0,
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            visible[index].progressPercent == 100 &&
                                    visible[index].evidence.isNotEmpty
                                ? 'Completion Submitted'
                                : 'Progress Update',
                            style: Theme.of(context).textTheme.titleSmall
                                ?.copyWith(fontSize: 15, height: 1.5),
                          ),
                          const SizedBox(height: AppSpacing.xxs),
                          Text(
                            formatReportDateTime(visible[index].updatedAt),
                            style: Theme.of(context).textTheme.bodySmall,
                          ),
                          if (visible[index].notes?.trim().isNotEmpty ==
                              true) ...[
                            const SizedBox(height: AppSpacing.xxs),
                            Text(
                              visible[index].notes!,
                              style: Theme.of(context).textTheme.bodySmall,
                            ),
                          ],
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }
}
