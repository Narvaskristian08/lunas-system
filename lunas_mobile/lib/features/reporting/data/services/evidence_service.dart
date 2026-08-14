import 'package:image_picker/image_picker.dart';
import 'package:lunas_mobile/features/reporting/data/services/evidence_analysis_service.dart';
import 'package:lunas_mobile/features/reporting/domain/models/evidence_analysis.dart';
import 'package:lunas_mobile/features/reporting/domain/models/evidence_selection.dart';

/// Captures/selects evidence and performs only the checks this app can verify.
/// No face/plate model or hazard model is bundled in the repository, therefore
/// this service deliberately never claims that redaction or AI analysis ran.
class EvidenceService {
  EvidenceService({
    ImagePicker? picker,
    EvidenceAnalysisService? analysisService,
  }) : _picker = picker ?? ImagePicker(),
       _analysisService =
           analysisService ?? const UnavailableEvidenceAnalysisService();

  static const maxBytes = 10 * 1024 * 1024;
  final ImagePicker _picker;
  final EvidenceAnalysisService _analysisService;

  Future<EvidenceSelection?> pick(ImageSource source) async {
    final image = await _picker.pickImage(source: source);
    if (image == null) return null;

    final byteLength = await image.length();
    if (byteLength <= 0) {
      throw const EvidenceException('The selected image is empty or unreadable.');
    }
    if (byteLength > maxBytes) {
      throw const EvidenceException(
        'Choose an image smaller than 10 MB before submitting your report.',
      );
    }
    final mediaType = _mediaTypeFor(image.name);
    if (mediaType == null) {
      throw const EvidenceException(
        'Choose a JPG or PNG image for report evidence.',
      );
    }
    final analysis = await _analyze(image);
    return EvidenceSelection(
      file: image,
      byteLength: byteLength,
      mediaType: mediaType,
      privacyStatus: EvidencePrivacyStatus.unavailable,
      qualityStatus: EvidenceQualityStatus.basicChecksPassed,
      analysis: analysis,
    );
  }

  String? _mediaTypeFor(String filename) {
    final extension = filename.split('.').last.toLowerCase();
    return switch (extension) {
      'jpg' || 'jpeg' => 'image/jpeg',
      'png' => 'image/png',
      _ => null,
    };
  }

  Future<EvidenceAnalysisResult> _analyze(XFile image) async {
    try {
      return await _analysisService.analyze(image);
    } catch (_) {
      // Evidence collection must remain usable if an optional future model
      // fails. Do not turn that failure into a fabricated analysis result.
      return const EvidenceAnalysisResult(modelAvailable: false);
    }
  }
}
