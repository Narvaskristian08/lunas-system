import 'dart:typed_data';

import 'package:flutter/material.dart';
import 'package:lunas_mobile/core/theme/app_spacing.dart';
import 'package:lunas_mobile/core/widgets/lunas_state_view.dart';
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
    this.width,
    this.height,
    super.key,
  });

  final String url;
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
        child: Image.network(
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
