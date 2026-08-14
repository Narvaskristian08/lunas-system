import 'package:flutter/material.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:lunas_mobile/core/app_services.dart';
import 'package:lunas_mobile/core/network/api_exception.dart';
import 'package:lunas_mobile/core/theme/app_spacing.dart';
import 'package:lunas_mobile/core/widgets/lunas_button.dart';
import 'package:lunas_mobile/core/widgets/lunas_card.dart';
import 'package:lunas_mobile/core/widgets/lunas_state_view.dart';
import 'package:lunas_mobile/core/widgets/official_scaffold.dart';
import 'package:lunas_mobile/features/reporting/data/models/category_option.dart';
import 'package:lunas_mobile/features/reporting/data/models/incident_report.dart';
import 'package:lunas_mobile/features/reporting/presentation/widgets/evidence_preview.dart';
import 'package:lunas_mobile/features/reporting/presentation/widgets/report_status_timeline.dart';
import 'package:lunas_mobile/features/validation/data/models/validation_incident.dart';

class ValidationIncidentDetailScreen extends StatefulWidget {
  const ValidationIncidentDetailScreen({required this.incidentId, super.key});
  final String incidentId;

  @override
  State<ValidationIncidentDetailScreen> createState() =>
      _ValidationIncidentDetailScreenState();
}

class _ValidationIncidentDetailScreenState
    extends State<ValidationIncidentDetailScreen> {
  bool _loading = true;
  String? _error;
  ValidationIncident? _incident;
  List<ReportStatusEvent> _history = const [];
  List<DuplicateCandidate> _candidates = const [];
  IncidentSla? _sla;
  String? _supplementalNotice;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
      _supplementalNotice = null;
    });
    try {
      final incident = await validationService.getIncident(widget.incidentId);
      var history = incident.statusHistory;
      var candidates = incident.duplicateCandidates;
      var sla = incident.sla;
      final notices = <String>[];
      try {
        history = await validationService.getHistory(widget.incidentId);
      } on ApiException {
        notices.add(
          'The dedicated status-history refresh was unavailable; showing history returned with the incident.',
        );
      }
      try {
        candidates = await validationService.getDuplicateCandidates(
          widget.incidentId,
        );
      } on ApiException {
        notices.add(
          'Duplicate candidates could not be refreshed; showing candidates returned with the incident.',
        );
      }
      try {
        sla = await validationService.getSla(widget.incidentId);
      } on ApiException {
        notices.add('SLA details could not be refreshed.');
      }
      if (mounted) {
        setState(() {
          _incident = incident;
          _history = history;
          _candidates = candidates;
          _sla = sla;
          _supplementalNotice = notices.isEmpty ? null : notices.join(' ');
        });
      }
    } on ApiException catch (error) {
      if (mounted) setState(() => _error = error.message);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _openDecision(
    ValidationDecisionType type, {
    String? duplicateIncidentId,
  }) async {
    final incident = _incident;
    if (incident == null) return;
    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      showDragHandle: true,
      builder: (_) => _ValidationDecisionSheet(
        incident: incident,
        type: type,
        candidates: _candidates,
        initialDuplicateIncidentId: duplicateIncidentId,
        onSubmit: _submitDecision,
      ),
    );
  }

  Future<void> _submitDecision(ValidationDecisionRequest request) async {
    try {
      switch (request.type) {
        case ValidationDecisionType.validate:
          await validationService.validateIncident(widget.incidentId, request);
          break;
        case ValidationDecisionType.reject:
          await validationService.rejectIncident(widget.incidentId, request);
          break;
        case ValidationDecisionType.duplicate:
          await validationService.markDuplicate(widget.incidentId, request);
          break;
      }
    } on ApiException catch (error) {
      if (error.statusCode == 409) {
        // A second official may have already made the single allowed decision.
        // Refresh the server record before the operator can make another try.
        await _load();
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text(
                'Another official changed this report first. The latest server record is now shown.',
              ),
            ),
          );
        }
      }
      rethrow;
    }
    if (!mounted) return;
    final action = switch (request.type) {
      ValidationDecisionType.validate => 'validated',
      ValidationDecisionType.reject => 'rejected',
      ValidationDecisionType.duplicate => 'marked as duplicate',
    };
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          'The report was $action. The server record has been refreshed.',
        ),
      ),
    );
    await _load();
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Scaffold(
        body: SafeArea(
          child: LunasStateView(
            state: LunasViewState.loading,
            title: 'Loading incident review',
            message:
                'Getting the report, history, duplicate candidates, and SLA data.',
          ),
        ),
      );
    }
    if (_error != null || _incident == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Incident review')),
        body: SafeArea(
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
    final incident = _incident!;
    return OfficialScaffold(
      title: 'Incident review',
      subtitle: incident.reportNumber,
      selectedIndex: 1,
      showBackButton: true,
      actions: [
        IconButton(
          onPressed: _load,
          tooltip: 'Refresh incident',
          icon: const Icon(Icons.refresh_rounded),
        ),
        const SizedBox(width: AppSpacing.sm),
      ],
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          _OverviewCard(incident: incident),
          const SizedBox(height: AppSpacing.xl),
          if (_supplementalNotice != null) ...[
            _Notice(text: _supplementalNotice!),
            const SizedBox(height: AppSpacing.xl),
          ],
          _DecisionPanel(
            canDecide: incident.status == 'submitted',
            onValidate: () => _openDecision(ValidationDecisionType.validate),
            onReject: () => _openDecision(ValidationDecisionType.reject),
            onDuplicate: () => _openDecision(ValidationDecisionType.duplicate),
          ),
          const SizedBox(height: AppSpacing.xl),
          _Section(
            title: 'Evidence',
            child: _EvidenceSection(images: incident.images),
          ),
          const SizedBox(height: AppSpacing.xl),
          _Section(
            title: 'Submitted description',
            child: LunasCard(
              child: Text(
                incident.description.isEmpty
                    ? 'No description was returned with this report.'
                    : incident.description,
              ),
            ),
          ),
          const SizedBox(height: AppSpacing.xl),
          _Section(
            title: 'Location review',
            child: _LocationReview(location: incident.location),
          ),
          const SizedBox(height: AppSpacing.xl),
          _Section(
            title: 'Duplicate candidates',
            child: _DuplicateCandidatesSection(
              candidates: _candidates,
              candidateCount: incident.possibleDuplicateCandidateCount,
              onSelectDuplicate: (id) => _openDecision(
                ValidationDecisionType.duplicate,
                duplicateIncidentId: id,
              ),
              canDecide: incident.status == 'submitted',
            ),
          ),
          const SizedBox(height: AppSpacing.xl),
          _Section(
            title: 'Validation and routing',
            child: _ValidationRoutingDetails(incident: incident, sla: _sla),
          ),
          const SizedBox(height: AppSpacing.xl),
          _Section(
            title: 'Status history',
            child: LunasCard(child: ReportStatusTimeline(events: _history)),
          ),
        ],
      ),
    );
  }
}

