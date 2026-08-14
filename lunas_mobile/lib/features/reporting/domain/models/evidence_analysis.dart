/// Result contract for an optional on-device evidence model.
///
/// It intentionally distinguishes an unavailable model from an analysis that
/// found no hazard or no privacy concern. A later approved TensorFlow Lite
/// implementation can satisfy this contract while the report flow continues
/// to require the citizen's privacy acknowledgement.
class EvidenceAnalysisResult {
  const EvidenceAnalysisResult({
    required this.modelAvailable,
    this.suggestedCategory,
    this.confidence,
    this.privacyRedactionApplied = false,
  });

  final bool modelAvailable;
  final String? suggestedCategory;
  final double? confidence;
  final bool privacyRedactionApplied;
}
