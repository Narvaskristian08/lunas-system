import 'package:flutter/material.dart';
import 'package:lunas_mobile/core/theme/app_colors.dart';
import 'package:lunas_mobile/core/theme/app_radius.dart';
import 'package:lunas_mobile/core/theme/app_spacing.dart';
import 'package:lunas_mobile/core/widgets/lunas_card.dart';
import 'package:lunas_mobile/features/utility/presentation/screens/utility_routes.dart';
import 'package:lunas_mobile/features/utility/presentation/screens/utility_widgets.dart';

/// Landing dashboard for a verified Dagupan utility-provider account.
class UtilityDashboardScreen extends StatelessWidget {
  const UtilityDashboardScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return UtilityPage(
      selectedNavigationIndex: 0,
      actions: const [
        Padding(
          padding: EdgeInsets.only(right: AppSpacing.md),
          child: CircleAvatar(
            radius: 17,
            backgroundColor: Color(0xFFDCE6FF),
            foregroundColor: AppColorsLight.brandBase,
            child: Text('MR', style: TextStyle(fontWeight: FontWeight.w800)),
          ),
        ),
      ],
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text('Dagupan Electric Corporation (DECORP)', style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(height: AppSpacing.xxs),
          Text(
            'Engr. Mateo Rivera',
            style: Theme.of(context).textTheme.headlineLarge?.copyWith(fontSize: 30, fontWeight: FontWeight.w800),
          ),
          const SizedBox(height: AppSpacing.xl),
          Container(
            padding: const EdgeInsets.all(AppSpacing.lg),
            decoration: BoxDecoration(
              color: AppColorsLight.brandBase,
              borderRadius: AppRadius.card,
            ),
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'SLA compliance summary',
                        style: Theme.of(context).textTheme.titleMedium?.copyWith(color: Colors.white, fontWeight: FontWeight.w700),
                      ),
                      const SizedBox(height: AppSpacing.xs),
                      Text(
                        '96%',
                        style: Theme.of(context).textTheme.displayMedium?.copyWith(color: Colors.white, fontSize: 38, fontWeight: FontWeight.w800),
                      ),
                    ],
                  ),
                ),
                Icon(Icons.check_circle_rounded, color: Colors.white.withValues(alpha: .30), size: 68),
              ],
            ),
          ),
          const SizedBox(height: AppSpacing.xl),
          LayoutBuilder(
            builder: (context, constraints) {
              final width = (constraints.maxWidth - AppSpacing.sm) / 2;
              return Wrap(
                spacing: AppSpacing.sm,
                runSpacing: AppSpacing.sm,
                children: [
                  SizedBox(
                    width: width,
                    child: UtilityMetricCard(
                      label: 'Newly assigned',
                      value: '3',
                      icon: Icons.fiber_new_outlined,
                      color: AppColorsLight.brandBase,
                      onTap: () => Navigator.pushNamed(context, UtilityRoutes.incidents),
                    ),
                  ),
                  SizedBox(width: width, child: const UtilityMetricCard(label: 'Accepted', value: '5', icon: Icons.thumb_up_outlined, color: AppColorsLight.success)),
                  SizedBox(width: width, child: const UtilityMetricCard(label: 'In progress', value: '2', icon: Icons.sync_rounded, color: AppColorsLight.alert)),
                  SizedBox(width: width, child: const UtilityMetricCard(label: 'Awaiting verification', value: '4', icon: Icons.verified_user_outlined, color: AppColorsLight.info)),
                  SizedBox(width: width, child: const UtilityMetricCard(label: 'Overdue', value: '1', icon: Icons.warning_amber_rounded, color: AppColorsLight.critical, emphasized: true)),
                  SizedBox(width: width, child: const UtilityMetricCard(label: 'Completed today', value: '8', icon: Icons.task_alt_rounded, color: AppColorsLight.success, emphasized: true)),
                ],
              );
            },
          ),
          const SizedBox(height: AppSpacing.xxl),
          UtilitySectionTitle(
            title: 'Urgent incidents',
            actionLabel: 'View assigned',
            onAction: () => Navigator.pushNamed(context, UtilityRoutes.incidents),
          ),
          const SizedBox(height: AppSpacing.sm),
          _UrgentIncidentCard(
            title: 'Transformer sparking',
            location: 'Brgy. Tapuac',
            icon: Icons.electric_bolt_rounded,
            onTap: () => Navigator.pushNamed(context, UtilityRoutes.incidentDetails),
          ),
          const SizedBox(height: AppSpacing.sm),
          _UrgentIncidentCard(
            title: 'Exposed high-voltage cable',
            location: 'Arellano Street',
            icon: Icons.cable_rounded,
            onTap: () => Navigator.pushNamed(context, UtilityRoutes.incidentDetails),
          ),
          const SizedBox(height: AppSpacing.xxl),
          const UtilitySectionTitle(title: 'Quick actions'),
          const SizedBox(height: AppSpacing.sm),
          _QuickActionGrid(),
        ],
      ),
    );
  }
}

