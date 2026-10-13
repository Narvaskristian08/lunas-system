import 'package:geocoding/geocoding.dart';
import 'package:geolocator/geolocator.dart';
import 'package:lunas_mobile/features/maps/domain/models/selected_location.dart';

enum LocationFailure {
  servicesDisabled,
  permissionDenied,
  permissionDeniedForever,
}

class LocationServiceException implements Exception {
  const LocationServiceException(this.failure);

  final LocationFailure failure;
}

class LocationService {
  const LocationService();

  Future<Position> determinePosition() async {
    if (!await Geolocator.isLocationServiceEnabled()) {
      throw const LocationServiceException(LocationFailure.servicesDisabled);
    }

    var permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
    }

    if (permission == LocationPermission.denied) {
      throw const LocationServiceException(LocationFailure.permissionDenied);
    }
    if (permission == LocationPermission.deniedForever) {
      throw const LocationServiceException(
        LocationFailure.permissionDeniedForever,
      );
    }
    if (permission != LocationPermission.whileInUse &&
        permission != LocationPermission.always) {
      throw const LocationServiceException(LocationFailure.permissionDenied);
    }

    return Geolocator.getCurrentPosition(
      locationSettings: const LocationSettings(
        accuracy: LocationAccuracy.high,
        timeLimit: Duration(seconds: 20),
      ),
    );
  }

  Future<bool> openAppSettings() => Geolocator.openAppSettings();

  Future<SelectedLocation> resolveLocation({
    required double latitude,
    required double longitude,
  }) async {
    try {
      final placemarks = await Geocoding().placemarkFromCoordinates(
        latitude,
        longitude,
      );
      final placemark = placemarks.firstOrNull;
      if (placemark == null) throw const FormatException('No placemark');
      final parts = <String?>[
        placemark.street,
        placemark.subLocality,
        placemark.locality,
        placemark.administrativeArea,
        placemark.postalCode,
      ].whereType<String>().where((part) => part.trim().isNotEmpty).toSet();
      final barangayCandidates = <String?>[
        placemark.subLocality,
        placemark.locality,
        placemark.name,
      ].whereType<String>().where((part) => part.trim().isNotEmpty).toSet();

      return SelectedLocation(
        latitude: latitude,
        longitude: longitude,
        address: parts.isEmpty
            ? 'Selected location (${latitude.toStringAsFixed(5)}, '
                  '${longitude.toStringAsFixed(5)})'
            : parts.join(', '),
        barangayCandidates: barangayCandidates.toList(growable: false),
        reverseGeocodingSucceeded: true,
        city: placemark.locality,
        countryCode: placemark.isoCountryCode,
      );
    } catch (_) {
      // The geocoding plugin is unavailable on some web browsers. Coordinates
      // remain a useful, readable fallback instead of blocking selection.
    }

    return SelectedLocation(
      latitude: latitude,
      longitude: longitude,
      address:
          'Selected location (${latitude.toStringAsFixed(5)}, '
          '${longitude.toStringAsFixed(5)})',
      reverseGeocodingSucceeded: false,
    );
  }
}
