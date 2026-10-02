import 'package:lunas_mobile/features/maps/domain/models/selected_location.dart';
import 'package:lunas_mobile/features/reporting/data/models/category_option.dart';
import 'package:lunas_mobile/features/reporting/domain/models/evidence_selection.dart';

class CitizenReportDraft {
  const CitizenReportDraft({
    required this.category,
    required this.description,
    required this.location,
    required this.barangay,
    required this.evidence,
    required this.privacyAcknowledged,
    this.locationConfirmed = false,
    this.locationExplanationReason,
    this.locationExplanationText,
  });

  final bool locationConfirmed;
  final String? locationExplanationReason;
  final String? locationExplanationText;
  final CategoryOption category;
  final String description;
  final SelectedLocation location;
  final String barangay;
  final EvidenceSelection evidence;
  final bool privacyAcknowledged;
}
