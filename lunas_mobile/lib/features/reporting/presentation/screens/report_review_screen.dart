import 'dart:async';
import 'package:lunas_mobile/features/reporting/data/models/incident_report.dart';
import 'package:flutter/material.dart';
import 'package:lunas_mobile/features/maps/domain/models/location_integrity.dart';
import 'package:go_router/go_router.dart';
import 'package:lunas_mobile/app/app_services.dart';
import 'package:lunas_mobile/core/network/api_exception.dart';
import 'package:lunas_mobile/core/theme/app_spacing.dart';
import 'package:lunas_mobile/core/widgets/lunas_app_bar.dart';
import 'package:lunas_mobile/core/widgets/lunas_button.dart';
import 'package:lunas_mobile/core/widgets/lunas_card.dart';
import 'package:lunas_mobile/features/reporting/domain/models/citizen_report_draft.dart';
import 'package:lunas_mobile/features/reporting/presentation/widgets/evidence_preview.dart';

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
      subtitle: 'Check your report before submitting.',
      showBackButton: true,
    ),
    bottomNavigationBar: ColoredBox(
      color: Theme.of(context).colorScheme.surface,
      child: SafeArea(
        top: false,
        child: Padding(
          padding: const EdgeInsets.fromLTRB(
            AppSpacing.xl,
            AppSpacing.md,
            AppSpacing.xl,
            AppSpacing.md,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              LunasButton(
                label: 'Submit Report',
                icon: Icons.send_rounded,
                isLoading: _submitting,
                onPressed: _submitting || _loadingPolicy ? null : _submit,
              ),
              const SizedBox(height: AppSpacing.sm),
              Text(
                'An authorized official will review your report next.',
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.bodySmall,
              ),
            ],
          ),
        ),
      ),
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
            LunasCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Report summary',
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const SizedBox(height: AppSpacing.md),
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      SizedBox(
                        width: 88,
                        child: LocalEvidencePreview(
                          evidence: widget.draft.evidence,
                          height: 88,
                        ),
                      ),
                      const SizedBox(width: AppSpacing.md),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              widget.draft.category.label,
                              style: Theme.of(context).textTheme.labelLarge
                                  ?.copyWith(
                                    color: Theme.of(
                                      context,
                                    ).colorScheme.primary,
                                  ),
                            ),
                            const SizedBox(height: AppSpacing.sm),
                            Text(widget.draft.description),
                          ],
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: AppSpacing.lg),
            Text(
              'Report location',
              style: Theme.of(
                context,
              ).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700),
            ),
            const SizedBox(height: AppSpacing.sm),
            LunasCard(
              child: Material(
                type: MaterialType.transparency,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Icon(
                          Icons.location_on_outlined,
                          color: Theme.of(context).colorScheme.primary,
                        ),
                        const SizedBox(width: AppSpacing.sm),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                widget.draft.barangay,
                                style: Theme.of(context).textTheme.titleMedium
                                    ?.copyWith(fontWeight: FontWeight.w700),
                              ),
                              const SizedBox(height: AppSpacing.xs),
                              Text(widget.draft.location.address),
                              const SizedBox(height: AppSpacing.sm),
                              Text(
                                widget.draft.location.coordinates,
                                style: Theme.of(context).textTheme.bodySmall,
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: AppSpacing.lg),
            Text(
              'Before you submit',
              style: Theme.of(
                context,
              ).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700),
            ),
            const SizedBox(height: AppSpacing.sm),
            LunasCard(
              child: Material(
                type: MaterialType.transparency,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Text(
                      'Location check',
                      style: Theme.of(context).textTheme.labelLarge,
                    ),
                    const SizedBox(height: AppSpacing.sm),
                    Text(switch (_comparison) {
                      'discrepancy' =>
                        'Location differs from current GPS. Reporting from home or using a photo taken earlier is allowed. Explain below.',
                      'consistent' => 'No significant discrepancy detected.',
                      'inconclusive' =>
                        'Comparison inconclusive: GPS is stale or inaccurate. Manual reporting is allowed.',
                      _ =>
                        'Comparison unavailable. Manual reporting is allowed.',
                    }),
                    const Text(
                      'GPS is a reference only. An official will verify the report location and barangay.',
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
                          DropdownMenuItem(
                            value: 'other',
                            child: Text('Other'),
                          ),
                        ],
                        onChanged: _submitting
                            ? null
                            : (value) =>
                                  setState(() => _explanationReason = value),
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
                    const SizedBox(height: AppSpacing.md),
                    CheckboxListTile(
                      contentPadding: EdgeInsets.zero,
                      controlAffinity: ListTileControlAffinity.leading,
                      value: _locationConfirmed,
                      onChanged: _submitting
                          ? null
                          : (value) => setState(
                              () => _locationConfirmed = value ?? false,
                            ),
                      title: const Text(
                        'The pin marks the actual damage location.',
                      ),
                    ),
                    if (widget
                        .draft
                        .evidence
                        .requiresPrivacyAcknowledgement) ...[
                      const Divider(height: AppSpacing.xl),
                      Text(
                        'Evidence privacy',
                        style: Theme.of(context).textTheme.labelLarge,
                      ),
                      CheckboxListTile(
                        value: _acknowledgedPrivacy,
                        contentPadding: EdgeInsets.zero,
                        controlAffinity: ListTileControlAffinity.leading,
                        onChanged: _submitting
                            ? null
                            : (value) => setState(
                                () => _acknowledgedPrivacy = value ?? false,
                              ),
                        title: const Text(
                          'I checked the image for private information.',
                        ),
                        subtitle: const Text(
                          'Faces and license plates are automatically checked and redacted before storage.',
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ),
            const SizedBox(height: AppSpacing.md),
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Icon(
                  Icons.info_outline_rounded,
                  size: 16,
                  color: Theme.of(context).colorScheme.onSurfaceVariant,
                ),
                const SizedBox(width: AppSpacing.sm),
                Expanded(
                  child: Text(
                    'AI may assist with image screening. An authorized official makes the review decision.',
                    style: Theme.of(context).textTheme.bodySmall,
                  ),
                ),
              ],
            ),
            if (_error != null) ...[
              const SizedBox(height: AppSpacing.sm),
              Text(
                _error!,
                style: TextStyle(color: Theme.of(context).colorScheme.error),
              ),
            ],
          ],
        ),
      ),
    ),
  );
}
