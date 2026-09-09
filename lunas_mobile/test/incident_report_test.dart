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
      'repair': {
        'reference': 'WO-202608-ABC123',
        'status': 'in_progress',
        'progressPercent': 50,
        'stage': 'main_repair',
        'readyForCompletion': false,
        'updatedAt': '2026-08-12T08:00:00.000Z',
      },
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
    expect(report.repair?.progressPercent, 50);
    expect(report.currentStatusLabel, 'Repair Progress: 50%');
    expect(report.statusChipLabel, '50% repair');
  });

  test(
    'keeps 100 percent repair visibility high level and awaiting verification',
    () {
      final report = IncidentReport.fromJson({
        'id': 'incident-ready',
        'status': 'completed',
        'location': {
          'coordinates': [120.3333, 16.0433],
        },
        'repair': {
          'status': 'completed',
          'progressPercent': 100,
          'readyForCompletion': true,
        },
        'statusHistory': [
          {
            'status': 'completed',
            'progressPercent': 100,
            'repairStage': 'ready_for_completion',
          },
        ],
      });

      expect(
        report.currentStatusLabel,
        'Repair Progress: 100% · Awaiting Verification',
      );
      expect(report.statusChipLabel, 'Awaiting verification');
      expect(
        report.statusHistory.single.citizenLabel,
        contains('Awaiting Verification'),
      );
    },
  );

  test(
    'keeps only the permitted server-provided decision reason for citizens',
    () {
      final rejected = IncidentReport.fromJson({
        'id': 'incident-2',
        'reportNumber': 'LUNAS-202608-000002',
        'category': 'road',
        'description': 'The image does not show the reported issue clearly.',
        'status': 'rejected',
        'location': {
          'coordinates': [120.3333, 16.0433],
        },
        'rejectionReason': 'Insufficient evidence',
      });
      final duplicate = IncidentReport.fromJson({
        'id': 'incident-3',
        'reportNumber': 'LUNAS-202608-000003',
        'category': 'road',
        'description': 'This matches another reported road concern.',
        'status': 'duplicate',
        'location': {
          'coordinates': [120.3333, 16.0433],
        },
        'duplicateReason': 'Same issue and location as LUNAS-202608-000001',
      });

      expect(rejected.rejectionReason, 'Insufficient evidence');
      expect(rejected.duplicateReason, isNull);
      expect(duplicate.duplicateReason, contains('LUNAS-202608-000001'));
    },
  );

  test('parses safe AI assistance and normalized image highlights', () {
    final report = IncidentReport.fromJson({
      'id': 'incident-ai',
      'category': 'road',
      'location': {
        'coordinates': [120.3333, 16.0433],
      },
      'aiAnalysis': {
        'analysisStatus': 'completed',
        'category': 'road',
        'modelAvailable': true,
        'detected': true,
        'confidence': 0.91,
        'findingsCount': 1,
        'requiresManualReview': false,
        'advisoryOnly': false,
      },
      'images': [
        {
          'url': 'https://storage.example/evidence.webp',
          'mimeType': 'image/webp',
          'width': 1000,
          'height': 800,
          'aiFindings': [
            {
              'label': 'pothole',
              'confidence': 0.91,
              'bbox': {'x1': 0.1, 'y1': 0.2, 'x2': 0.7, 'y2': 0.8},
            },
          ],
        },
      ],
    });

    expect(report.aiAnalysis?.requiresManualReview, isTrue);
    expect(report.aiAnalysis?.advisoryOnly, isTrue);
    expect(report.images.single.aiFindings.single.label, 'pothole');
    expect(report.images.single.aiFindings.single.bbox.x1, 0.1);
  });
}
