import 'package:flutter/material.dart';
import 'package:lunas_mobile/core/app_services.dart';
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
  State<CitizenReportDetailScreen> createState() => _CitizenReportDetailScreenState();
}

class _CitizenReportDetailScreenState extends State<CitizenReportDetailScreen> {
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

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
      _historyNotice = null;
    });
    try {
      final report = await reportService.getReport(widget.reportId);
      List<ReportStatusEvent>? history;
      try {
        history = await reportService.getHistory(widget.reportId);
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
          _report = report;
          _history = history;
        });
      }
    } on ApiException catch (error) {
      if (mounted) setState(() => _error = error.message);
    } finally {
      if (mounted) setState(() => _loading = false);
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
        appBar: const LunasAppBar(title: 'Report details', showBackButton: true),
        body: SafeArea(
          top: false,
          child: LunasStateView(
            state: LunasViewState.error,
            title: 'Could not open this report',
            message: _error ?? 'This report is unavailable.',
            actionLabel: 'Try again',
            onAction: _load,
          ),
        ),
      );
    }
    final report = _report!;
    final history = _history ?? report.statusHistory;
    return Scaffold(
      appBar: const LunasAppBar(
        title: 'Report details',
        subtitle: 'Your submitted infrastructure report',
        showBackButton: true,
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
              constraints: const BoxConstraints(maxWidth: 760),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  LunasCard(
                    color: Theme.of(context).colorScheme.primaryContainer,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        ReportStatusChip(label: report.statusChipLabel),
                        const SizedBox(height: AppSpacing.md),
                        Text(report.categoryLabel, style: Theme.of(context).textTheme.headlineSmall),
                        const SizedBox(height: AppSpacing.xxs),
                        SelectableText(
                          report.reportNumber,
                          style: Theme.of(context).textTheme.bodySmall,
                        ),
                        const SizedBox(height: AppSpacing.sm),
                        Text(report.location.displayAddress),
                        const SizedBox(height: AppSpacing.xxs),
                        Text(
                          'Submitted ${formatReportDateTime(report.createdAt)}',
                          style: Theme.of(context).textTheme.bodySmall,
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: AppSpacing.xl),
                  if (report.repair != null) ...[
                    _CitizenRepairProgressCard(repair: report.repair!),
                    const SizedBox(height: AppSpacing.xl),
                  ],
                  if (_decisionReason(report) != null) ...[
                    Text('Official update', style: Theme.of(context).textTheme.titleLarge),
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
                  if (report.images.isNotEmpty) ...[
                    Text('Evidence', style: Theme.of(context).textTheme.titleLarge),
                    const SizedBox(height: AppSpacing.sm),
                    for (final evidence in report.images) ...[
                      RemoteEvidencePreview(url: evidence.url),
                      const SizedBox(height: AppSpacing.sm),
                      _EvidenceProcessingStatus(evidence: evidence),
                    ],
                    const SizedBox(height: AppSpacing.xl),
                  ] else ...[
                    Text('Evidence', style: Theme.of(context).textTheme.titleLarge),
                    const SizedBox(height: AppSpacing.sm),
                    const LunasCard(
                      child: Text('No evidence metadata was returned for this report.'),
                    ),
                    const SizedBox(height: AppSpacing.xl),
                  ],
                  Text('Description', style: Theme.of(context).textTheme.titleLarge),
                  const SizedBox(height: AppSpacing.sm),
                  LunasCard(child: Text(report.description)),
                  const SizedBox(height: AppSpacing.xl),
                  Text('Location', style: Theme.of(context).textTheme.titleLarge),
                  const SizedBox(height: AppSpacing.sm),
                  LunasCard(
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Icon(Icons.location_on_outlined),
                        const SizedBox(width: AppSpacing.md),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(report.location.displayAddress),
                              if (report.location.latitude != null && report.location.longitude != null) ...[
                                const SizedBox(height: AppSpacing.xxs),
                                Text(
                                  '${report.location.latitude!.toStringAsFixed(6)}, ${report.location.longitude!.toStringAsFixed(6)}',
                                  style: Theme.of(context).textTheme.bodySmall,
                                ),
                              ],
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: AppSpacing.xl),
                  Text('Status history', style: Theme.of(context).textTheme.titleLarge),
                  const SizedBox(height: AppSpacing.sm),
                  if (_historyNotice != null) ...[
                    Text(_historyNotice!, style: Theme.of(context).textTheme.bodySmall),
                    const SizedBox(height: AppSpacing.sm),
                  ],
                  LunasCard(child: ReportStatusTimeline(events: history)),
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
  _ => null,
};

class _CitizenRepairProgressCard extends StatelessWidget {
  const _CitizenRepairProgressCard({required this.repair});

  final IncidentRepairSummary repair;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isReady = repair.readyForCompletion || repair.progressPercent == 100;
    return LunasCard(
      color: isReady
          ? theme.colorScheme.tertiaryContainer
          : theme.colorScheme.primaryContainer.withValues(alpha: .55),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(
                isReady ? Icons.pending_actions_outlined : Icons.construction_outlined,
                color: isReady
                    ? theme.colorScheme.onTertiaryContainer
                    : theme.colorScheme.primary,
              ),
              const SizedBox(width: AppSpacing.sm),
              Expanded(
                child: Text(
                  'Maintenance progress',
                  style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700),
                ),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.sm),
          Text(repair.citizenStatusLabel, style: theme.textTheme.bodyLarge),
          const SizedBox(height: AppSpacing.sm),
          LinearProgressIndicator(value: repair.progressPercent / 100),
          if (repair.reference != null || repair.updatedAt != null) ...[
            const SizedBox(height: AppSpacing.sm),
            Text(
              [
                if (repair.reference != null) 'Work order ${repair.reference}',
                if (repair.updatedAt != null) 'Updated ${formatReportDateTime(repair.updatedAt)}',
              ].join(' · '),
              style: theme.textTheme.bodySmall,
            ),
          ],
          if (isReady) ...[
            const SizedBox(height: AppSpacing.sm),
            Text(
              'The field repair is ready for formal completion and verification. It has not been verified or closed yet.',
              style: theme.textTheme.bodySmall,
            ),
          ],
        ],
      ),
    );
  }
}

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
                  isRejected ? 'Report not validated' : 'Report marked as a duplicate',
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

class _EvidenceProcessingStatus extends StatelessWidget {
  const _EvidenceProcessingStatus({required this.evidence});
  final ReportEvidence evidence;

  @override
  Widget build(BuildContext context) {
    final quality = evidence.qualityStatus;
    final privacyStatus = evidence.privacyProcessingStatus;
    final privacyText = privacyStatus == null
        ? 'Privacy-processing status was not returned for this evidence.'
        : evidence.privacyProcessingApplied == true || evidence.isPrivacyMasked == true
        ? 'Server privacy processing: ${humanStatus(privacyStatus)}.'
        : privacyStatus == 'not_available'
        ? 'Server privacy redaction is not available for this evidence.'
        : 'Server privacy-processing status: ${humanStatus(privacyStatus)}.';
    return Padding(
      padding: const EdgeInsets.only(top: AppSpacing.xs),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (quality != null)
            Text('Evidence quality check: ${humanStatus(quality)}.'),
          Text(privacyText),
        ],
      ),
    );
  }
}
