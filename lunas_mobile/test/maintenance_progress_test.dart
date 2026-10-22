import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:lunas_mobile/features/reporting/data/models/incident_report.dart';
import 'package:lunas_mobile/features/reporting/data/models/maintenance_tracking.dart';
import 'package:lunas_mobile/features/reporting/presentation/widgets/maintenance_progress.dart';
import 'package:lunas_mobile/features/reporting/presentation/widgets/reporting_widgets.dart';

void main() {
  test('submitted initial findings still await Secretary review', () {
    expect(
      reportWorkflowStep(
        IncidentReport.fromJson({
          'status': 'tanod_verified',
          'agencyStatus': 'not_routed',
        }),
      ),
      2,
    );
  });
  test(
    'agency completion and final inspections stay in final check until acceptance',
    () {
      for (final status in [
        'provider_assigned',
        'tanod_assigned',
        'tanod_in_progress',
        'tanod_verified',
      ]) {
        expect(
          reportWorkflowStep(
            IncidentReport.fromJson({
              'status': status,
              'agencyStatus': 'work_completed',
            }),
          ),
          4,
        );
      }
      expect(
        reportWorkflowStep(
          IncidentReport.fromJson({
            'status': 'closed',
            'agencyStatus': 'work_completed',
          }),
        ),
        5,
      );
      expect(
        reportWorkflowStep(
          IncidentReport.fromJson({
            'status': 'tanod_verified',
            'agencyStatus': 'correction_required',
          }),
        ),
        3,
      );
    },
  );
  test(
    'elapsed duration is distinct from deadline and dates use Philippine time',
    () {
      expect(maintenanceDuration(90061000), '1d 1h 1m 1s');
      expect(maintenanceDuration(null), 'Unavailable');
      expect(
        maintenanceDate(DateTime.parse('2026-10-21T18:00:00Z')),
        '2026-10-22 02:00 PHT',
      );
    },
  );
  testWidgets(
    'recorded progress and distinct work cycles render on narrow screens',
    (tester) async {
      await tester.binding.setSurfaceSize(const Size(320, 900));
      addTearDown(() => tester.binding.setSurfaceSize(null));
      final tracking = MaintenanceTracking.fromJson({
        'progressPercent': 100,
        'active': false,
        'acceptedAt': '2026-10-22T04:00:00Z',
        'cycles': [
          {
            'reference': 'cycle-1',
            'startedAt': '2026-10-20T00:00:00Z',
            'completedAt': '2026-10-20T02:00:00Z',
            'elapsedMilliseconds': 7200000,
          },
          {
            'reference': 'cycle-2',
            'startedAt': '2026-10-21T00:00:00Z',
            'completedAt': '2026-10-21T01:00:00Z',
            'elapsedMilliseconds': 3600000,
          },
        ],
      });
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: SingleChildScrollView(
              child: MaintenanceProgress(tracking: tracking),
            ),
          ),
        ),
      );
      expect(find.text('Physical repair progress: 100%'), findsOneWidget);
      expect(find.text('Work cycle 1'), findsOneWidget);
      expect(find.text('Work cycle 2'), findsOneWidget);
      expect(find.text('Elapsed repair time: 0d 2h 0m 0s'), findsOneWidget);
      expect(tester.takeException(), isNull);
      await tester.pumpWidget(const SizedBox());
    },
  );
}
