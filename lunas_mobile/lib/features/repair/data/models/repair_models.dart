import 'package:lunas_mobile/features/reporting/data/models/incident_report.dart';

/// The only repair progress percentages accepted by the backend for a work
/// order.
const repairProgressValues = <int>{0, 25, 50, 75, 100};

enum RepairProgressStage {
  assigned,
  sitePreparation,
  mainRepair,
  finishing,
  readyForCompletion,
}

extension RepairProgressStageValue on RepairProgressStage {
  String get apiValue => switch (this) {
    RepairProgressStage.assigned => 'assigned',
    RepairProgressStage.sitePreparation => 'site_preparation',
    RepairProgressStage.mainRepair => 'main_repair',
    RepairProgressStage.finishing => 'finishing',
    RepairProgressStage.readyForCompletion => 'ready_for_completion',
  };

  String get label => switch (this) {
    RepairProgressStage.assigned => 'Assigned / Accepted',
    RepairProgressStage.sitePreparation => 'Site Preparation',
    RepairProgressStage.mainRepair => 'Main Repair Underway',
    RepairProgressStage.finishing => 'Finishing Work',
    RepairProgressStage.readyForCompletion => 'Awaiting Review',
  };
}

RepairProgressStage repairStageForProgress(int progress) => switch (progress) {
  0 => RepairProgressStage.assigned,
  25 => RepairProgressStage.sitePreparation,
  50 => RepairProgressStage.mainRepair,
  75 => RepairProgressStage.finishing,
  100 => RepairProgressStage.readyForCompletion,
  _ => RepairProgressStage.assigned,
};

RepairProgressStage repairProgressStageFromJson(
  Object? value, {
  int? progress,
}) {
  final normalized = value?.toString().trim().toLowerCase();
  return switch (normalized) {
    'assigned' || 'accepted' => RepairProgressStage.assigned,
    'site_preparation' ||
    'site preparation' => RepairProgressStage.sitePreparation,
    'main_repair' ||
    'main repair' ||
    'main repair underway' => RepairProgressStage.mainRepair,
    'finishing' ||
    'finishing_work' ||
    'finishing work' => RepairProgressStage.finishing,
    'ready_for_completion' ||
    'ready for completion' ||
    'completed' => RepairProgressStage.readyForCompletion,
    _ => repairStageForProgress(progress ?? 0),
  };
}

enum RepairWorkOrderStatus {
  pending,
  accepted,
  inProgress,
  completed,
  reworkRequired,
  cityCorrectionRequired,
  providerAccepted,
  verified,
  unknown,
}

extension RepairWorkOrderStatusValue on RepairWorkOrderStatus {
  String get apiValue => switch (this) {
    RepairWorkOrderStatus.pending => 'pending',
    RepairWorkOrderStatus.accepted => 'accepted',
    RepairWorkOrderStatus.inProgress => 'in_progress',
    RepairWorkOrderStatus.completed => 'completed',
    RepairWorkOrderStatus.reworkRequired => 'rework_required',
    RepairWorkOrderStatus.cityCorrectionRequired => 'city_correction_required',
    RepairWorkOrderStatus.providerAccepted => 'provider_accepted',
    RepairWorkOrderStatus.verified => 'verified',
    RepairWorkOrderStatus.unknown => 'unknown',
  };

  String get label => switch (this) {
    RepairWorkOrderStatus.pending => 'Pending Assignment',
    RepairWorkOrderStatus.accepted => 'Assigned',
    RepairWorkOrderStatus.inProgress => 'In Progress',
    RepairWorkOrderStatus.completed => 'Awaiting Provider Review',
    RepairWorkOrderStatus.reworkRequired => 'Needs Correction',
    RepairWorkOrderStatus.cityCorrectionRequired =>
      'Returned by City Engineering',
    RepairWorkOrderStatus.providerAccepted => 'Awaiting City Verification',
    RepairWorkOrderStatus.verified => 'Closed',
    RepairWorkOrderStatus.unknown => 'Status Unavailable',
  };
}

