import 'agency_schedule.dart';
import 'package:lunas_mobile/features/reporting/data/models/category_option.dart';
import 'package:lunas_mobile/core/utils/display_labels.dart';

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
    this.aiAnalysis,
    this.rejectionReason,
    this.duplicateReason,
    this.clarificationReason,
    this.repair,
    this.agencySchedule,
    this.agencyStatus,
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
  final AiAnalysis? aiAnalysis;
  final String? rejectionReason;
  final String? duplicateReason;
  final String? clarificationReason;
  final IncidentRepairSummary? repair;
  final AgencySchedule? agencySchedule;
  final String? agencyStatus;

  String? get agencyStatusLabel => switch (agencyStatus) {
    'not_routed' => 'Not yet routed to an agency',
    'ready_for_work' => 'Ready for work',
    'pending_procurement' => 'Pending procurement / bidding',
    'work_in_progress' => 'Work in progress',
    'work_completed' => 'Work completed',
    'correction_required' => 'Correction required',
    _ => null,
  };

  String get categoryLabel => categoryFromCode(category).label;

  /// Citizen-safe operational wording. Personnel, reassignment notes, SLA
  /// internals, and field evidence are deliberately absent from this model.
  String get currentStatusLabel => status == 'resolved' || status == 'closed'
      ? 'Resolved · Verified by City Engineering'
      : repair?.citizenStatusLabel ?? _statusLabel(status);
  String get statusChipLabel => status == 'resolved' || status == 'closed'
      ? 'Resolved'
      : repair?.citizenChipLabel ?? _statusLabel(status);

  factory IncidentReport.fromJson(Map<String, dynamic> json) {
    final locationValue = _map(json['location']);
    final imageValues = json['images'] is List
        ? json['images'] as List
        : const [];
    final historyValues = json['statusHistory'] is List
        ? json['statusHistory'] as List
        : const [];
    return IncidentReport(
      id: (json['id'] ?? json['_id'] ?? '').toString(),
      reportNumber:
          (json['reportNumber'] ??
                  json['referenceNumber'] ??
                  'Pending reference')
              .toString(),
      category: (json['category'] ?? 'other').toString(),
      description: (json['description'] ?? '').toString(),
      status: (json['status'] ?? 'submitted').toString(),
      createdAt: _date(json['createdAt'] ?? json['submittedAt']),
      location: IncidentLocation.fromJson(locationValue),
      images: imageValues
          .whereType<Map>()
          .map(
            (value) =>
                ReportEvidence.fromJson(Map<String, dynamic>.from(value)),
          )
          .toList(growable: false),
      statusHistory: historyValues
          .whereType<Map>()
          .map(
            (value) =>
                ReportStatusEvent.fromJson(Map<String, dynamic>.from(value)),
          )
          .toList(growable: false),
      possibleDuplicateCandidateCount:
          int.tryParse(
            (json['possibleDuplicateCandidateCount'] ?? 0).toString(),
          ) ??
          0,
      aiAnalysis: _map(json['aiAnalysis']).isEmpty
          ? null
          : AiAnalysis.fromJson(_map(json['aiAnalysis'])),
      rejectionReason: _text(json['rejectionReason']),
      duplicateReason: _text(json['duplicateReason']),
      clarificationReason: _text(json['clarificationReason']),
      agencyStatus: _text(json['agencyStatus']),
      agencySchedule: _map(json['agencySchedule']).isEmpty
          ? null
          : AgencySchedule.fromJson(_map(json['agencySchedule'])),
      repair: _map(json['repair']).isEmpty
          ? null
          : IncidentRepairSummary.fromJson(_map(json['repair'])),
    );
  }
}

/// High-level repair state returned for the citizen's own report only.
class IncidentRepairSummary {
  const IncidentRepairSummary({
    this.reference,
    required this.status,
    required this.progressPercent,
    this.assignmentState,
    this.stage,
    required this.readyForCompletion,
    this.updatedAt,
  });

  final String? reference;
  final String status;
  final int progressPercent;
  final String? assignmentState;
  final String? stage;
  final bool readyForCompletion;
  final DateTime? updatedAt;

  String get citizenStatusLabel {
    if (readyForCompletion || status == 'completed') {
      return 'Repair Completed · Awaiting Utility Provider Review';
    }
    if (status == 'provider_accepted') {
      return 'Provider accepted · awaiting City Engineering verification';
    }
    if (status == 'city_correction_required') {
      return 'City Engineering returned the repair for correction';
    }
    if (status == 'rework_required') {
      return 'Corrective work requested';
    }
    if (status == 'in_progress' && progressPercent > 0) {
      return 'Repair Progress: $progressPercent%';
    }
    if (status == 'in_progress') return 'Repair in Progress';
    if (status == 'pending' && assignmentState == 'unassigned') {
      return 'Work Order Created · Awaiting Assignment';
    }
    if (status == 'pending' && assignmentState == 'declined') {
      return 'Work Order Awaiting Reassignment';
    }
    if (status == 'pending' || status == 'accepted') {
      return 'Assigned for Repair';
    }
    return _statusLabel(status);
  }

