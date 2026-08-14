import 'package:flutter_test/flutter_test.dart';
import 'package:lunas_mobile/features/validation/data/models/validation_incident.dart';

void main() {
  test('unwraps a validation detail response and routing fields', () {
    final incident = ValidationIncident.fromJson({
      'success': true,
      'data': {
        'id': 'incident-50',
        'reportNumber': 'LUNAS-202608-000050',
        'category': 'road',
        'description': 'A large pothole near the junction.',
        'status': 'submitted',
        'location': {
          'type': 'Point',
          'coordinates': [120.3333, 16.0433],
          'address': {'barangay': 'Poblacion Oeste'},
        },
        'jurisdiction': {
          'barangay': 'Poblacion Oeste',
          'responsibility': 'city_engineering',
        },
        'routing': {
          'responsibleOrganization': 'City Engineering Office',
          'responsibleRole': 'city_engineer',
          'reason': 'Road-maintenance responsibility',
        },
      },
    });

    expect(incident.id, 'incident-50');
    expect(incident.jurisdiction, 'Poblacion Oeste');
    expect(incident.jurisdictionResponsibility, 'city_engineering');
    expect(incident.responsibleOrganization, 'City Engineering Office');
    expect(incident.responsibleRole, 'city_engineer');
    expect(incident.routingReason, 'Road-maintenance responsibility');
  });

  test('parses a root data queue with root pagination', () {
    final queue = ValidationQueuePage.fromPayload({
      'success': true,
      'data': [
        {
          'id': 'incident-queue-1',
          'reportNumber': 'LUNAS-202608-000051',
          'category': 'drainage',
          'description': 'Drain blockage',
          'status': 'submitted',
          'location': {'coordinates': [120.3333, 16.0433]},
        },
      ],
      'pagination': {'page': 2, 'limit': 10, 'total': 11, 'pages': 2},
    });

    expect(queue.incidents.single.id, 'incident-queue-1');
    expect(queue.page, 2);
    expect(queue.hasNextPage, isFalse);
  });

  test('parses the dedicated duplicate-candidate response fields', () {
    final candidate = DuplicateCandidate.fromJson({
      'id': 'candidate-1',
      'reportNumber': 'LUNAS-202608-000052',
      'category': 'road',
      'status': 'validated',
      'submittedAt': '2026-08-11T08:00:00.000Z',
      'location': {
        'coordinates': [120.3333, 16.0433],
        'address': {'barangay': 'Poblacion Oeste'},
      },
      'distanceMeters': 87.3,
      'score': 92,
      'evidenceUrl': 'https://storage.example.test/signed-image',
    });

    expect(candidate.createdAt, isNotNull);
    expect(candidate.distanceMeters, 87.3);
    expect(candidate.imageUrl, 'https://storage.example.test/signed-image');
  });
}
