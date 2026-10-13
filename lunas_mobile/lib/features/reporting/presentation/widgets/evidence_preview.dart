import 'dart:typed_data';

import 'package:flutter/material.dart';
import 'package:lunas_mobile/core/theme/app_spacing.dart';
import 'package:lunas_mobile/core/widgets/lunas_card.dart';
import 'package:lunas_mobile/core/widgets/lunas_state_view.dart';
import 'package:lunas_mobile/core/utils/display_labels.dart';
import 'package:lunas_mobile/features/reporting/data/models/incident_report.dart';
import 'package:lunas_mobile/features/reporting/domain/models/evidence_selection.dart';

class LocalEvidencePreview extends StatelessWidget {
  const LocalEvidencePreview({
    required this.evidence,
    this.height = 180,
    super.key,
  });

  final EvidenceSelection evidence;
  final double height;

  @override
  Widget build(BuildContext context) => FutureBuilder<Uint8List>(
    future: evidence.readAsBytes(),
    builder: (context, snapshot) {
      if (snapshot.hasData) {
        return ClipRRect(
          borderRadius: BorderRadius.circular(12),
          child: Image.memory(
            snapshot.data!,
            height: height,
            width: double.infinity,
            fit: BoxFit.cover,
            errorBuilder: (_, error, _) {
              debugPrint(
                'Local evidence decoding failed (${error.runtimeType}).',
              );
              return _PreviewFallback(height: height);
            },
          ),
        );
      }
      if (snapshot.hasError) {
        debugPrint(
          'Local evidence read failed (${snapshot.error.runtimeType}).',
        );
        return _PreviewFallback(height: height);
      }
      return SizedBox(
        height: height,
        child: const Center(
          child: SizedBox.square(dimension: 36, child: LunasLoadingIndicator()),
        ),
      );
    },
  );
}

class RemoteEvidencePreview extends StatelessWidget {
  const RemoteEvidencePreview({
    required this.url,
    this.findings = const [],
    this.width,
    this.height,
    super.key,
  });
  final String url;
  final List<AiFinding> findings;
  final int? width;
  final int? height;

  @override
  Widget build(BuildContext context) {
    if (!url.startsWith('http')) return const _PreviewFallback();
    final visibleFindings =
        findings
            .where((finding) => finding.confidence >= .25)
            .toList(growable: false)
          ..sort((a, b) => b.confidence.compareTo(a.confidence));
    final limitedFindings = visibleFindings.take(5).toList(growable: false);
    final overlayColor = Theme.of(context).colorScheme.tertiary;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        ClipRRect(
          borderRadius: BorderRadius.circular(12),
          child: AspectRatio(
            aspectRatio: width != null && height != null && height! > 0
                ? width! / height!
                : 4 / 3,
            child: LayoutBuilder(
              builder: (context, constraints) => Image.network(
                url,
                fit: BoxFit.contain,
                errorBuilder: (_, error, _) {
                  debugPrint(
                    'Evidence image could not be loaded (${error.runtimeType}).',
                  );
                  return const _PreviewFallback();
                },
                loadingBuilder: (context, child, progress) => progress == null
                    ? child
                    : const Center(
                        child: SizedBox.square(
                          dimension: 36,
                          child: LunasLoadingIndicator(),
                        ),
                      ),
                frameBuilder: (context, child, frame, synchronous) {
                  if (frame == null && !synchronous) return child;
                  return Stack(
                    fit: StackFit.expand,
                    clipBehavior: Clip.hardEdge,
                    children: [
                      child,
                      for (
                        var index = 0;
                        index < limitedFindings.length;
                        index++
                      )
                        _FindingOverlay(
                          finding: limitedFindings[index],
                          number: index + 1,
                          color: overlayColor,
                          availableWidth: constraints.maxWidth,
                          availableHeight: constraints.maxHeight,
                        ),
                    ],
                  );
                },
              ),
            ),
          ),
        ),
        if (limitedFindings.isNotEmpty) ...[
          const SizedBox(height: AppSpacing.sm),
          Wrap(
            spacing: AppSpacing.sm,
            runSpacing: AppSpacing.xs,
            children: [
              for (var index = 0; index < limitedFindings.length; index++)
                _FindingLegendItem(
                  number: index + 1,
                  finding: limitedFindings[index],
                  color: overlayColor,
                ),
            ],
          ),
        ],
      ],
    );
  }
}

