import 'dart:async';
import 'package:lunas_mobile/features/reporting/data/models/incident_report.dart';
import 'package:flutter/material.dart';
import 'package:lunas_mobile/features/maps/domain/models/location_integrity.dart';
import 'package:go_router/go_router.dart';
import 'package:lunas_mobile/core/app_services.dart';
import 'package:lunas_mobile/core/network/api_exception.dart';
import 'package:lunas_mobile/core/theme/app_spacing.dart';
import 'package:lunas_mobile/core/widgets/lunas_app_bar.dart';
import 'package:lunas_mobile/core/widgets/lunas_button.dart';
import 'package:lunas_mobile/core/widgets/lunas_card.dart';
import 'package:lunas_mobile/features/reporting/domain/models/citizen_report_draft.dart';
import 'package:lunas_mobile/features/reporting/presentation/widgets/evidence_preview.dart';
import 'package:lunas_mobile/features/reporting/presentation/widgets/reporting_widgets.dart';

class ReportReviewScreen extends StatefulWidget {
  const ReportReviewScreen({
    required this.draft,
    this.policyLoader,
    this.submitReport,
    super.key,
  });
  final Future<LocationPolicy> Function()? policyLoader;
  final Future<IncidentReport> Function(CitizenReportDraft)? submitReport;
  final CitizenReportDraft draft;

  @override
  State<ReportReviewScreen> createState() => _ReportReviewScreenState();
}

class _ReportReviewScreenState extends State<ReportReviewScreen> {
  bool _locationConfirmed = false;
  String? _explanationReason;
  final _explanationText = TextEditingController();
  bool _loadingPolicy = true;
  LocationPolicy? _policy;
  Timer? _comparisonTimer;
  String get _comparison =>
      _policy?.compare(
        widget.draft.location.longitude,
        widget.draft.location.latitude,
        widget.draft.location.gpsFix,
        DateTime.now(),
      ) ??
      'unavailable';

  @override
  void initState() {
    super.initState();
    _loadPolicy();
    _comparisonTimer = Timer.periodic(const Duration(seconds: 5), (_) {
      if (mounted && !_submitting) setState(() {});
    });
  }

  Future<void> _loadPolicy() async {
    setState(() => _loadingPolicy = true);
    try {
      final policy =
          await (widget.policyLoader ?? reportService.getLocationPolicy)();
      if (mounted) {
        setState(() {
          _policy = policy;
          _error = null;
        });
      }
    } catch (_) {
      if (mounted) {
        setState(
          () => _error =
              'Location review unavailable. Tap Retry location review.',
        );
      }
    } finally {
      if (mounted) setState(() => _loadingPolicy = false);
    }
  }

  @override
  void dispose() {
    _comparisonTimer?.cancel();
    _explanationText.dispose();
    super.dispose();
  }

  bool _acknowledgedPrivacy = false;
  bool _submitting = false;
  String? _error;

