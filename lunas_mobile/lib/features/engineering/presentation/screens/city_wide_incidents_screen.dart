import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:lunas_mobile/core/app_services.dart';
import 'package:lunas_mobile/core/network/api_exception.dart';
import 'package:lunas_mobile/core/theme/app_colors.dart';
import 'package:lunas_mobile/core/theme/app_spacing.dart';
import 'package:lunas_mobile/core/widgets/lunas_card.dart';
import 'package:lunas_mobile/core/widgets/lunas_state_view.dart';
import 'package:lunas_mobile/features/validation/data/models/validation_incident.dart';
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
  final _search = TextEditingController();
  bool _loading = true;
  String? _error;
  List<ValidationIncident> _incidents = const [];

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _search.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final page = await validationService.getIncidents(
        page: 1,
        limit: 50,
        search: _search.text.trim().isEmpty ? null : _search.text.trim(),
      );
      if (mounted) setState(() => _incidents = page.incidents);
    } on ApiException catch (error) {
      if (mounted) setState(() => _error = error.message);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final visible = _incidents
        .where((incident) {
          switch (_filter) {
            case 'Pending':
              return incident.status == 'submitted' ||
                  incident.status == 'validated';
            case 'In progress':
              return incident.status == 'assigned' ||
                  incident.status == 'accepted' ||
                  incident.status == 'in_progress';
            case 'Overdue':
              return incident.sla?.isOverdue == true;
            default:
              return true;
          }
        })
        .map(_displayIncident)
        .toList(growable: false);
    return EngineeringPage(
      title: 'City-wide incidents',
      subtitle: 'Engineering review queue',
      actions: [
        IconButton(
          tooltip: 'Open map overview',
          onPressed: () => context.push(EngineeringRoutes.map),
          icon: const Icon(Icons.map_outlined),
        ),
        const SizedBox(width: AppSpacing.sm),
      ],
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          TextField(
            controller: _search,
            textInputAction: TextInputAction.search,
            onSubmitted: (_) => _load(),
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
          if (_loading)
            const LunasStateView(
              state: LunasViewState.loading,
              title: 'Loading city incidents',
              message: 'Getting incidents in your authorized city scope.',
            )
          else if (_error != null)
            LunasStateView(
              state: LunasViewState.error,
              title: 'Could not load incidents',
              message: _error!,
              actionLabel: 'Retry',
              onAction: _load,
            )
          else ...[
            EngineeringSectionHeading(
              title: '${visible.length} incidents',
              description: 'Sorted by response urgency and SLA deadline.',
              trailing: IconButton(
                tooltip: 'Filter incidents',
                onPressed: _load,
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
                  onTap: () => context.push(
                    '/engineering/incidents/${incident.routeId}',
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
        ],
      ),
    );
  }
}

_EngineeringIncident _displayIncident(ValidationIncident incident) {
  final rawPriority = incident.priority ?? 'unassigned';
  final priority = rawPriority.isEmpty
      ? 'Unassigned'
      : '${rawPriority[0].toUpperCase()}${rawPriority.substring(1)}';
  final color = switch (rawPriority.toLowerCase()) {
    'critical' => AppColorsLight.critical,
    'high' => AppColorsLight.alert,
    'medium' => AppColorsLight.brandBase,
    'low' => AppColorsLight.success,
    _ => AppColorsLight.textSecondary,
  };
  final status = incident.sla?.isOverdue == true
      ? 'Overdue'
      : switch (incident.status) {
          'submitted' => 'Pending',
          'validated' ||
          'assigned' ||
          'accepted' ||
          'in_progress' => 'In progress',
          'completed' || 'verified' || 'closed' => 'Completed',
          _ => incident.status,
        };
  final deadline = incident.sla?.deadline;
  final slaLabel = incident.sla?.isOverdue == true
      ? 'SLA overdue'
      : deadline == null
      ? 'SLA unavailable'
      : 'Due ${deadline.toLocal().month}/${deadline.toLocal().day}';
  return _EngineeringIncident(
    id: incident.reportNumber,
    routeId: incident.id,
    title: incident.categoryLabel,
    location: incident.location.displayAddress,
    assignee: incident.responsibleOrganization ?? 'Not assigned',
    remaining: slaLabel,
    priority: priority,
    status: status,
    icon: Icons.report_problem_outlined,
    color: color,
  );
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
    required this.routeId,
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
  final String routeId;
  final String title;
  final String location;
  final String assignee;
  final String remaining;
  final String priority;
  final String status;
  final IconData icon;
  final Color color;
}
