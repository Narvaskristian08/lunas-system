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

    return Geolocator.getCurrentPosition(
      locationSettings: const LocationSettings(
        accuracy: LocationAccuracy.high,
        timeLimit: Duration(seconds: 20),
      ),
    );
  }

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
      final parts = <String?>[
        placemark?.street,
        placemark?.subLocality,
        placemark?.locality,
        placemark?.administrativeArea,
        placemark?.postalCode,
      ].whereType<String>().where((part) => part.trim().isNotEmpty).toSet();

      if (parts.isNotEmpty) {
        return SelectedLocation(
          latitude: latitude,
          longitude: longitude,
          address: parts.join(', '),
        );
      }
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
    );
  }
}
