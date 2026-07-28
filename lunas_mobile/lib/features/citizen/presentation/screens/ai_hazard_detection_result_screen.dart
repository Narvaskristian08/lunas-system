import 'package:flutter/material.dart';
import 'package:lunas_mobile/core/theme/app_colors.dart';
import 'package:lunas_mobile/core/theme/app_spacing.dart';
import 'package:lunas_mobile/core/widgets/lunas_app_bar.dart';
import 'package:lunas_mobile/core/widgets/lunas_button.dart';
import 'package:lunas_mobile/core/widgets/lunas_card.dart';
import 'package:lunas_mobile/features/citizen/presentation/screens/citizen_flow_widgets.dart';

/// Presents an AI suggestion after a citizen captures a hazard photo.
///
/// The citizen must still verify the suggested classification before a report
/// can be submitted; this screen deliberately does not present AI output as a
/// final decision.
class AiHazardDetectionResultScreen extends StatelessWidget {
  const AiHazardDetectionResultScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final scheme = theme.colorScheme;
    return Scaffold(
      appBar: const LunasAppBar(
        title: 'Detection Result',
        subtitle: 'Review the AI suggestion before continuing',
        showBackButton: true,
      ),
      body: CitizenFlowScroll(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            CitizenPhotoPlaceholder(
              label: 'Severe road pothole',
              showDetection: true,
            ),
            const SizedBox(height: AppSpacing.lg),
            CitizenAccentCard(
              accent: scheme.error,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          'Suggested classification',
                          style: theme.textTheme.titleMedium,
                        ),
                      ),
                      Icon(Icons.error_outline_rounded, color: scheme.error),
                    ],
                  ),
                  const SizedBox(height: AppSpacing.sm),
                  Text(
                    'Severe Road Pothole',
                    style: theme.textTheme.headlineLarge?.copyWith(
                      color: scheme.error,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  const SizedBox(height: AppSpacing.xs),
                  Text(
                    'Immediate attention is recommended to help prevent vehicle damage.',
                    style: theme.textTheme.bodyMedium,
                  ),
                  const SizedBox(height: AppSpacing.md),
                  CitizenStatusPill(
                    label: 'AI suggestion — needs your confirmation',
                    color: scheme.primary,
                    icon: Icons.auto_awesome_outlined,
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
                      Expanded(
                        child: Text(
                          'AI confidence',
                          style: theme.textTheme.titleMedium,
                        ),
                      ),
                      const CitizenStatusPill(
                        label: 'High',
                        color: AppColorsLight.success,
                      ),
                    ],
                  ),
                  const SizedBox(height: AppSpacing.md),
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Text(
                        '98%',
                        style: theme.textTheme.displayMedium?.copyWith(
                          color: AppColorsLight.success,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                      const SizedBox(width: AppSpacing.sm),
                      Padding(
                        padding: const EdgeInsets.only(bottom: AppSpacing.xs),
                        child: Text('certainty', style: theme.textTheme.bodyMedium),
                      ),
                    ],
                  ),
                  const SizedBox(height: AppSpacing.md),
                  ClipRRect(
                    borderRadius: BorderRadius.circular(AppSpacing.xs),
                    child: LinearProgressIndicator(
                      value: .98,
                      minHeight: 9,
                      color: AppColorsLight.success,
                      backgroundColor: scheme.primaryContainer,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: AppSpacing.sm),
            LunasCard(
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    width: 44,
                    height: 44,
                    decoration: BoxDecoration(
                      color: scheme.primaryContainer,
                      shape: BoxShape.circle,
                    ),
                    child: Icon(
                      Icons.privacy_tip_outlined,
                      color: scheme.primary,
                    ),
                  ),
                  const SizedBox(width: AppSpacing.md),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Privacy verification',
                          style: theme.textTheme.titleMedium,
                        ),
                        const SizedBox(height: AppSpacing.xxs),
                        Text(
                          'No faces or license plates were found in this image.',
                          style: theme.textTheme.bodyMedium,
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: AppSpacing.xs),
                  const CitizenStatusPill(
                    label: 'Passed',
                    color: AppColorsLight.success,
                    icon: Icons.check_circle_outline_rounded,
                  ),
                ],
              ),
            ),
            const SizedBox(height: AppSpacing.xl),
            LunasButton(
              label: 'Confirm Detection',
              icon: Icons.check_circle_outline_rounded,
              onPressed: () => Navigator.pushNamed(context, '/reports/confirm'),
            ),
            const SizedBox(height: AppSpacing.sm),
            OutlinedButton.icon(
              onPressed: () => Navigator.pushNamed(context, '/reports/photo'),
              icon: const Icon(Icons.replay_rounded),
              label: const Text('Retake Photo'),
            ),
          ],
        ),
      ),
    );
  }
}