RepairWorkOrderStatus repairWorkOrderStatusFromJson(Object? value) {
  return switch (value?.toString().trim().toLowerCase()) {
    'pending' => RepairWorkOrderStatus.pending,
    'accepted' => RepairWorkOrderStatus.accepted,
    'in_progress' || 'in progress' => RepairWorkOrderStatus.inProgress,
    'completed' || 'ready_for_completion' => RepairWorkOrderStatus.completed,
    'rework_required' => RepairWorkOrderStatus.reworkRequired,
    'city_correction_required' => RepairWorkOrderStatus.cityCorrectionRequired,
    'provider_accepted' => RepairWorkOrderStatus.providerAccepted,
    'verified' => RepairWorkOrderStatus.verified,
    _ => RepairWorkOrderStatus.unknown,
  };
}

class RepairWorkOrderEvent {
  const RepairWorkOrderEvent({
    required this.id,
    this.type,
    this.status,
    this.notes,
    this.createdAt,
  });

  final String id;
  final String? type;
  final String? status;
  final String? notes;
  final DateTime? createdAt;

  factory RepairWorkOrderEvent.fromJson(Object? value) {
    final json = _map(value);
    return RepairWorkOrderEvent(
      id: _id(json),
      type: _text(json['type']),
      status: _text(json['status']),
      notes: _text(json['notes']),
      createdAt: _date(json['createdAt']),
    );
  }
}

class RepairSla {
  const RepairSla({
    this.targetResolutionHours,
    this.startedAt,
    this.deadline,
    this.state,
    this.isApproaching = false,
    this.isOverdue = false,
    this.timeRemaining,
  });

  final int? targetResolutionHours;
  final DateTime? startedAt;
  final DateTime? deadline;
  final String? state;
  final bool isApproaching;
  final bool isOverdue;
  final String? timeRemaining;

  bool get hasDeadline => deadline != null;

  factory RepairSla.fromJson(Object? value) {
    final json = _map(value);
    final state = _text(json['state']);
    return RepairSla(
      targetResolutionHours: _int(
        json['targetResolutionHours'] ?? json['targetResolutionTime'],
      ),
      startedAt: _date(json['startedAt'] ?? json['slaStartedAt']),
      deadline: _date(json['deadline'] ?? json['targetDeadline']),
      state: state,
      isApproaching: json['isApproaching'] == true || state == 'approaching',
      isOverdue: json['isOverdue'] == true || state == 'overdue',
      timeRemaining:
          _text(
            json['timeRemaining'] ??
                json['remaining'] ??
                json['remainingLabel'],
          ) ??
          _remainingLabel(json['remainingMilliseconds']),
    );
  }
}

class RepairPerson {
  const RepairPerson({
    required this.id,
    required this.name,
    this.role,
    this.organization,
    this.team,
    this.availability,
    this.activeAssignments,
    this.isActive,
  });

  final String id;
  final String name;
  final String? role;
  final String? organization;
  final String? team;
  final String? availability;
  final int? activeAssignments;
  final bool? isActive;

  factory RepairPerson.fromJson(Object? value) {
    final json = _map(value);
    final firstName = _text(json['firstName']);
    final lastName = _text(json['lastName']);
    final fullName = '${firstName ?? ''} ${lastName ?? ''}'.trim();
    return RepairPerson(
      id: _id(json),
      name:
          _text(json['name'] ?? json['fullName']) ??
          (fullName.isEmpty ? 'Assigned personnel' : fullName),
      role: _text(json['role']),
      organization: _organizationName(
        json['organization'] ??
            json['utilityCompany'] ??
            json['responsibleOrganization'],
      ),
      team: _organizationName(json['team']),
      availability: _text(json['availability'] ?? json['availabilityStatus']),
      activeAssignments: _int(
        json['activeAssignments'] ??
            json['activeAssignmentCount'] ??
            json['workload'],
      ),
      isActive: json['isActive'] is bool ? json['isActive'] as bool : null,
    );
  }
}

