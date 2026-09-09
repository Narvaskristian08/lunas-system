import 'package:image_picker/image_picker.dart';
import 'package:lunas_mobile/features/reporting/domain/models/evidence_analysis.dart';

abstract interface class EvidenceAnalysisService {
  Future<EvidenceAnalysisResult> analyze(XFile image);
}

/// Compatibility fallback for the mobile evidence model boundary.
///
/// The current mobile flow never runs a model. Hazard assistance belongs to
/// the backend, and the official web workflow always requires manual review.
class UnavailableEvidenceAnalysisService implements EvidenceAnalysisService {
  const UnavailableEvidenceAnalysisService();

  @override
  Future<EvidenceAnalysisResult> analyze(XFile image) async =>
      const EvidenceAnalysisResult(modelAvailable: false);
}
