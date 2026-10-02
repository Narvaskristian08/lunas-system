import 'package:flutter_test/flutter_test.dart';
import 'package:lunas_mobile/features/maps/domain/models/location_integrity.dart';

void main() {
  final now = DateTime.utc(2026, 10, 2);
  const policy = LocationPolicy();
  GpsFix fix({double latitude = 16.0433, double accuracy = 10, int age = 0}) =>
      GpsFix(
        longitude: 120.3333,
        latitude: latitude,
        accuracyMeters: accuracy,
        capturedAt: now.subtract(Duration(seconds: age)),
      );
  String compare(GpsFix? gps) => policy.compare(120.3333, 16.0433, gps, now);
  test('matching GPS', () => expect(compare(fix()), 'consistent'));
  test(
    'reporting from home and earlier photo remains a discrepancy signal',
    () => expect(compare(fix(latitude: 16.1)), 'discrepancy'),
  );
  test('pin displacement recalculates', () {
    expect(policy.compare(120.3333, 16.1, fix(), now), 'discrepancy');
    expect(compare(fix()), 'consistent');
  });
  test('uncertainty prevents threshold overstatement', () {
    expect(compare(fix(latitude: 16.0483, accuracy: 100)), 'consistent');
    expect(compare(fix(latitude: 16.0483, accuracy: 1)), 'discrepancy');
  });
  test(
    'inaccurate GPS is inconclusive',
    () => expect(compare(fix(accuracy: 101)), 'inconclusive'),
  );
  test(
    'stale GPS is inconclusive',
    () => expect(compare(fix(age: 121)), 'inconclusive'),
  );
  test(
    'future GPS is inconclusive',
    () => expect(compare(fix(age: -6)), 'inconclusive'),
  );
  test(
    'denied or missing GPS permits manual comparison unavailable',
    () => expect(compare(null), 'unavailable'),
  );
  test('new fix recalculates', () {
    expect(compare(fix(age: 121)), 'inconclusive');
    expect(compare(fix()), 'consistent');
  });
  test('server configured policy changes advisory threshold', () {
    final configured = LocationPolicy.fromJson({
      'thresholdMeters': 1000,
      'maxAccuracyMeters': 100,
      'maxAgeSeconds': 120,
    });
    expect(configured.compare(120.3333, 16.0483, fix(), now), 'consistent');
  });
}