class _FindingOverlay extends StatelessWidget {
  const _FindingOverlay({
    required this.finding,
    required this.number,
    required this.color,
    required this.availableWidth,
    required this.availableHeight,
  });

  final AiFinding finding;
  final int number;
  final Color color;
  final double availableWidth;
  final double availableHeight;

  @override
  Widget build(BuildContext context) => Positioned(
    left: finding.bbox.x1 * availableWidth,
    top: finding.bbox.y1 * availableHeight,
    width: (finding.bbox.x2 - finding.bbox.x1) * availableWidth,
    height: (finding.bbox.y2 - finding.bbox.y1) * availableHeight,
    child: DecoratedBox(
      decoration: BoxDecoration(
        border: Border.all(color: color, width: 2),
        color: color.withValues(alpha: .08),
      ),
      child: Align(
        alignment: Alignment.topLeft,
        child: Container(
          width: 22,
          height: 22,
          alignment: Alignment.center,
          decoration: BoxDecoration(color: color, shape: BoxShape.circle),
          child: Text(
            '$number',
            style: const TextStyle(
              color: Colors.white,
              fontSize: 11,
              fontWeight: FontWeight.w700,
            ),
          ),
        ),
      ),
    ),
  );
}

class _FindingLegendItem extends StatelessWidget {
  const _FindingLegendItem({
    required this.number,
    required this.finding,
    required this.color,
  });

  final int number;
  final AiFinding finding;
  final Color color;

  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.symmetric(horizontal: AppSpacing.sm, vertical: 6),
    decoration: BoxDecoration(
      color: color.withValues(alpha: .1),
      borderRadius: BorderRadius.circular(999),
    ),
    child: Text(
      '$number  ${humanizeCodeLabel(finding.label)} · ${(finding.confidence * 100).round()}%',
      style: Theme.of(context).textTheme.labelSmall?.copyWith(
        color: color,
        fontWeight: FontWeight.w700,
      ),
    ),
  );
}

class AiAssistanceCard extends StatelessWidget {
  const AiAssistanceCard({required this.analysis, super.key});

  final AiAnalysis? analysis;

  @override
  Widget build(BuildContext context) {
    if (analysis == null) return const SizedBox.shrink();
    final completed = analysis!.status == 'completed';
    final status = switch (analysis!.status) {
      'completed' => 'Analysis completed',
      'failed' => 'Analysis unavailable',
      _ => 'Category model unavailable',
    };
    return LunasCard(
      color: Theme.of(context).colorScheme.tertiaryContainer,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Wrap(
            spacing: AppSpacing.sm,
            runSpacing: AppSpacing.xs,
            crossAxisAlignment: WrapCrossAlignment.center,
            children: [
              const Icon(Icons.auto_awesome_outlined),
              Text(status, style: Theme.of(context).textTheme.titleMedium),
              const Chip(label: Text('AI Assistance Only')),
            ],
          ),
          const SizedBox(height: AppSpacing.sm),
          Text(
            'Manual review required. AI assistance does not change the category, priority, routing, status, duplicate decision, work order, or closure.',
            style: Theme.of(context).textTheme.bodySmall,
          ),
          if (analysis!.model != null) ...[
            const SizedBox(height: AppSpacing.xs),
            Text(
              'Category model: ${humanizeCodeLabel(analysis!.model!)}${completed ? '' : ' (unavailable)'}',
              style: Theme.of(context).textTheme.bodySmall,
            ),
          ],
          if (completed) ...[
            const SizedBox(height: AppSpacing.sm),
            Text(
              analysis!.hazardType == null
                  ? '${analysis!.findingsCount} image highlight(s) available for review.'
                  : 'Image finding: ${analysis!.hazardType} · ${(analysis!.confidence * 100).round()}% confidence.',
            ),
          ] else ...[
            const SizedBox(height: AppSpacing.sm),
            Text(
              'The report remains available for manual review because no category model result is available.',
              style: Theme.of(context).textTheme.bodySmall,
            ),
          ],
        ],
      ),
    );
  }
}

class _PreviewFallback extends StatelessWidget {
  const _PreviewFallback({this.height = 180});
  final double height;

  @override
  Widget build(BuildContext context) => SizedBox(
    height: height,
    child: Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            Icons.image_not_supported_outlined,
            size: height < 100 ? 24 : 42,
          ),
          const SizedBox(height: AppSpacing.sm),
          Text(
            height < 100 ? 'No preview' : 'Evidence preview unavailable',
            style: Theme.of(context).textTheme.bodySmall,
          ),
        ],
      ),
    ),
  );
}
