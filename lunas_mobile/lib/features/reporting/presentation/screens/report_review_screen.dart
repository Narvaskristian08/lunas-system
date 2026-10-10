import 'package:lunas_mobile/features/reporting/presentation/widgets/reporting_widgets.dart';
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
import 'package:lunas_mobile/features/reporting/data/models/reporting_restriction.dart';

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
      if (mounted && !_submitting) _updateReview(() {});
    });
  }

  Future<void> _loadPolicy() async {
    _updateReview(() => _loadingPolicy = true);
    try {
      final policy =
          await (widget.policyLoader ?? reportService.getLocationPolicy)();
      if (mounted) {
        _updateReview(() {
          _policy = policy;
          _error = null;
        });
      }
    } catch (_) {
      if (mounted) {
        _updateReview(
          () => _error =
              'Location review unavailable. Tap Retry location review.',
        );
      }
    } finally {
      if (mounted) _updateReview(() => _loadingPolicy = false);
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
  ReportingRestriction? _reportingRestriction;

  Future<void> _submit() async {
    if (_policy == null) {
      _updateReview(
        () =>
            _error = 'Location review unavailable. Tap Retry location review.',
      );
      return;
    }
    if (!_locationConfirmed) {
      _updateReview(
        () => _error =
            'Confirm that the selected pin is the actual damage location.',
      );
      return;
    }
    if (_comparison == 'discrepancy' &&
        (_explanationReason == null ||
            (_explanationReason == 'other' &&
                _explanationText.text.trim().length < 10))) {
      _updateReview(
        () => _error =
            'Choose an explanation. Other requires at least 10 characters.',
      );
      return;
    }
    if (widget.draft.evidence.requiresPrivacyAcknowledgement &&
        !_acknowledgedPrivacy) {
      _updateReview(
        () => _error =
            'Confirm that the evidence does not include private or identifying information before submitting.',
      );
      return;
    }
    _updateReview(() {
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
      if (_sheetState != null) {
        _sheetState = null;
        Navigator.of(context, rootNavigator: true).pop();
      }
      context.go('/citizen', extra: report);
    } on ApiException catch (error) {
      if (mounted) {
        _updateReview(() {
          if (error.code == 'REPORTING_BLOCKED') {
            final raw = error.data?['reportingRestriction'];
            _reportingRestriction = ReportingRestriction.fromJson(
              raw is Map ? Map<String, dynamic>.from(raw) : null,
            );
            _error = null;
          } else {
            _error = error.message;
          }
        });
      }
    } catch (_) {
      if (mounted) {
        _updateReview(
          () => _error =
              'We could not submit this report. Your form is still available; please try again.',
        );
      }
    } finally {
      if (mounted) _updateReview(() => _submitting = false);
    }
  }

  StateSetter? _sheetState;
  void _updateReview(VoidCallback update) {
    if (!mounted) return;
    setState(update);
    _sheetState?.call(() {});
  }

  Future<void> _openConfirmation() async {
    await showDialog<void>(
      context: context,
      useRootNavigator: true,
      barrierDismissible: false,
      builder: (sheetContext) => StatefulBuilder(
        builder: (_, sheetState) {
          _sheetState = sheetState;
          return PopScope(
            canPop: !_submitting,
            child: Dialog(
              alignment: Alignment.center,
              insetPadding: const EdgeInsets.symmetric(
                horizontal: AppSpacing.xl,
                vertical: AppSpacing.lg,
              ),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(20),
              ),
              child: Padding(
                padding: const EdgeInsets.only(top: AppSpacing.lg),
                child: ConstrainedBox(
                  constraints: BoxConstraints(
                    maxHeight:
                        (MediaQuery.sizeOf(sheetContext).height -
                            MediaQuery.viewInsetsOf(sheetContext).bottom -
                            MediaQuery.paddingOf(sheetContext).vertical -
                            AppSpacing.lg * 2) *
                        .8,
                  ),
                  child: SingleChildScrollView(
                    physics: const BouncingScrollPhysics(
                      parent: AlwaysScrollableScrollPhysics(),
                    ),
                    keyboardDismissBehavior:
                        ScrollViewKeyboardDismissBehavior.onDrag,
                    padding: const EdgeInsets.fromLTRB(
                      AppSpacing.xl,
                      0,
                      AppSpacing.xl,
                      AppSpacing.lg,
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          'Final Check',
                          style: Theme.of(context).textTheme.titleMedium
                              ?.copyWith(fontWeight: FontWeight.w700),
                        ),
                        const SizedBox(height: AppSpacing.sm),
                        Text(
                          'Review both items to continue.',
                          style: Theme.of(context).textTheme.bodyMedium,
                        ),
                        const SizedBox(height: AppSpacing.md),
                        Padding(
                          padding: EdgeInsets.zero,
                          child: Material(
                            type: MaterialType.transparency,
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.stretch,
                              children: [
                                if (_comparison == 'discrepancy')
                                  const Text(
                                    'The pin is away from your current location. Tell us why—you can report from elsewhere or use an earlier photo.',
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
                                      labelText:
                                          'Location discrepancy explanation',
                                    ),
                                    items: const [
                                      DropdownMenuItem(
                                        value: 'photo_taken_earlier',
                                        child: Text('Photo was taken earlier'),
                                      ),
                                      DropdownMenuItem(
                                        value: 'gps_inaccurate',
                                        child: Text(
                                          'GPS location is inaccurate',
                                        ),
                                      ),
                                      DropdownMenuItem(
                                        value: 'reporting_elsewhere',
                                        child: Text(
                                          'Reporting from another location',
                                        ),
                                      ),
                                      DropdownMenuItem(
                                        value: 'other',
                                        child: Text('Other'),
                                      ),
                                    ],
                                    onChanged: _submitting
                                        ? null
                                        : (value) => _updateReview(
                                            () => _explanationReason = value,
                                          ),
                                  ),
                                  if (_explanationReason == 'other')
                                    TextField(
                                      controller: _explanationText,
                                      maxLength: 500,
                                      decoration: const InputDecoration(
                                        labelText:
                                            'Explanation (at least 10 characters)',
                                      ),
                                    ),
                                ],
                                const SizedBox(height: AppSpacing.sm),
                                _ConfirmationRow(
                                  value: _locationConfirmed,
                                  onChanged: _submitting
                                      ? null
                                      : (value) => _updateReview(
                                          () => _locationConfirmed =
                                              value ?? false,
                                        ),
                                  title: 'I confirmed the damage location.',
                                  subtitle:
                                      'The pin marks where the damage is.',
                                ),
                                if (widget
                                    .draft
                                    .evidence
                                    .requiresPrivacyAcknowledgement) ...[
                                  const Divider(height: AppSpacing.md),

                                  _ConfirmationRow(
                                    value: _acknowledgedPrivacy,
                                    onChanged: _submitting
                                        ? null
                                        : (value) => _updateReview(
                                            () => _acknowledgedPrivacy =
                                                value ?? false,
                                          ),
                                    title: 'I reviewed the photo for privacy.',
                                    subtitle:
                                        'I checked for personal details. Faces and plates are also checked and redacted before storage.',
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
                              color: Theme.of(
                                context,
                              ).colorScheme.onSurfaceVariant,
                            ),
                            const SizedBox(width: AppSpacing.sm),
                            Expanded(
                              child: Text(
                                'An official reviews every report. AI assists with screening.',
                                style: Theme.of(context).textTheme.bodySmall,
                              ),
                            ),
                          ],
                        ),
                        if (_error != null) ...[
                          const SizedBox(height: AppSpacing.sm),
                          Text(
                            _error!,
                            style: TextStyle(
                              color: Theme.of(context).colorScheme.error,
                            ),
                          ),
                        ],
                        const SizedBox(height: AppSpacing.lg),
                        LunasButton(
                          label: 'Submit Report',
                          icon: Icons.send_rounded,
                          isLoading: _submitting,
                          onPressed: _submitting || _loadingPolicy
                              ? null
                              : _submit,
                        ),
                        TextButton(
                          onPressed: _submitting
                              ? null
                              : () => Navigator.of(sheetContext).pop(),
                          child: const Text('Back to Review'),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          );
        },
      ),
    );
    _sheetState = null;
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: const LunasAppBar(
      title: 'Confirm Details',
      subtitle: 'Check your report before submitting.',
      showBackButton: true,
    ),
    bottomNavigationBar: SafeArea(
      top: false,
      child: Padding(
        padding: const EdgeInsets.fromLTRB(
          AppSpacing.xl,
          AppSpacing.sm,
          AppSpacing.xl,
          AppSpacing.lg,
        ),
        child: LunasButton(
          label: _reportingRestriction?.isBlocked == true
              ? 'Open Appeal'
              : 'Submit Report',
          icon: _reportingRestriction?.isBlocked == true
              ? Icons.rate_review_outlined
              : Icons.send_rounded,
          isLoading: _submitting,
          onPressed: _submitting || _loadingPolicy
              ? null
              : _reportingRestriction?.isBlocked == true
              ? () => context.push('/reports/appeal')
              : _openConfirmation,
        ),
      ),
    ),
    body: SafeArea(
      top: false,
      child: LayoutBuilder(
        builder: (context, constraints) => SingleChildScrollView(
          physics: const BouncingScrollPhysics(
            parent: AlwaysScrollableScrollPhysics(),
          ),
          padding: const EdgeInsets.fromLTRB(
            AppSpacing.xl,
            AppSpacing.md,
            AppSpacing.xl,
            AppSpacing.md,
          ),
          child: ConstrainedBox(
            constraints: BoxConstraints(
              minHeight: (constraints.maxHeight - AppSpacing.md * 2).clamp(
                0.0,
                double.infinity,
              ),
            ),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(16),
                  child: LocalEvidencePreview(
                    evidence: widget.draft.evidence,
                    height: 180,
                  ),
                ),
                const SizedBox(height: AppSpacing.md),
                if (_reportingRestriction?.isBlocked == true) ...[
                  _ReportingBlockedCard(restriction: _reportingRestriction!),
                  const SizedBox(height: AppSpacing.md),
                ],
                LunasCard(
                  child: Row(
                    children: [
                      Icon(
                        reportCategoryIcon(widget.draft.category.code),
                        size: 28,
                        color: Theme.of(context).colorScheme.primary,
                      ),
                      const SizedBox(width: AppSpacing.md),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Category',
                              style: Theme.of(context).textTheme.labelSmall,
                            ),
                            const SizedBox(height: AppSpacing.xs),
                            Text(
                              widget.draft.category.label,
                              style: Theme.of(context).textTheme.titleMedium
                                  ?.copyWith(fontWeight: FontWeight.w700),
                            ),
                          ],
                        ),
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
                LunasCard(
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Icon(
                        Icons.location_on_outlined,
                        size: 22,
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
                            const SizedBox(height: AppSpacing.sm),
                            Text(
                              widget.draft.location.address,
                              style: Theme.of(
                                context,
                              ).textTheme.bodyMedium?.copyWith(height: 1.5),
                            ),
                          ],
                        ),
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

class _ConfirmationRow extends StatelessWidget {
  const _ConfirmationRow({
    required this.value,
    required this.onChanged,
    required this.title,
    required this.subtitle,
  });
  final bool value;
  final ValueChanged<bool?>? onChanged;
  final String title;
  final String subtitle;
  @override
  Widget build(BuildContext context) => InkWell(
    borderRadius: BorderRadius.circular(8),
    onTap: onChanged == null ? null : () => onChanged!(!value),
    child: Padding(
      padding: const EdgeInsets.symmetric(vertical: AppSpacing.sm),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 32,
            height: 28,
            child: Checkbox(value: value, onChanged: onChanged),
          ),
          const SizedBox(width: AppSpacing.sm),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: Theme.of(
                    context,
                  ).textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.w600),
                ),
                const SizedBox(height: AppSpacing.xs),
                Text(subtitle, style: Theme.of(context).textTheme.bodySmall),
              ],
            ),
          ),
        ],
      ),
    ),
  );
}

class _ReportingBlockedCard extends StatelessWidget {
  const _ReportingBlockedCard({required this.restriction});

  final ReportingRestriction restriction;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return LunasCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              Icon(Icons.pause_circle_outline, color: theme.colorScheme.error),
              const SizedBox(width: AppSpacing.sm),
              Expanded(
                child: Text(
                  'Report submission paused',
                  style: theme.textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.sm),
          Text(
            'You have ${restriction.confirmedFindings} confirmed invalid-report findings. You can still sign in, view your reports, and submit an appeal.',
          ),
          const SizedBox(height: AppSpacing.md),
          LinearProgressIndicator(
            value: (restriction.confirmedFindings / restriction.threshold)
                .clamp(0, 1)
                .toDouble(),
          ),
          const SizedBox(height: AppSpacing.xs),
          Text(
            '${restriction.confirmedFindings} / ${restriction.threshold} confirmed findings',
            style: theme.textTheme.bodySmall,
          ),
          const SizedBox(height: AppSpacing.md),
          LunasButton(
            label: 'Submit Appeal',
            icon: Icons.rate_review_outlined,
            onPressed: () => context.push('/reports/appeal'),
          ),
        ],
      ),
    );
  }
}
