import 'package:image_picker/image_picker.dart';
import 'package:lunas_mobile/features/reporting/domain/models/evidence_analysis.dart';
import 'package:lunas_mobile/features/reporting/domain/models/evidence_selection.dart';

/// Captures/selects evidence and performs only local file checks.
///
/// Hazard assistance is intentionally not run on mobile. The selected image
/// is uploaded by ReportService and the backend owns all AI calls and result
/// normalization for the official web workflow.
class EvidenceService {
  EvidenceService({ImagePicker? picker}) : _picker = picker ?? ImagePicker();

  static const maxBytes = 10 * 1024 * 1024;
  final ImagePicker _picker;

  Future<EvidenceSelection?> pick(ImageSource source) async {
    final image = await _picker.pickImage(source: source);
    if (image == null) return null;

    final byteLength = await image.length();
    if (byteLength <= 0) {
      throw const EvidenceException(
        'The selected image is empty or unreadable.',
      );
    }
    if (byteLength > maxBytes) {
      throw const EvidenceException(
        'Choose an image smaller than 10 MB before submitting your report.',
      );
    }
    final mediaType = _mediaTypeFor(image.name);
    if (mediaType == null) {
      throw const EvidenceException(
        'Choose a JPG, PNG, or WebP image for report evidence.',
      );
    }
    return EvidenceSelection(
      file: image,
      byteLength: byteLength,
      mediaType: mediaType,
      privacyStatus: EvidencePrivacyStatus.unavailable,
      qualityStatus: EvidenceQualityStatus.basicChecksPassed,
      // Kept in the selection model for backward compatibility. It is always
      // unavailable on mobile; no model or AI service is called here.
      analysis: const EvidenceAnalysisResult(modelAvailable: false),
    );
  }

  String? _mediaTypeFor(String filename) {
    final extension = filename.split('.').last.toLowerCase();
    return switch (extension) {
      'jpg' || 'jpeg' => 'image/jpeg',
      'png' => 'image/png',
      'webp' => 'image/webp',
      _ => null,
    };
  }
}
