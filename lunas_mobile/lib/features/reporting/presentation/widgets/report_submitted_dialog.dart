import 'package:flutter/material.dart';
import 'package:lunas_mobile/core/theme/app_spacing.dart';
import 'package:lunas_mobile/core/theme/text_styles.dart';
import 'package:lunas_mobile/core/widgets/lunas_button.dart';
import 'package:lunas_mobile/features/reporting/data/models/incident_report.dart';

class ReportSubmittedDialog extends StatelessWidget {
  const ReportSubmittedDialog({required this.report, super.key});
  final IncidentReport report;
  @override
  Widget build(BuildContext context) => PopScope(
    canPop: false,
    child: Dialog(
      insetPadding: const EdgeInsets.symmetric(horizontal: 24, vertical: 32),
      constraints: const BoxConstraints(maxWidth: 400),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      child: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(28, 32, 28, 20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Icon(
              Icons.check_circle_rounded,
              size: 56,
              color: Colors.green,
            ),
            const SizedBox(height: AppSpacing.lg),
            Text(
              'Report Submitted',
              textAlign: TextAlign.center,
              style: Theme.of(
                context,
              ).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w700),
            ),
            const SizedBox(height: AppSpacing.sm),
            const Text(
              'Your report has been received. Track its progress in My Reports.',
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: AppSpacing.lg),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 18),
              decoration: BoxDecoration(
                color: Theme.of(
                  context,
                ).colorScheme.primary.withValues(alpha: .04),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Column(
                children: [
                  Text(
                    'Report ID',
                    style: Theme.of(context).textTheme.labelSmall,
                  ),
                  const SizedBox(height: AppSpacing.sm),
                  SelectableText(
                    report.reportNumber,
                    textAlign: TextAlign.center,
                    style: AppTextStyles.technicalHash.copyWith(
                      fontSize: 16,
                      fontWeight: FontWeight.w700,
                      color: Theme.of(context).colorScheme.onSurface,
                    ),
                  ),
                ],
              ),
            ),
            if (report.possibleDuplicateCandidateCount > 0) ...[
              const SizedBox(height: AppSpacing.md),
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Icon(
                    Icons.info_outline_rounded,
                    size: 18,
                    color: Theme.of(context).colorScheme.onSurfaceVariant,
                  ),
                  const SizedBox(width: AppSpacing.sm),
                  Expanded(
                    child: Text(
                      'A similar report was found nearby. An official will check both reports.',
                      style: Theme.of(
                        context,
                      ).textTheme.bodySmall?.copyWith(height: 1.5),
                    ),
                  ),
                ],
              ),
            ],
            const SizedBox(height: AppSpacing.lg),
            LunasButton(
              label: 'View Report Details',
              onPressed: report.id.isEmpty
                  ? null
                  : () => Navigator.of(
                      context,
                    ).pop('/reports/${Uri.encodeComponent(report.id)}'),
            ),
            const SizedBox(height: AppSpacing.sm),
            TextButton(
              onPressed: () => Navigator.of(context).pop('/citizen'),
              child: const Text('Close'),
            ),
          ],
        ),
      ),
    ),
  );
}
