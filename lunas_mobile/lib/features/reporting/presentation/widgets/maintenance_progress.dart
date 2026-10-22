import 'dart:async';
import 'package:flutter/material.dart';
import '../../data/models/maintenance_tracking.dart';

class MaintenanceProgress extends StatefulWidget {
  const MaintenanceProgress({
    required this.tracking,
    this.compact = false,
    super.key,
  });
  final MaintenanceTracking? tracking;
  final bool compact;
  @override
  State<MaintenanceProgress> createState() => _MaintenanceProgressState();
}

class _MaintenanceProgressState extends State<MaintenanceProgress> {
  Timer? _timer;
  final _clock = Stopwatch()..start();
  @override
  void initState() {
    super.initState();
    _timer = Timer.periodic(const Duration(seconds: 1), (_) {
      if (mounted && widget.tracking?.active == true && !widget.compact) {
        setState(() {});
      }
    });
  }

  @override
  void didUpdateWidget(covariant MaintenanceProgress oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.tracking != widget.tracking) _clock.reset();
  }

  @override
  void dispose() {
    _timer?.cancel();
    _clock.stop();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final tracking = widget.tracking;
    if (tracking == null) return const SizedBox.shrink();
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(
            'Physical repair progress: ${tracking.progressPercent}%',
            style: Theme.of(context).textTheme.labelLarge,
          ),
          const SizedBox(height: 8),
          LinearProgressIndicator(
            value: tracking.progressPercent / 100,
            minHeight: 8,
            semanticsLabel: 'Agency-reported physical repair progress',
            semanticsValue: '${tracking.progressPercent}%',
          ),
          const SizedBox(height: 6),
          const Text(
            'Recorded by the agency. Work completion remains subject to final verification.',
          ),
          if (!widget.compact) ...[
            if (tracking.cycles.isEmpty)
              const Text(
                'Work has not started; elapsed repair time is unavailable.',
              ),
            for (var i = 0; i < tracking.cycles.length; i++) ...[
              const SizedBox(height: 12),
              Text(
                'Work cycle ${i + 1}',
                style: Theme.of(context).textTheme.titleSmall,
              ),
              Text('Started: ${maintenanceDate(tracking.cycles[i].startedAt)}'),
              Text(
                'Agency completed: ${maintenanceDate(tracking.cycles[i].completedAt)}',
              ),
              Text(
                'Elapsed repair time: ${maintenanceDuration(tracking.cycles[i].elapsedMilliseconds == null ? null : tracking.cycles[i].elapsedMilliseconds! + (tracking.active && i == tracking.cycles.length - 1 ? _clock.elapsedMilliseconds : 0))}',
              ),
            ],
            if (tracking.acceptedAt != null)
              Text(
                'Secretary accepted: ${maintenanceDate(tracking.acceptedAt)}',
              ),
          ],
        ],
      ),
    );
  }
}

String maintenanceDuration(int? milliseconds) {
  if (milliseconds == null) return 'Unavailable';
  final duration = Duration(milliseconds: milliseconds);
  return '${duration.inDays}d ${duration.inHours % 24}h ${duration.inMinutes % 60}m ${duration.inSeconds % 60}s';
}

String maintenanceDate(DateTime? value) {
  if (value == null) return 'Not recorded';
  final date = value.toUtc().add(const Duration(hours: 8));
  String pad(int value) => value.toString().padLeft(2, '0');
  return '${date.year}-${pad(date.month)}-${pad(date.day)} ${pad(date.hour)}:${pad(date.minute)} PHT';
}
