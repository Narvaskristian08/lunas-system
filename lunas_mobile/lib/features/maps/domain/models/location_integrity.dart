import 'dart:math' as math;

class GpsFix {
  const GpsFix({
    required this.longitude,
    required this.latitude,
    required this.accuracyMeters,
    required this.capturedAt,
  });
  final double longitude;
  final double latitude;
  final double accuracyMeters;
  final DateTime capturedAt;
  Map<String, dynamic> toJson() => {
    'coordinates': [longitude, latitude],
    'accuracyMeters': accuracyMeters,
    'capturedAt': capturedAt.toUtc().toIso8601String(),
  };
}

class LocationPolicy {
  const LocationPolicy({
    this.thresholdMeters = 500,
    this.maxAccuracyMeters = 100,
    this.maxAgeSeconds = 120,
  });
  final double thresholdMeters;
  final double maxAccuracyMeters;
  final double maxAgeSeconds;
  factory LocationPolicy.fromJson(Map<String, dynamic> json) => LocationPolicy(
    thresholdMeters: (json['thresholdMeters'] as num).toDouble(),
    maxAccuracyMeters: (json['maxAccuracyMeters'] as num).toDouble(),
    maxAgeSeconds: (json['maxAgeSeconds'] as num).toDouble(),
  );
  String compare(double longitude, double latitude, GpsFix? fix, DateTime now) {
    if (fix == null) {
      return 'unavailable';
    }
    final age = now.difference(fix.capturedAt).inMilliseconds;
    if (!fix.longitude.isFinite ||
        !fix.latitude.isFinite ||
        fix.longitude.abs() > 180 ||
        fix.latitude.abs() > 90 ||
        !fix.accuracyMeters.isFinite ||
        fix.accuracyMeters < 0 ||
        fix.accuracyMeters > maxAccuracyMeters ||
        age < -5000 ||
        age > maxAgeSeconds * 1000) {
      return 'inconclusive';
    }
    double radians(double value) => value * math.pi / 180;
    final a =
        math.pow(math.sin(radians(latitude - fix.latitude) / 2), 2) +
        math.cos(radians(latitude)) *
            math.cos(radians(fix.latitude)) *
            math.pow(math.sin(radians(longitude - fix.longitude) / 2), 2);
    final clamped = a.clamp(0.0, 1.0);
    final distance =
        6371000 * 2 * math.atan2(math.sqrt(clamped), math.sqrt(1 - clamped));
    return math.max(0, distance - fix.accuracyMeters) > thresholdMeters
        ? 'discrepancy'
        : 'consistent';
  }
}
