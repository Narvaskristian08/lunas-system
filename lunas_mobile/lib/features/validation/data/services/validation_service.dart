import 'package:lunas_mobile/core/network/api_client.dart';
import 'package:lunas_mobile/features/reporting/data/models/incident_report.dart';
import 'package:lunas_mobile/features/validation/data/models/validation_incident.dart';
import 'package:lunas_mobile/features/validation/data/models/validation_summary.dart';

/// Server-backed access to the official validation workflow.
///
/// Queue filters are sent to the backend so jurisdiction and permission scope
/// remain authoritative; this service never filters a broader incident set on
/// the device.
class ValidationService {
  const ValidationService({required ApiClient apiClient}) : _apiClient = apiClient;

  final ApiClient _apiClient;

  Future<ValidationQueuePage> getPendingValidation({
    int page = 1,
    int limit = 20,
    String? search,
    String? category,
    String? barangay,
    bool? hasDuplicateCandidate,
    String? sortBy,
    String? from,
    String? to,
  }) async {
    if (page < 1) throw ArgumentError.value(page, 'page', 'Must be at least 1');
    if (limit < 1) throw ArgumentError.value(limit, 'limit', 'Must be at least 1');

    final payload = await _apiClient.get(
      '/incidents/pending-validation',
      queryParameters: {
        'page': '$page',
        'limit': '$limit',
        ..._optionalQuery('search', search),
        ..._optionalQuery('category', category),
        ..._optionalQuery('barangay', barangay),
        if (hasDuplicateCandidate != null)
          'hasDuplicateCandidate': hasDuplicateCandidate.toString(),
        ..._optionalQuery('sortBy', sortBy),
        ..._optionalQuery('from', from),
        ..._optionalQuery('to', to),
      },
    );
    return ValidationQueuePage.fromPayload(payload);
  }

  Future<ValidationIncident> getIncident(String incidentId) async {
    final payload = await _apiClient.get('/incidents/$incidentId');
    return ValidationIncident.fromJson(payload);
  }

  Future<List<ReportStatusEvent>> getHistory(String incidentId) async {
    final payload = await _apiClient.get('/incidents/$incidentId/history');
    final data = _map(payload['data']);
    final rawHistory = payload['data'] is List
        ? payload['data'] as List
        : _firstList(data, const ['history', 'statusHistory', 'items'])
        .isNotEmpty
        ? _firstList(data, const ['history', 'statusHistory', 'items'])
        : _firstList(payload, const ['history', 'statusHistory']);
    return rawHistory
        .whereType<Map>()
        .map((event) => ReportStatusEvent.fromJson(Map<String, dynamic>.from(event)))
        .toList(growable: false);
  }

  Future<List<DuplicateCandidate>> getDuplicateCandidates(String incidentId) async {
    final payload = await _apiClient.get('/incidents/$incidentId/duplicate-candidates');
    final data = _map(payload['data']);
    final rawCandidates = payload['data'] is List
        ? payload['data'] as List
        : _firstList(data, const [
            'candidates',
            'duplicateCandidates',
            'possibleDuplicateCandidates',
            'items',
          ]).isNotEmpty
        ? _firstList(data, const [
            'candidates',
            'duplicateCandidates',
            'possibleDuplicateCandidates',
            'items',
          ])
        : _firstList(payload, const [
            'candidates',
            'duplicateCandidates',
            'possibleDuplicateCandidates',
          ]);
    return rawCandidates
        .whereType<Map>()
        .map((candidate) => DuplicateCandidate.fromJson(Map<String, dynamic>.from(candidate)))
        .where((candidate) => candidate.id.isNotEmpty)
        .toList(growable: false);
  }

  Future<IncidentSla?> getSla(String incidentId) async {
    final payload = await _apiClient.get('/incidents/$incidentId/sla');
    final data = _map(payload['data']);
    final sla = _map(data['sla']);
    if (sla.isNotEmpty) return IncidentSla.fromJson(sla);
    return data.isEmpty ? null : IncidentSla.fromJson(data);
  }

  Future<ValidationSummary> getValidationSummary() async {
    final payload = await _apiClient.get('/stats/validation-summary');
    return ValidationSummary.fromPayload(payload);
  }

  /// Alias kept small and explicit for dashboard callers.
  Future<ValidationSummary> getSummary() => getValidationSummary();

  Future<ValidationIncident> submitDecision(
    String incidentId,
    ValidationDecisionRequest request,
  ) {
    return switch (request.type) {
      ValidationDecisionType.validate => validateIncident(incidentId, request),
      ValidationDecisionType.reject => rejectIncident(incidentId, request),
      ValidationDecisionType.duplicate => markDuplicate(incidentId, request),
    };
  }

