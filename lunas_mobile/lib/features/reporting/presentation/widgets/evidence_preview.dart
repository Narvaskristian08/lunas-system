import 'dart:typed_data';

import 'package:flutter/material.dart';
import 'package:lunas_mobile/core/theme/app_spacing.dart';
import 'package:lunas_mobile/core/widgets/lunas_card.dart';
import 'package:lunas_mobile/core/widgets/lunas_state_view.dart';
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
            errorBuilder: (_, _, _) => _PreviewFallback(height: height),
          ),
        );
      }
      if (snapshot.hasError) return _PreviewFallback(height: height);
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
    return ClipRRect(
      borderRadius: BorderRadius.circular(12),
      child: AspectRatio(
        aspectRatio: width != null && height != null && height! > 0
            ? width! / height!
            : 4 / 3,
        child: LayoutBuilder(
          builder: (context, constraints) => Stack(
            fit: StackFit.expand,
            clipBehavior: Clip.none,
            children: [
              Image.network(
                url,
                fit: BoxFit.contain,
                errorBuilder: (_, _, _) => const _PreviewFallback(),
                loadingBuilder: (context, child, progress) => progress == null
                    ? child
                    : const Center(
                        child: SizedBox.square(
                          dimension: 36,
                          child: LunasLoadingIndicator(),
                        ),
                      ),
              ),
              for (final finding in findings)
                Positioned(
                  left: finding.bbox.x1 * constraints.maxWidth,
                  top: finding.bbox.y1 * constraints.maxHeight,
                  width:
                      (finding.bbox.x2 - finding.bbox.x1) *
                      constraints.maxWidth,
                  height:
                      (finding.bbox.y2 - finding.bbox.y1) *
                      constraints.maxHeight,
                  child: DecoratedBox(
                    decoration: BoxDecoration(
                      border: Border.all(
                        color: Colors.amber.shade700,
                        width: 2,
                      ),
                      color: Colors.amber.withValues(alpha: 0.12),
                    ),
                    child: Align(
                      alignment: Alignment.topLeft,
                      child: Container(
                        color: Colors.black87,
                        padding: const EdgeInsets.symmetric(
                          horizontal: 4,
                          vertical: 2,
                        ),
                        child: Text(
                          '${finding.label} · ${(finding.confidence * 100).round()}%',
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 10,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
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
              const Chip(label: Text('AI assistance only')),
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
              'Category model: ${_modelLabel(analysis!.model!)}${completed ? '' : ' (unavailable)'}',
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

String _modelLabel(String value) {
  final words = value
      .split(RegExp(r'[_-]+'))
      .where((word) => word.isNotEmpty)
      .map((word) => '${word[0].toUpperCase()}${word.substring(1)}');
  return words.join(' ');
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
          const Icon(Icons.image_not_supported_outlined, size: 42),
          const SizedBox(height: AppSpacing.sm),
          Text(
            'Evidence preview unavailable',
            style: Theme.of(context).textTheme.bodySmall,
          ),
        ],
      ),
    ),
  );
}
