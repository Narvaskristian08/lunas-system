import 'package:flutter/material.dart';
import 'package:lunas_mobile/core/theme/app_spacing.dart';
import 'package:lunas_mobile/core/widgets/lunas_app_bar.dart';
import 'package:lunas_mobile/core/widgets/lunas_button.dart';
import 'package:lunas_mobile/core/widgets/lunas_card.dart';
import 'package:lunas_mobile/core/widgets/lunas_state_view.dart';
import 'package:lunas_mobile/features/reporting/presentation/widgets/reporting_widgets.dart';

class ReportStatusScreen extends StatelessWidget {
  const ReportStatusScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: const LunasAppBar(title: 'Report Status'),
      body: SafeArea(
        top: false,
        child: LayoutBuilder(
          builder: (context, constraints) {
            final horizontal = constraints.maxWidth < 360
                ? AppSpacing.md
                : AppSpacing.xl;
            return SingleChildScrollView(
              padding: EdgeInsets.fromLTRB(
                horizontal,
                AppSpacing.md,
                horizontal,
                AppSpacing.xl,
              ),
              child: Align(
                alignment: Alignment.topCenter,
                child: ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 560),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      const LunasStateView(
                        state: LunasViewState.success,
                        title: 'Report Submitted!',
                        message:
                            'Thank you for helping improve your community. You can track every update from My Reports.',
                        compact: true,
                      ),
                      const LunasCard(
                        child: Column(
                          children: [
                            ReportStatusChip(label: 'Submitted'),
                            SizedBox(height: AppSpacing.md),
                            Text('RPT-2026-0142'),
                            SizedBox(height: AppSpacing.lg),
                            AuditTimeline(),
                          ],
                        ),
                      ),
                      const SizedBox(height: AppSpacing.xl),
                      LunasButton(
                        label: 'View Report Details',
                        onPressed: () =>
                            Navigator.pushNamed(context, '/reports/details'),
                      ),
                      const SizedBox(height: AppSpacing.sm),
                      TextButton(
                        onPressed: () => Navigator.pushNamedAndRemoveUntil(
                          context,
                          '/home',
                          (_) => false,
                        ),
                        child: const Text('Return Home'),
                      ),
                    ],
                  ),
                ),
              ),
            );
          },
        ),
      ),
    );
  }
}
