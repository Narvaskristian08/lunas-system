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
        ModalRoute.of(context)?.settings.arguments as String? ?? 'LNS-9920-X';
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
                    color: theme.colorScheme.errorContainer,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const ReportStatusChip(
                          label: 'Critical',
                          isCritical: true,
                        ),
                        const SizedBox(height: AppSpacing.md),
                        Text(
                          'Structural Fissure',
                          style: theme.textTheme.headlineLarge,
                        ),
                        Text(
                          reportId,
                          style: AppTextStyles.technicalHash.copyWith(
                            color: theme.colorScheme.onErrorContainer,
                          ),
                        ),
                        const SizedBox(height: AppSpacing.sm),
                        Text(
                          'Grid Sector 7G • Canary Wharf, E14',
                          style: theme.textTheme.bodyMedium,
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: AppSpacing.md),
                  const ReportMetadataGrid(
                    items: [
                      (
                        label: 'Confidence',
                        value: '98.2%',
                        icon: Icons.verified_outlined,
                      ),
                      (
                        label: 'Response ETA',
                        value: '00:14:52',
                        icon: Icons.timer_outlined,
                      ),
                      (
                        label: 'IPFS Node',
                        value: 'QmXoyp...',
                        icon: Icons.cloud_done_outlined,
                      ),
                      (
                        label: 'Protocol',
                        value: 'Polygon',
                        icon: Icons.hub_outlined,
                      ),
                    ],
                  ),
                  const SizedBox(height: AppSpacing.xxl),
                  const ReportSectionTitle('Description'),
                  const SizedBox(height: AppSpacing.md),
                  const LunasCard(
                    child: Text(
                      'Deep structural cracking is visible along the primary support surface. The area requires immediate engineering inspection.',
                    ),
                  ),
                  const SizedBox(height: AppSpacing.xxl),
                  const ReportSectionTitle(
                    'Audit Timeline',
                    trailing: ReportStatusChip(label: 'Polygon Live'),
                  ),
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
