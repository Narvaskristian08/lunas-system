import 'package:flutter/material.dart';
import 'package:lunas_mobile/core/theme/app_colors.dart';
import 'package:lunas_mobile/core/theme/app_radius.dart';
import 'package:lunas_mobile/core/theme/app_spacing.dart';
import 'package:lunas_mobile/core/widgets/lunas_app_scaffold.dart';
import 'package:lunas_mobile/core/widgets/lunas_card.dart';
import 'package:lunas_mobile/features/stitch_extras/presentation/screens/stitch_extra_widgets.dart';

class RepairTasksListScreen extends StatelessWidget {
  const RepairTasksListScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return LunasAppScaffold(
      title: 'LUNAS Repair',
      subtitle: 'My tasks',
      showBackButton: true,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Container(
            padding: const EdgeInsets.all(AppSpacing.md),
            decoration: BoxDecoration(
              color: AppColorsLight.critical.withValues(alpha: .08),
              borderRadius: AppRadius.input,
              border: Border.all(
                color: AppColorsLight.critical.withValues(alpha: .25),
              ),
            ),
            child: Row(
              children: [
                const Icon(
                  Icons.warning_amber_rounded,
                  color: AppColorsLight.critical,
                ),
                const SizedBox(width: AppSpacing.sm),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        '3 tasks due today',
                        style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                      Text(
                        'A critical SLA target is approaching.',
                        style: Theme.of(context).textTheme.bodySmall,
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: AppSpacing.lg),
          Text(
            'Assigned tasks',
            style: Theme.of(context).textTheme.titleLarge?.copyWith(
              fontWeight: FontWeight.w800,
            ),
          ),
          const SizedBox(height: AppSpacing.sm),
          _TaskCard(
            title: 'Water main pressure drop',
            location: 'A.B. Fernandez Avenue, Dagupan City',
            status: 'In progress',
            priority: 'High priority',
            priorityColor: AppColorsLight.critical,
            actionLabel: 'Update progress',
            onTap: () => Navigator.pushNamed(context, '/repair/progress'),
          ),
          const SizedBox(height: AppSpacing.md),
          _TaskCard(
            title: 'Road surface damage',
            location: 'Mabini Street, Barangay 8',
            status: 'Assigned',
            priority: 'Medium priority',
            priorityColor: AppColorsLight.alert,
            actionLabel: 'View work order',
            onTap: () => Navigator.pushNamed(context, '/repair/work-order'),
          ),
        ],
      ),
    );
  }
}

class _TaskCard extends StatelessWidget {
  const _TaskCard({
    required this.title,
    required this.location,
    required this.status,
    required this.priority,
    required this.priorityColor,
    required this.actionLabel,
    required this.onTap,
  });

  final String title;
  final String location;
  final String status;
  final String priority;
  final Color priorityColor;
  final String actionLabel;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return LunasCard(
      onTap: onTap,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              StitchStatusPill(label: priority, color: priorityColor),
              const SizedBox(width: AppSpacing.xs),
              StitchStatusPill(
                label: status,
                color: Theme.of(context).colorScheme.primary,
              ),
              const Spacer(),
              const Icon(Icons.chevron_right_rounded),
            ],
          ),
          const SizedBox(height: AppSpacing.md),
          Text(
            title,
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.w800,
            ),
          ),
          const SizedBox(height: AppSpacing.xs),
          Row(
            children: [
              Icon(
                Icons.location_on_outlined,
                size: 18,
                color: Theme.of(context).colorScheme.onSurfaceVariant,
              ),
              const SizedBox(width: AppSpacing.xs),
              Expanded(
                child: Text(location, style: Theme.of(context).textTheme.bodySmall),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.md),
          Text(
            actionLabel,
            style: Theme.of(context).textTheme.labelLarge?.copyWith(
              color: Theme.of(context).colorScheme.primary,
            ),
          ),
        ],
      ),
    );
  }
}
