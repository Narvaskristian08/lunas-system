import 'package:lunas_mobile/features/reporting/data/models/category_option.dart';
import 'package:lunas_mobile/features/reporting/data/models/incident_report.dart';

enum ValidationDecisionType { validate, reject, duplicate }

const validationResponsibilityRoles = <String>[
  'barangay',
  'city_engineering',
  'utility_provider',
];

String validationResponsibilityLabel(String value) => switch (value) {
  'barangay' => 'Barangay',
  'city_engineering' => 'City engineering',
  'utility_provider' => 'Utility provider',
  _ => value.replaceAll('_', ' '),
};

extension ValidationDecisionTypeLabel on ValidationDecisionType {
  String get apiValue => switch (this) {
    ValidationDecisionType.validate => 'validate',
    ValidationDecisionType.reject => 'reject',
    ValidationDecisionType.duplicate => 'duplicate',
  };

  String get label => switch (this) {
    ValidationDecisionType.validate => 'Validate',
    ValidationDecisionType.reject => 'Reject',
    ValidationDecisionType.duplicate => 'Mark duplicate',
  };
}

/// Server-paginated official queue response. The backend continues to enforce
/// role and jurisdiction scope; this object never attempts client-side scope
/// filtering.
class ValidationQueuePage {
  const ValidationQueuePage({
    required this.incidents,
    required this.page,
    required this.limit,
    required this.total,
    required this.pages,
  });

  final List<ValidationIncident> incidents;
  final int page;
  final int limit;
  final int total;
  final int pages;

  bool get hasPreviousPage => page > 1;
  bool get hasNextPage => page < pages;

  factory ValidationQueuePage.fromPayload(Map<String, dynamic> payload) {
    final data = _map(payload['data']);
    final source = data.isEmpty ? payload : data;
    final rawItems = _firstList(source, const [
      'incidents',
      'items',
      'results',
      'data',
    ]);
    final pagination = _map(source['pagination']).isNotEmpty
        ? _map(source['pagination'])
        : _map(payload['pagination']);
    final page = _int(pagination['page']) ?? 1;
    final limit = _int(pagination['limit']) ?? rawItems.length;
    final total = _int(pagination['total']) ?? rawItems.length;
    final pages =
        _int(pagination['pages']) ??
        (limit == 0 ? 1 : (total / limit).ceil().clamp(1, 1 << 31).toInt());
    return ValidationQueuePage(
      incidents: rawItems
          .whereType<Map>()
          .map(
            (item) =>
                ValidationIncident.fromJson(Map<String, dynamic>.from(item)),
          )
          .toList(growable: false),
      page: page,
      limit: limit,
      total: total,
      pages: pages,
    );
  }
}

