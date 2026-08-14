import 'package:image_picker/image_picker.dart';
import 'package:lunas_mobile/features/reporting/domain/models/evidence_analysis.dart';

abstract interface class EvidenceAnalysisService {
  Future<EvidenceAnalysisResult> analyze(XFile image);
}

/// Truthful fallback until an approved on-device model asset is delivered.
/// It never infers a category and never reports privacy redaction as complete.
class UnavailableEvidenceAnalysisService implements EvidenceAnalysisService {
  const UnavailableEvidenceAnalysisService();

  @override
  Future<EvidenceAnalysisResult> analyze(XFile image) async =>
      const EvidenceAnalysisResult(modelAvailable: false);
}