class _OverviewCard extends StatelessWidget {
  const _OverviewCard({required this.incident});
  final ValidationIncident incident;

  @override
  Widget build(BuildContext context) => LunasCard(
    color: Theme.of(context).colorScheme.primaryContainer,
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Wrap(
          spacing: AppSpacing.sm,
          runSpacing: AppSpacing.xs,
          crossAxisAlignment: WrapCrossAlignment.center,
          children: [
            Chip(label: Text(humanStatus(incident.status))),
            if (incident.priority != null && incident.hasAssignedPriority)
              Chip(
                avatar: const Icon(Icons.flag_outlined, size: 18),
                label: Text(_priorityLabel(incident.priority!)),
              ),
          ],
        ),
        const SizedBox(height: AppSpacing.md),
        Text(
          incident.categoryLabel,
          style: Theme.of(context).textTheme.headlineSmall,
        ),
        const SizedBox(height: AppSpacing.xxs),
        SelectableText(
          incident.reportNumber,
          style: Theme.of(context).textTheme.bodySmall,
        ),
        const SizedBox(height: AppSpacing.sm),
        Text('Submitted ${formatReportDateTime(incident.createdAt)}'),
        if (incident.aiSuggestedCategory != null) ...[
          const SizedBox(height: AppSpacing.sm),
          _Notice(
            text:
                'Server-provided category suggestion: ${_categoryLabel(incident.aiSuggestedCategory!)}${incident.aiConfidence == null ? '' : ' (${(incident.aiConfidence! * 100).toStringAsFixed(0)}% confidence)'}. Review it alongside the citizen-selected category; it is not an automated decision.',
            compact: true,
          ),
        ],
      ],
    ),
  );
}

class _DecisionPanel extends StatelessWidget {
  const _DecisionPanel({
    required this.canDecide,
    required this.onValidate,
    required this.onReject,
    required this.onDuplicate,
  });

  final bool canDecide;
  final VoidCallback onValidate;
  final VoidCallback onReject;
  final VoidCallback onDuplicate;

