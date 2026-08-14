import 'package:flutter_test/flutter_test.dart';
import 'package:lunas_mobile/features/reporting/data/models/incident_report.dart';

void main() {
  test('parses the citizen-safe incident response and real status history', () {
    final report = IncidentReport.fromJson({
      'id': 'incident-1',
      'reportNumber': 'LUNAS-202608-000001',
      'category': 'road',
      'description': 'A pothole is blocking the right lane.',
      'status': 'submitted',
      'createdAt': '2026-08-11T08:00:00.000Z',
      'location': {
        'type': 'Point',
        'coordinates': [120.3333, 16.0433],
        'address': {'street': 'Rizal Avenue', 'barangay': 'Barangay 5'},
      },
      'images': [
        {
          'url': null,
          'isPrivacyMasked': false,
          'quality': {'status': 'passed'},
          'privacyProcessing': {'status': 'not_available', 'applied': false},
        },
      ],
      'statusHistory': [
        {
          'status': 'submitted',
          'changedAt': '2026-08-11T08:00:00.000Z',
          'notes': 'Incident reported',
        },
      ],
      'possibleDuplicateCandidateCount': 1,
    });

    expect(report.id, 'incident-1');
    expect(report.categoryLabel, 'Roads and sidewalks');
    expect(report.location.displayAddress, 'Rizal Avenue, Barangay 5');
    expect(report.images.single.url, isEmpty);
    expect(report.images.single.qualityStatus, 'passed');
    expect(report.images.single.privacyProcessingApplied, isFalse);
    expect(report.statusHistory.single.status, 'submitted');
    expect(report.possibleDuplicateCandidateCount, 1);
  });

  test('keeps only the permitted server-provided decision reason for citizens', () {
    final rejected = IncidentReport.fromJson({
      'id': 'incident-2',
      'reportNumber': 'LUNAS-202608-000002',
      'category': 'road',
      'description': 'The image does not show the reported issue clearly.',
      'status': 'rejected',
      'location': {'coordinates': [120.3333, 16.0433]},
      'rejectionReason': 'Insufficient evidence',
    });
    final duplicate = IncidentReport.fromJson({
      'id': 'incident-3',
      'reportNumber': 'LUNAS-202608-000003',
      'category': 'road',
      'description': 'This matches another reported road concern.',
      'status': 'duplicate',
      'location': {'coordinates': [120.3333, 16.0433]},
      'duplicateReason': 'Same issue and location as LUNAS-202608-000001',
    });

    expect(rejected.rejectionReason, 'Insufficient evidence');
    expect(rejected.duplicateReason, isNull);
    expect(duplicate.duplicateReason, contains('LUNAS-202608-000001'));
  });
}
