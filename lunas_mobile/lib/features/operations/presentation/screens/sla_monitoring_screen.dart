import 'package:flutter/material.dart';
import 'package:lunas_mobile/core/theme/app_colors.dart';
import 'package:lunas_mobile/core/theme/app_spacing.dart';
import 'package:lunas_mobile/core/widgets/lunas_card.dart';
import 'package:lunas_mobile/features/operations/presentation/screens/operations_routes.dart';
import 'package:lunas_mobile/features/operations/presentation/screens/operations_widgets.dart';

class SlaMonitoringScreen extends StatelessWidget {
  const SlaMonitoringScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return OperationsPage(
      title: 'SLA monitoring',
      subtitle: 'Response targets for active infrastructure reports',
      actions: [
        IconButton(
          tooltip: 'Filter SLA records',
          onPressed: () => _showMessage(
            context,
            'SLA filters are a static UI control in this prototype.',
          ),
          icon: const Icon(Icons.filter_list_rounded),
        ),
        const SizedBox(width: AppSpacing.sm),
      ],
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          LayoutBuilder(
            builder: (context, constraints) {
              final columns = constraints.maxWidth >= 680 ? 3 : 1;
              final width =
                  (constraints.maxWidth - (columns - 1) * AppSpacing.sm) /
                  columns;
              return Wrap(
                spacing: AppSpacing.sm,
                runSpacing: AppSpacing.sm,
                children: [
                  SizedBox(
                    width: width,
                    child: const OperationsMetricCard(
                      label: 'Within SLA',
                      value: '10',
                      icon: Icons.check_circle_outline_rounded,
                      color: AppColorsLight.success,
                    ),
                  ),
                  SizedBox(
                    width: width,
                    child: const OperationsMetricCard(
                      label: 'Near deadline',
                      value: '3',
                      icon: Icons.schedule_outlined,
                      color: AppColorsLight.alert,
                      emphasized: true,
                    ),
                  ),
                  SizedBox(
                    width: width,
                    child: const OperationsMetricCard(
                      label: 'Overdue',
                      value: '2',
                      icon: Icons.warning_amber_rounded,
                      color: AppColorsLight.critical,
                      emphasized: true,
                    ),
                  ),
                ],
              );
            },
          ),
          const SizedBox(height: AppSpacing.xxl),
          const OperationsSectionHeading(
            title: 'Active incidents',
            description:
                'Time remaining is recalculated from the validated work order.',
          ),
          const SizedBox(height: AppSpacing.md),
          _SlaIncidentCard(
            id: 'INC-2026-0142',
            stage: 'In progress',
            personnel: 'Leah Ramos',
            priority: 'High',
            remaining: '2h 15m',
            color: AppColorsLight.success,
          ),
          const SizedBox(height: AppSpacing.sm),
          _SlaIncidentCard(
            id: 'INC-2026-0138',
            stage: 'Dispatched',
            personnel: 'Noel Santos',
            priority: 'Critical',
            remaining: '-45m',
            color: AppColorsLight.critical,
            isOverdue: true,
          ),
          const SizedBox(height: AppSpacing.sm),
          _SlaIncidentCard(
            id: 'INC-2026-0145',
            stage: 'Assessing',
            personnel: 'Mara de Guzman',
            priority: 'Medium',
            remaining: '0h 20m',
            color: AppColorsLight.alert,
          ),
          const SizedBox(height: AppSpacing.xl),
          Container(
            padding: const EdgeInsets.all(AppSpacing.md),
            decoration: BoxDecoration(
              color: AppColorsLight.brandBase.withValues(alpha: .07),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: AppColorsLight.brandBase.withValues(alpha: .20),
              ),
            ),
            child: const OperationsInfoRow(
              icon: Icons.notifications_active_outlined,
              label: 'SLA safeguard',
              value:
                  'Escalate overdue incidents according to the city response policy; this prototype does not send live notifications.',
            ),
          ),
        ],
      ),
    );
  }

  void _showMessage(BuildContext context, String message) {
    ScaffoldMessenger.of(
      context,
    ).showSnackBar(SnackBar(content: Text(message)));
  }
}

class _SlaIncidentCard extends StatelessWidget {
  const _SlaIncidentCard({
    required this.id,
    required this.stage,
    required this.personnel,
    required this.priority,
    required this.remaining,
    required this.color,
    this.isOverdue = false,
  });

  final String id;
  final String stage;
  final String personnel;
  final String priority;
  final String remaining;
  final Color color;
  final bool isOverdue;

  @override
  Widget build(BuildContext context) {
    return LunasCard(
      onTap: () =>
          Navigator.pushNamed(context, OperationsRoutes.repairVerification),
      color: isOverdue ? color.withValues(alpha: .11) : null,
      padding: const EdgeInsets.all(AppSpacing.md),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '#$id',
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    color: color,
                    fontWeight: FontWeight.w800,
                  ),
                ),
                const SizedBox(height: AppSpacing.sm),
                Text(
                  'Personnel: $personnel',
                  style: Theme.of(context).textTheme.bodyMedium,
                ),
                const SizedBox(height: AppSpacing.xxs),
                Text(
                  'Priority: $priority',
                  style: Theme.of(context).textTheme.bodyMedium,
                ),
              ],
            ),
          ),
          const SizedBox(width: AppSpacing.sm),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              OperationsBadge(label: stage, color: color),
              const SizedBox(height: AppSpacing.md),
              Text('Remaining', style: Theme.of(context).textTheme.bodySmall),
              const SizedBox(height: AppSpacing.xxs),
              Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  if (isOverdue) ...[
                    Icon(Icons.error_outline_rounded, size: 18, color: color),
                    const SizedBox(width: AppSpacing.xxs),
                  ],
                  Text(
                    remaining,
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      color: color,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ],
      ),
    );
  }
}
