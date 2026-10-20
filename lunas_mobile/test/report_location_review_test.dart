import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:image_picker/image_picker.dart';
import 'package:lunas_mobile/features/maps/domain/models/location_integrity.dart';
import 'package:lunas_mobile/features/maps/domain/models/selected_location.dart';
import 'package:lunas_mobile/features/reporting/data/models/category_option.dart';
import 'package:lunas_mobile/features/reporting/domain/models/citizen_report_draft.dart';
import 'package:lunas_mobile/features/reporting/domain/models/evidence_selection.dart';
import 'package:lunas_mobile/features/reporting/domain/models/evidence_analysis.dart';
import 'package:lunas_mobile/features/reporting/presentation/screens/report_review_screen.dart';

void main() {
  CitizenReportDraft draft({bool mismatch = false}) => CitizenReportDraft(
    category: supportedReportCategories.first,
    description: 'Damaged road photographed earlier.',
    location: SelectedLocation(
      latitude: 16.0433,
      longitude: 120.3333,
      address: 'Damage location',
      pinSource: 'map_pin',
      gpsFix: mismatch
          ? GpsFix(
              latitude: 16.1,
              longitude: 120.4,
              accuracyMeters: 10,
              capturedAt: DateTime.now(),
            )
          : null,
    ),
    barangay: 'Pantal',
    privacyAcknowledged: false,
    evidence: EvidenceSelection(
      file: XFile.fromData(
        base64Decode(
          'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg==',
        ),
        name: 'earlier.png',
      ),
      byteLength: 70,
      mediaType: 'image/png',
      privacyStatus: EvidencePrivacyStatus.unavailable,
      qualityStatus: EvidenceQualityStatus.basicChecksPassed,
      analysis: const EvidenceAnalysisResult(modelAvailable: false),
    ),
  );
  Future<void> tap(WidgetTester tester, String text) async {
    final target = find.text(text).last;
    await tester.ensureVisible(target);
    await tester.tap(target);
    await tester.pumpAndSettle();
  }

  testWidgets(
    'manual pin requires explicit confirmation and preserves the draft',
    (tester) async {
      CitizenReportDraft? submitted;
      await tester.pumpWidget(
        MaterialApp(
          home: ReportReviewScreen(
            draft: draft(),
            policyLoader: () async => const LocationPolicy(),
            submitReport: (value) async {
              submitted = value;
              throw StateError('isolated submission fixture');
            },
          ),
        ),
      );
      await tester.pumpAndSettle();
      await tap(tester, 'Submit Report');
      expect(find.text('Final Check'), findsOneWidget);
      await tap(tester, 'Submit Report');
      expect(submitted, isNull);
      expect(
        find.text(
          'Confirm that the selected pin is the actual damage location.',
        ),
        findsOneWidget,
      );
      await tap(tester, 'I confirmed the damage location.');
      await tap(tester, 'I reviewed the photo for privacy.');
      await tap(tester, 'Back to Review');
      await tap(tester, 'Submit Report');
      expect(
        tester
            .widgetList<Checkbox>(find.byType(Checkbox))
            .every((checkbox) => checkbox.value == true),
        isTrue,
      );
      await tap(tester, 'Submit Report');
      expect(submitted?.locationConfirmed, isTrue);
      expect(submitted?.location.pinSource, 'map_pin');
      await tester.pumpWidget(const SizedBox());
    },
  );
  testWidgets(
    'home reporting requires explanation and accepts photo taken earlier',
    (tester) async {
      await tester.binding.setSurfaceSize(const Size(360, 820));
      addTearDown(() => tester.binding.setSurfaceSize(null));
      CitizenReportDraft? submitted;
      await tester.pumpWidget(
        MaterialApp(
          home: ReportReviewScreen(
            draft: draft(mismatch: true),
            policyLoader: () async => const LocationPolicy(),
            submitReport: (value) async {
              submitted = value;
              throw StateError('isolated submission fixture');
            },
          ),
        ),
      );
      await tester.pumpAndSettle();
      await tap(tester, 'Submit Report');
      await tap(tester, 'I confirmed the damage location.');
      await tap(tester, 'I reviewed the photo for privacy.');
      await tap(tester, 'Submit Report');
      expect(submitted, isNull);
      expect(
        find.text(
          'Choose an explanation. Other requires at least 10 characters.',
        ),
        findsOneWidget,
      );
      final fullReason = find.text('Reporting from another location');
      await tester.ensureVisible(fullReason);
      final option = find.ancestor(
        of: fullReason,
        matching: find.byType(RadioListTile<String>),
      );
      expect(
        tester.getRect(fullReason).bottom,
        lessThanOrEqualTo(tester.getRect(option).bottom),
      );
      expect(
        tester.getRect(fullReason).right,
        lessThanOrEqualTo(tester.getRect(option).right),
      );
      await tap(tester, 'Photo was taken earlier');
      await tap(tester, 'Submit Report');
      expect(submitted?.locationExplanationReason, 'photo_taken_earlier');
      expect(
        await submitted!.evidence.readAsBytes(),
        base64Decode(
          'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg==',
        ),
      );
      await tester.pumpWidget(const SizedBox());
    },
  );
}
