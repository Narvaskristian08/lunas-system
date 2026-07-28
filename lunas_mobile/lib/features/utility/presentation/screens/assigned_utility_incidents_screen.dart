import 'package:flutter/material.dart';
import 'package:lunas_mobile/core/theme/app_colors.dart';
import 'package:lunas_mobile/core/theme/app_spacing.dart';
import 'package:lunas_mobile/core/widgets/lunas_card.dart';
import 'package:lunas_mobile/features/utility/presentation/screens/utility_routes.dart';
import 'package:lunas_mobile/features/utility/presentation/screens/utility_widgets.dart';

/// Assigned incident queue for the utility provider workspace.
class AssignedUtilityIncidentsScreen extends StatefulWidget {
  const AssignedUtilityIncidentsScreen({super.key});

  @override
  State<AssignedUtilityIncidentsScreen> createState() => _AssignedUtilityIncidentsScreenState();
}

class _AssignedUtilityIncidentsScreenState extends State<AssignedUtilityIncidentsScreen> {
  String _selectedStatus = 'All';

  @override
  Widget build(BuildContext context) {
    final incidents = _selectedStatus == 'All'
        ? _incidents
        : _incidents.where((incident) => incident.status == _selectedStatus).toList();
    return UtilityPage(
      title: 'Assigned incidents',
      selectedNavigationIndex: 1,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          TextField(
            decoration: const InputDecoration(
              hintText: 'Search assigned incidents',
              prefixIcon: Icon(Icons.search_rounded),
            ),
          ),
          const SizedBox(height: AppSpacing.sm),
          Row(
            children: [
              Expanded(
                child: Text('Dispatch queue', style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w800)),
              ),
              IconButton.outlined(
                tooltip: 'Filter incidents',
                onPressed: () => showUtilityMessage(context, 'Advanced filters are a static prototype control.'),
                icon: const Icon(Icons.tune_rounded),
              ),
              const SizedBox(width: AppSpacing.xs),
              IconButton.outlined(
                tooltip: 'Sort incidents',
                onPressed: () => showUtilityMessage(context, 'Sorting is a static prototype control.'),
                icon: const Icon(Icons.sort_rounded),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.sm),
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: _filters
                  .map(
                    (filter) => Padding(
                      padding: const EdgeInsets.only(right: AppSpacing.xs),
                      child: ChoiceChip(
                        label: Text(filter.label),
                        selected: _selectedStatus == filter.status,
                        onSelected: (_) => setState(() => _selectedStatus = filter.status),
                      ),
                    ),
                  )
                  .toList(),
            ),
          ),
          const SizedBox(height: AppSpacing.lg),
          for (final incident in incidents) ...[
            _IncidentQueueCard(
              incident: incident,
              onOpen: () => Navigator.pushNamed(context, UtilityRoutes.incidentDetails),
              onAction: incident.action == 'Accept task'
                  ? () => Navigator.pushNamed(context, UtilityRoutes.acceptAssignment)
                  : () => Navigator.pushNamed(context, UtilityRoutes.incidentDetails),
            ),
            const SizedBox(height: AppSpacing.sm),
          ],
          if (incidents.isEmpty)
            Padding(
              padding: const EdgeInsets.only(top: AppSpacing.xxl),
              child: Center(
                child: Text('No incidents in this static filter.', style: Theme.of(context).textTheme.bodyMedium),
              ),
            ),
        ],
      ),
    );
  }
}

const _filters = [
  _IncidentFilter(label: 'All', status: 'All'),
  _IncidentFilter(label: 'New (1)', status: 'New'),
  _IncidentFilter(label: 'Accepted (1)', status: 'Accepted'),
  _IncidentFilter(label: 'In progress (1)', status: 'In progress'),
  _IncidentFilter(label: 'Awaiting verification', status: 'Awaiting verification'),
  _IncidentFilter(label: 'Completed', status: 'Completed'),
];

class _IncidentFilter {
  const _IncidentFilter({required this.label, required this.status});

