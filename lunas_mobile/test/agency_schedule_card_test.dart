import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:lunas_mobile/features/reporting/data/models/agency_schedule.dart';
import 'package:lunas_mobile/features/reporting/presentation/widgets/agency_schedule_card.dart';

void main() {
  for (final compact in [false, true]) {
    testWidgets(
      'narrow citizen card (compact: $compact) is read-only and renders the recorded target',
      (tester) async {
        await tester.binding.setSurfaceSize(const Size(320, 760));
        addTearDown(() => tester.binding.setSurfaceSize(null));
        await tester.pumpWidget(
          MaterialApp(
            home: Scaffold(
              body: SingleChildScrollView(
                child: AgencyScheduleCard(
                  compact: compact,
                  schedule: AgencySchedule(
                    state: 'active',
                    deadline: DateTime.parse('2026-10-23T08:00:00Z'),
                    durationMilliseconds: 259200000,
                    remainingMilliseconds: 172800000,
                  ),
                ),
              ),
            ),
          ),
        );
        expect(find.textContaining('Oct 23, 2026 · 4:00 PM'), findsOneWidget);
        expect(find.byType(Slider), findsNothing);
        expect(
          tester
              .widget<LinearProgressIndicator>(
                find.byType(LinearProgressIndicator),
              )
              .value,
          closeTo(2 / 3, .001),
        );
        expect(tester.takeException(), isNull);
        await tester.pumpWidget(const SizedBox());
      },
    );
  }
  testWidgets(
    'resolved, awaiting verification, missing and overdue states are explicit',
    (tester) async {
      for (final entry in {
        'resolved': 'Resolved',
        'awaiting_verification': 'Awaiting final verification',
        'awaiting_schedule': 'Awaiting agency schedule',
        'active': 'Deadline passed',
      }.entries) {
        await tester.pumpWidget(
          MaterialApp(
            home: Scaffold(
              body: AgencyScheduleCard(
                key: ValueKey(entry.key),
                schedule: AgencySchedule(
                  state: entry.key,
                  durationMilliseconds: 10000,
                  remainingMilliseconds: entry.key == 'awaiting_schedule'
                      ? null
                      : -60000,
                ),
              ),
            ),
          ),
        );
        expect(find.text(entry.value), findsOneWidget);
        expect(tester.takeException(), isNull);
      }
      await tester.pumpWidget(const SizedBox());
    },
  );
}
