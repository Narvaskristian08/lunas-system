import 'dart:typed_data';

import 'package:flutter/material.dart';
import 'package:lunas_mobile/core/theme/app_spacing.dart';
import 'package:lunas_mobile/features/reporting/domain/models/evidence_selection.dart';

class LocalEvidencePreview extends StatelessWidget {
  const LocalEvidencePreview({required this.evidence, this.height = 180, super.key});

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
        child: const Center(child: CircularProgressIndicator()),
      );
    },
  );
}

class RemoteEvidencePreview extends StatelessWidget {
  const RemoteEvidencePreview({required this.url, super.key});
  final String url;

  @override
  Widget build(BuildContext context) {
    if (!url.startsWith('http')) return const _PreviewFallback();
    return ClipRRect(
      borderRadius: BorderRadius.circular(12),
      child: Image.network(
        url,
        height: 200,
        width: double.infinity,
        fit: BoxFit.cover,
        errorBuilder: (_, _, _) => const _PreviewFallback(),
        loadingBuilder: (context, child, progress) => progress == null
            ? child
            : const SizedBox(
                height: 200,
                child: Center(child: CircularProgressIndicator()),
              ),
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
          const Icon(Icons.image_not_supported_outlined, size: 42),
          const SizedBox(height: AppSpacing.sm),
          Text('Evidence preview unavailable', style: Theme.of(context).textTheme.bodySmall),
        ],
      ),
    ),
  );
}