  final String label;
  final String status;
}

const _incidents = [
  _UtilityIncident(
    id: '#INC-DE-001',
    title: 'Sparking transformer',
    category: 'Electrical hazard',
    location: 'Brgy. Tapuac',
    eta: '45m SLA remaining',
    priority: 'Critical',
    status: 'New',
    action: 'Accept task',
    icon: Icons.electric_bolt_rounded,
    priorityColor: AppColorsLight.critical,
  ),
  _UtilityIncident(
    id: '#INC-DE-002',
    title: 'Leaning pole after storm',
    category: 'Electrical infrastructure',
    location: 'Brgy. Bonuan Gueset',
    eta: '3h SLA remaining',
    priority: 'High',
    status: 'In progress',
    action: 'Update status',
    icon: Icons.electric_meter_rounded,
    priorityColor: AppColorsLight.alert,
  ),
  _UtilityIncident(
    id: '#INC-DE-003',
    title: 'Low-hanging wire',
    category: 'Electrical safety',
    location: 'A.B. Fernandez Avenue',
    eta: '1d SLA remaining',
    priority: 'Medium',
    status: 'Accepted',
    action: 'Start work',
    icon: Icons.cable_rounded,
    priorityColor: AppColorsLight.info,
  ),
];

class _UtilityIncident {
  const _UtilityIncident({
    required this.id,
    required this.title,
    required this.category,
    required this.location,
    required this.eta,
    required this.priority,
    required this.status,
    required this.action,
    required this.icon,
    required this.priorityColor,
  });

  final String id;
  final String title;
  final String category;
  final String location;
  final String eta;
  final String priority;
  final String status;
  final String action;
  final IconData icon;
  final Color priorityColor;
}

class _IncidentQueueCard extends StatelessWidget {
  const _IncidentQueueCard({
    required this.incident,
    required this.onOpen,
    required this.onAction,
  });

  final _UtilityIncident incident;
  final VoidCallback onOpen;
  final VoidCallback onAction;

  @override
  Widget build(BuildContext context) {
    final statusColor = switch (incident.status) {
      'New' => AppColorsLight.brandBase,
      'In progress' => AppColorsLight.alert,
      'Accepted' => AppColorsLight.success,
      _ => AppColorsLight.info,
    };
    return LunasCard(
      onTap: onOpen,
      padding: const EdgeInsets.all(AppSpacing.md),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              Expanded(child: Text(incident.id, style: Theme.of(context).textTheme.bodySmall?.copyWith(fontWeight: FontWeight.w800))),
              UtilityStatusPill(label: incident.priority, color: incident.priorityColor),
            ],
          ),
          const SizedBox(height: AppSpacing.sm),
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              CircleAvatar(
                backgroundColor: incident.priorityColor.withValues(alpha: .12),
                foregroundColor: incident.priorityColor,
                child: Icon(incident.icon),
              ),
              const SizedBox(width: AppSpacing.md),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(incident.title, style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w800)),
                    const SizedBox(height: AppSpacing.xxs),
                    Text(incident.category, style: Theme.of(context).textTheme.bodySmall),
                    const SizedBox(height: AppSpacing.xs),
                    Row(
                      children: [
                        const Icon(Icons.location_on_outlined, size: 16),
                        const SizedBox(width: AppSpacing.xxs),
                        Expanded(child: Text(incident.location, style: Theme.of(context).textTheme.bodySmall)),
                      ],
                    ),
                    const SizedBox(height: AppSpacing.xxs),
                    Row(
                      children: [
                        const Icon(Icons.timer_outlined, size: 16),
                        const SizedBox(width: AppSpacing.xxs),
                        Text(incident.eta, style: Theme.of(context).textTheme.bodySmall),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.md),
          Row(
            children: [
              UtilityStatusPill(label: incident.status, color: statusColor),
              const Spacer(),
              TextButton.icon(
                onPressed: onAction,
                icon: const Icon(Icons.arrow_forward_rounded, size: 18),
                label: Text(incident.action),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
