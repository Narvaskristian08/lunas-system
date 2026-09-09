import 'dart:typed_data';

import 'package:flutter_test/flutter_test.dart';
import 'package:image_picker/image_picker.dart';
import 'package:lunas_mobile/features/reporting/data/services/evidence_analysis_service.dart';

void main() {
  test(
    'mobile evidence analysis remains unavailable and makes no decision',
    () async {
      final result = await const UnavailableEvidenceAnalysisService().analyze(
        XFile.fromData(Uint8List.fromList([1, 2, 3]), name: 'evidence.jpg'),
      );

      expect(result.modelAvailable, isFalse);
      expect(result.suggestedCategory, isNull);
      expect(result.confidence, isNull);
      expect(result.privacyRedactionApplied, isFalse);
    },
  );
}
