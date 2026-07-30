class SelectedLocation {
  const SelectedLocation({
    required this.latitude,
    required this.longitude,
    required this.address,
  });

  final double latitude;
  final double longitude;
  final String address;

  String get coordinates =>
      '${latitude.toStringAsFixed(6)}, ${longitude.toStringAsFixed(6)}';
}