class _UrgentIncidentCard extends StatelessWidget {
  const _UrgentIncidentCard({
    required this.title,
    required this.location,
    required this.icon,
    required this.onTap,
  });

  final String title;
  final String location;
  final IconData icon;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return LunasCard(
      onTap: onTap,
      padding: const EdgeInsets.all(AppSpacing.md),
      color: AppColorsLight.critical.withValues(alpha: .035),
      child: Row(
        children: [
          CircleAvatar(
            backgroundColor: AppColorsLight.critical.withValues(alpha: .13),
            foregroundColor: AppColorsLight.critical,
            child: Icon(icon),
          ),
          const SizedBox(width: AppSpacing.md),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w800)),
                const SizedBox(height: AppSpacing.xxs),
                Row(
                  children: [
                    const Icon(Icons.location_on_outlined, size: 17),
                    const SizedBox(width: AppSpacing.xxs),
                    Expanded(child: Text(location, style: Theme.of(context).textTheme.bodySmall)),
                  ],
                ),
              ],
            ),
          ),
          const UtilityStatusPill(label: 'Critical', color: AppColorsLight.critical),
        ],
      ),
    );
  }
}

class _QuickActionGrid extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final actions = [
      _QuickAction(
        icon: Icons.assignment_outlined,
        label: 'View assigned',
        color: AppColorsLight.brandBase,
        onTap: () => Navigator.pushNamed(context, UtilityRoutes.incidents),
      ),
      _QuickAction(
        icon: Icons.map_outlined,
        label: 'Open map',
        color: AppColorsLight.brandBase,
        onTap: () => Navigator.pushNamed(context, UtilityRoutes.map),
      ),
      _QuickAction(
        icon: Icons.update_rounded,
        label: 'Update status',
        color: AppColorsLight.info,
        onTap: () => Navigator.pushNamed(context, UtilityRoutes.incidentDetails),
      ),
      _QuickAction(
        icon: Icons.check_circle_outline_rounded,
        label: 'Submit completion',
        color: AppColorsLight.success,
        onTap: () => showUtilityMessage(context, 'Completion submission is represented in the static incident workflow.'),
      ),
    ];
    return LayoutBuilder(
      builder: (context, constraints) {
        final width = (constraints.maxWidth - AppSpacing.sm) / 2;
        return Wrap(
          spacing: AppSpacing.sm,
          runSpacing: AppSpacing.sm,
          children: actions
              .map((action) => SizedBox(width: width, child: action))
              .toList(),
        );
      },
    );
  }
}

class _QuickAction extends StatelessWidget {
  const _QuickAction({
    required this.icon,
    required this.label,
    required this.color,
    required this.onTap,
  });

  final IconData icon;
  final String label;
  final Color color;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return LunasCard(
      onTap: onTap,
      color: color.withValues(alpha: .08),
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.sm, vertical: AppSpacing.lg),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, color: color),
          const SizedBox(height: AppSpacing.xs),
          Text(label, textAlign: TextAlign.center, style: Theme.of(context).textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.w800)),
        ],
      ),
    );
  }
}
