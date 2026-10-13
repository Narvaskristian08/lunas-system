import 'package:flutter/material.dart';
import 'package:lunas_mobile/core/theme/app_colors.dart';

enum NotificationKind { update, activity, alert }

class NotificationData {
  const NotificationData({
    required this.id,
    required this.title,
    required this.message,
    required this.time,
    required this.icon,
    required this.color,
    required this.kind,
    this.type = 'status_update',
    this.incidentId,
    this.workOrderId,
    this.reportNumber,
    this.location,
    this.isRead = false,
    this.createdAt,
  });

  final String id;
  final String type;
  final String title;
  final String message;
  final String time;
  final IconData icon;
  final Color color;
  final NotificationKind kind;

  /// The MongoDB Incident `_id`. This is the only value used for navigation.
  final String? incidentId;

  /// The backend work-order `_id`. Repair navigation is derived from this
  /// resource identifier; server-provided link strings are never followed.
  final String? workOrderId;

  /// Human-readable report number; display-only.
  final String? reportNumber;
  final String? location;
  final bool isRead;
  final DateTime? createdAt;

  factory NotificationData.fromJson(Map<String, dynamic> json) {
    final data = _map(json['data']);
    final type = (json['type'] ?? 'status_update').toString();
    final createdAt = DateTime.tryParse(
      (json['createdAt'] ?? json['sentAt'] ?? '').toString(),
    )?.toLocal();
    return NotificationData(
      id: (json['_id'] ?? json['id'] ?? '').toString(),
      type: type,
      title: (json['title'] ?? 'LUNAS Update').toString(),
      message: (json['message'] ?? '').toString(),
      time: _relativeTime(createdAt),
      icon: _iconFor(type),
      color: _colorFor(type),
      kind: _kindFor(type),
      incidentId: _text(data['incidentId']),
      workOrderId: _text(data['workOrderId']),
      reportNumber: _text(data['reportNumber']),
      location: _text(data['location'] ?? data['address']),
      isRead: json['isRead'] == true,
      createdAt: createdAt,
    );
  }
}

NotificationKind _kindFor(String type) {
  if ({
    'sla_approaching',
    'sla_overdue',
    'sla_reminder',
    'sla_escalation',
    'incident_rejected',
    'repair_rejected',
    'duplicate_detected',
    'work_order_declined',
  }.contains(type)) {
    return NotificationKind.alert;
  }
  if ({
    'incident_validated',
    'work_order_assigned',
    'work_order_reassigned',
    'work_order_accepted',
    'system_announcement',
    'status_update',
  }.contains(type)) {
    return NotificationKind.activity;
  }
  return NotificationKind.update;
}

IconData _iconFor(String type) => switch (type) {
  'incident_submitted' => Icons.assignment_outlined,
  'incident_validated' => Icons.verified_outlined,
  'incident_rejected' || 'duplicate_detected' => Icons.warning_amber_rounded,
  'incident_routed' => Icons.route_outlined,
  'work_order_assigned' ||
  'work_order_reassigned' => Icons.engineering_outlined,
  'work_order_accepted' => Icons.assignment_turned_in_outlined,
  'work_order_declined' || 'repair_rejected' => Icons.replay_outlined,
  'work_order_in_progress' ||
  'work_order_progress' => Icons.construction_outlined,
  'work_order_completed' ||
  'repair_verified' => Icons.check_circle_outline_rounded,
  'sla_approaching' || 'sla_reminder' => Icons.schedule_outlined,
  'sla_overdue' || 'sla_escalation' => Icons.priority_high_rounded,
  _ => Icons.notifications_outlined,
};

Color _colorFor(String type) => switch (_kindFor(type)) {
  NotificationKind.alert => AppColorsLight.critical,
  NotificationKind.activity => AppColorsLight.info,
  NotificationKind.update => AppColorsLight.alert,
};

String _relativeTime(DateTime? createdAt) {
  if (createdAt == null) return 'Just now';
  final difference = DateTime.now().difference(createdAt);
  if (difference.inMinutes < 1) return 'Just now';
  if (difference.inHours < 1) return '${difference.inMinutes} min';
  if (difference.inDays < 1) return '${difference.inHours} hr';
  if (difference.inDays < 7) return '${difference.inDays}d';
  return '${createdAt.month}/${createdAt.day}/${createdAt.year}';
}

Map<String, dynamic> _map(Object? value) => value is Map<String, dynamic>
    ? value
    : value is Map
    ? Map<String, dynamic>.from(value)
    : <String, dynamic>{};

String? _text(Object? value) {
  final text = value?.toString().trim();
  return text == null || text.isEmpty ? null : text;
}
