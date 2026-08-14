import 'package:lunas_mobile/features/reporting/data/models/category_option.dart';

class IncidentReport {
  const IncidentReport({
    required this.id,
    required this.reportNumber,
    required this.category,
    required this.description,
    required this.status,
    required this.createdAt,
    required this.location,
    required this.images,
    required this.statusHistory,
    required this.possibleDuplicateCandidateCount,
    this.rejectionReason,
    this.duplicateReason,
  });

  final String id;
  final String reportNumber;
  final String category;
  final String description;
  final String status;
  final DateTime? createdAt;
  final IncidentLocation location;
  final List<ReportEvidence> images;
  final List<ReportStatusEvent> statusHistory;
  final int possibleDuplicateCandidateCount;
  final String? rejectionReason;
  final String? duplicateReason;

  String get categoryLabel => categoryFromCode(category).label;

  factory IncidentReport.fromJson(Map<String, dynamic> json) {
    final locationValue = _map(json['location']);
    final imageValues = json['images'] is List ? json['images'] as List : const [];
    final historyValues = json['statusHistory'] is List
        ? json['statusHistory'] as List
        : const [];
    return IncidentReport(
      id: (json['id'] ?? json['_id'] ?? '').toString(),
      reportNumber: (json['reportNumber'] ?? json['referenceNumber'] ?? 'Pending reference')
          .toString(),
      category: (json['category'] ?? 'other').toString(),
      description: (json['description'] ?? '').toString(),
      status: (json['status'] ?? 'submitted').toString(),
      createdAt: _date(json['createdAt'] ?? json['submittedAt']),
      location: IncidentLocation.fromJson(locationValue),
      images: imageValues
          .whereType<Map>()
          .map((value) => ReportEvidence.fromJson(Map<String, dynamic>.from(value)))
          .toList(growable: false),
      statusHistory: historyValues
          .whereType<Map>()
          .map((value) => ReportStatusEvent.fromJson(Map<String, dynamic>.from(value)))
          .toList(growable: false),
      possibleDuplicateCandidateCount:
          int.tryParse((json['possibleDuplicateCandidateCount'] ?? 0).toString()) ?? 0,
      rejectionReason: _text(json['rejectionReason']),
      duplicateReason: _text(json['duplicateReason']),
    );
  }
}

class IncidentLocation {
  const IncidentLocation({
    required this.latitude,
    required this.longitude,
    required this.address,
    required this.barangay,
    this.city,
  });

  final double? latitude;
  final double? longitude;
  final String? address;
  final String? barangay;
  final String? city;

  String get displayAddress {
    final parts = [
      address,
      if (barangay != null && barangay!.isNotEmpty)
        barangay!.toLowerCase().startsWith('barangay')
            ? barangay!
            : 'Barangay $barangay',
    ].whereType<String>().where((value) => value.trim().isNotEmpty).toList();
    if (parts.isNotEmpty) return parts.join(', ');
    if (latitude != null && longitude != null) {
      return '${latitude!.toStringAsFixed(5)}, ${longitude!.toStringAsFixed(5)}';
    }
    return 'Location details unavailable';
  }

  factory IncidentLocation.fromJson(Map<String, dynamic> json) {
    final coordinates = json['coordinates'] is List
        ? json['coordinates'] as List
        : const [];
    final address = _map(json['address']);
    return IncidentLocation(
      longitude: coordinates.isNotEmpty ? _double(coordinates.first) : null,
      latitude: coordinates.length > 1 ? _double(coordinates[1]) : null,
      address: (address['street'] ?? address['displayName'] ?? address['address'])
          ?.toString(),
      barangay: address['barangay']?.toString(),
      city: address['city']?.toString(),
    );
  }
}

class ReportEvidence {
  const ReportEvidence({
    required this.url,
    this.isPrivacyMasked,
    this.qualityStatus,
    this.privacyProcessingStatus,
    this.privacyProcessingApplied,
  });

  final String url;
  final bool? isPrivacyMasked;
  final String? qualityStatus;
  final String? privacyProcessingStatus;
  final bool? privacyProcessingApplied;

  factory ReportEvidence.fromJson(Map<String, dynamic> json) {
    final privacy = _map(json['privacyProcessing']);
    final quality = _map(json['quality']);
    return ReportEvidence(
      url: (json['url'] ?? json['signedUrl'] ?? '').toString(),
      isPrivacyMasked: json['isPrivacyMasked'] as bool?,
      qualityStatus: quality['status']?.toString(),
      privacyProcessingStatus: privacy['status']?.toString(),
      privacyProcessingApplied: privacy['applied'] as bool?,
    );
  }
}

class ReportStatusEvent {
  const ReportStatusEvent({
    required this.status,
    required this.changedAt,
    this.notes,
  });

  final String status;
  final DateTime? changedAt;
  final String? notes;

  factory ReportStatusEvent.fromJson(Map<String, dynamic> json) => ReportStatusEvent(
    status: (json['status'] ?? 'submitted').toString(),
    changedAt: _date(json['changedAt'] ?? json['createdAt']),
    notes: json['notes']?.toString(),
  );
}

Map<String, dynamic> _map(Object? value) => value is Map<String, dynamic>
    ? value
    : value is Map
    ? Map<String, dynamic>.from(value)
    : <String, dynamic>{};

String? _text(Object? value) {
  final text = value?.toString().trim();
  return text == null || text.isEmpty ? null : text;
}

double? _double(Object? value) => value is num
    ? value.toDouble()
    : double.tryParse(value?.toString() ?? '');

DateTime? _date(Object? value) => value == null
    ? null
    : DateTime.tryParse(value.toString())?.toLocal();
