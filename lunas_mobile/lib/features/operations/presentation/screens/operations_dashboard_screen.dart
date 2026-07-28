import 'package:flutter/material.dart';
import 'package:lunas_mobile/core/theme/app_colors.dart';
import 'package:lunas_mobile/core/theme/app_radius.dart';
import 'package:lunas_mobile/core/theme/app_spacing.dart';
import 'package:lunas_mobile/core/widgets/lunas_card.dart';
import 'package:lunas_mobile/features/operations/presentation/screens/operations_routes.dart';
import 'package:lunas_mobile/features/operations/presentation/screens/operations_widgets.dart';

/// Entry point for the static official operations workspace.
///
/// In production, access to this area must be authorized by the account's
/// verified department and role.
class OperationsDashboardScreen extends StatelessWidget {
  const OperationsDashboardScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return OperationsPage(
      title: 'Official operations',
      subtitle: 'Dagupan response workspace',
      showBackButton: true,
      actions: [
        IconButton(
          tooltip: 'SLA monitoring',
          onPressed: () => Navigator.pushNamed(context, OperationsRoutes.slaMonitoring),
          icon: const Icon(Icons.timer_outlined),
        ),
        const SizedBox(width: AppSpacing.sm),
      ],
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Container(
            padding: const EdgeInsets.all(AppSpacing.lg),
            decoration: BoxDecoration(
              color: AppColorsLight.brandBase,
              borderRadius: AppRadius.card,
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Icon(
                  Icons.account_balance_outlined,
                  color: Colors.white,
                  size: 32,
                ),
                const SizedBox(height: AppSpacing.md),
                Text(
                  'Keep the response moving.',
                  style: Theme.of(context).textTheme.headlineLarge?.copyWith(
                    color: Colors.white,
                    fontSize: 28,
                    fontWeight: FontWeight.w800,
                  ),
                ),
                const SizedBox(height: AppSpacing.xs),
                Text(
                  'Review citizen reports, make the routing decision, and verify completed work.',
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: Colors.white.withValues(alpha: .88),
                    height: 1.45,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: AppSpacing.xl),
          LayoutBuilder(
            builder: (context, constraints) {
              final compact = constraints.maxWidth < 560;
              final width = compact
                  ? constraints.maxWidth
                  : (constraints.maxWidth - AppSpacing.sm) / 2;
              return Wrap(
                spacing: AppSpacing.sm,
                runSpacing: AppSpacing.sm,
                children: [
                  SizedBox(
                    width: width,
                    child: const OperationsMetricCard(
                      label: 'Awaiting validation',
                      value: '34',
                      icon: Icons.inbox_outlined,
                      color: AppColorsLight.brandBase,
                    ),
                  ),
                  SizedBox(
                    width: width,
                    child: const OperationsMetricCard(
                      label: 'Near SLA deadline',
                      value: '3',
                      icon: Icons.schedule_outlined,
                      color: AppColorsLight.alert,
                      emphasized: true,
                    ),
                  ),
                  SizedBox(
                    width: width,
                    child: const OperationsMetricCard(
                      label: 'Ready to verify',
                      value: '5',
                      icon: Icons.fact_check_outlined,
                      color: AppColorsLight.success,
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
            title: 'Response workflow',
            description: 'Use human review at each decision point.',
          ),
          const SizedBox(height: AppSpacing.sm),
          _WorkflowCard(
            step: '01',
            title: 'Incoming reports',
            description: 'Review citizen submissions and the AI-provided context.',
            icon: Icons.inbox_outlined,
            color: AppColorsLight.brandBase,
            onTap: () => Navigator.pushNamed(context, OperationsRoutes.incomingReports),
          ),
          const SizedBox(height: AppSpacing.sm),
          _WorkflowCard(
            step: '02',
            title: 'Validate and assign',
            description: 'Confirm category, priority, location, and appropriate personnel.',
            icon: Icons.assignment_ind_outlined,
            color: AppColorsLight.alert,
            onTap: () => Navigator.pushNamed(context, OperationsRoutes.validateReport),
          ),
          const SizedBox(height: AppSpacing.sm),
          _WorkflowCard(
            step: '03',
            title: 'Verify repair evidence',
            description: 'Review field evidence before formally approving completion.',
            icon: Icons.verified_outlined,
            color: AppColorsLight.success,
            onTap: () => Navigator.pushNamed(context, OperationsRoutes.repairVerification),
          ),
          const SizedBox(height: AppSpacing.xxl),
          LunasCard(
            color: AppColorsLight.brandBase.withValues(alpha: .07),
            child: const OperationsInfoRow(
              icon: Icons.verified_user_outlined,
              label: 'Prototype safeguard',
              value: 'AI suggestions are advisory; an authorized official makes the final decision.',
            ),
          ),
        ],
      ),
    );
  }
}

class _WorkflowCard extends StatelessWidget {
  const _WorkflowCard({
    required this.step,
    required this.title,
    required this.description,
    required this.icon,
    required this.color,
    required this.onTap,
  });

  final String step;
  final String title;
  final String description;
  final IconData icon;
  final Color color;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return LunasCard(
      onTap: onTap,
      padding: const EdgeInsets.all(AppSpacing.md),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 48,
            height: 48,
            alignment: Alignment.center,
            decoration: BoxDecoration(
              color: color.withValues(alpha: .12),
              borderRadius: AppRadius.input,
            ),
            child: Text(
              step,
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                color: color,
                fontWeight: FontWeight.w800,
              ),
            ),
          ),
          const SizedBox(width: AppSpacing.md),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w800,
                  ),
                ),
                const SizedBox(height: AppSpacing.xxs),
                Text(description, style: Theme.of(context).textTheme.bodySmall),
              ],
            ),
          ),
          const SizedBox(width: AppSpacing.sm),
          Icon(icon, color: color),
        ],
      ),
    );
  }
}