  Future<void> _submit() async {
    if (_policy == null) {
      setState(
        () =>
            _error = 'Location review unavailable. Tap Retry location review.',
      );
      return;
    }
    if (!_locationConfirmed) {
      setState(
        () => _error =
            'Confirm that the selected pin is the actual damage location.',
      );
      return;
    }
    if (_comparison == 'discrepancy' &&
        (_explanationReason == null ||
            (_explanationReason == 'other' &&
                _explanationText.text.trim().length < 10))) {
      setState(
        () => _error =
            'Choose an explanation. Other requires at least 10 characters.',
      );
      return;
    }
    if (widget.draft.evidence.requiresPrivacyAcknowledgement &&
        !_acknowledgedPrivacy) {
      setState(
        () => _error =
            'Confirm that the evidence does not include private or identifying information before submitting.',
      );
      return;
    }
    setState(() {
      _submitting = true;
      _error = null;
    });
    try {
      final report = await (widget.submitReport ?? reportService.submit)(
        CitizenReportDraft(
          category: widget.draft.category,
          description: widget.draft.description,
          location: widget.draft.location,
          barangay: widget.draft.barangay,
          evidence: widget.draft.evidence,
          privacyAcknowledged: _acknowledgedPrivacy,
          locationConfirmed: _locationConfirmed,
          locationExplanationReason: _explanationReason,
          locationExplanationText: _explanationText.text.trim(),
        ),
      );
      if (!mounted) return;
      context.go('/reports/submitted', extra: report);
    } on ApiException catch (error) {
      if (mounted) setState(() => _error = error.message);
    } catch (_) {
      if (mounted) {
        setState(
          () => _error =
              'We could not submit this report. Your form is still available; please try again.',
        );
      }
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: const LunasAppBar(
      title: 'Confirm Details',
      subtitle: 'Review before submitting your report',
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
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const ReportProgressIndicator(current: 3, total: 3),
            const SizedBox(height: AppSpacing.xl),
            LocalEvidencePreview(evidence: widget.draft.evidence, height: 220),
            const SizedBox(height: AppSpacing.md),
            LunasCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _ReviewRow(
                    label: 'Category',
                    value: widget.draft.category.label,
                  ),
                  const Divider(height: AppSpacing.xl),
                  _ReviewRow(label: 'Barangay', value: widget.draft.barangay),
                  const Divider(height: AppSpacing.xl),
                  _ReviewRow(
                    label: 'Coordinates',
                    value: widget.draft.location.coordinates,
                  ),
                  const Divider(height: AppSpacing.xl),
                  _ReviewRow(
                    label: 'Location',
                    value: widget.draft.location.address,
                  ),
                ],
              ),
            ),
            const SizedBox(height: AppSpacing.md),
            LunasCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Description',
                    style: Theme.of(context).textTheme.labelLarge,
                  ),
                  const SizedBox(height: AppSpacing.sm),
                  Text(widget.draft.description),
                ],
              ),
            ),
            const SizedBox(height: AppSpacing.md),
            Container(
              padding: const EdgeInsets.all(AppSpacing.md),
              decoration: BoxDecoration(
                color: Theme.of(context).colorScheme.tertiaryContainer,
                borderRadius: BorderRadius.circular(12),
              ),
              child: const Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Icon(Icons.auto_awesome_outlined),
                  SizedBox(width: AppSpacing.sm),
                  Expanded(
                    child: Text(
                      'LUNAS may provide server-side AI assistance after you submit this image. AI assistance is advisory only; an authorized official must manually review your report.',
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: AppSpacing.md),
            Text(switch (_comparison) {
              'discrepancy' =>
                'Location differs from current GPS. Reporting from home or using a photo taken earlier is allowed. Explain below.',
              'consistent' => 'No significant discrepancy detected.',
              'inconclusive' =>
                'Comparison inconclusive: GPS is stale or inaccurate. Manual reporting is allowed.',
              _ => 'Comparison unavailable. Manual reporting is allowed.',
            }),
            const Text(
              'Current GPS does not establish where the photo was taken. Barangay jurisdiction is unverified geographically; human review is required.',
            ),
            if (_loadingPolicy)
              Semantics(
                label: 'Loading location review',
                child: const LinearProgressIndicator(),
              ),
            if (_policy == null && !_loadingPolicy)
              TextButton(
                onPressed: _loadPolicy,
                child: const Text('Retry location review'),
              ),
            if (_comparison == 'discrepancy') ...[
              DropdownButtonFormField<String>(
                initialValue: _explanationReason,
                decoration: const InputDecoration(
                  labelText: 'Location discrepancy explanation',
                ),
                items: const [
                  DropdownMenuItem(
                    value: 'photo_taken_earlier',
                    child: Text('Photo was taken earlier'),
                  ),
                  DropdownMenuItem(
                    value: 'gps_inaccurate',
                    child: Text('GPS location is inaccurate'),
                  ),
                  DropdownMenuItem(
                    value: 'reporting_elsewhere',
                    child: Text('Reporting from another location'),
                  ),
                  DropdownMenuItem(value: 'other', child: Text('Other')),
                ],
                onChanged: _submitting
                    ? null
                    : (value) => setState(() => _explanationReason = value),
              ),
              if (_explanationReason == 'other')
                TextField(
                  controller: _explanationText,
                  maxLength: 500,
                  decoration: const InputDecoration(
                    labelText: 'Explanation (at least 10 characters)',
                  ),
                ),
            ],
            CheckboxListTile(
              value: _locationConfirmed,
              onChanged: _submitting
                  ? null
                  : (value) =>
                        setState(() => _locationConfirmed = value ?? false),
              title: const Text(
                'I confirm that the selected pin represents the actual damage location.',
              ),
            ),
            if (widget.draft.evidence.requiresPrivacyAcknowledgement) ...[
              const SizedBox(height: AppSpacing.md),
              CheckboxListTile(
                value: _acknowledgedPrivacy,
                contentPadding: EdgeInsets.zero,
                controlAffinity: ListTileControlAffinity.leading,
                onChanged: _submitting
                    ? null
                    : (value) =>
                          setState(() => _acknowledgedPrivacy = value ?? false),
                title: const Text(
                  'I reviewed this image for private information.',
                ),
                subtitle: const Text(
                  'I understand LUNAS does not automatically blur faces, mask license plates, or anonymize uploaded images.',
                ),
              ),
            ],
            if (_error != null) ...[
              const SizedBox(height: AppSpacing.sm),
              Text(
                _error!,
                style: TextStyle(color: Theme.of(context).colorScheme.error),
              ),
            ],
            const SizedBox(height: AppSpacing.lg),
            LunasButton(
              label: 'Submit Report',
              icon: Icons.send_rounded,
              isLoading: _submitting,
              onPressed: _submitting || _loadingPolicy ? null : _submit,
            ),
            const SizedBox(height: AppSpacing.sm),
            Text(
              'Submitting creates a report in the “Submitted” status. An authorized official will review it next.',
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.bodySmall,
            ),
          ],
        ),
      ),
    ),
  );
}

class _ReviewRow extends StatelessWidget {
  const _ReviewRow({required this.label, required this.value});
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) => Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      Text(label.toUpperCase(), style: Theme.of(context).textTheme.labelSmall),
      const SizedBox(height: AppSpacing.xxs),
      Text(value),
    ],
  );
}
