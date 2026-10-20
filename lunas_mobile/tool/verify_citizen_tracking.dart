import 'dart:io';

import 'package:lunas_mobile/features/reporting/data/models/incident_report.dart';

void main() {
  var checks = 0;
  void check(bool value) {
    if (!value) throw StateError('Tracking check ${checks + 1} failed');
    checks++;
  }
  final report = IncidentReport.fromJson({
    '_id': 'own-report', 'category': 'road', 'originalCategory': 'other',
    'status': 'provider_assigned', 'statusLabel': 'Awaiting work authorization',
    'agencyAssignment': {'status': 'under_review'}, 'sla': {'state': 'not_started'},
    'statusHistory': [{'status': 'provider_assigned', 'statusLabel': 'Awaiting external funding'}],
  });
  check(report.currentStatusLabel == 'Awaiting work authorization');
  check(report.statusChipLabel == 'Awaiting work authorization');
  check(report.originalCategory == 'other');
  check(report.category == 'road');
  check(report.agencyAssignment['organization'] == null);
  check(report.sla['deadline'] == null);
  check(report.statusHistory.single.citizenLabel == 'Awaiting external funding');
  check(ReportStatusEvent.fromJson({'status': 'repair_completed'}).citizenLabel == 'Repair submitted for review');
  check(IncidentReport.fromJson({'status': 'submitted'}).sla.isEmpty);
  stdout.writeln('$checks SDK-only citizen tracking checks passed');
}
