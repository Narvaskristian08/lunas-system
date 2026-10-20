import 'dart:convert';
import 'package:lunas_mobile/features/maps/domain/models/location_integrity.dart';

import 'package:http_parser/http_parser.dart';
import 'package:lunas_mobile/core/network/api_client.dart';
import 'package:lunas_mobile/features/reporting/data/models/incident_report.dart';
import 'package:lunas_mobile/features/reporting/domain/models/citizen_report_draft.dart';
import 'package:lunas_mobile/features/reporting/data/models/reporting_appeal.dart';

class ReportService {
  const ReportService({required ApiClient apiClient}) : _apiClient = apiClient;

  final ApiClient _apiClient;

  Future<void> respondToVerificationClarification(
    String incidentId,
    String response,
    int expectedVersion,
  ) async {
    await _apiClient.post(
      '/incidents/$incidentId/clarification-response',
      body: {'response': response.trim(), 'expectedVersion': expectedVersion},
    );
  }

  Future<LocationPolicy> getLocationPolicy() async {
    final payload = await _apiClient.get('/incidents/location-policy');
    return LocationPolicy.fromJson(_dataMap(payload));
  }

  Future<List<String>> getBarangays() async {
    final payload = await _apiClient.get('/incidents/barangays');
    final data = payload['data'];
    final values = data is List
        ? data
              .map((value) => value.toString().trim())
              .where((value) => value.isNotEmpty)
              .toList(growable: false)
        : const <String>[];
    if (values.isEmpty) {
      throw StateError('No recognized Dagupan barangays are available.');
    }
    return values;
  }

  Future<List<IncidentReport>> getMyReports({int limit = 20}) async =>
      (await getMyReportsPage(limit: limit)).items;

  Future<CitizenReportPage> getMyReportsPage({
    int page = 1,
    int limit = 20,
    String filter = 'all',
    String search = '',
  }) async {
    final payload = await _apiClient.get(
      '/incidents/my',
      queryParameters: {
        'page': '$page',
        'limit': '$limit',
        'reportView': filter,
        if (search.trim().isNotEmpty) 'search': search.trim(),
      },
    );
    final pagination = payload['pagination'] as Map? ?? {};
    return CitizenReportPage(
      items: _reportList(payload),
      page: (pagination['page'] as num?)?.toInt() ?? page,
      pages: (pagination['pages'] as num?)?.toInt() ?? 1,
      total: (pagination['total'] as num?)?.toInt() ?? 0,
    );
  }

  Future<IncidentReport> getReport(String id) async {
    final payload = await _apiClient.get('/incidents/$id');
    return IncidentReport.fromJson(_dataMap(payload));
  }

  /// Opens a report using its MongoDB Incident `_id`.
  Future<IncidentReport> getReportById(String id) => getReport(id);

  Future<List<ReportStatusEvent>> getHistory(String id) async {
    final payload = await _apiClient.get('/incidents/$id/history');
    final data = payload['data'];
    final rawHistory = data is List
        ? data
        : data is Map && data['history'] is List
        ? data['history'] as List
        : const [];
    return rawHistory
        .whereType<Map>()
        .map(
          (event) =>
              ReportStatusEvent.fromJson(Map<String, dynamic>.from(event)),
        )
        .toList(growable: false);
  }

  Future<IncidentReport> submit(CitizenReportDraft draft) async {
    if (!draft.location.isValid) {
      throw ArgumentError('A valid report location is required.');
    }
    if (!draft.locationConfirmed) {
      throw ArgumentError(
        'Confirm the actual damage location before submitting.',
      );
    }
    final bytes = await draft.evidence.readAsBytes();
    final payload = await _apiClient.multipart(
      '/incidents',
      fields: {
        'locationIntegrity': jsonEncode({
          'confirmed': draft.locationConfirmed,
          'pinSource': draft.location.pinSource,
          if (draft.location.gpsFix != null)
            'gps': draft.location.gpsFix!.toJson(),
          if (draft.locationExplanationReason != null)
            'explanation': {
              'reason': draft.locationExplanationReason,
              'text': draft.locationExplanationText ?? '',
            },
        }),
        'category': draft.category.code,
        'description': draft.description,
        // The server retains the reporter's acknowledgement alongside the
        // backend-owned privacy-redaction result.
        'privacyAcknowledged': draft.privacyAcknowledged.toString(),
        'location': jsonEncode({
          'type': 'Point',
          'coordinates': [draft.location.longitude, draft.location.latitude],
          'address': {
            'street': draft.location.address,
            'barangay': draft.barangay,
            'city': 'Dagupan City',
          },
        }),
      },
      files: [
        ApiMultipartFile(
          fieldName: 'evidence',
          filename: draft.evidence.filename,
          bytes: bytes,
          contentType: MediaType.parse(draft.evidence.mediaType),
        ),
      ],
    );
    return IncidentReport.fromJson(_dataMap(payload));
  }

  Future<ReportingAppeal?> getMyAppeal() async {
    final payload = await _apiClient.get('/reporting-appeals/me');
    final data = payload['data'];
    return data is Map
        ? ReportingAppeal.fromJson(Map<String, dynamic>.from(data))
        : null;
  }

  Future<ReportingAppeal> submitAppeal({
    required String explanation,
    required String evidenceReference,
  }) async {
    final payload = await _apiClient.post(
      '/reporting-appeals',
      body: {
        'explanation': explanation,
        'evidenceReference': evidenceReference,
      },
    );
    return ReportingAppeal.fromJson(_dataMap(payload));
  }

  List<IncidentReport> _reportList(Map<String, dynamic> payload) {
    final data = payload['data'];
    final values = data is List
        ? data
        : data is Map && data['incidents'] is List
        ? data['incidents'] as List
        : const [];
    return values
        .whereType<Map>()
        .map(
          (value) => IncidentReport.fromJson(Map<String, dynamic>.from(value)),
        )
        .toList(growable: false);
  }

  Map<String, dynamic> _dataMap(Map<String, dynamic> payload) {
    final data = payload['data'];
    return data is Map<String, dynamic>
        ? data
        : data is Map
        ? Map<String, dynamic>.from(data)
        : <String, dynamic>{};
  }
}

class CitizenReportPage {
  const CitizenReportPage({
    required this.items,
    required this.page,
    required this.pages,
    required this.total,
  });
  final List<IncidentReport> items;
  final int page;
  final int pages;
  final int total;
}
