import 'dart:typed_data';

import 'package:image_picker/image_picker.dart';
import 'package:lunas_mobile/features/reporting/domain/models/evidence_analysis.dart';

enum EvidencePrivacyStatus { unavailable }

enum EvidenceQualityStatus { basicChecksPassed }

class EvidenceSelection {
  const EvidenceSelection({
    required this.file,
    required this.byteLength,
    required this.mediaType,
    required this.privacyStatus,
    required this.qualityStatus,
    required this.analysis,
  });

  final XFile file;
  final int byteLength;
  final String mediaType;
  final EvidencePrivacyStatus privacyStatus;
  final EvidenceQualityStatus qualityStatus;
  final EvidenceAnalysisResult analysis;

  String get filename => file.name.isEmpty ? 'report-evidence.jpg' : file.name;
  bool get requiresPrivacyAcknowledgement =>
      privacyStatus == EvidencePrivacyStatus.unavailable;

  Future<Uint8List> readAsBytes() => file.readAsBytes();
}

class EvidenceException implements Exception {
  const EvidenceException(this.message);
  final String message;
}
