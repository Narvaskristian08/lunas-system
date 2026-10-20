import 'dart:async';
import 'package:flutter/material.dart';
import 'package:lunas_mobile/core/widgets/lunas_card.dart';
import 'package:lunas_mobile/features/reporting/data/models/agency_schedule.dart';

class AgencyScheduleCard extends StatefulWidget {
  const AgencyScheduleCard({this.schedule, this.compact = false, super.key});
  final bool compact;
  final AgencySchedule? schedule;
  @override
  State<AgencyScheduleCard> createState() => _AgencyScheduleCardState();
}

class _AgencyScheduleCardState extends State<AgencyScheduleCard> {
  final _clock = Stopwatch()..start();
  Timer? _timer;
  @override
  void initState() {
    super.initState();
    _timer = Timer.periodic(const Duration(seconds: 1), (_) {
      if (mounted &&
          widget.schedule?.remainingMilliseconds != null &&
          widget.schedule?.stopped != true) {
        setState(() {});
      }
    });
  }

  @override
  void didUpdateWidget(covariant AgencyScheduleCard oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (!identical(oldWidget.schedule, widget.schedule)) _clock.reset();
  }

  @override
  void dispose() {
    _timer?.cancel();
    _clock.stop();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final schedule = widget.schedule;
    final colors = Theme.of(context).colorScheme;
    final remaining = schedule?.remainingAfter(_clock.elapsed);
    final fraction = schedule?.fractionAfter(_clock.elapsed);
    final stopped = schedule?.stopped ?? false;
    final overdue = !stopped && remaining != null && remaining <= 0;
    final title = switch (schedule?.state) {
      'resolved' => 'Resolved',
      'awaiting_verification' => 'Awaiting final verification',
      'inactive' => 'Schedule no longer active',
      _ =>
        remaining == null
            ? 'Awaiting agency schedule'
            : overdue
            ? 'Deadline passed'
            : agencyRemainingLabel(remaining),
    };
    final color = overdue ? colors.error : colors.primary;
    final deadline = schedule?.deadline;
    final target = deadline == null ? null : _philippineTime(deadline);
    final description = switch (schedule?.state) {
      'resolved' => 'Final verification accepted. Countdown stopped.',
      'awaiting_verification' =>
        'Agency work is complete. Final verification is pending.',
      'inactive' => 'This report is no longer awaiting agency work.',
      _ =>
        fraction == null && deadline != null
            ? 'A valid work-start period is unavailable, so the percentage cannot be shown.'
            : 'The bar decreases from the recorded start to the agency target. This is a target, not a guaranteed completion date.',
    };
    final content = Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Row(
          children: [
            Icon(Icons.schedule_rounded, size: 20, color: colors.primary),
            const SizedBox(width: 8),
            Expanded(
              child: Text(
                'Agency schedule',
                style: Theme.of(context).textTheme.titleSmall,
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Text(
          title,
          style: Theme.of(context).textTheme.titleMedium?.copyWith(
            color: color,
            fontWeight: FontWeight.w700,
          ),
        ),
        SizedBox(height: widget.compact ? 10 : 16),
        Semantics(
          label: 'Agency time remaining',
          value: fraction == null
              ? title
              : '${(fraction * 100).round()} percent. $title',
          child: LayoutBuilder(
            builder: (context, constraints) => Stack(
              clipBehavior: Clip.none,
              children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(12),
                  child: LinearProgressIndicator(
                    value: fraction ?? 0,
                    minHeight: 10,
                    color: color,
                    backgroundColor: colors.surfaceContainerHighest,
                  ),
                ),
                if (fraction != null)
                  Positioned(
                    left: (fraction * constraints.maxWidth - 8).clamp(
                      0.0,
                      (constraints.maxWidth - 16).clamp(0.0, double.infinity),
                    ),
                    top: -3,
                    child: Container(
                      width: 16,
                      height: 16,
                      decoration: BoxDecoration(
                        color: color,
                        shape: BoxShape.circle,
                        border: Border.all(color: colors.surface, width: 2),
                      ),
                    ),
                  ),
              ],
            ),
          ),
        ),
        SizedBox(height: widget.compact ? 10 : 16),
        Text(
          target == null
              ? 'The agency has not recorded a target date.'
              : 'Agency target: $target (Philippine time)',
          style: Theme.of(context).textTheme.bodySmall,
        ),
        if (overdue && !widget.compact)
          Padding(
            padding: const EdgeInsets.only(top: 8),
            child: Text(
              agencyRemainingLabel(remaining),
              style: TextStyle(color: colors.error),
            ),
          ),
        if (!widget.compact) const SizedBox(height: 8),
        if (!widget.compact)
          Text(
            description,
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
              color: colors.onSurfaceVariant,
              height: 1.5,
            ),
          ),
      ],
    );
    return widget.compact ? content : LunasCard(child: content);
  }
}

String _philippineTime(DateTime value) {
  final date = value.toUtc().add(const Duration(hours: 8));
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
  final hour = date.hour % 12 == 0 ? 12 : date.hour % 12;
  return '${months[date.month - 1]} ${date.day}, ${date.year} · $hour:${date.minute.toString().padLeft(2, '0')} ${date.hour < 12 ? 'AM' : 'PM'}';
}
