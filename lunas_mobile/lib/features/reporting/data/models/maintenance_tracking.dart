class MaintenanceCycle {
  const MaintenanceCycle({
    required this.reference,
    this.startedAt,
    this.completedAt,
    this.elapsedMilliseconds,
  });
  final String reference;
  final DateTime? startedAt;
  final DateTime? completedAt;
  final int? elapsedMilliseconds;
  factory MaintenanceCycle.fromJson(Map<String, dynamic> json) =>
      MaintenanceCycle(
        reference: json['reference']?.toString() ?? '',
        startedAt: DateTime.tryParse(json['startedAt']?.toString() ?? ''),
        completedAt: DateTime.tryParse(json['completedAt']?.toString() ?? ''),
        elapsedMilliseconds: (json['elapsedMilliseconds'] as num?)?.toInt(),
      );
}

class MaintenanceTracking {
  const MaintenanceTracking({
    required this.progressPercent,
    required this.active,
    required this.cycles,
    this.acceptedAt,
  });
  final int progressPercent;
  final bool active;
  final List<MaintenanceCycle> cycles;
  final DateTime? acceptedAt;
  factory MaintenanceTracking.fromJson(Map<String, dynamic> json) =>
      MaintenanceTracking(
        progressPercent: ((json['progressPercent'] as num?)?.toInt() ?? 0)
            .clamp(0, 100),
        active: json['active'] == true,
        acceptedAt: DateTime.tryParse(json['acceptedAt']?.toString() ?? ''),
        cycles: (json['cycles'] as List? ?? [])
            .whereType<Map>()
            .map(
              (value) =>
                  MaintenanceCycle.fromJson(Map<String, dynamic>.from(value)),
            )
            .toList(),
      );
}
