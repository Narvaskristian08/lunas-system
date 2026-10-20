import 'dart:convert';

import 'package:http_parser/http_parser.dart';
import 'package:lunas_mobile/core/network/api_client.dart';
import 'package:lunas_mobile/features/repair/data/models/repair_models.dart';
import 'package:lunas_mobile/features/repair/data/models/inspection_models.dart';
import 'package:lunas_mobile/features/reporting/domain/models/evidence_selection.dart';

/// Server-backed repair operations. Authorization, personnel ownership,
/// jurisdiction, workflow transitions, SLA state, and concurrency are all
/// enforced by the API; this client only submits explicit user actions.
class RepairService {
  const RepairService({required ApiClient apiClient}) : _apiClient = apiClient;

  final ApiClient _apiClient;

  Future<List<TanodInspection>> getMyInspections() async {
    final payload = await _apiClient.get('/incidents/my-inspections');
    final data = payload['data'] is List
        ? payload['data'] as List
        : const <dynamic>[];
    return data.map(TanodInspection.fromJson).toList(growable: false);
  }

  Future<void> startInspection(String incidentId, String inspectionId) async {
    await _apiClient.post(
      '/incidents/$incidentId/inspections/$inspectionId/start',
    );
  }

  Future<void> submitInspection({
    required String incidentId,
    required String inspectionId,
    required String findings,
    required String result,
    EvidenceSelection? evidence,
  }) async {
    final trimmed = findings.trim();
    if (trimmed.length < 2) {
      throw ArgumentError.value(findings, 'findings', 'Findings are required');
    }
    final fields = {'findings': trimmed, 'result': result};
    if (evidence == null) {
      await _apiClient.post(
        '/incidents/$incidentId/inspections/$inspectionId/submit',
        body: fields,
      );
      return;
    }
    await _apiClient.multipart(
      '/incidents/$incidentId/inspections/$inspectionId/submit',
      fields: fields,
      files: [
        ApiMultipartFile(
          fieldName: 'evidence',
          filename: evidence.filename,
          bytes: await evidence.readAsBytes(),
          contentType: MediaType.parse(evidence.mediaType),
        ),
      ],
    );
  }

  Future<RepairDashboardSummary> getDashboardSummary() async {
    final payload = await _apiClient.get('/dashboard/work-orders-summary');
    return RepairDashboardSummary.fromPayload(payload);
  }

  Future<RepairWorkOrderPage> getMyWorkOrders({
    int page = 1,
    int limit = 20,
    RepairWorkOrderStatus? status,
    String? repairView,
    bool overdueOnly = false,
  }) async {
    _checkPage(page, limit);
    final payload = await _apiClient.get(
      '/work-orders/my',
      queryParameters: {
        'page': '$page',
        'limit': '$limit',
        if (repairView == 'overdue' || overdueOnly)
          'slaState': 'overdue'
        else if (repairView == 'approaching')
          'slaState': 'approaching',
        if (repairView != 'overdue' && repairView != 'approaching')
          'repairView': ?repairView,
        if (status != null && status != RepairWorkOrderStatus.unknown)
          'status': status.apiValue,
      },
    );
    return RepairWorkOrderPage.fromPayload(payload);
  }

  Future<RepairWorkOrder> getWorkOrder(String workOrderId) async {
    _requireId(workOrderId);
    final payload = await _apiClient.get('/work-orders/$workOrderId');
    return RepairWorkOrder.fromJson(payload);
  }

  Future<RepairWorkOrder> accept(String workOrderId, {int? version}) async {
    return _postAction(workOrderId, 'accept', version: version);
  }

  Future<RepairWorkOrder> decline(
    String workOrderId, {
    required String reason,
    String? notes,
    int? version,
  }) async {
    final trimmedReason = reason.trim();
    if (trimmedReason.length < 2) {
      throw ArgumentError.value(
        reason,
        'reason',
        'A decline reason must be at least 2 characters',
      );
    }
    if (trimmedReason.length > 500) {
      throw ArgumentError.value(
        reason,
        'reason',
        'Must be 500 characters or fewer',
      );
    }
    return _postAction(
      workOrderId,
      'decline',
      version: version,
      body: {
        'reason': trimmedReason,
        if (notes?.trim().isNotEmpty == true) 'notes': notes!.trim(),
      },
    );
  }

  Future<RepairWorkOrder> start(
    String workOrderId, {
    double? latitude,
    double? longitude,
    int? version,
  }) async {
    return _postAction(
      workOrderId,
      'start',
      version: version,
      body: _locationBody(latitude: latitude, longitude: longitude),
    );
  }