class RepairAssignment {
  const RepairAssignment({
    required this.id,
    this.assignee,
    this.status,
    this.assignedAt,
    this.acceptedAt,
    this.declinedAt,
    this.declineReason,
    this.endedAt,
    this.reassignmentReason,
    this.active,
  });

  final String id;
  final RepairPerson? assignee;
  final String? status;
  final DateTime? assignedAt;
  final DateTime? acceptedAt;
  final DateTime? declinedAt;
  final String? declineReason;
  final DateTime? endedAt;
  final String? reassignmentReason;
  final bool? active;

  factory RepairAssignment.fromJson(Object? value) {
    final json = _map(value);
    final assigneeValue =
        json['assignee'] ?? json['assignedTo'] ?? json['personnel'];
    return RepairAssignment(
      id: _id(json),
      assignee: assigneeValue == null
          ? null
          : RepairPerson.fromJson(assigneeValue),
      status: _text(json['status'] ?? json['assignmentStatus']),
      assignedAt: _date(json['assignedAt']),
      acceptedAt: _date(json['acceptedAt']),
      declinedAt: _date(json['declinedAt']),
      declineReason: _text(json['declineReason']),
      endedAt: _date(json['endedAt']),
      reassignmentReason: _text(
        json['reassignmentReason'] ?? json['endedReason'],
      ),
      active: json['active'] as bool?,
    );
  }
}

class RepairEvidence {
  const RepairEvidence({
    required this.id,
    required this.url,
    this.key,
    this.mimeType,
    this.size,
    this.caption,
    this.uploadedAt,
    this.progressUpdateId,
  });

  final String id;
  final String url;
  final String? key;
  final String? mimeType;
  final int? size;
  final String? caption;
  final DateTime? uploadedAt;
  final String? progressUpdateId;

  factory RepairEvidence.fromJson(Object? value) {
    final json = _map(value);
    return RepairEvidence(
      id: _id(json),
      url: _text(json['signedUrl'] ?? json['url']) ?? '',
      key: _text(json['key'] ?? json['storageKey']),
      mimeType: _text(json['mimeType'] ?? json['contentType']),
      size: _int(json['size'] ?? json['byteLength']),
      caption: _text(json['caption'] ?? json['notes']),
      uploadedAt: _date(json['uploadedAt'] ?? json['createdAt']),
      progressUpdateId: _text(
        json['progressUpdateId'] ?? json['progressUpdate'],
      ),
    );
  }
}

class RepairProgressUpdate {
  const RepairProgressUpdate({
    required this.id,
    required this.previousPercent,
    required this.progressPercent,
    required this.stage,
    this.notes,
    this.updatedAt,
    this.evidence = const [],
    this.location,
  });

  final String id;
  final int previousPercent;
  final int progressPercent;
  final RepairProgressStage stage;
  final String? notes;
  final DateTime? updatedAt;
  final List<RepairEvidence> evidence;
  final IncidentLocation? location;

  factory RepairProgressUpdate.fromJson(Object? value) {
    final json = _map(value);
    final progress =
        _int(json['progressPercent'] ?? json['newPercentage']) ?? 0;
    return RepairProgressUpdate(
      id: _id(json),
      previousPercent:
          _int(json['previousPercent'] ?? json['previousPercentage']) ?? 0,
      progressPercent: progress,
      stage: repairProgressStageFromJson(json['stage'], progress: progress),
      notes: _text(json['notes']),
      updatedAt: _date(json['updatedAt'] ?? json['createdAt']),
      evidence: _list(
        json['evidence'] ?? json['repairEvidence'],
      ).map(RepairEvidence.fromJson).toList(growable: false),
      location: _map(json['location']).isEmpty
          ? null
          : IncidentLocation.fromJson(_map(json['location'])),
    );
  }
}

