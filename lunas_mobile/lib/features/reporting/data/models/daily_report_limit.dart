class DailyReportLimit {
  const DailyReportLimit({
    required this.limit,
    required this.submitted,
    required this.remaining,
    required this.dayKey,
    required this.resetsAt,
  });

  final int limit;
  final int submitted;
  final int remaining;
  final String dayKey;
  final DateTime? resetsAt;

  bool get isExhausted => remaining <= 0;

  String get remainingLabel => '$remaining of $limit reports remaining today';

  String get resetLabel =>
      'Reporting becomes available again at 12:00 AM Philippine time.';

  factory DailyReportLimit.fromJson(Map<String, dynamic>? json) {
    final source = json ?? const <String, dynamic>{};
    return DailyReportLimit(
      limit: _number(source['limit'], fallback: 3),
      submitted: _number(source['submitted']),
      remaining: _number(source['remaining'], fallback: 3),
      dayKey: source['dayKey']?.toString() ?? '',
      resetsAt: DateTime.tryParse(source['resetsAt']?.toString() ?? ''),
    );
  }

  static int _number(Object? value, {int fallback = 0}) {
    return int.tryParse(value?.toString() ?? '') ?? fallback;
  }
}
