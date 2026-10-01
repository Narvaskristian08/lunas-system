import 'package:lunas_mobile/features/maps/domain/models/selected_location.dart';

enum BarangaySuggestionStatus { matched, noMatch, ambiguous, unavailable }

class BarangaySuggestion {
  const BarangaySuggestion(this.status, {this.barangay});

  final BarangaySuggestionStatus status;
  final String? barangay;
}

String _comparisonKey(String value) => value
    .trim()
    .toLowerCase()
    .replaceFirst(RegExp(r'^(barangay|brgy\.?)\s+'), '')
    .replaceAll(RegExp(r'\s+'), ' ');

/// Matches reverse-geocoder text only when it identifies exactly one
/// backend-provided canonical barangay. It never infers a nearby value.
BarangaySuggestion resolveBarangaySuggestion(
  SelectedLocation location,
  List<String> canonicalBarangays,
) {
  if (!location.reverseGeocodingSucceeded) {
    return const BarangaySuggestion(BarangaySuggestionStatus.unavailable);
  }
  final canonicalByKey = {
    for (final barangay in canonicalBarangays)
      _comparisonKey(barangay): barangay,
  };
  final matches = location.barangayCandidates
      .map((candidate) => canonicalByKey[_comparisonKey(candidate)])
      .whereType<String>()
      .toSet();
  if (matches.length == 1) {
    return BarangaySuggestion(
      BarangaySuggestionStatus.matched,
      barangay: matches.single,
    );
  }
  if (matches.length > 1) {
    return const BarangaySuggestion(BarangaySuggestionStatus.ambiguous);
  }
  return const BarangaySuggestion(BarangaySuggestionStatus.noMatch);
}
