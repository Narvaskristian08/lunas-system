import 'package:flutter_test/flutter_test.dart';
import 'package:lunas_mobile/features/reporting/data/models/agency_schedule.dart';
import 'package:lunas_mobile/features/reporting/data/models/incident_report.dart';

void main() {
  test(
    'three-day window decreases and clamps without using the device wall clock',
    () {
      const schedule = AgencySchedule(
        state: 'active',
        durationMilliseconds: 259200000,
        remainingMilliseconds: 259200000,
      );
      expect(schedule.fractionAfter(Duration.zero), 1);
      expect(
        schedule.fractionAfter(const Duration(days: 1)),
        closeTo(2 / 3, .00001),
      );
      expect(schedule.fractionAfter(const Duration(days: 4)), 0);
      expect(
        agencyRemainingLabel(schedule.remainingAfter(const Duration(days: 4))!),
        '1d past deadline',
      );
    },
  );
  test(
    'completion and resolution stop the countdown; missing windows stay unknown',
    () {
      for (final state in ['awaiting_verification', 'resolved', 'inactive']) {
        final schedule = AgencySchedule(
          state: state,
          durationMilliseconds: 3000,
          remainingMilliseconds: 1000,
        );
        expect(schedule.remainingAfter(const Duration(days: 9)), 1000);
      }
      expect(
        const AgencySchedule(
          state: 'awaiting_start',
          remainingMilliseconds: 1000,
        ).fractionAfter(Duration.zero),
        isNull,
      );
      expect(
        const AgencySchedule(
          state: 'active',
          durationMilliseconds: 0,
          remainingMilliseconds: 1000,
        ).fractionAfter(Duration.zero),
        isNull,
      );
    },
  );
  test('citizen report parses safe schedule and tolerates older responses', () {
    final report = IncidentReport.fromJson({
      'agencySchedule': {
        'state': 'active',
        'deadline': '2026-10-23T08:00:00Z',
        'durationMilliseconds': 259200000,
        'remainingMilliseconds': 172800000,
      },
    });
    expect(
      report.agencySchedule!.fractionAfter(Duration.zero),
      closeTo(2 / 3, .00001),
    );
    expect(report.agencySchedule!.deadline!.toUtc().hour, 8);
    expect(IncidentReport.fromJson({}).agencySchedule, isNull);
  });
}
