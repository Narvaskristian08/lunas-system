class ReportingRestriction {
  const ReportingRestriction({
    this.status = 'clear',
    this.confirmedFindings = 0,
    this.threshold = 3,
    this.assignedBarangay,
    this.appealStatus = 'none',
    this.appealId,
  });

  final String status;
  final int confirmedFindings;
  final int threshold;
  final String? assignedBarangay;
  final String appealStatus;
  final String? appealId;

  bool get isBlocked => status == 'blocked';

  factory ReportingRestriction.fromJson(Map<String, dynamic>? json) {
    final source = json ?? const <String, dynamic>{};
    return ReportingRestriction(
      status: source['status']?.toString() == 'blocked' ? 'blocked' : 'clear',
      confirmedFindings:
          int.tryParse(source['confirmedFindings']?.toString() ?? '') ?? 0,
      threshold: int.tryParse(source['threshold']?.toString() ?? '') ?? 3,
      assignedBarangay: source['assignedBarangay']?.toString(),
      appealStatus: source['appealStatus']?.toString() ?? 'none',
      appealId: source['appealId']?.toString(),
    );
  }
}
