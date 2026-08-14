class ValidationSummary {
  const ValidationSummary({
    required this.pending,
    required this.validated,
    required this.rejected,
    required this.duplicate,
  });

  final int pending;
  final int validated;
  final int rejected;
  final int duplicate;

  factory ValidationSummary.fromPayload(Map<String, dynamic> payload) {
    final data = _map(payload['data']);
    final source = data.isEmpty ? payload : data;
    final incidents = _map(source['incidents']);
    return ValidationSummary(
      pending: _int(source['pending'] ?? source['pendingValidation'] ?? incidents['pending']) ?? 0,
      validated: _int(source['validated'] ?? incidents['validated']) ?? 0,
      rejected: _int(source['rejected'] ?? incidents['rejected']) ?? 0,
      duplicate: _int(source['duplicate'] ?? source['duplicates'] ?? incidents['duplicate']) ?? 0,
    );
  }
}

Map<String, dynamic> _map(Object? value) => value is Map<String, dynamic>
    ? value
    : value is Map
    ? Map<String, dynamic>.from(value)
    : <String, dynamic>{};

int? _int(Object? value) => value is int
    ? value
    : value is num
    ? value.toInt()
    : int.tryParse(value?.toString() ?? '');
