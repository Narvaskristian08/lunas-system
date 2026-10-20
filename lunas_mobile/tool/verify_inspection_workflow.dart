import 'dart:io';

import 'package:lunas_mobile/features/repair/data/models/inspection_models.dart';

void main() {
  var checks = 0;
  void check(bool condition) {
    if (!condition) {
      throw StateError('Inspection contract check ${checks + 1} failed');
    }
    checks++;
  }

  final task = TanodInspection.fromJson({
    '_id': 'task',
    'type': 'initial',
    'status': 'assigned',
    'version': 3,
    'instructions': 'Check the north side',
    'acknowledgedAt': '2026-10-20T00:00:00Z',
    'incident': {
      '_id': 'report',
      'reportNumber': 'LUNAS-TEST',
      'category': 'road',
      'description': 'Reported concern',
      'location': {
        'address': {'barangay': 'Pantal'},
        'coordinates': [120.3, 16.1],
      },
    },
  });
  check(task.version == 3);
  check(task.acknowledgedAt != null);
  check(task.instructions == 'Check the north side');
  check(task.incidentId == 'report' && task.barangay == 'Pantal');
  for (final outcome in ['verified', 'not_verified', 'unable_to_verify']) {
    check(TanodInspection.fromJson({'result': outcome}).result == outcome);
  }
  final historical = TanodInspection.fromJson({
    'status': 'replaced',
    'incident': null,
  });
  check(historical.incidentId == '' && historical.version == 0);
  check(
    TanodInspection.fromJson({
          'evidence': [
            {'url': 'https://signed.example/own-photo', 'key': 'private'},
          ],
        }).inspectionEvidenceUrls.single ==
        'https://signed.example/own-photo',
  );
  stdout.writeln('$checks SDK-only inspection contract checks passed');
}
