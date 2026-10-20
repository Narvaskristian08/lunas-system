import 'package:flutter_test/flutter_test.dart';
import 'package:lunas_mobile/features/repair/data/models/repair_models.dart';

void main() {
  test(
    'all backend work-order statuses have distinct labels and round-trip values',
    () {
      const labels = {
        'pending': 'Pending Assignment',
        'accepted': 'Assigned',
        'in_progress': 'In Progress',
        'completed': 'Awaiting Provider Review',
        'rework_required': 'Needs Correction',
        'city_correction_required': 'Returned by City Engineering',
        'provider_accepted': 'Awaiting City Verification',
        'verified': 'Closed',
      };
      for (final entry in labels.entries) {
        final status = repairWorkOrderStatusFromJson(entry.key);
        expect(status, isNot(RepairWorkOrderStatus.unknown));
        expect(status.apiValue, entry.key);
        expect(status.label, entry.value);
      }
    },
  );

  test('parses the server-safe repair work-order detail response', () {
    final workOrder = RepairWorkOrder.fromJson({
      'success': true,
      'data': {
        'id': 'work-order-1',
        'reference': 'WO-202608-0001',
        'status': 'in_progress',
        'assignmentState': 'accepted',
        'priority': 'high',
        'progressPercent': 50,
        'progressStage': 'main_repair',
        'incident': {
          'id': 'incident-1',
          'reportNumber': 'LUNAS-202608-0001',
          'category': 'road',
          'description': 'A deep pothole blocks one lane.',
          'location': {
            'coordinates': [120.3333, 16.0433],
            'address': {
              'street': 'Rizal Avenue',
              'barangay': 'Poblacion Oeste',
            },
          },
          'images': [
            {'url': 'https://storage.example.test/citizen-image'},
          ],
        },
        'currentAssignment': {
          'id': 'assignment-1',
          'status': 'accepted',
          'assignee': {
            'id': 'repairer-1',
            'firstName': 'Ana',
            'lastName': 'Cruz',
          },
        },
        'sla': {
          'deadline': '2026-08-21T12:00:00.000Z',
          'isApproaching': true,
          'remainingMilliseconds': 5400000,
        },
        'evidence': [
          {
            'id': 'evidence-1',
            'url': 'https://storage.example.test/repair-image',
            'caption': 'Pothole patch at 50 percent.',
          },
        ],
        'progressUpdates': [
          {
            'id': 'progress-1',
            'previousPercent': 25,
            'progressPercent': 50,
            'stage': 'main_repair',
            'notes': 'Base layer placed.',
          },
        ],
      },
    });

    expect(workOrder.id, 'work-order-1');
    expect(workOrder.orderNumber, 'WO-202608-0001');
    expect(workOrder.status, RepairWorkOrderStatus.inProgress);
    expect(workOrder.progressStage, RepairProgressStage.mainRepair);
    expect(
      workOrder.location.displayAddress,
      'Rizal Avenue, Barangay Poblacion Oeste',
    );
    expect(workOrder.currentAssignment?.assignee?.name, 'Ana Cruz');
    expect(workOrder.sla.timeRemaining, '1h 30m');
    expect(workOrder.repairEvidence.single.caption, contains('50 percent'));
    expect(
      workOrder.progressUpdates.single.stage,
      RepairProgressStage.mainRepair,
    );
  });

  test('parses the paginated list and scoped dashboard summary', () {
    final page = RepairWorkOrderPage.fromPayload({
      'success': true,
      'data': [
        {
          'id': 'work-order-list-1',
          'reference': 'WO-202608-0002',
          'status': 'pending',
          'progressPercent': 0,
          'incident': {
            'location': {
              'coordinates': [120.3333, 16.0433],
            },
          },
        },
      ],
      'pagination': {'page': 2, 'limit': 10, 'total': 11, 'pages': 2},
    });
    final summary = RepairDashboardSummary.fromPayload({
      'success': true,
      'data': {
        'pendingAcceptance': 2,
        'accepted': 3,
        'activeRepairs': 4,
        'readyForCompletion': 1,
        'approaching': 5,
        'overdue': 6,
      },
    });

    expect(page.items.single.orderNumber, 'WO-202608-0002');
    expect(page.page, 2);
    expect(page.hasNextPage, isFalse);
    expect(summary.pendingAssignments, 2);
    expect(summary.inProgress, 4);
    expect(summary.readyForCompletion, 1);
    expect(summary.overdue, 6);
  });

  test('keeps repair milestones discrete and maps them to approved stages', () {
    expect(repairStageForProgress(25), RepairProgressStage.sitePreparation);
    expect(repairStageForProgress(75), RepairProgressStage.finishing);
    expect(repairProgressValues.contains(80), isFalse);
  });

  test(
    'pending handoffs require explicit acceptance before repair updates',
    () {
      final workOrder = RepairWorkOrder.fromJson({
        'id': 'reassigned-work-order',
        'reference': 'WO-202608-0003',
        'status': 'in_progress',
        'assignmentState': 'pending',
        'progressPercent': 50,
        'currentAssignment': {'id': 'assignment-2', 'status': 'pending'},
        'incident': {
          'location': {
            'coordinates': [120.3333, 16.0433],
          },
        },
      });

      expect(workOrder.isPendingAcceptance, isTrue);
      expect(workOrder.canStart, isFalse);
      expect(workOrder.canUpdateProgress, isFalse);
    },
  );
  test('pending assignments cannot start before separate acceptance', () {
    for (final status in ['pending', 'accepted', 'rework_required']) {
      final workOrder = RepairWorkOrder.fromJson({
        'id': 'assigned-work-order',
        'status': status,
        'assignmentState': 'pending',
        'currentAssignment': {'id': 'assignment-1', 'status': 'pending'},
      });
      expect(workOrder.canStart, isFalse);
      expect(workOrder.canUpdateProgress, isFalse);
    }
  });
}