  Future<ValidationIncident> validateIncident(
    String incidentId,
    ValidationDecisionRequest request,
  ) {
    _requireType(request, ValidationDecisionType.validate);
    final jurisdiction = <String, dynamic>{
      if (_nonEmpty(request.jurisdictionBarangay) != null)
        'barangay': _nonEmpty(request.jurisdictionBarangay),
      if (_nonEmpty(request.jurisdictionCity) != null) 'city': _nonEmpty(request.jurisdictionCity),
      'responsibility': _requiredText(
        request.jurisdictionResponsibility,
        'jurisdiction responsibility',
      ),
    };
    final routing = <String, dynamic>{
      'responsibleOrganization': _requiredText(
        request.responsibleOrganization,
        'responsible organization',
      ),
      'responsibleRole': _requiredText(request.responsibleRole, 'responsible role'),
      if (_nonEmpty(request.routingReason) != null) 'reason': _nonEmpty(request.routingReason),
    };
    return _postIncidentAction(
      incidentId,
      'validate',
      {
        'priority': _requiredText(request.priority, 'priority'),
        'jurisdiction': jurisdiction,
        'routing': routing,
        if (_nonEmpty(request.notes) != null) 'notes': _nonEmpty(request.notes),
      },
    );
  }

  Future<ValidationIncident> rejectIncident(
    String incidentId,
    ValidationDecisionRequest request,
  ) {
    _requireType(request, ValidationDecisionType.reject);
    return _postIncidentAction(
      incidentId,
      'reject',
      {
        'reason': _requiredText(request.reason, 'rejection reason'),
        if (_nonEmpty(request.notes) != null) 'notes': _nonEmpty(request.notes),
      },
    );
  }

  Future<ValidationIncident> markDuplicate(
    String incidentId,
    ValidationDecisionRequest request,
  ) {
    _requireType(request, ValidationDecisionType.duplicate);
    return _postIncidentAction(
      incidentId,
      'mark-duplicate',
      {
        'duplicateOf': _requiredText(request.duplicateOfIncidentId, 'canonical incident'),
        'reason': _requiredText(request.reason, 'duplicate reason'),
        if (_nonEmpty(request.notes) != null) 'notes': _nonEmpty(request.notes),
      },
    );
  }

  Future<ValidationIncident> updatePriority(String incidentId, String priority) {
    return _patchIncidentAction(
      incidentId,
      'priority',
      {'priority': _requiredText(priority, 'priority')},
    );
  }

  Future<ValidationIncident> updateJurisdiction(
    String incidentId, {
    required String barangay,
    String? city,
    required String responsibility,
  }) {
    return _patchIncidentAction(
      incidentId,
      'jurisdiction',
      {
        'barangay': _requiredText(barangay, 'barangay'),
        if (_nonEmpty(city) != null) 'city': _nonEmpty(city),
        'responsibility': _requiredText(responsibility, 'jurisdiction responsibility'),
      },
    );
  }

  Future<ValidationIncident> routeIncident(
    String incidentId, {
    required String responsibleOrganization,
    required String responsibleRole,
    String? reason,
  }) {
    return _postIncidentAction(
      incidentId,
      'route',
      {
        'responsibleOrganization': _requiredText(
          responsibleOrganization,
          'responsible organization',
        ),
        'responsibleRole': _requiredText(responsibleRole, 'responsible role'),
        if (_nonEmpty(reason) != null) 'reason': _nonEmpty(reason),
      },
    );
  }

  Future<ValidationIncident> _postIncidentAction(
    String incidentId,
    String action,
    Map<String, dynamic> body,
  ) async {
    final payload = await _apiClient.post('/incidents/$incidentId/$action', body: body);
    return ValidationIncident.fromJson(payload);
  }

  Future<ValidationIncident> _patchIncidentAction(
    String incidentId,
    String action,
    Map<String, dynamic> body,
  ) async {
    final payload = await _apiClient.patch('/incidents/$incidentId/$action', body: body);
    return ValidationIncident.fromJson(payload);
  }
}

Map<String, String> _optionalQuery(String key, String? value) {
  final text = _nonEmpty(value);
  return text == null ? const <String, String>{} : {key: text};
}

void _requireType(ValidationDecisionRequest request, ValidationDecisionType expected) {
  if (request.type != expected) {
    throw ArgumentError.value(
      request.type,
      'request.type',
      'Expected ${expected.apiValue} request',
    );
  }
}

String _requiredText(String? value, String field) {
  final text = _nonEmpty(value);
  if (text == null) throw ArgumentError.value(value, field, 'Must not be blank');
  return text;
}

String? _nonEmpty(String? value) {
  final text = value?.trim();
  return text == null || text.isEmpty ? null : text;
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
  return const <dynamic>[];
}
