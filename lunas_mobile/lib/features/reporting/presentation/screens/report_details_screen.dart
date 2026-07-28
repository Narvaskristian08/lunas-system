import 'package:flutter/material.dart';
import 'package:lunas_mobile/core/theme/app_spacing.dart';
import 'package:lunas_mobile/core/theme/text_styles.dart';
import 'package:lunas_mobile/core/widgets/lunas_app_bar.dart';
import 'package:lunas_mobile/core/widgets/lunas_card.dart';
import 'package:lunas_mobile/features/reporting/presentation/widgets/reporting_widgets.dart';

class ReportDetailsScreen extends StatelessWidget {
  const ReportDetailsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final reportId =
        ModalRoute.of(context)?.settings.arguments as String? ?? 'RPT-2026-0142';
    return Scaffold(
      appBar: const LunasAppBar(
        title: 'Report Details',
        subtitle: 'Verified incident record',
        showBackButton: true,
      ),
      body: SafeArea(
        top: false,
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(
            AppSpacing.xl,
            AppSpacing.md,
            AppSpacing.xl,
            AppSpacing.hero,
          ),
          child: Align(
            alignment: Alignment.topCenter,
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 760),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  LunasCard(
                    color: theme.colorScheme.primaryContainer,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const ReportStatusChip(
                          label: 'Under review',
                          icon: Icons.rate_review_outlined,
                        ),
                        const SizedBox(height: AppSpacing.md),
                        Text(
                          'Road surface damage',
                          style: theme.textTheme.headlineLarge,
                        ),
                        Text(
                          reportId,
                          style: AppTextStyles.technicalHash.copyWith(
                            color: theme.colorScheme.onPrimaryContainer,
                          ),
                        ),
                        const SizedBox(height: AppSpacing.sm),
                        Text(
                          'Mabini Street, Barangay 8, Dagupan City',
                          style: theme.textTheme.bodyMedium,
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: AppSpacing.md),
                  const ReportMetadataGrid(
                    items: [
                      (
                        label: 'AI triage',
                        value: 'High priority',
                        icon: Icons.auto_awesome_outlined,
                      ),
                      (
                        label: 'Submitted',
                        value: 'Today, 9:42 AM',
                        icon: Icons.timer_outlined,
                      ),
                      (
                        label: 'Assignment',
                        value: 'Awaiting review',
                        icon: Icons.groups_outlined,
                      ),
                      (
                        label: 'Target response',
                        value: 'Within 8 hours',
                        icon: Icons.schedule_outlined,
                      ),
                    ],
                  ),
                  const SizedBox(height: AppSpacing.xxl),
                  const ReportSectionTitle('Description'),
                  const SizedBox(height: AppSpacing.md),
                  const LunasCard(
                    child: Text(
                      'A deep pothole is affecting the right lane near the intersection. The road surface is uneven and may be unsafe for motorcycles and pedestrians.',
                    ),
                  ),
                  const SizedBox(height: AppSpacing.xxl),
                  const ReportSectionTitle('Report Timeline'),
                  const SizedBox(height: AppSpacing.md),
                  const AuditTimeline(),
                  const SizedBox(height: AppSpacing.xxl),
                  OutlinedButton.icon(
                    onPressed: () =>
                        Navigator.pushNamed(context, '/reports/edit'),
                    icon: const Icon(Icons.edit_outlined),
                    label: const Text('Edit Report'),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