class RepairWorkOrder {
  const RepairWorkOrder({
    required this.id,
    required this.orderNumber,
    required this.status,
    required this.progressPercent,
    required this.progressStage,
    required this.incidentId,
    required this.incidentReference,
    required this.category,
    required this.description,
    required this.location,
    required this.citizenEvidence,
    required this.assignments,
    required this.progressUpdates,
    required this.history,
    required this.repairEvidence,
    required this.sla,
    this.priority,
    this.responsibleOrganization,
    this.jurisdiction,
    this.assignmentState,
    this.currentAssignment,
    this.acceptedAt,
    this.startedAt,
    this.readyForCompletionAt,
    this.instructions,
    this.createdAt,
    this.updatedAt,
    this.version,
  });

  final String id;
  final String orderNumber;
  final RepairWorkOrderStatus status;
  final int progressPercent;
  final RepairProgressStage progressStage;
  final String incidentId;
  final String incidentReference;
  final String category;
  final String description;
  final IncidentLocation location;
  final List<ReportEvidence> citizenEvidence;
  final String? priority;
  final String? responsibleOrganization;
  final String? jurisdiction;
  final String? assignmentState;
  final RepairAssignment? currentAssignment;
  final List<RepairAssignment> assignments;
  final List<RepairProgressUpdate> progressUpdates;
  final List<RepairWorkOrderEvent> history;
  final List<RepairEvidence> repairEvidence;
  final RepairSla sla;
  final DateTime? acceptedAt;
  final DateTime? startedAt;
  final DateTime? readyForCompletionAt;
  final String? instructions;
  final DateTime? createdAt;
  final DateTime? updatedAt;
  final int? version;

  String? get _currentAssignmentStatus =>
      currentAssignment?.status?.trim().toLowerCase();

  bool get _hasPendingAssignment =>
      assignmentState == 'pending' || _currentAssignmentStatus == 'pending';

  bool get _hasAcceptedAssignment =>
      assignmentState == 'accepted' || _currentAssignmentStatus == 'accepted';

  /// A reassigned in-progress work order remains `in_progress` while its new
  /// assignment waits for acceptance, so status alone must never unlock repair
  /// actions.
  bool get isPendingAcceptance =>
      (status == RepairWorkOrderStatus.pending ||
          status == RepairWorkOrderStatus.inProgress ||
          status == RepairWorkOrderStatus.reworkRequired) &&
      (_hasPendingAssignment ||
          (status == RepairWorkOrderStatus.pending && assignmentState == null));

  bool get canStart =>
      (status == RepairWorkOrderStatus.accepted ||
          status == RepairWorkOrderStatus.reworkRequired) &&
      _hasAcceptedAssignment &&
      !_hasPendingAssignment;

  bool get canUpdateProgress =>
      status == RepairWorkOrderStatus.inProgress &&
      _hasAcceptedAssignment &&
      !_hasPendingAssignment;
  bool get isReadyForCompletion => status == RepairWorkOrderStatus.completed;

  bool get isCorrectionResubmission =>
      status == RepairWorkOrderStatus.inProgress && progressPercent == 100;

