import 'package:flutter/material.dart';
import 'package:lunas_mobile/core/theme/app_spacing.dart';
import 'package:lunas_mobile/core/widgets/lunas_app_bar.dart';
import 'package:lunas_mobile/core/widgets/lunas_card.dart';
import 'package:lunas_mobile/features/reporting/data/models/incident_report.dart';
import 'package:lunas_mobile/features/reporting/presentation/widgets/evidence_preview.dart';

/// Displays server-authored AI assistance when a real report is available.
/// No placeholder classification is shown when the backend has no result.
class AiHazardDetectionResultScreen extends StatelessWidget {
  const AiHazardDetectionResultScreen({this.report, super.key});
  final IncidentReport? report;

  @override
  Widget build(BuildContext context) {
    final analysis = report?.aiAnalysis;
    return Scaffold(
      appBar: const LunasAppBar(title: 'Detection Result', subtitle: 'AI assistance', showBackButton: true),
      body: SafeArea(top: false, child: SingleChildScrollView(
        padding: const EdgeInsets.all(AppSpacing.xl),
        child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
          if (report?.images.isNotEmpty == true)
            RemoteEvidencePreview(url: report!.images.first.url, width: report!.images.first.width, height: report!.images.first.height, findings: report!.images.first.aiFindings)
          else
            const LunasCard(child: Text('No submitted evidence image is available for this report.')),
          const SizedBox(height: AppSpacing.md),
          LunasCard(child: analysis == null ? const Text('AI analysis is not available for this report. Official review remains the source of truth.') : Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text('AI assistance', style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: AppSpacing.sm),
            Text(analysis.category ?? analysis.hazardType ?? 'No classification returned.'),
            const SizedBox(height: AppSpacing.sm),
            Text('Confidence: ${(analysis.confidence * 100).round()}%'),
            const SizedBox(height: AppSpacing.sm),
            LinearProgressIndicator(value: analysis.confidence),
            const SizedBox(height: AppSpacing.md),
            const Text('Advisory only. An authorized official must manually review the report.'),
          ])),
        ]),
      )),
    );
  }
}
