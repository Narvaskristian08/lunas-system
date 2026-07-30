import 'package:flutter/material.dart';
import 'package:lunas_mobile/core/theme/app_colors.dart';
import 'package:lunas_mobile/core/theme/app_spacing.dart';
import 'package:lunas_mobile/core/widgets/lunas_card.dart';
import 'package:lunas_mobile/features/repair/presentation/screens/repair_routes.dart';
import 'package:lunas_mobile/features/repair/presentation/screens/repair_widgets.dart';

/// Detail view for a repair work order before field work begins.
class WorkOrderDetailsScreen extends StatelessWidget {
  const WorkOrderDetailsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final workOrderId =
        ModalRoute.of(context)?.settings.arguments as String? ?? 'WO-2026-0142';
    return RepairPage(
      appBar: const RepairAppBar(showBackButton: true),
      bottomActionBar: _WorkOrderActionBar(
        onNavigate: () => Navigator.pushNamed(context, RepairRoutes.map),
        onStart: () => Navigator.pushNamed(context, RepairRoutes.startRepair),
      ),
      padding: const EdgeInsets.fromLTRB(
        AppSpacing.xl,
        AppSpacing.lg,
        AppSpacing.xl,
        AppSpacing.xxxl,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Work order #$workOrderId',
                      style: theme.textTheme.headlineLarge?.copyWith(
                        fontSize: 28,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                    const SizedBox(height: AppSpacing.xs),
                    Text(
                      'Created Jul 28, 2026 • 08:30 AM',
                      style: theme.textTheme.bodyMedium,
                    ),
                  ],
                ),
              ),
              const SizedBox(width: AppSpacing.sm),
              const RepairStatusChip(
                label: 'High priority',
                color: AppColorsLight.critical,
                icon: Icons.priority_high_rounded,
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.xl),
          _PriorityCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: const [
                _DetailHeading(
                  icon: Icons.info_outline_rounded,
                  title: 'General information',
                ),
                SizedBox(height: AppSpacing.lg),
                RepairInfoRow(label: 'Incident ref', value: 'INC-2026-0142'),
                SizedBox(height: AppSpacing.sm),
                RepairInfoRow(label: 'Category', value: 'Infrastructure'),
                SizedBox(height: AppSpacing.sm),
                RepairInfoRow(label: 'Type', value: 'Pothole repair'),
                Padding(
                  padding: EdgeInsets.symmetric(vertical: AppSpacing.md),
                  child: Divider(),
                ),
                RepairInfoRow(label: 'Assigned by', value: 'Supervisor Reyes'),
              ],
            ),
          ),
          const SizedBox(height: AppSpacing.md),
          LunasCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const _DetailHeading(
                  icon: Icons.report_problem_outlined,
                  title: 'Incident details',
                ),
                const SizedBox(height: AppSpacing.md),
                Text(
                  'A deep pothole has been reported in the outer lane. It may damage vehicles during rain and needs a cold-patch repair with edge sealing.',
                  style: theme.textTheme.bodyMedium?.copyWith(
                    color: theme.colorScheme.onSurface,
                    height: 1.45,
                  ),
                ),
                const SizedBox(height: AppSpacing.md),
                const RepairPlaceholderImage(
                  label: 'Citizen report photo',
                  detail: 'Reference image attached to this work order',
                  icon: Icons.photo_camera_outlined,
                  height: 170,
                  accentColor: AppColorsLight.critical,
                ),
              ],
            ),
          ),
          const SizedBox(height: AppSpacing.md),
          LunasCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: const [
                _DetailHeading(
                  icon: Icons.location_on_outlined,
                  title: 'Location',
                ),
                SizedBox(height: AppSpacing.md),
                _LocationDetail(),
                SizedBox(height: AppSpacing.md),
                RepairPlaceholderImage(
                  label: 'Location preview',
                  detail: 'Open the map to navigate to the incident.',
                  icon: Icons.map_outlined,
                  height: 132,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _PriorityCard extends StatelessWidget {
  const _PriorityCard({required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    return LunasCard(
      padding: EdgeInsets.zero,
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Container(width: 4, color: AppColorsLight.critical),
          Expanded(
            child: Padding(
              padding: const EdgeInsets.all(AppSpacing.lg),
              child: child,
            ),
          ),
        ],
      ),
    );
  }
}

class _DetailHeading extends StatelessWidget {
  const _DetailHeading({required this.icon, required this.title});

  final IconData icon;
  final String title;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Row(
      children: [
        Icon(icon, color: theme.colorScheme.primary),
        const SizedBox(width: AppSpacing.sm),
        Expanded(
          child: Text(
            title,
            style: theme.textTheme.titleLarge?.copyWith(
              color: theme.colorScheme.primary,
              fontWeight: FontWeight.w800,
            ),
          ),
        ),
      ],
    );
  }
}

class _LocationDetail extends StatelessWidget {
  const _LocationDetail();

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Address', style: theme.textTheme.bodySmall),
        const SizedBox(height: AppSpacing.xxs),
        Text(
          'A.B. Fernandez Ave., Barangay IV, Dagupan City',
          style: theme.textTheme.titleMedium?.copyWith(
            fontWeight: FontWeight.w700,
          ),
        ),
        const SizedBox(height: AppSpacing.md),
        Text('GPS coordinates', style: theme.textTheme.bodySmall),
        const SizedBox(height: AppSpacing.xxs),
        Text(
          '16.0437° N, 120.3337° E',
          style: theme.textTheme.bodyMedium?.copyWith(fontFamily: 'RobotoMono'),
        ),
      ],
    );
  }
}

class _WorkOrderActionBar extends StatelessWidget {
  const _WorkOrderActionBar({required this.onNavigate, required this.onStart});

  final VoidCallback onNavigate;
  final VoidCallback onStart;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return SafeArea(
      top: false,
      child: Container(
        padding: const EdgeInsets.all(AppSpacing.md),
        decoration: BoxDecoration(
          color: theme.colorScheme.surface,
          border: Border(
            top: BorderSide(color: theme.colorScheme.outlineVariant),
          ),
        ),
        child: Row(
          children: [
            Expanded(
              child: OutlinedButton.icon(
                onPressed: onNavigate,
                icon: const Icon(Icons.navigation_outlined),
                label: const Text('Navigate'),
              ),
            ),
            const SizedBox(width: AppSpacing.sm),
            Expanded(
              child: FilledButton.icon(
                onPressed: onStart,
                icon: const Icon(Icons.handyman),
                label: const Text('Start repair'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
