import 'location_integrity.dart';

class SelectedLocation {
  const SelectedLocation({
    required this.latitude,
    required this.longitude,
    required this.address,
    this.pinSource = 'manual',
    this.gpsFix,
    this.barangayCandidates = const [],
    this.reverseGeocodingSucceeded = false,
    this.city,
    this.countryCode,
  });

  final String pinSource;
  final GpsFix? gpsFix;
  final double latitude;
  final double longitude;
  final String address;
  final String? city;
  final String? countryCode;
  bool get hasJurisdictionMismatch =>
      reverseGeocodingSucceeded &&
      ((countryCode?.isNotEmpty == true &&
              countryCode!.toUpperCase() != 'PH') ||
          (city?.trim().isNotEmpty == true &&
              !city!.toLowerCase().contains('dagupan')));

  /// Raw locality candidates from the platform geocoder. They are suggestions
  /// only and must be matched against the backend-provided canonical list.
  final List<String> barangayCandidates;
  final bool reverseGeocodingSucceeded;

  bool get isValid =>
      latitude.isFinite &&
      longitude.isFinite &&
      latitude >= -90 &&
      latitude <= 90 &&
      longitude >= -180 &&
      longitude <= 180;

  String get coordinates =>
      '${latitude.toStringAsFixed(6)}, ${longitude.toStringAsFixed(6)}';
}