  @override
  Widget build(BuildContext context) => LunasCard(
    color: canDecide ? Theme.of(context).colorScheme.secondaryContainer : null,
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Row(
          children: [
            Icon(
              canDecide ? Icons.gavel_outlined : Icons.lock_outline_rounded,
              color: canDecide
                  ? Theme.of(context).colorScheme.onSecondaryContainer
                  : null,
            ),
            const SizedBox(width: AppSpacing.sm),
            Expanded(
              child: Text(
                canDecide ? 'Make validation decision' : 'Decision recorded',
                style: Theme.of(context).textTheme.titleMedium,
              ),
            ),
          ],
        ),
        const SizedBox(height: AppSpacing.xs),
        Text(
          canDecide
              ? 'One server-enforced decision is allowed while the report is submitted. All actions are auditable.'
              : 'This report is no longer submitted, so validation actions are disabled.',
        ),
        if (canDecide) ...[
          const SizedBox(height: AppSpacing.md),
          Wrap(
            spacing: AppSpacing.sm,
            runSpacing: AppSpacing.sm,
            children: [
              FilledButton.icon(
                onPressed: onValidate,
                icon: const Icon(Icons.verified_outlined),
                label: const Text('Validate'),
              ),
              OutlinedButton.icon(
                onPressed: onReject,
                icon: const Icon(Icons.cancel_outlined),
                label: const Text('Reject'),
              ),
              OutlinedButton.icon(
                onPressed: onDuplicate,
                icon: const Icon(Icons.content_copy_outlined),
                label: const Text('Mark duplicate'),
              ),
            ],
          ),
        ],
      ],
    ),
  );
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

class _EvidenceSection extends StatelessWidget {
  const _EvidenceSection({required this.images});
  final List<ReportEvidence> images;

  @override
  Widget build(BuildContext context) {
    if (images.isEmpty) {
      return const LunasCard(
        child: Text('No evidence metadata was returned for this report.'),
      );
    }
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        for (final evidence in images) ...[
          LunasCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                _EvidenceViewerTrigger(url: evidence.url),
                const SizedBox(height: AppSpacing.sm),
                if (evidence.qualityStatus != null)
                  Text(
                    'Evidence quality: ${humanStatus(evidence.qualityStatus!)}.',
                  ),
                Text(_privacyText(evidence)),
              ],
            ),
          ),
          const SizedBox(height: AppSpacing.sm),
        ],
      ],
    );
  }
}

class _LocationReview extends StatelessWidget {
  const _LocationReview({required this.location});
  final IncidentLocation location;

