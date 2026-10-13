import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:lunas_mobile/core/widgets/lunas_filter_button.dart';
import 'package:lunas_mobile/features/reporting/presentation/widgets/reporting_widgets.dart';
import 'package:lunas_mobile/features/repair/presentation/screens/assigned_work_orders_screen.dart';

void main() {
  testWidgets('citizen filters fit a narrow screen with enlarged text', (
    tester,
  ) async {
    await tester.binding.setSurfaceSize(const Size(320, 640));
    addTearDown(() => tester.binding.setSurfaceSize(null));
    await tester.pumpWidget(
      MaterialApp(
        home: MediaQuery(
          data: const MediaQueryData(textScaler: TextScaler.linear(2)),
          child: Scaffold(
            body: Padding(
              padding: const EdgeInsets.all(20),
              child: Row(
                children: [
                  for (final label in [
                    'All',
                    'Active',
                    'In Progress',
                    'Resolved',
                  ])
                    Expanded(
                      child: LunasFilterButton(
                        label: label,
                        selected: false,
                        onTap: () {},
                      ),
                    ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
    expect(tester.takeException(), isNull);
    expect(find.text('In Progress'), findsOneWidget);
  });

  testWidgets('repair filters remain readable at 200 percent text', (
    tester,
  ) async {
    await tester.binding.setSurfaceSize(const Size(320, 640));
    addTearDown(() => tester.binding.setSurfaceSize(null));
    await tester.pumpWidget(
      MaterialApp(
        home: MediaQuery(
          data: const MediaQueryData(textScaler: TextScaler.linear(2)),
          child: Scaffold(
            body: RepairStatusFilters(selected: null, onSelected: (_) {}),
          ),
        ),
      ),
    );

    expect(tester.takeException(), isNull);
    final assignedButton = find.widgetWithText(OutlinedButton, 'Assigned');
    expect(assignedButton, findsOneWidget);
    expect(tester.getSize(assignedButton).height, greaterThanOrEqualTo(48));
    expect(tester.getSize(assignedButton).width, greaterThan(72));
    expect(find.byType(SingleChildScrollView), findsOneWidget);
  });

  testWidgets('long status pills stay inside a narrow right-aligned row', (
    tester,
  ) async {
    await tester.binding.setSurfaceSize(const Size(320, 640));
    addTearDown(() => tester.binding.setSurfaceSize(null));
    await tester.pumpWidget(
      MaterialApp(
        home: MediaQuery(
          data: const MediaQueryData(textScaler: TextScaler.linear(2)),
          child: const Scaffold(
            body: Padding(
              padding: EdgeInsets.all(20),
              child: ReportStatusHeader(
                title: 'Road Damage',
                status: 'Barangay Validated',
              ),
            ),
          ),
        ),
      ),
    );

    expect(tester.takeException(), isNull);
    expect(find.text('BARANGAY VALIDATED'), findsOneWidget);
    expect(
      tester.getRect(find.byType(ReportStatusChip)).right,
      lessThanOrEqualTo(300),
    );
  });
}
