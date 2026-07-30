import 'package:lunas_mobile/features/maps/domain/models/selected_location.dart';

class ReportDraft {
  const ReportDraft({
    required this.category,
    required this.description,
    required this.photoReference,
    required this.location,
  });

  final String category;
  final String description;
  final String photoReference;
  final SelectedLocation location;

  double get latitude => location.latitude;
  double get longitude => location.longitude;
}