class ValidationIncident {
  const ValidationIncident({
    required this.id,
    required this.reportNumber,
    required this.category,
    required this.description,
    required this.status,
    required this.createdAt,
    required this.location,
    required this.images,
    required this.statusHistory,
    required this.duplicateCandidates,
    required this.possibleDuplicateCandidateCount,
    this.priority,
    this.priorityAssignedAt,
    this.aiSuggestedCategory,
    this.aiConfidence,
    this.aiAnalysis,
    this.jurisdiction,
    this.jurisdictionResponsibility,
    this.responsibleOrganization,
    this.responsibleRole,
    this.routingReason,
    this.rejectionReason,
    this.duplicateReason,
    this.duplicateOfId,
    this.duplicateOfReportNumber,
    this.validatedAt,
    this.validatedByName,
    this.sla,
    this.workOrderId,
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
  final List<DuplicateCandidate> duplicateCandidates;
  final int possibleDuplicateCandidateCount;
  final String? priority;
  final DateTime? priorityAssignedAt;
  final String? aiSuggestedCategory;
  final double? aiConfidence;
  final AiAnalysis? aiAnalysis;
  final String? jurisdiction;
  final String? jurisdictionResponsibility;
  final String? responsibleOrganization;
  final String? responsibleRole;
  final String? routingReason;
  final String? rejectionReason;
  final String? duplicateReason;
  final String? duplicateOfId;
  final String? duplicateOfReportNumber;
  final DateTime? validatedAt;
  final String? validatedByName;
  final IncidentSla? sla;
  final String? workOrderId;

  String get categoryLabel => categoryFromCode(category).label;
  // Incidents are created with a default `medium` value, so the priority text
  // alone is not evidence of an official decision. The server sets this field
  // only when an official validates or later changes the priority.
  bool get hasAssignedPriority => priorityAssignedAt != null;

  factory ValidationIncident.fromJson(Map<String, dynamic> json) {
    // Detail responses use `{ data: incident }`, while a few action responses
    // use `{ data: { incident } }`. Queue items are already incident maps.
    final directIncident = _map(json['incident']);
    final data = _map(json['data']);
    final nestedIncident = _map(data['incident']);
    final source = directIncident.isNotEmpty
        ? directIncident
        : nestedIncident.isNotEmpty
        ? nestedIncident
        : data.isNotEmpty
        ? data
        : json;
    final ai = _map(source['aiAnalysis']);
    final routing = _map(source['routing']);
    final jurisdiction = _map(source['jurisdiction']);
    final location = _map(source['location']);
    final address = _map(location['address']);
    final duplicateOf = _map(source['duplicateOf']);
    final validatedBy = _map(source['validatedBy']);
    final workOrder = _map(source['workOrder']);
    final rawImages = _firstList(source, const ['images', 'evidence']);
    final evidenceThumbnail = source['evidenceThumbnail'];
    final queueImages = rawImages.isNotEmpty
        ? rawImages
        : evidenceThumbnail is Map
        ? [evidenceThumbnail]
        : evidenceThumbnail is String && evidenceThumbnail.trim().isNotEmpty
        ? [
            <String, dynamic>{'url': evidenceThumbnail},
          ]
        : const <dynamic>[];
    final rawHistory = _firstList(source, const ['statusHistory', 'history']);
    final rawCandidates = _firstList(source, const [
      'duplicateCandidates',
      'possibleDuplicateCandidates',
    ]);
    final detection = _map(source['duplicateDetection']);
    final jurisdictionValue =
        source['jurisdiction'] ??
        source['targetJurisdiction'] ??
        routing['jurisdiction'] ??
        routing['targetJurisdiction'] ??
        address['barangay'];
    final organizationValue =
        source['responsibleOrganization'] ??
        source['responsibleOffice'] ??
        source['provider'] ??
        routing['responsibleOrganization'] ??
        routing['organization'] ??
        routing['provider'];
    return ValidationIncident(
      id: (source['id'] ?? source['_id'] ?? '').toString(),
      reportNumber:
          (source['reportNumber'] ??
                  source['referenceNumber'] ??
                  'Report reference unavailable')
              .toString(),
      category: (source['category'] ?? 'other').toString(),
      description: (source['description'] ?? '').toString(),
      status: (source['status'] ?? 'submitted').toString(),
      createdAt: _date(source['createdAt'] ?? source['submittedAt']),
      location: IncidentLocation.fromJson(location),
      images: queueImages
          .whereType<Map>()
          .map(
            (image) =>
                ReportEvidence.fromJson(Map<String, dynamic>.from(image)),
          )
          .toList(growable: false),
      statusHistory: rawHistory
          .whereType<Map>()
          .map(
            (event) =>
                ReportStatusEvent.fromJson(Map<String, dynamic>.from(event)),
          )
          .toList(growable: false),
      duplicateCandidates: rawCandidates
          .whereType<Map>()
          .map(
            (candidate) => DuplicateCandidate.fromJson(
              Map<String, dynamic>.from(candidate),
            ),
          )
          .where((candidate) => candidate.id.isNotEmpty)
          .toList(growable: false),
      possibleDuplicateCandidateCount:
          _int(
            source['possibleDuplicateCandidateCount'] ??
                detection['candidateCount'] ??
                rawCandidates.length,
          ) ??
          0,
      priority: _text(source['priority']),
      priorityAssignedAt: _date(source['priorityAssignedAt']),
      aiSuggestedCategory: _text(
        source['aiSuggestedCategory'] ?? ai['hazardType'] ?? ai['category'],
      ),
      aiConfidence: _double(ai['confidence'] ?? source['aiConfidence']),
      aiAnalysis: ai.isEmpty ? null : AiAnalysis.fromJson(ai),
      jurisdiction: _organizationName(jurisdictionValue),
      jurisdictionResponsibility: _text(
        source['jurisdictionResponsibility'] ?? jurisdiction['responsibility'],
      ),
      responsibleOrganization: _organizationName(organizationValue),
      responsibleRole: _text(
        source['responsibleRole'] ?? routing['responsibleRole'],
      ),
      routingReason: _text(source['routingReason'] ?? routing['reason']),
      rejectionReason: _text(source['rejectionReason']),
      duplicateReason: _text(source['duplicateReason']),
      duplicateOfId: _text(
        source['duplicateOf'] is Map
            ? duplicateOf['id'] ?? duplicateOf['_id']
            : source['duplicateOf'],
      ),
      duplicateOfReportNumber: _text(
        source['duplicateOfReportNumber'] ??
            duplicateOf['reportNumber'] ??
            duplicateOf['referenceNumber'],
      ),
      validatedAt: _date(source['validatedAt']),
      validatedByName: _personName(validatedBy),
      sla: IncidentSla.fromMaybeJson(source['sla']),
      workOrderId: _text(workOrder['id'] ?? workOrder['_id']),
    );
  }
}

class DuplicateCandidate {
  const DuplicateCandidate({
    required this.id,
    required this.reportNumber,
    required this.category,
    required this.status,
    required this.location,
    this.createdAt,
    this.distanceMeters,
    this.score,
    this.imageUrl,
  });

  final String id;
  final String reportNumber;
  final String category;
  final String status;
  final IncidentLocation location;
  final DateTime? createdAt;
  final double? distanceMeters;
  final double? score;
  final String? imageUrl;

  factory DuplicateCandidate.fromJson(Map<String, dynamic> json) {
    final incident = _map(json['incident']);
    final source = incident.isEmpty ? json : incident;
    final rawImages = _firstList(source, const ['images', 'evidence']);
    final firstImage = rawImages.isNotEmpty && rawImages.first is Map
        ? Map<String, dynamic>.from(rawImages.first as Map)
        : const <String, dynamic>{};
    return DuplicateCandidate(
      id: (source['id'] ?? source['_id'] ?? json['incidentId'] ?? '')
          .toString(),
      reportNumber:
          (source['reportNumber'] ??
                  source['referenceNumber'] ??
                  json['reportNumber'] ??
                  '')
              .toString(),
      category: (source['category'] ?? json['category'] ?? 'other').toString(),
      status: (source['status'] ?? json['status'] ?? 'submitted').toString(),
      location: IncidentLocation.fromJson(_map(source['location'])),
      createdAt: _date(
        source['createdAt'] ??
            source['submittedAt'] ??
            json['createdAt'] ??
            json['submittedAt'],
      ),
      distanceMeters: _double(json['distanceMeters'] ?? json['distance']),
      score: _double(json['score'] ?? json['confidence']),
      imageUrl: _text(
        firstImage['url'] ??
            firstImage['signedUrl'] ??
            source['evidenceUrl'] ??
            json['evidenceUrl'] ??
            json['imageUrl'],
      ),
    );
  }
}

class IncidentSla {
  const IncidentSla({
    required this.targetResolutionHours,
    required this.deadline,
    required this.isOverdue,
    this.state,
  });

  final int? targetResolutionHours;
  final DateTime? deadline;
  final bool isOverdue;
  final String? state;

  factory IncidentSla.fromJson(Map<String, dynamic> json) => IncidentSla(
    targetResolutionHours: _int(
      json['targetResolutionHours'] ??
          json['targetResolutionTime'] ??
          json['targetHours'],
    ),
    deadline: _date(json['deadline'] ?? json['targetDeadline']),
    isOverdue: json['isOverdue'] == true || json['state'] == 'overdue',
    state: _text(json['state']),
  );

  static IncidentSla? fromMaybeJson(Object? value) {
    final source = _map(value);
    return source.isEmpty ? null : IncidentSla.fromJson(source);
  }
}

class ValidationDecisionRequest {
  const ValidationDecisionRequest.validate({
    required this.priority,
    required this.jurisdictionResponsibility,
    required this.responsibleOrganization,
    required this.responsibleRole,
    this.jurisdictionBarangay,
    this.jurisdictionCity,
    this.notes,
    this.routingReason,
  }) : type = ValidationDecisionType.validate,
       reason = null,
       duplicateOfIncidentId = null;

  const ValidationDecisionRequest.reject({required this.reason, this.notes})
    : type = ValidationDecisionType.reject,
      priority = null,
      jurisdictionBarangay = null,
      jurisdictionCity = null,
      jurisdictionResponsibility = null,
      responsibleOrganization = null,
      responsibleRole = null,
      routingReason = null,
      duplicateOfIncidentId = null;

  const ValidationDecisionRequest.duplicate({
    required this.reason,
    required this.duplicateOfIncidentId,
    this.notes,
  }) : type = ValidationDecisionType.duplicate,
       priority = null,
       jurisdictionBarangay = null,
       jurisdictionCity = null,
       jurisdictionResponsibility = null,
       responsibleOrganization = null,
       responsibleRole = null,
       routingReason = null;

  final ValidationDecisionType type;
  final String? priority;
  final String? jurisdictionBarangay;
  final String? jurisdictionCity;
  final String? jurisdictionResponsibility;
  final String? responsibleOrganization;
  final String? responsibleRole;
  final String? routingReason;
  final String? reason;
  final String? notes;
  final String? duplicateOfIncidentId;
}

Map<String, dynamic> _map(Object? value) => value is Map<String, dynamic>
    ? value
    : value is Map
    ? Map<String, dynamic>.from(value)
    : <String, dynamic>{};

List<dynamic> _firstList(Map<String, dynamic> source, List<String> keys) {
  for (final key in keys) {
    final value = source[key];
    if (value is List) return value;
  }
  return const [];
}

String? _text(Object? value) {
  final text = value?.toString().trim();
  return text == null || text.isEmpty ? null : text;
}

String? _organizationName(Object? value) {
  if (value is Map) {
    final source = Map<String, dynamic>.from(value);
    return _text(
      source['name'] ?? source['label'] ?? source['barangay'] ?? source['code'],
    );
  }
  return _text(value);
}

String? _personName(Map<String, dynamic> person) {
  if (person.isEmpty) return null;
  final name = '${person['firstName'] ?? ''} ${person['lastName'] ?? ''}'
      .trim();
  return name.isEmpty ? _text(person['name']) : name;
}

int? _int(Object? value) => value is int
    ? value
    : value is num
    ? value.toInt()
    : int.tryParse(value?.toString() ?? '');

double? _double(Object? value) =>
    value is num ? value.toDouble() : double.tryParse(value?.toString() ?? '');

DateTime? _date(Object? value) =>
    value == null ? null : DateTime.tryParse(value.toString())?.toLocal();
