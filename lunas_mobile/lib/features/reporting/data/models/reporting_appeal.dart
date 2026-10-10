class ReportingAppeal {
  const ReportingAppeal({
    required this.id,
    required this.assignedBarangay,
    required this.explanation,
    required this.evidenceReference,
    required this.status,
    required this.version,
  });

  final String id;
  final String assignedBarangay;
  final String explanation;
  final String evidenceReference;
  final String status;
  final int version;

  factory ReportingAppeal.fromJson(Map<String, dynamic> json) {
    return ReportingAppeal(
      id: (json['id'] ?? json['_id'] ?? '').toString(),
      assignedBarangay: (json['assignedBarangay'] ?? '').toString(),
      explanation: (json['explanation'] ?? '').toString(),
      evidenceReference: (json['evidenceReference'] ?? '').toString(),
      status: (json['status'] ?? 'pending').toString(),
      version: int.tryParse(json['version']?.toString() ?? '') ?? 0,
    );
  }
}
