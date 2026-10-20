import 'package:lunas_mobile/core/widgets/quiet_data_refresh.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:lunas_mobile/app/app_services.dart';
import 'package:lunas_mobile/core/network/api_exception.dart';
import 'package:lunas_mobile/core/theme/app_spacing.dart';
import 'package:lunas_mobile/core/widgets/lunas_app_bar.dart';
import 'package:lunas_mobile/core/widgets/lunas_card.dart';
import 'package:lunas_mobile/core/widgets/lunas_state_view.dart';
import 'package:lunas_mobile/features/reporting/data/models/incident_report.dart';
import 'package:lunas_mobile/features/reporting/presentation/widgets/evidence_preview.dart';
import 'package:lunas_mobile/features/reporting/presentation/widgets/report_status_timeline.dart';
import 'package:lunas_mobile/features/reporting/presentation/widgets/reporting_widgets.dart';

class CitizenReportDetailScreen extends StatefulWidget {
  const CitizenReportDetailScreen({required this.reportId, super.key});
  final String reportId;

  @override
  State<CitizenReportDetailScreen> createState() =>
      _CitizenReportDetailScreenState();
}

class _CitizenReportDetailScreenState extends State<CitizenReportDetailScreen>
    with WidgetsBindingObserver, QuietDataRefresh<CitizenReportDetailScreen> {
  bool _loading = true;
  String? _error;
  IncidentReport? _report;
  List<ReportStatusEvent>? _history;
  String? _historyNotice;

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
        _historyNotice = null;
      });
    }
    try {
      final report = await reportService.getReportById(widget.reportId);
      List<ReportStatusEvent>? history;
      try {
        history = await reportService.getHistory(report.id);
      } on ApiException catch (error) {
        // The incident record itself includes server-authored status history.
        // Keep it visible if the dedicated history endpoint is temporarily down.
        history = report.statusHistory;
        _historyNotice = error.isNotFound
            ? 'The detailed history endpoint is not available yet. Showing history included with this report.'
            : 'The detailed history could not be refreshed. Showing history included with this report.';
      }
      if (mounted) {
        setState(() {
          _error = null;
          _report = report;
          _history = history;
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

  Future<void> _respondToClarification(IncidentReport report) async {
    final controller = TextEditingController();
    final response = await showDialog<String>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: const Text('Respond to clarification'),
        content: TextField(
          controller: controller,
          maxLength: 4000,
          maxLines: 4,
          decoration: const InputDecoration(
            labelText: 'Additional information',
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogContext),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () {
              if (controller.text.trim().length >= 2) {
                Navigator.pop(dialogContext, controller.text.trim());
              }
            },
            child: const Text('Send response'),
          ),
        ],
      ),
    );
    controller.dispose();
    if (response == null) return;
    try {
      await reportService.respondToVerificationClarification(
        report.id,
        response,
        int.tryParse(
              '${report.verificationClarification?['expectedVersion']}',
            ) ??
            -1,
      );
      await _load();
    } on ApiException catch (error) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text(error.message)));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Scaffold(
        body: SafeArea(
          child: LunasStateView(
            state: LunasViewState.loading,
            title: 'Loading report',
            message: 'Getting the report and its status history.',
          ),
        ),
      );
    }
    if (_error != null || _report == null) {
      return Scaffold(
        appBar: const LunasAppBar(
          title: 'Report Details',
          showBackButton: true,
        ),
        body: SafeArea(
          top: false,
          child: LunasStateView(
            state: LunasViewState.error,
            title: 'Could not open this report',
            message: _error ?? 'This report is unavailable.',
            actionLabel: 'Try Again',
            onAction: _load,
          ),
        ),
      );
    }
    final report = _report!;
    final history = visibleReportHistory(_history ?? report.statusHistory);
    return Scaffold(
      appBar: LunasAppBar(
        title: 'Report Details',
        subtitle: report.reportNumber,
        showBackButton: true,
      ),
      body: SafeArea(
        top: false,
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(
            AppSpacing.xl,
            AppSpacing.md,
            AppSpacing.xl,
            AppSpacing.xxl,
          ),
          child: Align(
            alignment: Alignment.topCenter,
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 760),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  if (report.status == 'clarification_required' &&
                      report.verificationClarification?['recipient'] ==
                          'citizen' &&
                      report.verificationClarification?['respondedAt'] ==
                          null) ...[
                    Text(
                      'Clarification requested: ${report.verificationClarification?['reason'] ?? "Additional information is required"}',
                    ),
                    OutlinedButton(
                      onPressed: () => _respondToClarification(report),
                      child: const Text('Respond to clarification'),
                    ),
                  ],
                  if (_decisionReason(report) != null) ...[
                    Text(
                      'Official Update',
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                    const SizedBox(height: AppSpacing.sm),
                    _CitizenDecisionReason(
                      status: report.status,
                      reason: _decisionReason(report)!,
                    ),
                    const SizedBox(height: AppSpacing.xl),
                  ],
                  if (report.possibleDuplicateCandidateCount > 0) ...[
                    Container(
                      padding: const EdgeInsets.all(AppSpacing.md),
                      decoration: BoxDecoration(
                        color: Theme.of(context).colorScheme.tertiaryContainer,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Text(
                        'This report has possible nearby similar reports for official review. It has not been automatically rejected or merged.',
                      ),
                    ),
                    const SizedBox(height: AppSpacing.xl),
                  ],
                  if (report.location.needsReview) ...[
                    _LocationReviewCard(location: report.location),
                    const SizedBox(height: AppSpacing.xl),
                  ],
                  LunasCard(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(report.currentStatusLabel),
                        Text(
                          report.agencyAssignment['organization']?.toString() ??
                              (report.agencyAssignment['status'] ==
                                      'under_review'
                                  ? 'Agency assignment under review'
                                  : 'Awaiting verified agency assignment'),
                        ),
                        if (report.originalCategory != null &&
                            report.originalCategory != report.category)
                          Text(
                            'Original reported category: ${report.originalCategory}',
                          ),
                        Text('SLA: ${report.sla['state'] ?? 'not_started'}'),
                        if (report.sla['startedAt'] != null)
                          Text(
                            'Recorded start: ${DateTime.tryParse(report.sla['startedAt'].toString())?.toLocal()}',
                          ),
                        if (report.sla['deadline'] != null)
                          Text(
                            'Recorded deadline: ${DateTime.tryParse(report.sla['deadline'].toString())?.toLocal()}',
                          ),
                        if (report.sla['recordedOutcome'] != null)
                          Text(
                            'Historical SLA outcome: ${report.sla['recordedOutcome']}',
                          ),
                      ],
                    ),
                  ),
                  const SizedBox(height: AppSpacing.xl),
                  LunasCard(child: ReportWorkflowProgress(report: report)),
                  const SizedBox(height: AppSpacing.xl),
                  if (report.images.isNotEmpty) ...[
                    Text(
                      'Evidence',
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                    const SizedBox(height: AppSpacing.sm),
                    for (final evidence in report.images) ...[
                      RemoteEvidencePreview(
                        url: evidence.url,
                        width: evidence.width,
                        height: evidence.height,
                      ),
                      const SizedBox(height: AppSpacing.sm),
                    ],
                    const SizedBox(height: AppSpacing.xl),
                  ] else ...[
                    Text(
                      'Evidence',
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                    const SizedBox(height: AppSpacing.sm),
                    const LunasCard(
                      child: Text('No photos are available for this report.'),
                    ),
                    const SizedBox(height: AppSpacing.xl),
                  ],
                  Text(
                    'Report Information',
                    style: Theme.of(context).textTheme.titleLarge,
                  ),
                  const SizedBox(height: AppSpacing.sm),
                  LunasCard(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        _ReportInformationField(
                          icon: categoryIcon(report.category),
                          label: 'Category',
                          value: report.categoryLabel,
                        ),
                        const Divider(height: AppSpacing.xxl, indent: 36),
                        _ReportInformationField(
                          icon: Icons.notes_rounded,
                          label: 'Description',
                          value: report.description,
                        ),
                        const Divider(height: AppSpacing.xxl, indent: 36),
                        _ReportInformationField(
                          icon: Icons.location_on_outlined,
                          label: 'Location',
                          value: report.location.displayAddress,
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: AppSpacing.xl),
                  Text(
                    'Status History',
                    style: Theme.of(context).textTheme.titleLarge,
                  ),
                  const SizedBox(height: AppSpacing.sm),
                  if (_historyNotice != null) ...[
                    Text(
                      _historyNotice!,
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                    const SizedBox(height: AppSpacing.sm),
                  ],
                  LunasCard(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        ReportStatusTimeline(
                          compact: true,
                          events: history.length > 3
                              ? history.sublist(history.length - 3)
                              : history,
                        ),
                        const Divider(height: AppSpacing.md),
                        TextButton.icon(
                          onPressed: () =>
                              context.push('/reports/${report.id}/timeline'),
                          icon: const Icon(
                            Icons.chevron_right_rounded,
                            size: 18,
                          ),
                          iconAlignment: IconAlignment.end,
                          style: TextButton.styleFrom(
                            padding: const EdgeInsets.symmetric(
                              horizontal: AppSpacing.xs,
                            ),
                            textStyle: const TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                          label: const Text('View Full Timeline'),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

String? _decisionReason(IncidentReport report) => switch (report.status) {
  'rejected' => report.rejectionReason,
  'duplicate' => report.duplicateReason,
  'clarification_required' => report.clarificationReason,
  _ => null,
};

class _CitizenDecisionReason extends StatelessWidget {
  const _CitizenDecisionReason({required this.status, required this.reason});
  final String status;
  final String reason;

  @override
  Widget build(BuildContext context) {
    final isRejected = status == 'rejected';
    return LunasCard(
      color: isRejected
          ? Theme.of(context).colorScheme.errorContainer
          : Theme.of(context).colorScheme.tertiaryContainer,
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(
            isRejected ? Icons.cancel_outlined : Icons.content_copy_outlined,
            color: isRejected
                ? Theme.of(context).colorScheme.onErrorContainer
                : Theme.of(context).colorScheme.onTertiaryContainer,
          ),
          const SizedBox(width: AppSpacing.md),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  isRejected
                      ? 'Report Not Validated'
                      : 'Report Marked as a Duplicate',
                  style: Theme.of(context).textTheme.titleMedium,
                ),
                const SizedBox(height: AppSpacing.xs),
                Text(reason),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _LocationReviewCard extends StatelessWidget {
  const _LocationReviewCard({required this.location});

  final IncidentLocation location;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return LunasCard(
      color: theme.colorScheme.errorContainer,
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(Icons.location_off_outlined, color: theme.colorScheme.error),
          const SizedBox(width: AppSpacing.md),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Location Needs Review',
                  style: theme.textTheme.titleMedium?.copyWith(
                    color: theme.colorScheme.onErrorContainer,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: AppSpacing.xs),
                Text(
                  'The saved address does not match Dagupan City. Treat this location as unverified until it is reviewed.',
                  style: theme.textTheme.bodyMedium?.copyWith(
                    color: theme.colorScheme.onErrorContainer,
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

class _ReportInformationField extends StatelessWidget {
  const _ReportInformationField({
    required this.icon,
    required this.label,
    required this.value,
  });
  final IconData icon;
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Row(
          children: [
            SizedBox.square(
              dimension: 24,
              child: Center(
                child: Icon(icon, size: 22, color: theme.colorScheme.primary),
              ),
            ),
            const SizedBox(width: AppSpacing.sm),
            Expanded(
              child: Text(
                label,
                style: theme.textTheme.labelMedium?.copyWith(
                  color: theme.colorScheme.onSurfaceVariant,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: AppSpacing.xxs),
        Padding(
          padding: const EdgeInsets.only(left: 24 + AppSpacing.sm),
          child: Text(
            value,
            style: theme.textTheme.bodyMedium?.copyWith(
              color: theme.colorScheme.onSurface,
              height: 1.5,
            ),
          ),
        ),
      ],
    );
  }
}
