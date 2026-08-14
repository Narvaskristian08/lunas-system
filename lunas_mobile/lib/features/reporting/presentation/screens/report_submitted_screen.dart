import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:lunas_mobile/core/theme/app_spacing.dart';
import 'package:lunas_mobile/core/widgets/lunas_button.dart';
import 'package:lunas_mobile/core/widgets/lunas_card.dart';
import 'package:lunas_mobile/features/reporting/data/models/incident_report.dart';
import 'package:lunas_mobile/features/reporting/presentation/widgets/report_status_timeline.dart';

class ReportSubmittedScreen extends StatelessWidget {
  const ReportSubmittedScreen({required this.report, super.key});
  final IncidentReport report;

  @override
  Widget build(BuildContext context) => Scaffold(
    body: SafeArea(
      child: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(AppSpacing.xl),
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 520),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const Icon(Icons.check_circle_rounded, size: 72, color: Colors.green),
                const SizedBox(height: AppSpacing.lg),
                Text(
                  'Report submitted',
                  textAlign: TextAlign.center,
                  style: Theme.of(context).textTheme.headlineSmall,
                ),
                const SizedBox(height: AppSpacing.sm),
                const Text(
                  'Your report is now recorded and awaiting official review. Track updates in My Reports.',
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: AppSpacing.xxl),
                LunasCard(
                  child: Column(
                    children: [
                      Text('REPORT REFERENCE', style: Theme.of(context).textTheme.labelSmall),
                      const SizedBox(height: AppSpacing.xs),
                      SelectableText(
                        report.reportNumber,
                        style: Theme.of(context).textTheme.titleLarge,
                      ),
                      const SizedBox(height: AppSpacing.lg),
                      ReportStatusTimeline(events: report.statusHistory),
                    ],
                  ),
                ),
                if (report.possibleDuplicateCandidateCount > 0) ...[
                  const SizedBox(height: AppSpacing.md),
                  Container(
                    padding: const EdgeInsets.all(AppSpacing.md),
                    decoration: BoxDecoration(
                      color: Theme.of(context).colorScheme.tertiaryContainer,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Text(
                      'LUNAS found a possible nearby similar report. Your report was still submitted and will receive official review.',
                    ),
                  ),
                ],
                const SizedBox(height: AppSpacing.xl),
                LunasButton(
                  label: 'View report details',
                  onPressed: report.id.isEmpty
                      ? null
                      : () => context.go('/reports/${report.id}'),
                ),
                const SizedBox(height: AppSpacing.sm),
                TextButton(
                  onPressed: () => context.go('/citizen'),
                  child: const Text('Return home'),
                ),
              ],
            ),
          ),
        ),
      ),
    ),
  );
}