  @override
  Widget build(BuildContext context) {
    final latitude = location.latitude;
    final longitude = location.longitude;
    return LunasCard(
      padding: EdgeInsets.zero,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          if (latitude != null && longitude != null)
            ClipRRect(
              borderRadius: const BorderRadius.vertical(
                top: Radius.circular(16),
              ),
              child: SizedBox(
                height: 230,
                child: GoogleMap(
                  initialCameraPosition: CameraPosition(
                    target: LatLng(latitude, longitude),
                    zoom: 16,
                  ),
                  markers: {
                    Marker(
                      markerId: const MarkerId('incident-location'),
                      position: LatLng(latitude, longitude),
                    ),
                  },
                  myLocationButtonEnabled: false,
                  myLocationEnabled: false,
                  rotateGesturesEnabled: false,
                  tiltGesturesEnabled: false,
                  zoomControlsEnabled: false,
                ),
              ),
            )
          else
            const SizedBox(
              height: 120,
              child: Center(child: Icon(Icons.location_off_outlined, size: 42)),
            ),
          Padding(
            padding: const EdgeInsets.all(AppSpacing.lg),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Icon(Icons.location_on_outlined),
                const SizedBox(width: AppSpacing.md),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(location.displayAddress),
                      if (latitude != null && longitude != null) ...[
                        const SizedBox(height: AppSpacing.xxs),
                        SelectableText(
                          '${latitude.toStringAsFixed(6)}, ${longitude.toStringAsFixed(6)}',
                          style: Theme.of(context).textTheme.bodySmall,
                        ),
                      ],
                      if (location.city?.trim().isNotEmpty == true) ...[
                        const SizedBox(height: AppSpacing.xxs),
                        Text(
                          location.city!,
                          style: Theme.of(context).textTheme.bodySmall,
                        ),
                      ],
                    ],
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

class _EvidenceViewerTrigger extends StatelessWidget {
  const _EvidenceViewerTrigger({required this.url});
  final String url;

  Future<void> _open(BuildContext context) async {
    if (!url.startsWith('http')) return;
    await showDialog<void>(
      context: context,
      builder: (dialogContext) => Dialog.fullscreen(
        child: SafeArea(
          child: Stack(
            children: [
              Center(
                child: InteractiveViewer(
                  minScale: 0.8,
                  maxScale: 4,
                  child: Image.network(
                    url,
                    fit: BoxFit.contain,
                    errorBuilder: (_, _, _) => const _EvidenceUnavailable(),
                  ),
                ),
              ),
              Positioned(
                top: AppSpacing.sm,
                right: AppSpacing.sm,
                child: IconButton.filledTonal(
                  onPressed: () => Navigator.pop(dialogContext),
                  tooltip: 'Close evidence viewer',
                  icon: const Icon(Icons.close_rounded),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) => Semantics(
    button: url.startsWith('http'),
    label: url.startsWith('http')
        ? 'Open evidence viewer'
        : 'Evidence preview unavailable',
    child: InkWell(
      onTap: url.startsWith('http') ? () => _open(context) : null,
      borderRadius: BorderRadius.circular(12),
      child: RemoteEvidencePreview(url: url),
    ),
  );
}

class _EvidenceUnavailable extends StatelessWidget {
  const _EvidenceUnavailable();

  @override
  Widget build(BuildContext context) => const Center(
    child: Padding(
      padding: EdgeInsets.all(AppSpacing.xl),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.image_not_supported_outlined, size: 48),
          SizedBox(height: AppSpacing.sm),
          Text('Evidence preview unavailable'),
        ],
      ),
    ),
  );
}

class _DuplicateCandidatesSection extends StatelessWidget {
  const _DuplicateCandidatesSection({
    required this.candidates,
    required this.candidateCount,
    required this.onSelectDuplicate,
    required this.canDecide,
  });

  final List<DuplicateCandidate> candidates;
  final int candidateCount;
  final ValueChanged<String> onSelectDuplicate;
  final bool canDecide;

  @override
  Widget build(BuildContext context) {
    if (candidates.isEmpty) {
      return LunasCard(
        child: Text(
          candidateCount > 0
              ? '$candidateCount possible match${candidateCount == 1 ? ' was' : 'es were'} recorded, but their details are not currently available. They are suggestions only.'
              : 'No possible duplicate candidates were returned. This does not prove the report is unique.',
        ),
      );
    }
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        _Notice(
          text:
              'Candidates are advisory. Review the evidence, location, and report details before marking any report as a duplicate.',
          compact: true,
        ),
        const SizedBox(height: AppSpacing.sm),
        for (final candidate in candidates) ...[
          LunasCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Row(
                  children: [
                    const Icon(Icons.content_copy_outlined),
                    const SizedBox(width: AppSpacing.sm),
                    Expanded(
                      child: Text(
                        candidate.reportNumber,
                        style: Theme.of(context).textTheme.titleMedium,
                      ),
                    ),
                    Chip(label: Text(humanStatus(candidate.status))),
                  ],
                ),
                const SizedBox(height: AppSpacing.sm),
                Text(
                  '${_categoryLabel(candidate.category)} · ${candidate.location.displayAddress}',
                ),
                if (candidate.createdAt != null) ...[
                  const SizedBox(height: AppSpacing.xxs),
                  Text(
                    'Submitted ${formatReportDateTime(candidate.createdAt)}',
                    style: Theme.of(context).textTheme.bodySmall,
                  ),
                ],
                if (candidate.distanceMeters != null ||
                    candidate.score != null) ...[
                  const SizedBox(height: AppSpacing.xs),
                  Text(
                    [
                      if (candidate.distanceMeters != null)
                        '${candidate.distanceMeters!.round()} m away',
                      if (candidate.score != null)
                        'match score ${candidate.score!.toStringAsFixed(0)}',
                    ].join(' · '),
                    style: Theme.of(context).textTheme.bodySmall,
                  ),
                ],
                if (candidate.imageUrl?.startsWith('http') == true) ...[
                  const SizedBox(height: AppSpacing.sm),
                  RemoteEvidencePreview(url: candidate.imageUrl!),
                ],
                if (canDecide) ...[
                  const SizedBox(height: AppSpacing.sm),
                  OutlinedButton.icon(
                    onPressed: () => onSelectDuplicate(candidate.id),
                    icon: const Icon(Icons.content_copy_outlined),
                    label: const Text('Use as duplicate reference'),
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
}

class _ValidationRoutingDetails extends StatelessWidget {
  const _ValidationRoutingDetails({required this.incident, required this.sla});
  final ValidationIncident incident;
  final IncidentSla? sla;

  @override
  Widget build(BuildContext context) {
    final hasDetails =
        incident.hasAssignedPriority ||
        incident.jurisdiction != null ||
        incident.responsibleOrganization != null ||
        incident.rejectionReason != null ||
        incident.duplicateReason != null ||
        incident.duplicateOfReportNumber != null ||
        incident.validatedAt != null ||
        incident.validatedByName != null ||
        (sla != null && sla!.state != 'not_started');
    if (!hasDetails) {
      return const LunasCard(
        child: Text(
          'No validation, routing, or SLA details have been recorded yet.',
        ),
      );
    }
    return LunasCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          if (incident.priority != null && incident.hasAssignedPriority)
            _DetailRow(
              label: 'Priority',
              value: _priorityLabel(incident.priority!),
            ),
          if (incident.priorityAssignedAt != null)
            _DetailRow(
              label: 'Priority assigned at',
              value: formatReportDateTime(incident.priorityAssignedAt),
            ),
          if (incident.jurisdiction != null)
            _DetailRow(label: 'Jurisdiction', value: incident.jurisdiction!),
          if (incident.jurisdictionResponsibility != null)
            _DetailRow(
              label: 'Responsibility',
              value: validationResponsibilityLabel(
                incident.jurisdictionResponsibility!,
              ),
            ),
          if (incident.responsibleOrganization != null)
            _DetailRow(
              label: 'Responsible organization',
              value: incident.responsibleOrganization!,
            ),
          if (incident.responsibleRole != null)
            _DetailRow(
              label: 'Routing role',
              value: validationResponsibilityLabel(incident.responsibleRole!),
            ),
          if (incident.routingReason != null)
            _DetailRow(label: 'Routing reason', value: incident.routingReason!),
          if (incident.rejectionReason != null)
            _DetailRow(
              label: 'Rejection reason',
              value: incident.rejectionReason!,
            ),
          if (incident.duplicateReason != null)
            _DetailRow(
              label: 'Duplicate reason',
              value: incident.duplicateReason!,
            ),
          if (incident.duplicateOfReportNumber != null)
            _DetailRow(
              label: 'Canonical report',
              value: incident.duplicateOfReportNumber!,
            ),
          if (incident.validatedByName != null)
            _DetailRow(label: 'Validated by', value: incident.validatedByName!),
          if (incident.validatedAt != null)
            _DetailRow(
              label: 'Validated at',
              value: formatReportDateTime(incident.validatedAt),
            ),
          if (sla != null && sla!.state != 'not_started') ...[
            _DetailRow(
              label: 'SLA state',
              value: humanStatus(
                sla!.state ?? (sla!.isOverdue ? 'breached' : 'active'),
              ),
            ),
            if (sla!.targetResolutionHours != null)
              _DetailRow(
                label: 'Target resolution',
                value: '${sla!.targetResolutionHours} hours',
              ),
            if (sla!.deadline != null)
              _DetailRow(
                label: 'Target deadline',
                value: formatReportDateTime(sla!.deadline),
              ),
          ],
        ],
      ),
    );
  }
}

class _DetailRow extends StatelessWidget {
  const _DetailRow({required this.label, required this.value});
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.only(bottom: AppSpacing.sm),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: Theme.of(context).textTheme.labelMedium),
        const SizedBox(height: AppSpacing.xxs),
        Text(value),
      ],
    ),
  );
}

class _Notice extends StatelessWidget {
  const _Notice({required this.text, this.compact = false});
  final String text;
  final bool compact;

  @override
  Widget build(BuildContext context) => Container(
    padding: EdgeInsets.all(compact ? AppSpacing.sm : AppSpacing.md),
    decoration: BoxDecoration(
      color: Theme.of(context).colorScheme.tertiaryContainer,
      borderRadius: BorderRadius.circular(12),
    ),
    child: Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Icon(Icons.info_outline_rounded),
        const SizedBox(width: AppSpacing.sm),
        Expanded(child: Text(text)),
      ],
    ),
  );
}

class _ValidationDecisionSheet extends StatefulWidget {
  const _ValidationDecisionSheet({
    required this.incident,
    required this.type,
    required this.candidates,
    required this.onSubmit,
    this.initialDuplicateIncidentId,
  });

  final ValidationIncident incident;
  final ValidationDecisionType type;
  final List<DuplicateCandidate> candidates;
  final String? initialDuplicateIncidentId;
  final Future<void> Function(ValidationDecisionRequest request) onSubmit;

  @override
  State<_ValidationDecisionSheet> createState() =>
      _ValidationDecisionSheetState();
}

class _ValidationDecisionSheetState extends State<_ValidationDecisionSheet> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _barangayController;
  late final TextEditingController _cityController;
  late final TextEditingController _organizationController;
  late final TextEditingController _routingReasonController;
  late final TextEditingController _reasonController;
  late final TextEditingController _notesController;
  late final TextEditingController _duplicateIdController;
  late String _priority;
  late String _responsibility;
  late String _responsibleRole;
  bool _submitting = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    final incident = widget.incident;
    _priority = _safePriority(incident.priority);
    _responsibility = _safeResponsibility(incident.jurisdictionResponsibility);
    _responsibleRole = _safeResponsibility(
      incident.responsibleRole ?? _responsibility,
    );
    _barangayController = TextEditingController(
      text: incident.jurisdiction ?? incident.location.barangay ?? '',
    );
    _cityController = TextEditingController(
      text: incident.location.city ?? 'Dagupan City',
    );
    _organizationController = TextEditingController(
      text:
          incident.responsibleOrganization ??
          _defaultOrganization(_responsibleRole, incident),
    );
    _routingReasonController = TextEditingController(
      text: incident.routingReason ?? '',
    );
    _reasonController = TextEditingController();
    _notesController = TextEditingController();
    _duplicateIdController = TextEditingController(
      text: widget.initialDuplicateIncidentId ?? '',
    );
  }