  factory RepairWorkOrder.fromJson(Object? value) {
    final json = _unwrapWorkOrder(_map(value));
    final incident = _map(json['incident']);
    final location = _map(incident['location']).isNotEmpty
        ? _map(incident['location'])
        : _map(json['location']);
    final rawCitizenEvidence = _list(
      incident['images'] ?? incident['evidence'] ?? json['citizenEvidence'],
    );
    final progress =
        _int(json['progressPercent'] ?? json['currentProgress']) ?? 0;
    final currentAssignmentValue =
        json['currentAssignment'] ??
        json['assignment'] ??
        json['activeAssignment'];
    return RepairWorkOrder(
      id: _id(json),
      orderNumber:
          _text(
            json['orderNumber'] ?? json['reference'] ?? json['referenceNumber'],
          ) ??
          'Work order unavailable',
      status: repairWorkOrderStatusFromJson(json['status']),
      progressPercent: repairProgressValues.contains(progress) ? progress : 0,
      progressStage: repairProgressStageFromJson(
        json['progressStage'] ?? json['currentStage'],
        progress: progress,
      ),
      incidentId: _id(incident).isNotEmpty
          ? _id(incident)
          : _text(json['incidentId']) ?? '',
      incidentReference:
          _text(
            incident['reportNumber'] ??
                incident['referenceNumber'] ??
                json['incidentReference'] ??
                json['incidentNumber'],
          ) ??
          'Incident reference unavailable',
      category: _text(incident['category'] ?? json['category']) ?? 'Other',
      description: _text(incident['description'] ?? json['description']) ?? '',
      location: IncidentLocation.fromJson(location),
      citizenEvidence: rawCitizenEvidence
          .map((item) => ReportEvidence.fromJson(_map(item)))
          .toList(growable: false),
      priority: _text(json['priority'] ?? incident['priority']),
      responsibleOrganization: _organizationName(
        json['responsibleOrganization'] ?? incident['responsibleOrganization'],
      ),
      jurisdiction: _organizationName(
        json['jurisdiction'] ?? incident['jurisdiction'],
      ),
      assignmentState: _text(json['assignmentState'])?.toLowerCase(),
      currentAssignment: currentAssignmentValue == null
          ? null
          : RepairAssignment.fromJson(currentAssignmentValue),
      assignments: _list(
        json['assignments'] ?? json['assignmentHistory'],
      ).map(RepairAssignment.fromJson).toList(growable: false),
      progressUpdates: _list(
        json['progressUpdates'] ?? json['progressHistory'],
      ).map(RepairProgressUpdate.fromJson).toList(growable: false),
      history: _list(
        json['history'],
      ).map(RepairWorkOrderEvent.fromJson).toList(growable: false),
      repairEvidence: _list(
        json['repairEvidence'] ?? json['evidence'],
      ).map(RepairEvidence.fromJson).toList(growable: false),
      sla: RepairSla.fromJson(json['sla']),
      acceptedAt: _date(json['acceptedAt']),
      startedAt: _date(json['startedAt'] ?? json['actualStartTime']),
      readyForCompletionAt: _date(
        json['readyForCompletionAt'] ?? json['actualCompletionTime'],
      ),
      instructions: _text(json['instructions']),
      createdAt: _date(json['createdAt']),
      updatedAt: _date(json['updatedAt']),
      version: _int(json['version'] ?? json['__v']),
    );
  }
}

class RepairWorkOrderPage {
  const RepairWorkOrderPage({
    required this.items,
    required this.page,
    required this.limit,
    required this.total,
    required this.pages,
  });

  final List<RepairWorkOrder> items;
  final int page;
  final int limit;
  final int total;
  final int pages;

  bool get hasNextPage => page < pages;
  bool get hasPreviousPage => page > 1;

  factory RepairWorkOrderPage.fromPayload(Map<String, dynamic> payload) {
    final data = _map(payload['data']);
    final source = data.isEmpty ? payload : data;
    final values = _list(
      source['workOrders'] ??
          source['items'] ??
          source['results'] ??
          payload['data'],
    );
    final pagination = _map(source['pagination']).isNotEmpty
        ? _map(source['pagination'])
        : _map(payload['pagination']);
    final page = _int(pagination['page']) ?? 1;
    final limit = _int(pagination['limit']) ?? values.length;
    final total =
        _int(pagination['total'] ?? payload['count']) ?? values.length;
    final pages =
        _int(pagination['pages']) ??
        (limit <= 0 ? 1 : (total / limit).ceil().clamp(1, 1 << 31).toInt());
    return RepairWorkOrderPage(
      items: values.map(RepairWorkOrder.fromJson).toList(growable: false),
      page: page,
      limit: limit,
      total: total,
      pages: pages,
    );
  }
}

