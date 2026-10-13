import 'package:flutter_test/flutter_test.dart';
import 'package:lunas_mobile/features/maps/domain/models/selected_location.dart';

void main() {
  test('known city and country mismatches are flagged while unavailable geocoding remains reviewable', () {
    const outside = SelectedLocation(latitude: 37.4, longitude: -122.1, address: 'Mountain View', city: 'Mountain View', countryCode: 'US', reverseGeocodingSucceeded: true);
    const inside = SelectedLocation(latitude: 16.04, longitude: 120.33, address: 'Dagupan City', city: 'Dagupan City', countryCode: 'PH', reverseGeocodingSucceeded: true);
    const unavailable = SelectedLocation(latitude: 16.04, longitude: 120.33, address: 'Selected coordinates');
    expect(outside.hasJurisdictionMismatch, isTrue);
    expect(inside.hasJurisdictionMismatch, isFalse);
    expect(unavailable.hasJurisdictionMismatch, isFalse);
  });
}