  @override
  void dispose() {
    _barangayController.dispose();
    _cityController.dispose();
    _organizationController.dispose();
    _routingReasonController.dispose();
    _reasonController.dispose();
    _notesController.dispose();
    _duplicateIdController.dispose();
    super.dispose();
  }

  ValidationDecisionRequest _request() {
    final notes = _clean(_notesController.text);
    return switch (widget.type) {
      ValidationDecisionType.validate => ValidationDecisionRequest.validate(
        priority: _priority,
        jurisdictionBarangay: _barangayController.text.trim(),
        jurisdictionCity: _clean(_cityController.text),
        jurisdictionResponsibility: _responsibility,
        responsibleOrganization: _organizationController.text.trim(),
        responsibleRole: _responsibleRole,
        routingReason: _clean(_routingReasonController.text),
        notes: notes,
      ),
      ValidationDecisionType.reject => ValidationDecisionRequest.reject(
        reason: _reasonController.text.trim(),
        notes: notes,
      ),
      ValidationDecisionType.duplicate => ValidationDecisionRequest.duplicate(
        duplicateOfIncidentId: _duplicateIdController.text.trim(),
        reason: _reasonController.text.trim(),
        notes: notes,
      ),
    };
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate() || _submitting) return;
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: Text('${widget.type.label} this report?'),
        content: Text(_confirmationText(widget.type)),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogContext, false),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(dialogContext, true),
            child: Text(widget.type.label),
          ),
        ],
      ),
    );
    if (confirmed != true || !mounted) return;
    setState(() {
      _submitting = true;
      _error = null;
    });
    try {
      await widget.onSubmit(_request());
      if (mounted) Navigator.of(context).pop();
    } on ApiException catch (error) {
      if (!mounted) return;
      if (error.statusCode == 409) {
        Navigator.of(context).pop();
        return;
      }
      setState(() {
        _error = error.message;
      });
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  void _setDuplicate(String id) {
    setState(() => _duplicateIdController.text = id);
  }

  @override
  Widget build(BuildContext context) => SafeArea(
    child: Padding(
      padding: EdgeInsets.fromLTRB(
        AppSpacing.xl,
        AppSpacing.sm,
        AppSpacing.xl,
        MediaQuery.viewInsetsOf(context).bottom + AppSpacing.xl,
      ),
      child: SingleChildScrollView(
        child: Form(
          key: _formKey,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text(
                widget.type.label,
                style: Theme.of(context).textTheme.titleLarge,
              ),
              const SizedBox(height: AppSpacing.xs),
              Text(
                widget.incident.reportNumber,
                style: Theme.of(context).textTheme.bodySmall,
              ),
              const SizedBox(height: AppSpacing.lg),
              if (_error != null) ...[
                _ErrorNotice(text: _error!),
                const SizedBox(height: AppSpacing.md),
              ],
              switch (widget.type) {
                ValidationDecisionType.validate => _validateFields(),
                ValidationDecisionType.reject => _rejectFields(),
                ValidationDecisionType.duplicate => _duplicateFields(),
              },
              const SizedBox(height: AppSpacing.md),
              TextFormField(
                controller: _notesController,
                maxLines: 3,
                maxLength: 2000,
                decoration: const InputDecoration(
                  labelText: 'Internal decision notes (optional)',
                  alignLabelWithHint: true,
                ),
              ),
              const SizedBox(height: AppSpacing.lg),
              LunasButton(
                label: widget.type.label,
                icon: switch (widget.type) {
                  ValidationDecisionType.validate => Icons.verified_outlined,
                  ValidationDecisionType.reject => Icons.cancel_outlined,
                  ValidationDecisionType.duplicate =>
                    Icons.content_copy_outlined,
                },
                isLoading: _submitting,
                onPressed: _submitting ? null : _submit,
              ),
            ],
          ),
        ),
      ),
    ),
  );

  Widget _validateFields() => Column(
    crossAxisAlignment: CrossAxisAlignment.stretch,
    children: [
      DropdownButtonFormField<String>(
        initialValue: _priority,
        decoration: const InputDecoration(labelText: 'Priority'),
        items: const [
          DropdownMenuItem(value: 'critical', child: Text('Critical')),
          DropdownMenuItem(value: 'high', child: Text('High')),
          DropdownMenuItem(value: 'medium', child: Text('Medium')),
          DropdownMenuItem(value: 'low', child: Text('Low')),
        ],
        onChanged: _submitting
            ? null
            : (value) => setState(() => _priority = value ?? _priority),
      ),
      const SizedBox(height: AppSpacing.md),
      Text(
        'Jurisdiction confirmation',
        style: Theme.of(context).textTheme.titleSmall,
      ),
      const SizedBox(height: AppSpacing.xs),
      TextFormField(
        controller: _barangayController,
        textCapitalization: TextCapitalization.words,
        decoration: const InputDecoration(labelText: 'Barangay'),
        validator: (value) => value == null || value.trim().isEmpty
            ? 'Confirm the barangay before validating.'
            : null,
      ),
      const SizedBox(height: AppSpacing.md),
      TextFormField(
        controller: _cityController,
        textCapitalization: TextCapitalization.words,
        decoration: const InputDecoration(labelText: 'City (optional)'),
      ),
      const SizedBox(height: AppSpacing.md),
      DropdownButtonFormField<String>(
        initialValue: _responsibility,
        decoration: const InputDecoration(
          labelText: 'Jurisdiction responsibility',
        ),
        items: validationResponsibilityRoles
            .map(
              (role) => DropdownMenuItem(
                value: role,
                child: Text(validationResponsibilityLabel(role)),
              ),
            )
            .toList(growable: false),
        onChanged: _submitting
            ? null
            : (value) => setState(() {
                _responsibility = value ?? _responsibility;
                if (_responsibleRole == 'barangay' ||
                    _responsibleRole == _responsibility) {
                  _responsibleRole = _responsibility;
                  _organizationController.text = _defaultOrganization(
                    _responsibleRole,
                    widget.incident,
                  );
                }
              }),
      ),
      const SizedBox(height: AppSpacing.lg),
      Text('Routing foundation', style: Theme.of(context).textTheme.titleSmall),
      const SizedBox(height: AppSpacing.xs),
      TextFormField(
        controller: _organizationController,
        textCapitalization: TextCapitalization.words,
        decoration: const InputDecoration(
          labelText: 'Responsible organization',
        ),
        validator: (value) => value == null || value.trim().isEmpty
            ? 'Select or enter the responsible organization.'
            : null,
      ),
      const SizedBox(height: AppSpacing.md),
      DropdownButtonFormField<String>(
        key: ValueKey(_responsibleRole),
        initialValue: _responsibleRole,
        decoration: const InputDecoration(labelText: 'Responsible role'),
        items: validationResponsibilityRoles
            .map(
              (role) => DropdownMenuItem(
                value: role,
                child: Text(validationResponsibilityLabel(role)),
              ),
            )
            .toList(growable: false),
        onChanged: _submitting
            ? null
            : (value) => setState(() {
                _responsibleRole = value ?? _responsibleRole;
                if (_organizationController.text.trim().isEmpty ||
                    _organizationController.text ==
                        _defaultOrganization(
                          _responsibility,
                          widget.incident,
                        )) {
                  _organizationController.text = _defaultOrganization(
                    _responsibleRole,
                    widget.incident,
                  );
                }
              }),
      ),
      const SizedBox(height: AppSpacing.md),
      TextFormField(
        controller: _routingReasonController,
        maxLines: 2,
        maxLength: 1000,
        decoration: const InputDecoration(
          labelText: 'Routing reason (optional)',
          alignLabelWithHint: true,
        ),
      ),
      const SizedBox(height: AppSpacing.sm),
      const _Notice(
        text:
            'Routing identifies the responsible organization only. It does not create a work order or assign repair personnel.',
        compact: true,
      ),
    ],
  );

  Widget _rejectFields() => Column(
    crossAxisAlignment: CrossAxisAlignment.stretch,
    children: [
      TextFormField(
        controller: _reasonController,
        maxLines: 3,
        maxLength: 500,
        decoration: const InputDecoration(
          labelText: 'Rejection reason',
          hintText: 'Explain why this report cannot be validated',
          alignLabelWithHint: true,
        ),
        validator: (value) => value == null || value.trim().isEmpty
            ? 'A rejection reason is required.'
            : null,
      ),
      const SizedBox(height: AppSpacing.sm),
      const _Notice(
        text:
            'The permitted rejection reason may be visible to the citizen. Do not enter private personal data or internal-only information.',
        compact: true,
      ),
    ],
  );

  Widget _duplicateFields() => Column(
    crossAxisAlignment: CrossAxisAlignment.stretch,
    children: [
      TextFormField(
        controller: _duplicateIdController,
        decoration: const InputDecoration(
          labelText: 'Canonical incident ID',
          hintText: 'Select a candidate below or enter its ID',
        ),
        validator: (value) {
          final id = value?.trim() ?? '';
          if (id.isEmpty) return 'A canonical incident reference is required.';
          if (id == widget.incident.id) {
            return 'A report cannot be a duplicate of itself.';
          }
          if (!RegExp(r'^[a-fA-F0-9]{24}$').hasMatch(id)) {
            return 'Choose a candidate or enter a valid incident ID.';
          }
          return null;
        },
      ),
      const SizedBox(height: AppSpacing.md),
      if (widget.candidates.isNotEmpty) ...[
        Text(
          'Available duplicate candidates',
          style: Theme.of(context).textTheme.titleSmall,
        ),
        const SizedBox(height: AppSpacing.xs),
        Wrap(
          spacing: AppSpacing.xs,
          runSpacing: AppSpacing.xs,
          children: widget.candidates
              .map(
                (candidate) => ChoiceChip(
                  label: Text(candidate.reportNumber),
                  selected: _duplicateIdController.text == candidate.id,
                  onSelected: _submitting
                      ? null
                      : (_) => _setDuplicate(candidate.id),
                ),
              )
              .toList(growable: false),
        ),
        const SizedBox(height: AppSpacing.md),
      ],
      TextFormField(
        controller: _reasonController,
        maxLines: 3,
        maxLength: 500,
        decoration: const InputDecoration(
          labelText: 'Duplicate reason',
          hintText: 'Explain why this report is a duplicate',
          alignLabelWithHint: true,
        ),
        validator: (value) => value == null || value.trim().isEmpty
            ? 'A duplicate reason is required.'
            : null,
      ),
      const SizedBox(height: AppSpacing.sm),
      const _Notice(
        text:
            'The server verifies that the reference is accessible, not the same report, and does not create a circular duplicate chain.',
        compact: true,
      ),
    ],
  );
}