class RepairDashboardSummary {
  const RepairDashboardSummary({
    required this.pendingAssignments,
    required this.accepted,
    required this.inProgress,
    required this.approachingDeadline,
    required this.overdue,
    required this.readyForCompletion,
    this.needsCorrection = 0,
    this.assignedRepairs,
  });

  final int pendingAssignments;
  final int accepted;
  final int inProgress;
  final int approachingDeadline;
  final int overdue;
  final int readyForCompletion;
  final int needsCorrection;
  final int? assignedRepairs;

  factory RepairDashboardSummary.fromPayload(Map<String, dynamic> payload) {
    final data = _map(payload['data']);
    final source = _map(data['workOrders']).isNotEmpty
        ? _map(data['workOrders'])
        : data;
    return RepairDashboardSummary(
      pendingAssignments:
          _int(
            source['pendingAssignments'] ??
                source['pendingAcceptance'] ??
                source['pending'] ??
                source['assigned'],
          ) ??
          0,
      assignedRepairs: _int(source['assignedRepairs']),
      accepted: _int(source['accepted']) ?? 0,
      inProgress:
          _int(
            source['inProgress'] ?? source['activeRepairs'] ?? source['active'],
          ) ??
          0,
      approachingDeadline:
          _int(
            source['approachingDeadline'] ??
                source['approaching'] ??
                source['nearDeadline'],
          ) ??
          0,
      overdue: _int(source['overdue'] ?? source['overdueRepairs']) ?? 0,
      needsCorrection:
          (_int(source['correctiveRepairs']) ?? 0) +
          (_int(source['cityCorrections']) ?? 0),
      readyForCompletion:
          (_int(
                source['readyForCompletion'] ??
                    source['ready'] ??
                    source['completed'],
              ) ??
              0) +
          (_int(source['awaitingFinalVerification']) ?? 0),
    );
  }
}

Map<String, dynamic> _unwrapWorkOrder(Map<String, dynamic> json) {
  final data = _map(json['data']);
  final nested = _map(data['workOrder']);
  if (nested.isNotEmpty) return nested;
  if (data.isNotEmpty &&
      (data.containsKey('orderNumber') || data.containsKey('status'))) {
    return data;
  }
  final direct = _map(json['workOrder']);
  return direct.isNotEmpty ? direct : json;
}

Map<String, dynamic> _map(Object? value) => value is Map<String, dynamic>
    ? value
    : value is Map
    ? Map<String, dynamic>.from(value)
    : <String, dynamic>{};

List<dynamic> _list(Object? value) => value is List ? value : const <dynamic>[];

String _id(Map<String, dynamic> json) => _text(json['id'] ?? json['_id']) ?? '';

String? _text(Object? value) {
  final text = value?.toString().trim();
  return text == null || text.isEmpty ? null : text;
}

int? _int(Object? value) => value is int
    ? value
    : value is num
    ? value.toInt()
    : int.tryParse(value?.toString() ?? '');

DateTime? _date(Object? value) =>
    value == null ? null : DateTime.tryParse(value.toString())?.toLocal();

String? _organizationName(Object? value) {
  if (value is Map) {
    final json = Map<String, dynamic>.from(value);
    return _text(
      json['name'] ?? json['label'] ?? json['barangay'] ?? json['code'],
    );
  }
  return _text(value);
}

String? _remainingLabel(Object? value) {
  final milliseconds = value is num
      ? value.toInt()
      : int.tryParse(value?.toString() ?? '');
  if (milliseconds == null) return null;
  final duration = Duration(milliseconds: milliseconds.abs());
  final hours = duration.inHours;
  final minutes = duration.inMinutes.remainder(60);
  final label = hours > 0 ? '${hours}h ${minutes}m' : '${minutes}m';
  return milliseconds < 0 ? '$label overdue' : label;
}
