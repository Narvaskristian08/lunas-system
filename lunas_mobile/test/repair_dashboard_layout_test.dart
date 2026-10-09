import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:lunas_mobile/core/theme/app_theme.dart';
import 'package:lunas_mobile/features/repair/data/models/repair_models.dart';
import 'package:lunas_mobile/features/repair/presentation/widgets/repair_widgets.dart';

void main() {
  testWidgets('assigned task cards stay bounded in a scrolling dashboard', (
    tester,
  ) async {
    await tester.binding.setSurfaceSize(const Size(375, 812));
    addTearDown(() => tester.binding.setSurfaceSize(null));
    final task = RepairWorkOrder.fromJson({
      '_id': 'task-1',
      'orderNumber': 'WO-202610-123456',
      'status': 'pending',
      'priority': 'high',
      'category': 'Road Damage',
      'location': {
        'address': 'A long street address in Dagupan City, Pangasinan',
      },
    });
    await tester.pumpWidget(
      MaterialApp(
        theme: AppTheme.light,
        home: Scaffold(
          body: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: Column(
              children: [
                LiveRepairWorkOrderCard(workOrder: task, onTap: () {}),
                LiveRepairWorkOrderCard(workOrder: task, onTap: () {}),
              ],
            ),
          ),
        ),
      ),
    );
    await tester.pumpAndSettle();
    expect(tester.takeException(), isNull);
    final cards = tester.getSize(find.byType(LiveRepairWorkOrderCard).first);
    expect(cards.width, 327);
    expect(cards.height, greaterThan(0));
    expect(cards.height, lessThan(500));
  });
}
