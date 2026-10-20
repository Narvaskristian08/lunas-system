class AgencySchedule {
  const AgencySchedule({
    required this.state,
    this.deadline,
    this.startedAt,
    this.durationMilliseconds,
    this.remainingMilliseconds,
  });
  final String state;
  final DateTime? deadline;
  final DateTime? startedAt;
  final double? durationMilliseconds;
  final double? remainingMilliseconds;

  factory AgencySchedule.fromJson(Map<String, dynamic> json) => AgencySchedule(
    state: json['state']?.toString() ?? 'awaiting_schedule',
    deadline: DateTime.tryParse(json['deadline']?.toString() ?? ''),
    startedAt: DateTime.tryParse(json['startedAt']?.toString() ?? ''),
    durationMilliseconds: _number(json['durationMilliseconds']),
    remainingMilliseconds: _number(json['remainingMilliseconds']),
  );
  static double? _number(dynamic value) =>
      value is num && value.isFinite ? value.toDouble() : null;
  bool get stopped =>
      ['resolved', 'awaiting_verification', 'inactive'].contains(state);
  double? remainingAfter(Duration elapsed) => remainingMilliseconds == null
      ? null
      : remainingMilliseconds! - (stopped ? 0 : elapsed.inMilliseconds);
  double? fractionAfter(Duration elapsed) {
    final remaining = remainingAfter(elapsed);
    if (remaining == null ||
        durationMilliseconds == null ||
        durationMilliseconds! <= 0) {
      return null;
    }
    return (remaining / durationMilliseconds!).clamp(0.0, 1.0);
  }
}

String agencyRemainingLabel(double milliseconds) {
  if (milliseconds.abs() < 60000) {
    return 'Less than a minute ${milliseconds > 0 ? "remaining" : "past deadline"}';
  }
  final minutes = (milliseconds.abs() / 60000).ceil().clamp(1, 2147483647);
  final days = minutes ~/ 1440;
  final hours = (minutes % 1440) ~/ 60;
  final mins = minutes % 60;
  final parts = [
    if (days > 0) '${days}d',
    if (hours > 0) '${hours}h',
    if (mins > 0) '${mins}m',
  ];
  return '${parts.join(' ')} ${milliseconds > 0 ? 'remaining' : 'past deadline'}';
}
