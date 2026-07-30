import 'package:flutter/material.dart';
import 'package:lunas_mobile/core/theme/app_colors.dart';
import 'package:lunas_mobile/core/theme/app_spacing.dart';
import 'package:lunas_mobile/core/widgets/lunas_card.dart';
import 'package:lunas_mobile/features/repair/presentation/screens/repair_routes.dart';
import 'package:lunas_mobile/features/repair/presentation/screens/repair_widgets.dart';

/// Repair history including verified, pending, and rework-required states.
class CompletedRepairsScreen extends StatelessWidget {
  const CompletedRepairsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return RepairPage(
      appBar: const RepairAppBar(title: 'History', showBackButton: true),
      selectedNavigationIndex: 1,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const TextField(
            readOnly: true,
            decoration: InputDecoration(
              hintText: 'Search work orders…',
              prefixIcon: Icon(Icons.search_rounded),
            ),
          ),
          const SizedBox(height: AppSpacing.md),
          const RepairFilterChips(
            labels: ['All', 'Verified', 'Pending', 'Rework required'],
          ),
          const SizedBox(height: AppSpacing.xl),
          _CompletedRepairCard(
            title: 'Water leak repair',
            workOrderId: 'WO-2026-0142',
            date: 'Jul 20, 2026',
            status: 'Verified',
            statusColor: AppColorsLight.success,
            icon: Icons.check_circle_outline_rounded,
            onTap: () =>
                Navigator.pushNamed(context, RepairRoutes.workOrderDetails),
          ),
          const SizedBox(height: AppSpacing.md),
          _CompletedRepairCard(
            title: 'Pothole repair',
            workOrderId: 'WO-2026-0142',
            date: 'Jul 18, 2026',
            status: 'Rework required',
            statusColor: AppColorsLight.critical,
            icon: Icons.error_outline_rounded,
            onTap: () =>
                Navigator.pushNamed(context, RepairRoutes.workOrderDetails),
          ),
          const SizedBox(height: AppSpacing.md),
          _CompletedRepairCard(
            title: 'Streetlight outage',
            workOrderId: 'WO-2026-0142',
            date: 'Jul 15, 2026',
            status: 'Pending verification',
            statusColor: AppColorsLight.alert,
            icon: Icons.timelapse_outlined,
            onTap: () =>
                Navigator.pushNamed(context, RepairRoutes.workOrderDetails),
          ),
        ],
      ),
    );
  }
}

class _CompletedRepairCard extends StatelessWidget {
  const _CompletedRepairCard({
    required this.title,
    required this.workOrderId,
    required this.date,
    required this.status,
    required this.statusColor,
    required this.icon,
    required this.onTap,
  });

  final String title;
  final String workOrderId;
  final String date;
  final String status;
  final Color statusColor;
  final IconData icon;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return LunasCard(
      onTap: onTap,
      padding: EdgeInsets.zero,
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Container(width: 4, color: statusColor),
          Expanded(
            child: Padding(
              padding: const EdgeInsets.all(AppSpacing.md),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          title,
                          style: Theme.of(context).textTheme.titleLarge
                              ?.copyWith(fontWeight: FontWeight.w800),
                        ),
                      ),
                      RepairStatusChip(
                        label: status,
                        color: statusColor,
                        icon: icon,
                      ),
                    ],
                  ),
                  const SizedBox(height: AppSpacing.xs),
                  Text(
                    workOrderId,
                    style: Theme.of(
                      context,
                    ).textTheme.bodyMedium?.copyWith(fontFamily: 'RobotoMono'),
                  ),
                  const Padding(
                    padding: EdgeInsets.symmetric(vertical: AppSpacing.md),
                    child: Divider(),
                  ),
                  Row(
                    children: [
                      Icon(
                        Icons.calendar_today_outlined,
                        size: 18,
                        color: Theme.of(context).colorScheme.onSurfaceVariant,
                      ),
                      const SizedBox(width: AppSpacing.xs),
                      Text(date, style: Theme.of(context).textTheme.bodyMedium),
                      const Spacer(),
                      Icon(
                        Icons.chevron_right_rounded,
                        color: Theme.of(context).colorScheme.onSurfaceVariant,
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
