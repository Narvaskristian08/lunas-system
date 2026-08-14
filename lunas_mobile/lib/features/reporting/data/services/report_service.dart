import 'dart:convert';

import 'package:http_parser/http_parser.dart';
import 'package:lunas_mobile/core/network/api_client.dart';
import 'package:lunas_mobile/features/reporting/data/models/incident_report.dart';
import 'package:lunas_mobile/features/reporting/domain/models/citizen_report_draft.dart';

class ReportService {
  const ReportService({required ApiClient apiClient}) : _apiClient = apiClient;

  final ApiClient _apiClient;

  Future<List<IncidentReport>> getMyReports({int limit = 20}) async {
    final payload = await _apiClient.get(
      '/incidents/my',
      queryParameters: {'page': '1', 'limit': '$limit'},
    );
    return _reportList(payload);
  }

  Future<IncidentReport> getReport(String id) async {
    final payload = await _apiClient.get('/incidents/$id');
    return IncidentReport.fromJson(_dataMap(payload));
  }

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
        .map((event) => ReportStatusEvent.fromJson(Map<String, dynamic>.from(event)))
        .toList(growable: false);
  }

  Future<IncidentReport> submit(CitizenReportDraft draft) async {
    final bytes = await draft.evidence.readAsBytes();
    final payload = await _apiClient.multipart(
      '/incidents',
      fields: {
        'category': draft.category.code,
        'description': draft.description,
        // The server requires an explicit acknowledgement until an approved
        // face/license-plate redaction provider is available.
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

  List<IncidentReport> _reportList(Map<String, dynamic> payload) {
    final data = payload['data'];
    final values = data is List
        ? data
        : data is Map && data['incidents'] is List
        ? data['incidents'] as List
        : const [];
    return values
        .whereType<Map>()
        .map((value) => IncidentReport.fromJson(Map<String, dynamic>.from(value)))
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
