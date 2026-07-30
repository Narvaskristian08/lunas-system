import 'package:flutter/material.dart';
import 'package:lunas_mobile/core/theme/app_colors.dart';
import 'package:lunas_mobile/core/theme/app_spacing.dart';
import 'package:lunas_mobile/core/widgets/lunas_card.dart';
import 'package:lunas_mobile/features/engineering/presentation/screens/engineering_routes.dart';
import 'package:lunas_mobile/features/engineering/presentation/screens/engineering_widgets.dart';

/// Static incident queue for the engineering team.
class CityWideIncidentsScreen extends StatefulWidget {
  const CityWideIncidentsScreen({super.key});

  @override
  State<CityWideIncidentsScreen> createState() =>
      _CityWideIncidentsScreenState();
}

class _CityWideIncidentsScreenState extends State<CityWideIncidentsScreen> {
  String _filter = 'All';

  static const _incidents = [
    _EngineeringIncident(
      id: 'INC-2026-089',
      title: 'Main water leak',
      location: 'Barangay Pantal, A.B. Fernandez Ave.',
      assignee: 'Engr. Santos',
      remaining: '45m left',
      priority: 'Critical',
      status: 'In progress',
      icon: Icons.water_drop_outlined,
      color: AppColorsLight.critical,
    ),
    _EngineeringIncident(
      id: 'INC-2026-092',
      title: 'Fallen power line',
      location: 'Barangay Bonuan Gueset, Bonuan Road',
      assignee: 'Unassigned',
      remaining: '2h 15m left',
      priority: 'High',
      status: 'Pending',
      icon: Icons.electrical_services_outlined,
      color: AppColorsLight.alert,
    ),
    _EngineeringIncident(
      id: 'INC-2026-085',
      title: 'Road surface failure',
      location: 'Barangay Pogo Chico, M.H. del Pilar St.',
      assignee: 'Engr. Reyes',
      remaining: '1d 4h left',
      priority: 'Medium',
      status: 'In progress',
      icon: Icons.construction_outlined,
      color: AppColorsLight.brandBase,
    ),
    _EngineeringIncident(
      id: 'INC-2026-078',
      title: 'Blocked drainage inlet',
      location: 'Barangay Malued, Arellano St.',
      assignee: 'Drainage Team 2',
      remaining: 'Overdue 2h',
      priority: 'High',
      status: 'Overdue',
      icon: Icons.water_outlined,
      color: AppColorsLight.critical,
    ),
  ];

  @override
  Widget build(BuildContext context) {
    final visible = _filter == 'All'
        ? _incidents
        : _incidents.where((incident) => incident.status == _filter).toList();
    return EngineeringPage(
      title: 'City-wide incidents',
      subtitle: 'Engineering review queue',
      actions: [
        IconButton(
          tooltip: 'Open map overview',
          onPressed: () => Navigator.pushNamed(context, EngineeringRoutes.map),
          icon: const Icon(Icons.map_outlined),
        ),
        const SizedBox(width: AppSpacing.sm),
      ],
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          TextField(
            readOnly: true,
            onTap: () => showEngineeringNotice(
              context,
              'Search is visual-only in this prototype.',
            ),
            decoration: const InputDecoration(
              hintText: 'Search incident ID, location, or category',
              prefixIcon: Icon(Icons.search_rounded),
            ),
          ),
          const SizedBox(height: AppSpacing.md),
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: ['All', 'Pending', 'In progress', 'Overdue']
                  .map(
                    (filter) => Padding(
                      padding: const EdgeInsets.only(right: AppSpacing.xs),
                      child: ChoiceChip(
                        label: Text(filter),
                        selected: _filter == filter,
                        onSelected: (_) => setState(() => _filter = filter),
                      ),
                    ),
                  )
                  .toList(),
            ),
          ),
          const SizedBox(height: AppSpacing.xl),
          EngineeringSectionHeading(
            title: '${visible.length} incidents',
            description: 'Sorted by response urgency and SLA deadline.',
            trailing: IconButton(
              tooltip: 'Filter incidents',
              onPressed: () => showEngineeringNotice(
                context,
                'Additional filters will be connected to live data later.',
              ),
              icon: const Icon(Icons.tune_rounded),
            ),
          ),
          const SizedBox(height: AppSpacing.sm),
          if (visible.isEmpty)
            LunasCard(
              child: Column(
                children: [
                  const Icon(Icons.inbox_outlined, size: 36),
                  const SizedBox(height: AppSpacing.sm),
                  Text(
                    'No $_filter incidents',
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                ],
              ),
            )
          else
            for (final incident in visible) ...[
              _IncidentCard(
                incident: incident,
                onTap: () => Navigator.pushNamed(
                  context,
                  EngineeringRoutes.incidentDetails,
                ),
              ),
              const SizedBox(height: AppSpacing.sm),
            ],
          const SizedBox(height: AppSpacing.xl),
          LunasCard(
            color: Theme.of(
              context,
            ).colorScheme.primaryContainer.withValues(alpha: .44),
            child: const EngineeringInfoRow(
              icon: Icons.info_outline_rounded,
              label: 'Routing safeguard',
              value:
                  'Priority and provider recommendations are decision support. An authorized engineer confirms dispatch.',
            ),
          ),
        ],
      ),
    );
  }
}

