import 'package:flutter/material.dart';
import 'package:lunas_mobile/core/theme/app_colors.dart';
import 'package:lunas_mobile/core/theme/app_spacing.dart';
import 'package:lunas_mobile/core/widgets/lunas_app_bar.dart';
import 'package:lunas_mobile/core/widgets/lunas_button.dart';
import 'package:lunas_mobile/core/widgets/lunas_card.dart';
import 'package:lunas_mobile/features/citizen/presentation/screens/citizen_flow_widgets.dart';

/// Final citizen review before the report is sent for official validation.
class ConfirmReportDetailsScreen extends StatelessWidget {
  const ConfirmReportDetailsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final scheme = theme.colorScheme;
    return Scaffold(
      appBar: const LunasAppBar(
        title: 'Confirm Details',
        subtitle: 'Review before submitting your report',
        showBackButton: true,
      ),
      body: CitizenFlowScroll(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Stack(
              children: [
                const CitizenPhotoPlaceholder(
                  label: 'High-severity road hazard',
                  aspectRatio: 1.42,
                ),
                Positioned(
                  left: AppSpacing.md,
                  bottom: AppSpacing.md,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const CitizenStatusPill(
                        label: 'High severity',
                        color: AppColorsLight.critical,
                        icon: Icons.warning_amber_rounded,
                      ),
                      const SizedBox(height: AppSpacing.sm),
                      Text(
                        'Road hazard',
                        style: theme.textTheme.headlineLarge?.copyWith(
                          color: Colors.white,
                          fontWeight: FontWeight.w800,
                          shadows: const [
                            Shadow(color: Color(0x99000000), blurRadius: 6),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: AppSpacing.lg),
            LunasCard(
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Icon(Icons.description_outlined, color: scheme.primary),
                  const SizedBox(width: AppSpacing.md),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Description', style: theme.textTheme.titleLarge),
                        const SizedBox(height: AppSpacing.sm),
                        Text(
                          'Deep pothole near the A.B. Fernandez Avenue intersection. It is difficult to see at night and may damage vehicles.',
                          style: theme.textTheme.bodyLarge,
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: AppSpacing.sm),
            LunasCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Icon(Icons.location_on_outlined, color: scheme.primary),
                      const SizedBox(width: AppSpacing.md),
                      Text('Location', style: theme.textTheme.titleLarge),
                    ],
                  ),
                  const SizedBox(height: AppSpacing.md),
                  Text(
                    'A.B. Fernandez Avenue, Dagupan City',
                    style: theme.textTheme.titleMedium,
                  ),
                  const SizedBox(height: AppSpacing.xxs),
                  Text(
                    '16.0438° N, 120.3330° E',
                    style: theme.textTheme.bodyMedium,
                  ),
                  const SizedBox(height: AppSpacing.md),
                  const CitizenMapPreview(
                    locationLabel: 'Dagupan City report location',
                    compact: true,
                  ),
                ],
              ),
            ),
            const SizedBox(height: AppSpacing.sm),
            LunasCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Icon(Icons.info_outline_rounded, color: scheme.primary),
                      const SizedBox(width: AppSpacing.md),
                      Text('Report info', style: theme.textTheme.titleLarge),
                    ],
                  ),
                  const SizedBox(height: AppSpacing.lg),
                  const CitizenDetailRow(
                    label: 'Category',
                    value: 'Road condition',
                  ),
                  const CitizenDetailRow(
                    label: 'Severity',
                    value: 'High',
                    valueColor: AppColorsLight.critical,
                    valueIcon: Icons.warning_amber_rounded,
                  ),
                  const CitizenDetailRow(
                    label: 'Estimated service target',
                    value: '48 hours',
                    showDivider: false,
                  ),
                ],
              ),
            ),
            const SizedBox(height: AppSpacing.xl),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: () =>
                        Navigator.pushNamed(context, '/reports/new'),
                    icon: const Icon(Icons.edit_outlined),
                    label: const Text('Edit'),
                  ),
                ),
                const SizedBox(width: AppSpacing.sm),
                Expanded(
                  flex: 2,
                  child: LunasButton(
                    label: 'Submit Report',
                    icon: Icons.send_rounded,
                    onPressed: () =>
                        Navigator.pushNamed(context, '/reports/status'),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
