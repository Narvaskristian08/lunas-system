import 'package:flutter/material.dart';
import 'package:lunas_mobile/core/theme/app_colors.dart';
import 'package:lunas_mobile/core/theme/app_spacing.dart';
import 'package:lunas_mobile/features/repair/presentation/screens/repair_routes.dart';
import 'package:lunas_mobile/features/repair/presentation/screens/repair_widgets.dart';

/// Canonical repair task list. It is intentionally static until task data is
/// connected to the work-order API.
class AssignedWorkOrdersScreen extends StatelessWidget {
  const AssignedWorkOrdersScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return RepairPage(
      appBar: RepairAppBar(
        title: 'LUNAS Repair',
        subtitle: 'Work orders',
        actions: const [
          Padding(
            padding: EdgeInsets.only(right: AppSpacing.md),
            child: CircleAvatar(
              radius: 17,
              backgroundColor: Color(0xFF0E67C8),
              child: Text('RP', style: TextStyle(color: Colors.white)),
            ),
          ),
        ],
      ),
      selectedNavigationIndex: 1,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          TextField(
            readOnly: true,
            decoration: const InputDecoration(
              hintText: 'Search work orders…',
              prefixIcon: Icon(Icons.search_rounded),
            ),
          ),
          const SizedBox(height: AppSpacing.md),
          const RepairFilterChips(
            labels: [
              'All',
              'Assigned',
              'Accepted',
              'In progress',
              'For verification',
            ],
          ),
          const SizedBox(height: AppSpacing.xl),
          RepairWorkOrderCard(
            workOrderId: 'WO-2026-0142',
            title: 'Pothole repair',
            location: 'Barangay IV',
            sla: 'SLA: 2h left',
            priority: 'High',
            priorityColor: AppColorsLight.critical,
            status: 'Assigned',
            statusColor: AppColorsLight.info,
            onTap: () =>
                Navigator.pushNamed(context, RepairRoutes.workOrderDetails),
          ),
          const SizedBox(height: AppSpacing.md),
          RepairWorkOrderCard(
            workOrderId: 'WO-2026-0142',
            title: 'Broken streetlight',
            location: 'Pantal intersection',
            sla: 'SLA: 1d left',
            priority: 'Medium',
            priorityColor: AppColorsLight.alert,
            status: 'Accepted',
            statusColor: AppColorsLight.success,
            onTap: () =>
                Navigator.pushNamed(context, RepairRoutes.workOrderDetails),
          ),
          const SizedBox(height: AppSpacing.md),
          RepairWorkOrderCard(
            workOrderId: 'WO-2026-0142',
            title: 'Drainage obstruction',
            location: 'Barangay Pantal',
            sla: 'SLA: 2h left',
            priority: 'High',
            priorityColor: AppColorsLight.critical,
            status: 'In progress',
            statusColor: AppColorsLight.alert,
            onTap: () =>
                Navigator.pushNamed(context, RepairRoutes.updateProgress),
          ),
          const SizedBox(height: AppSpacing.xxl),
          Text(
            'Showing 3 of 4 work orders',
            textAlign: TextAlign.center,
            style: Theme.of(context).textTheme.bodySmall,
          ),
        ],
      ),
    );
  }
}
