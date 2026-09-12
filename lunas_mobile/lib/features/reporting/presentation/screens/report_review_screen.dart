import 'package:flutter/material.dart';
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
  const ReportReviewScreen({required this.draft, super.key});
  final CitizenReportDraft draft;

  @override
  State<ReportReviewScreen> createState() => _ReportReviewScreenState();
}

class _ReportReviewScreenState extends State<ReportReviewScreen> {
  bool _acknowledgedPrivacy = false;
  bool _submitting = false;
  String? _error;

  Future<void> _submit() async {
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
      final report = await reportService.submit(
        CitizenReportDraft(
          category: widget.draft.category,
          description: widget.draft.description,
          location: widget.draft.location,
          barangay: widget.draft.barangay,
          evidence: widget.draft.evidence,
          privacyAcknowledged: _acknowledgedPrivacy,
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
      title: 'Review report',
      subtitle: 'Check the details before submitting',
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
            const ReportProgressIndicator(current: 4),
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
                  'I understand LUNAS cannot confirm faces or license plates were redacted in this build.',
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
              label: 'Submit report',
              icon: Icons.send_rounded,
              isLoading: _submitting,
              onPressed: _submitting ? null : _submit,
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
