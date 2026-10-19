class TanodInspection {
  const TanodInspection({
    required this.id,
    required this.type,
    required this.status,
    this.incidentId,
    this.reportNumber,
    this.category,
    this.description,
    this.barangay,
    this.address,
    this.latitude,
    this.longitude,
    this.findings,
    this.result,
    this.incidentImageUrls = const [],
  });

  final String id;
  final String type;
  final String status;
  final String? incidentId;
  final String? reportNumber;
  final String? category;
  final String? description;
  final String? barangay;
  final String? address;
  final double? latitude;
  final double? longitude;
  final String? findings;
  final String? result;
  final List<String> incidentImageUrls;

  factory TanodInspection.fromJson(Object? value) {
    final json = value is Map
        ? Map<String, dynamic>.from(value)
        : <String, dynamic>{};
    final incident = json['incident'] is Map
        ? Map<String, dynamic>.from(json['incident'] as Map)
        : <String, dynamic>{};
    final location = incident['location'] is Map
        ? Map<String, dynamic>.from(incident['location'] as Map)
        : <String, dynamic>{};
    final address = location['address'] is Map
        ? Map<String, dynamic>.from(location['address'] as Map)
        : <String, dynamic>{};
    final incidentImageUrls = (incident['images'] is List ? incident['images'] as List : const [])
        .whereType<Map>()
        .map((image) => image['url']?.toString() ?? '')
        .where((url) => url.startsWith('http'))
        .toList(growable: false);
    return TanodInspection(
      id: '${json['id'] ?? json['_id'] ?? ''}',
      type: '${json['type'] ?? 'initial'}',
      status: '${json['status'] ?? 'assigned'}',
      incidentId:
          '${json['incident'] is Map ? (json['incident'] as Map)['id'] ?? (json['incident'] as Map)['_id'] ?? '' : json['incident'] ?? ''}',
      reportNumber: incident['reportNumber']?.toString(),
      category: incident['category']?.toString(),
      description: incident['description']?.toString(),
      barangay: address['barangay']?.toString(),
      address: [address['street'], address['barangay'], address['city']]
          .whereType<String>()
          .where((value) => value.trim().isNotEmpty)
          .join(', '),
      longitude:
          location['coordinates'] is List &&
              (location['coordinates'] as List).isNotEmpty
          ? double.tryParse('${(location['coordinates'] as List).first}')
          : null,
      latitude:
          location['coordinates'] is List &&
              (location['coordinates'] as List).length > 1
          ? double.tryParse('${(location['coordinates'] as List)[1]}')
          : null,
      findings: json['findings']?.toString(),
      result: json['result']?.toString(),
      incidentImageUrls: incidentImageUrls,
    );
  }
}
