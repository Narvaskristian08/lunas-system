import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:lunas_mobile/core/theme/app_theme.dart';
import 'package:lunas_mobile/features/citizen/presentation/screens/citizen_dashboard_screen.dart';
import 'package:lunas_mobile/features/reporting/data/models/incident_report.dart';

void main() {
  testWidgets(
    'agency stages wrap in a narrow report card and preserve navigation',
    (tester) async {
      await tester.binding.setSurfaceSize(const Size(320, 900));
      addTearDown(() => tester.binding.setSurfaceSize(null));
      for (final stage in [
        'pending_procurement',
        'work_in_progress',
        'work_completed',
        'correction_required',
      ]) {
        final report = IncidentReport.fromJson({
          'id': 'report-1',
          'category': 'road',
          'status': 'provider_assigned',
          'reportNumber': 'LUNAS-202610-000003',
          'agencyStatus': stage,
        });
        var opened = false;
        await tester.pumpWidget(
          MaterialApp(
            theme: AppTheme.light,
            home: Scaffold(
              body: SingleChildScrollView(
                child: ReportListCard(
                  report: report,
                  onTap: () => opened = true,
                ),
              ),
            ),
          ),
        );
        expect(find.text(report.agencyStatusLabel!), findsOneWidget);
        expect(find.text('Agency status'), findsOneWidget);
        expect(find.byType(Slider), findsNothing);
        expect(tester.takeException(), isNull);
        await tester.tap(find.text(report.reportNumber));
        expect(opened, isTrue);
      }
      await tester.pumpWidget(const SizedBox());
    },
  );
}