  Future<RepairWorkOrder> submitProgress(
    String workOrderId, {
    required int progressPercent,
    required RepairProgressStage stage,
    required String notes,
    String? updateType,
    EvidenceSelection? finalEvidence,
    double? latitude,
    double? longitude,
    int? version,
  }) async {
    _requireId(workOrderId);
    if (!repairProgressValues.contains(progressPercent)) {
      throw ArgumentError.value(
        progressPercent,
        'progressPercent',
        'Progress must be 0, 25, 50, 75, or 100',
      );
    }
    if (repairStageForProgress(progressPercent) != stage) {
      throw ArgumentError.value(
        stage,
        'stage',
        'The selected stage does not match the progress percentage',
      );
    }
    final trimmedNotes = notes.trim();
    if (trimmedNotes.length > 2000) {
      throw ArgumentError.value(
        notes,
        'notes',
        'Notes must be 2,000 characters or fewer',
      );
    }
    final body = <String, dynamic>{
      // The server requires an explicit Start Work transition before this
      // update; this request never asks it to verify or close a repair.
      'updateType': ?updateType,
      'progressPercent': progressPercent,
      'stage': stage.apiValue,
      if (trimmedNotes.isNotEmpty) 'notes': trimmedNotes,
      ..._locationBody(latitude: latitude, longitude: longitude),
      'version': ?version,
    };
    if (progressPercent == 100 && finalEvidence == null) {
      throw ArgumentError.value(
        finalEvidence,
        'finalEvidence',
        'Final post-maintenance evidence is required at 100%',
      );
    }
    final payload = finalEvidence == null
        ? await _apiClient.post(
            '/work-orders/$workOrderId/progress',
            body: body,
          )
        : await _apiClient.multipart(
            '/work-orders/$workOrderId/progress',
            fields: body.map(
              (key, value) =>
                  MapEntry(key, value is String ? value : jsonEncode(value)),
            ),
            files: [
              ApiMultipartFile(
                fieldName: 'evidence',
                filename: finalEvidence.filename,
                bytes: await finalEvidence.readAsBytes(),
                contentType: MediaType.parse(finalEvidence.mediaType),
              ),
            ],
          );
    return RepairWorkOrder.fromJson(payload);
  }

  Future<RepairEvidence> uploadEvidence(
    String workOrderId, {
    required EvidenceSelection evidence,
    String? caption,
    String? progressUpdateId,
  }) async {
    _requireId(workOrderId);
    final bytes = await evidence.readAsBytes();
    final payload = await _apiClient.multipart(
      '/work-orders/$workOrderId/evidence',
      fields: {
        if (caption?.trim().isNotEmpty == true) 'caption': caption!.trim(),
        if (progressUpdateId?.trim().isNotEmpty == true)
          'progressUpdateId': progressUpdateId!.trim(),
      },
      files: [
        ApiMultipartFile(
          fieldName: 'evidence',
          filename: evidence.filename,
          bytes: bytes,
          contentType: MediaType.parse(evidence.mediaType),
        ),
      ],
    );
    final data = _map(payload['data']);
    final listData = payload['data'] is List
        ? payload['data'] as List
        : const <dynamic>[];
    final evidenceData = _map(data['evidence']).isNotEmpty
        ? _map(data['evidence'])
        : listData.isNotEmpty
        ? _map(listData.first)
        : data;
    return RepairEvidence.fromJson(evidenceData);
  }

  Future<RepairWorkOrder> _postAction(
    String workOrderId,
    String action, {
    Map<String, dynamic>? body,
    int? version,
  }) async {
    _requireId(workOrderId);
    final payload = await _apiClient.post(
      '/work-orders/$workOrderId/$action',
      body: {...?body, 'version': ?version},
    );
    return RepairWorkOrder.fromJson(payload);
  }

  Map<String, dynamic> _locationBody({double? latitude, double? longitude}) {
    if (latitude == null || longitude == null) return const {};
    if (latitude < -90 ||
        latitude > 90 ||
        longitude < -180 ||
        longitude > 180) {
      throw ArgumentError('Location coordinates are outside the valid range');
    }
    return {
      'location': {
        'type': 'Point',
        'coordinates': [longitude, latitude],
      },
    };
  }

  void _checkPage(int page, int limit) {
    if (page < 1) throw ArgumentError.value(page, 'page', 'Must be at least 1');
    if (limit < 1) {
      throw ArgumentError.value(limit, 'limit', 'Must be at least 1');
    }
  }

  void _requireId(String value) {
    if (value.trim().isEmpty) {
      throw ArgumentError.value(
        value,
        'id',
        'A resource identifier is required',
      );
    }
  }
}

Map<String, dynamic> _map(Object? value) => value is Map<String, dynamic>
    ? value
    : value is Map
    ? Map<String, dynamic>.from(value)
    : <String, dynamic>{};
