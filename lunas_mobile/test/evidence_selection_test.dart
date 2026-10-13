import 'dart:typed_data';
import 'package:flutter_test/flutter_test.dart';
import 'package:image_picker/image_picker.dart';
import 'package:lunas_mobile/features/reporting/domain/models/evidence_analysis.dart';
import 'package:lunas_mobile/features/reporting/domain/models/evidence_selection.dart';

void main() {
  test('retained evidence remains readable when the picker file is unavailable', () async {
    final bytes = Uint8List.fromList([1, 2, 3]);
    final selection = EvidenceSelection(file: XFile('missing-picker-cache-file.jpg'), bytes: bytes,
      byteLength: bytes.length, mediaType: 'image/jpeg', privacyStatus: EvidencePrivacyStatus.unavailable,
      qualityStatus: EvidenceQualityStatus.basicChecksPassed, analysis: const EvidenceAnalysisResult(modelAvailable: false));
    expect(await selection.readAsBytes(), bytes);
    expect(await selection.readAsBytes(), bytes);
  });
}
