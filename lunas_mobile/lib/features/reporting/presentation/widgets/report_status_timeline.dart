import 'package:lunas_mobile/core/widgets/timeline_marker.dart';
import 'package:flutter/material.dart';
import 'package:lunas_mobile/core/theme/app_spacing.dart';
import 'package:lunas_mobile/features/reporting/data/models/incident_report.dart';

String humanStatus(String status) => status
    .trim()
    .toLowerCase()
    .replaceAll(RegExp(r'[_-]+'), ' ')
    .split(' ')
    .where((part) => part.isNotEmpty)
    .map(
      (part) => ['ai', 'gps', 'sla', 'id'].contains(part)
          ? part.toUpperCase()
          : ['in', 'for', 'by', 'to', 'of', 'and'].contains(part)
          ? part
          : '${part[0].toUpperCase()}${part.substring(1)}',
    )
    .join(' ');

IconData categoryIcon(String category) => switch (category) {
  'road' => Icons.add_road_rounded,
  'drainage' => Icons.water_damage_outlined,
  'electrical' => Icons.electric_bolt_outlined,
  'water' => Icons.water_drop_outlined,
  'gas' => Icons.local_fire_department_outlined,
  'streetlight' => Icons.lightbulb_outline_rounded,
  _ => Icons.report_problem_outlined,
};

class ReportStatusTimeline extends StatelessWidget {
  const ReportStatusTimeline({
    required this.events,
    this.highlightLatest = false,
    this.compact = false,
    super.key,
  });
  final List<ReportStatusEvent> events;
  final bool highlightLatest;
  final bool compact;

  @override
  Widget build(BuildContext context) {
    final visible = visibleReportHistory(events);
    if (visible.isEmpty) {
      return const Text(
        'No status history has been returned for this report yet.',
      );
    }
    return Column(
      children: [
        for (var index = 0; index < visible.length; index++)
          _TimelineEvent(
            event: visible[visible.length - 1 - index],
            showLine: index != visible.length - 1,
            isLatest: index == 0,
            showLatestLabel: highlightLatest && index == 0,
            compact: compact,
          ),
      ],
    );
  }
}

class _TimelineEvent extends StatelessWidget {
  const _TimelineEvent({
    required this.event,
    required this.showLine,
    this.isLatest = false,
    this.showLatestLabel = false,
    this.compact = false,
  });
  final ReportStatusEvent event;
  final bool showLine;
  final bool isLatest;
  final bool showLatestLabel;
  final bool compact;

  @override
  Widget build(BuildContext context) {
    final color = Theme.of(context).colorScheme.primary;
    return IntrinsicHeight(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          TimelineMarker(latest: isLatest, showLine: showLine),
          const SizedBox(width: AppSpacing.sm),
          Expanded(
            child: Padding(
              padding: EdgeInsets.only(
                bottom: showLine
                    ? (compact ? AppSpacing.md : AppSpacing.xxl)
                    : 0,
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (showLatestLabel) ...[
                    Text(
                      'Latest Update',
                      style: Theme.of(
                        context,
                      ).textTheme.labelSmall?.copyWith(color: color),
                    ),
                    const SizedBox(height: AppSpacing.xxs),
                  ],
                  Text(
                    event.citizenLabel,
                    style: Theme.of(
                      context,
                    ).textTheme.titleSmall?.copyWith(fontSize: 15, height: 1.5),
                  ),
                  const SizedBox(height: AppSpacing.xxs),
                  Text(
                    formatReportDateTime(event.changedAt),
                    style: Theme.of(context).textTheme.bodySmall,
                  ),
                  if (event.notes != null &&
                      event.notes!.trim().isNotEmpty) ...[
                    const SizedBox(height: AppSpacing.xxs),
                    Text(
                      timelineNoteLabel(event.notes!),
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                  ],
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

String formatReportDateTime(DateTime? value) {
  if (value == null) return 'Time not available';
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  final hour = value.hour == 0 || value.hour == 12 ? 12 : value.hour % 12;
  final minute = value.minute.toString().padLeft(2, '0');
  final period = value.hour >= 12 ? 'PM' : 'AM';
  return '${months[value.month - 1]} ${value.day}, ${value.year} · $hour:$minute $period';
}

String timelineNoteLabel(String value) {
  const automaticNotes = <String, String>{
    'incident reported': 'Incident Reported',
    'barangay validation completed; forwarded to city engineering':
        'Barangay Validation Completed; Forwarded to City Engineering',
    'city engineering confirmed the incident':
        'City Engineering Confirmed the Incident',
    'jurisdiction confirmed': 'Jurisdiction Confirmed',
    'work order created from validated incident':
        'Work Order Created from Validated Incident',
    'repair personnel assigned': 'Repair Personnel Assigned',
    'repair assignment reassigned': 'Repair Assignment Reassigned',
    'repair assignment declined; awaiting reassignment':
        'Repair Assignment Declined; Awaiting Reassignment',
    'corrective repair work started': 'Corrective Repair Work Started',
    'repair work started': 'Repair Work Started',
    'utility provider accepted the repair and forwarded it for city engineering verification':
        'Utility Provider Accepted the Repair and Forwarded It for City Engineering Verification',
    'city engineering verified the repair and closed the incident':
        'City Engineering Verified the Repair and Closed the Incident',
  };
  return automaticNotes[value.trim().toLowerCase()] ?? value;
}