class _IncidentCard extends StatelessWidget {
  const _IncidentCard({required this.incident, required this.onTap});

  final _EngineeringIncident incident;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return LunasCard(
      onTap: onTap,
      padding: const EdgeInsets.all(AppSpacing.md),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 42,
                height: 42,
                decoration: BoxDecoration(
                  color: incident.color.withValues(alpha: .14),
                  shape: BoxShape.circle,
                ),
                child: Icon(incident.icon, color: incident.color),
              ),
              const SizedBox(width: AppSpacing.sm),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      incident.id,
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                    const SizedBox(height: AppSpacing.xxs),
                    Text(
                      incident.title,
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                  ],
                ),
              ),
              EngineeringBadge(label: incident.priority, color: incident.color),
            ],
          ),
          const SizedBox(height: AppSpacing.md),
          _DetailLine(
            icon: Icons.location_on_outlined,
            value: incident.location,
          ),
          const SizedBox(height: AppSpacing.xs),
          _DetailLine(
            icon: Icons.person_outline_rounded,
            value: incident.assignee,
          ),
          const SizedBox(height: AppSpacing.xs),
          Row(
            children: [
              _DetailLine(
                icon: Icons.timer_outlined,
                value: incident.remaining,
              ),
              const Spacer(),
              EngineeringBadge(
                label: incident.status,
                color: _statusColor(incident.status),
              ),
              const SizedBox(width: AppSpacing.xxs),
              const Icon(Icons.chevron_right_rounded),
            ],
          ),
        ],
      ),
    );
  }

  Color _statusColor(String status) {
    switch (status) {
      case 'Overdue':
        return AppColorsLight.critical;
      case 'Pending':
        return AppColorsLight.alert;
      default:
        return AppColorsLight.success;
    }
  }
}

class _DetailLine extends StatelessWidget {
  const _DetailLine({required this.icon, required this.value});

  final IconData icon;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(
          icon,
          size: 17,
          color: Theme.of(context).colorScheme.onSurfaceVariant,
        ),
        const SizedBox(width: AppSpacing.xs),
        Flexible(
          child: Text(value, style: Theme.of(context).textTheme.bodySmall),
        ),
      ],
    );
  }
}

class _EngineeringIncident {
  const _EngineeringIncident({
    required this.id,
    required this.title,
    required this.location,
    required this.assignee,
    required this.remaining,
    required this.priority,
    required this.status,
    required this.icon,
    required this.color,
  });

  final String id;
  final String title;
  final String location;
  final String assignee;
  final String remaining;
  final String priority;
  final String status;
  final IconData icon;
  final Color color;
}