  String get citizenChipLabel {
    if (readyForCompletion || status == 'completed') {
      return 'Provider review';
    }
    if (status == 'provider_accepted') {
      return 'City verification';
    }
    if (status == 'city_correction_required' || status == 'rework_required') {
      return 'Corrective work';
    }
    if (status == 'in_progress' && progressPercent > 0) {
      return '$progressPercent% repair';
    }
    if (status == 'in_progress') return 'Repair in progress';
    if (status == 'pending' && assignmentState == 'unassigned') {
      return 'Work order created';
    }
    if (status == 'pending' && assignmentState == 'declined') {
      return 'Awaiting reassignment';
    }
    if (status == 'pending' || status == 'accepted') {
      return 'Assigned for repair';
    }
    return _statusLabel(status);
  }

  factory IncidentRepairSummary.fromJson(Map<String, dynamic> json) {
    final progress =
        int.tryParse((json['progressPercent'] ?? 0).toString()) ?? 0;
    return IncidentRepairSummary(
      reference: _text(json['reference'] ?? json['orderNumber']),
      status: (json['status'] ?? 'pending').toString(),
      progressPercent: progress.clamp(0, 100).toInt(),
      assignmentState: _text(json['assignmentState'])?.toLowerCase(),
      stage: _text(json['stage'] ?? json['progressStage']),
      readyForCompletion: json['readyForCompletion'] == true,
      updatedAt: _date(json['updatedAt']),
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

  bool get hasValidCoordinates =>
      latitude != null &&
      longitude != null &&
      latitude!.isFinite &&
      longitude!.isFinite &&
      latitude! >= -90 &&
      latitude! <= 90 &&
      longitude! >= -180 &&
      longitude! <= 180;

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

  bool get needsReview {
    final normalizedCity = city?.trim().toLowerCase();
    if (normalizedCity != null &&
        normalizedCity.isNotEmpty &&
        normalizedCity != 'dagupan' &&
        normalizedCity != 'dagupan city') {
      return true;
    }

    final normalizedAddress = address?.toLowerCase() ?? '';
    const knownOutsideDagupanMarkers = <String>[
      'mountain view',
      'california',
      'united states',
      ' usa',
    ];
    return knownOutsideDagupanMarkers.any(normalizedAddress.contains);
  }

  factory IncidentLocation.fromJson(Map<String, dynamic> json) {
    final coordinates = json['coordinates'] is List
        ? json['coordinates'] as List
        : const [];
    final address = _map(json['address']);
    return IncidentLocation(
      longitude: coordinates.isNotEmpty ? _double(coordinates.first) : null,
      latitude: coordinates.length > 1 ? _double(coordinates[1]) : null,
      address:
          (address['street'] ?? address['displayName'] ?? address['address'])
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
    this.width,
    this.height,
    this.aiFindings = const [],
  });

  final String url;
  final bool? isPrivacyMasked;
  final String? qualityStatus;
  final String? privacyProcessingStatus;
  final bool? privacyProcessingApplied;
  final int? width;
  final int? height;
  final List<AiFinding> aiFindings;

  factory ReportEvidence.fromJson(Map<String, dynamic> json) {
    final privacy = _map(json['privacyProcessing']);
    final quality = _map(json['quality']);
    final rawFindings = json['aiFindings'] is List
        ? json['aiFindings'] as List
        : const [];
    return ReportEvidence(
      url: (json['url'] ?? json['signedUrl'] ?? '').toString(),
      isPrivacyMasked: json['isPrivacyMasked'] as bool?,
      qualityStatus: quality['status']?.toString(),
      privacyProcessingStatus: privacy['status']?.toString(),
      privacyProcessingApplied: privacy['applied'] as bool?,
      width: _int(json['width']),
      height: _int(json['height']),
      aiFindings: rawFindings
          .whereType<Map>()
          .map(
            (value) => AiFinding.tryFromJson(Map<String, dynamic>.from(value)),
          )
          .whereType<AiFinding>()
          .toList(growable: false),
    );
  }
}

class AiAnalysis {
  const AiAnalysis({
    required this.status,
    required this.category,
    this.model,
    required this.modelAvailable,
    required this.detected,
    required this.confidence,
    required this.findingsCount,
    required this.requiresManualReview,
    required this.advisoryOnly,
    this.hazardType,
    this.processedAt,
  });

  final String status;
  final String? category;
  final String? model;
  final bool modelAvailable;
  final bool detected;
  final double confidence;
  final int findingsCount;
  final bool requiresManualReview;
  final bool advisoryOnly;
  final String? hazardType;
  final DateTime? processedAt;

  factory AiAnalysis.fromJson(Map<String, dynamic> json) => AiAnalysis(
    status: (json['analysisStatus'] ?? 'unavailable').toString(),
    category: _text(json['category']),
    model: _text(json['model']),
    modelAvailable: json['modelAvailable'] == true,
    detected: json['detected'] == true,
    confidence: (_double(json['confidence']) ?? 0).clamp(0, 1).toDouble(),
    findingsCount: _int(json['findingsCount']) ?? 0,
    requiresManualReview: true,
    advisoryOnly: true,
    hazardType: _text(json['hazardType']),
    processedAt: _date(json['processedAt']),
  );
}

class AiFinding {
  const AiFinding({
    required this.label,
    required this.confidence,
    required this.bbox,
  });

  final String label;
  final double confidence;
  final AiBoundingBox bbox;

  static AiFinding? tryFromJson(Map<String, dynamic> json) {
    final label = _text(json['label']);
    final bbox = AiBoundingBox.tryFromJson(_map(json['bbox']));
    if (label == null || bbox == null) return null;
    return AiFinding(
      label: label,
      confidence: (_double(json['confidence']) ?? 0).clamp(0, 1).toDouble(),
      bbox: bbox,
    );
  }
}

class AiBoundingBox {
  const AiBoundingBox({
    required this.x1,
    required this.y1,
    required this.x2,
    required this.y2,
  });

  final double x1;
  final double y1;
  final double x2;
  final double y2;

  static AiBoundingBox? tryFromJson(Map<String, dynamic> json) {
    final values = [
      json['x1'],
      json['y1'],
      json['x2'],
      json['y2'],
    ].map(_double).toList(growable: false);
    if (values.any((value) => value == null)) return null;
    final x1 = values[0]!.clamp(0, 1).toDouble();
    final y1 = values[1]!.clamp(0, 1).toDouble();
    final x2 = values[2]!.clamp(0, 1).toDouble();
    final y2 = values[3]!.clamp(0, 1).toDouble();
    if (x2 < x1 || y2 < y1) return null;
    return AiBoundingBox(x1: x1, y1: y1, x2: x2, y2: y2);
  }
}

class ReportStatusEvent {
  const ReportStatusEvent({
    required this.status,
    required this.changedAt,
    this.notes,
    this.progressPercent,
    this.repairStage,
    this.event,
  });

  final String status;
  final DateTime? changedAt;
  final String? notes;
  final int? progressPercent;
  final String? repairStage;
  final String? event;

  String get citizenLabel {
    if (event == 'work_order_created') return 'Work Order Created';
    if (status == 'completed' ||
        status == 'repair_completed' ||
        status == 'provider_review') {
      return 'Repair Completed';
    }
    if (status == 'provider_accepted') {
      return 'Repair Approved by Utility Provider';
    }
    if (status == 'city_verification') {
      return 'Sent for City Engineering Review';
    }
    if (status == 'rework_required' || status == 'city_correction_required') {
      return 'Corrective Work Required';
    }
    if (status == 'verified') return 'Repair Verified by Responsible Provider';
    if (status == 'resolved' || status == 'closed') return 'Resolved';
    if (progressPercent == 100) return 'Repair Progress Reached 100%';
    if (status == 'barangay_validated') return 'Validated by Barangay Official';
    if (status == 'city_confirmed') return 'Confirmed by City Engineering';
    if (status == 'provider_assigned') return 'Assigned to Utility Provider';
    if (status == 'repair_assigned') return 'Utility Personnel Assigned';
    if (progressPercent != null && progressPercent! > 0) {
      return 'Repair Progress: $progressPercent%';
    }
    if (status == 'assigned') return 'Assigned for Repair';
    if (status == 'in_progress') return 'Repair in Progress';
    return _statusLabel(status);
  }

  factory ReportStatusEvent.fromJson(Map<String, dynamic> json) =>
      ReportStatusEvent(
        status: (json['status'] ?? 'submitted').toString(),
        changedAt: _date(json['changedAt'] ?? json['createdAt']),
        notes: json['notes']?.toString(),
        progressPercent: int.tryParse(
          (json['progressPercent'] ?? '').toString(),
        ),
        repairStage: _text(json['repairStage'] ?? json['stage']),
        event: _text(json['event']),
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

double? _double(Object? value) =>
    value is num ? value.toDouble() : double.tryParse(value?.toString() ?? '');

int? _int(Object? value) =>
    value is num ? value.toInt() : int.tryParse(value?.toString() ?? '');

DateTime? _date(Object? value) =>
    value == null ? null : DateTime.tryParse(value.toString())?.toLocal();

String _statusLabel(String value) => humanizeCodeLabel(value);

/// Collapses repeated display milestones without changing backend history.
List<ReportStatusEvent> visibleReportHistory(List<ReportStatusEvent> events) {
  final visible = <ReportStatusEvent>[];
  for (final event in events) {
    final previous = visible.isEmpty ? null : visible.last;
    final sameMinute =
        previous?.changedAt != null &&
        event.changedAt != null &&
        previous!.changedAt!.millisecondsSinceEpoch ~/ 60000 ==
            event.changedAt!.millisecondsSinceEpoch ~/ 60000;
    if (sameMinute &&
        previous.citizenLabel == event.citizenLabel &&
        (previous.notes ?? '').trim() == (event.notes ?? '').trim()) {
      visible[visible.length - 1] = event;
    } else {
      visible.add(event);
    }
  }
  return visible;
}
