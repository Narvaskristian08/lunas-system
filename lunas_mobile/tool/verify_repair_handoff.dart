import 'dart:io';

import 'package:lunas_mobile/features/repair/data/models/repair_models.dart';

void main() {
  var checks = 0;
  void check(bool value) {
    if (!value) throw StateError('Repair check ${checks + 1} failed');
    checks++;
  }

  RepairWorkOrder task(String status, String assignment) =>
      RepairWorkOrder.fromJson({
        '_id': 'work',
        'status': status,
        'assignmentState': assignment,
        'progressPercent': 50,
        'version': 7,
        'currentAssignment': {'_id': 'assignment', 'status': assignment},
        'progressUpdates': [
          {'actor': 'original-worker', 'progressPercent': 50},
        ],
      });
  for (final status in ['pending', 'in_progress', 'rework_required']) {
    final pending = task(status, 'pending');
    check(pending.isPendingAcceptance);
    check(!pending.canStart);
    check(!pending.canUpdateProgress);
    check(pending.progressPercent == 50);
    check(pending.version == 7);
  }
  final accepted = task('accepted', 'accepted');
  check(accepted.canStart);
  check(!accepted.canUpdateProgress);
  final handoff = task('in_progress', 'accepted');
  check(!handoff.isPendingAcceptance);
  check(handoff.canUpdateProgress);
  check(!handoff.canStart);
  check(handoff.progressPercent == 50);
  final closed = task('closed', 'accepted');
  check(!closed.canStart);
  check(!closed.canUpdateProgress);
  stdout.writeln('$checks SDK-only repair handoff checks passed');
}
