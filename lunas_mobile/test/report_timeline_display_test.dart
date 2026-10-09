import 'package:flutter_test/flutter_test.dart';
import 'package:lunas_mobile/features/reporting/data/models/incident_report.dart';

void main() {
  final time = DateTime(2026, 10, 9, 16, 44);
  test('collapses equivalent adjacent citizen milestones', () {
    final events = [
      ReportStatusEvent(status: 'resolved', changedAt: time),
      ReportStatusEvent(
        status: 'closed',
        changedAt: time.add(const Duration(seconds: 2)),
      ),
    ];
    expect(visibleReportHistory(events), hasLength(1));
  });
  test(
    'preserves notes, distinct handoffs, later repetitions and unknown times',
    () {
      final events = [
        ReportStatusEvent(status: 'resolved', changedAt: time),
        ReportStatusEvent(
          status: 'resolved',
          changedAt: time,
          notes: 'Additional review',
        ),
        ReportStatusEvent(status: 'verified', changedAt: time),
        ReportStatusEvent(
          status: 'resolved',
          changedAt: time.add(const Duration(minutes: 1)),
        ),
        const ReportStatusEvent(status: 'resolved', changedAt: null),
        const ReportStatusEvent(status: 'resolved', changedAt: null),
      ];
      expect(visibleReportHistory(events), hasLength(6));
    },
  );
}
