import 'package:flutter/material.dart';
import 'package:lunas_mobile/core/theme/app_colors.dart';
import 'package:lunas_mobile/core/theme/app_spacing.dart';
import 'package:lunas_mobile/core/widgets/lunas_app_scaffold.dart';
import 'package:lunas_mobile/core/widgets/lunas_button.dart';
import 'package:lunas_mobile/core/widgets/lunas_card.dart';
import 'package:lunas_mobile/features/citizen_extra/presentation/screens/citizen_extra_widgets.dart';

/// Citizen-readable lifecycle for a report as it moves through review and
/// repair. AI output is labelled advisory at the point it appears.
class ReportTimelineScreen extends StatelessWidget {
  const ReportTimelineScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return LunasAppScaffold(
      title: 'Report Timeline',
      subtitle: 'RPT-2026-0142',
      showBackButton: true,
      selectedIndex: 3,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          LunasCard(
            color: theme.colorScheme.primaryContainer.withValues(alpha: .60),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        'Pothole repair',
                        style: theme.textTheme.headlineSmall?.copyWith(
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                    ),
                    const CitizenExtraStatusChip(
                      label: 'In progress',
                      color: AppColorsLight.alert,
                      icon: Icons.construction_outlined,
                    ),
                  ],
                ),
                const SizedBox(height: AppSpacing.xs),
                Text(
                  'A.B. Fernandez Avenue, Barangay Pantal, Dagupan City',
                  style: theme.textTheme.bodyMedium,
                ),
                const SizedBox(height: AppSpacing.md),
                Row(
                  children: [
                    Icon(
                      Icons.schedule_outlined,
                      color: theme.colorScheme.primary,
                      size: 18,
                    ),
                    const SizedBox(width: AppSpacing.xs),
                    Text(
                      'Target completion: today, 5:00 PM',
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: theme.colorScheme.primary,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: AppSpacing.xxl),
          Text(
            'Report activity',
            style: theme.textTheme.titleLarge?.copyWith(
              fontWeight: FontWeight.w800,
            ),
          ),
          const SizedBox(height: AppSpacing.lg),
          const CitizenExtraTimelineItem(
            title: 'Repair Started',
            time: 'Today, 8:30 AM',
            description:
                'City Engineering repair personnel began work at the confirmed location.',
            detail: 'Department: City Engineering road maintenance team',
            icon: Icons.construction_outlined,
            color: AppColorsLight.brandBase,
            complete: true,
            showLine: true,
          ),
          const CitizenExtraTimelineItem(
            title: 'Work Order Assigned',
            time: 'Yesterday, 2:15 PM',
            description:
                'An authorized official routed the validated report to the appropriate repair team.',
            detail: 'Work order: WO-2026-0142',
            icon: Icons.assignment_ind_outlined,
            color: AppColorsLight.success,
            complete: true,
            showLine: true,
          ),
          const CitizenExtraTimelineItem(
            title: 'Official Validation',
            time: 'Yesterday, 10:45 AM',
            description:
                'A city official confirmed the category, severity, and location before assignment.',
            detail: 'Human review completed',
            icon: Icons.verified_outlined,
            color: AppColorsLight.brandBase,
            complete: true,
            showLine: true,
          ),
          const CitizenExtraTimelineItem(
            title: 'AI Triage Suggestion',
            time: 'Yesterday, 9:12 AM',
            description:
                'The system suggested a high-priority road hazard classification from the submitted report photo.',
            detail: 'Advisory only — official validation was required.',
            icon: Icons.auto_awesome_outlined,
            color: AppColorsLight.alert,
            complete: true,
            showLine: true,
          ),
          const CitizenExtraTimelineItem(
            title: 'Report Submitted',
            time: 'Yesterday, 9:05 AM',
            description:
                'Your citizen report was received and queued for review.',
            detail: 'Source: Citizen Portal',
            icon: Icons.publish_outlined,
            color: AppColorsLight.success,
            complete: true,
            showLine: false,
          ),
          const SizedBox(height: AppSpacing.lg),
          LunasButton(
            label: 'View Report Details',
            icon: Icons.description_outlined,
            onPressed: () => Navigator.pushNamed(context, '/reports/details'),
          ),
          const SizedBox(height: AppSpacing.sm),
          OutlinedButton.icon(
            onPressed: () => Navigator.pushNamed(context, '/reports/evidence'),
            icon: const Icon(Icons.photo_library_outlined),
            label: const Text('View Repair Evidence'),
          ),
        ],
      ),
    );
  }
}