class _ErrorNotice extends StatelessWidget {
  const _ErrorNotice({required this.text});
  final String text;

  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.all(AppSpacing.md),
    decoration: BoxDecoration(
      color: Theme.of(context).colorScheme.errorContainer,
      borderRadius: BorderRadius.circular(12),
    ),
    child: Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(
          Icons.error_outline_rounded,
          color: Theme.of(context).colorScheme.onErrorContainer,
        ),
        const SizedBox(width: AppSpacing.sm),
        Expanded(
          child: Text(
            text,
            style: TextStyle(
              color: Theme.of(context).colorScheme.onErrorContainer,
            ),
          ),
        ),
      ],
    ),
  );
}

String _privacyText(ReportEvidence evidence) {
  final status = evidence.privacyProcessingStatus;
  if (status == null) {
    return 'Privacy-processing status was not returned for this evidence.';
  }
  if (evidence.privacyProcessingApplied == true ||
      evidence.isPrivacyMasked == true) {
    return 'Server privacy processing: ${humanStatus(status)}.';
  }
  if (status == 'not_available') {
    return 'Server privacy redaction is not available for this evidence.';
  }
  return 'Server privacy-processing status: ${humanStatus(status)}.';
}

String _safePriority(String? value) => switch (value) {
  'critical' => 'critical',
  'high' => 'high',
  'low' => 'low',
  _ => 'medium',
};

String _safeResponsibility(String? value) => switch (value) {
  'barangay' => 'barangay',
  'city_engineer' || 'city_engineering' => 'city_engineering',
  'utility_provider' => 'utility_provider',
  _ => 'barangay',
};

String _defaultOrganization(
  String responsibleRole,
  ValidationIncident incident,
) => switch (responsibleRole) {
  'barangay' =>
    incident.jurisdiction == null || incident.jurisdiction!.trim().isEmpty
        ? 'Barangay'
        : 'Barangay ${incident.jurisdiction}',
  'city_engineering' => 'City Engineering',
  'utility_provider' => 'Utility Provider',
  _ => 'Responsible organization',
};

String _confirmationText(ValidationDecisionType type) => switch (type) {
  ValidationDecisionType.validate =>
    'This validates the submitted report and initializes its priority, jurisdiction, routing, and SLA foundation. The decision cannot be changed from this screen.',
  ValidationDecisionType.reject =>
    'This rejects the submitted report. The stated reason is recorded and may be shown to the citizen.',
  ValidationDecisionType.duplicate =>
    'This marks the submitted report as a duplicate of the selected canonical incident. Both records remain auditable.',
};

String _priorityLabel(String value) => value
    .replaceAll('_', ' ')
    .split(' ')
    .where((part) => part.isNotEmpty)
    .map((part) => '${part[0].toUpperCase()}${part.substring(1)}')
    .join(' ');

String _categoryLabel(String code) => categoryFromCode(code).label;

String? _clean(String value) {
  final result = value.trim();
  return result.isEmpty ? null : result;
}
