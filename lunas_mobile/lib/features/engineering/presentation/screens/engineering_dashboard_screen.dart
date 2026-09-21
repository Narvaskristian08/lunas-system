import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:lunas_mobile/core/app_services.dart';
import 'package:lunas_mobile/core/network/api_exception.dart';
import 'package:lunas_mobile/core/theme/app_colors.dart';
import 'package:lunas_mobile/core/theme/app_spacing.dart';
import 'package:lunas_mobile/core/widgets/lunas_card.dart';
import 'package:lunas_mobile/core/widgets/lunas_state_view.dart';
import 'package:lunas_mobile/features/engineering/presentation/screens/engineering_routes.dart';
import 'package:lunas_mobile/features/engineering/presentation/screens/engineering_widgets.dart';
import 'package:lunas_mobile/features/validation/data/models/validation_incident.dart';

/// City engineering overview backed by server-scoped aggregate and incident APIs.
class EngineeringDashboardScreen extends StatefulWidget {
  const EngineeringDashboardScreen({super.key});

  @override
  State<EngineeringDashboardScreen> createState() =>
      _EngineeringDashboardScreenState();
}

class _EngineeringDashboardScreenState
    extends State<EngineeringDashboardScreen> {
  bool _loading = true;
  String? _error;
  Map<String, dynamic> _stats = const {};
  List<ValidationIncident> _incidents = const [];

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final results = await Future.wait([
        validationService.getDashboardStats(),
        validationService.getIncidents(
          page: 1,
          limit: 10,
          priority: 'critical',
        ),
      ]);
      final payload = results.first as Map<String, dynamic>;
      final data = payload['data'] is Map
          ? Map<String, dynamic>.from(payload['data'] as Map)
          : <String, dynamic>{};
      final incidents = data['incidents'] is Map
          ? Map<String, dynamic>.from(data['incidents'] as Map)
          : <String, dynamic>{};
      if (mounted) {
        setState(() {
          _stats = incidents;
          _incidents = (results[1] as ValidationQueuePage).incidents;
        });
      }
    } on ApiException catch (error) {
      if (mounted) setState(() => _error = error.message);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  String _count(String key) => (_stats[key] ?? 0).toString();

  String get _criticalCount {
    final breakdown = _stats['byPriority'];
    if (breakdown is! List) return '0';
    for (final item in breakdown.whereType<Map>()) {
      final row = Map<String, dynamic>.from(item);
      if (row['_id']?.toString().toLowerCase() == 'critical') {
        return (row['count'] ?? 0).toString();
      }
    }
    return '0';
  }

  @override
  Widget build(BuildContext context) {
    return EngineeringPage(
      title: 'LUNAS Engineering',
      subtitle: 'Dagupan City infrastructure oversight',
      showBackButton: false,
      actions: [
        IconButton(
          onPressed: _loading ? null : _load,
          tooltip: 'Refresh dashboard',
          icon: const Icon(Icons.refresh_rounded),
        ),
        const SizedBox(width: AppSpacing.sm),
      ],
      child: _loading
          ? const LunasStateView(
              state: LunasViewState.loading,
              title: 'Loading engineering dashboard',
              message: 'Getting city-wide operational data.',
            )
          : _error != null
          ? LunasStateView(
              state: LunasViewState.error,
              title: 'Could not load dashboard',
              message: _error!,
              actionLabel: 'Retry',
              onAction: _load,
            )
          : Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text(
                  'Engineering dashboard',
                  style: Theme.of(context).textTheme.headlineLarge?.copyWith(
                    fontWeight: FontWeight.w800,
                  ),
                ),
                const SizedBox(height: AppSpacing.xs),
                Text(
                  'City-wide incidents and SLA overview.',
                  style: Theme.of(context).textTheme.bodyMedium,
                ),
                const SizedBox(height: AppSpacing.lg),
                LayoutBuilder(
                  builder: (context, constraints) {
                    final columns = constraints.maxWidth >= 640 ? 4 : 2;
                    final width =
                        (constraints.maxWidth - (columns - 1) * AppSpacing.sm) /
                        columns;
                    return Wrap(
                      spacing: AppSpacing.sm,
                      runSpacing: AppSpacing.sm,
                      children: [
                        _metric(
                          width,
                          'Active',
                          _count('inProgress'),
                          Icons.warning_amber_rounded,
                          AppColorsLight.brandBase,
                        ),
                        _metric(
                          width,
                          'Critical',
                          _criticalCount,
                          Icons.error_outline_rounded,
                          AppColorsLight.critical,
                          emphasized: true,
                        ),
                        _metric(
                          width,
                          'Overdue',
                          _count('overdue'),
                          Icons.schedule_outlined,
                          AppColorsLight.alert,
                        ),
                        _metric(
                          width,
                          'Completed',
                          _count('completed'),
                          Icons.check_circle_outline_rounded,
                          AppColorsLight.success,
                        ),
                      ],
                    );
                  },
                ),
                const SizedBox(height: AppSpacing.xl),
                EngineeringSectionHeading(
                  title: 'Critical incidents',
                  trailing: TextButton(
                    onPressed: () => context.push(EngineeringRoutes.incidents),
                    child: const Text('View all'),
                  ),
                ),
                const SizedBox(height: AppSpacing.sm),
                if (_incidents.isEmpty)
                  const LunasCard(
                    child: Text(
                      'No critical incidents in the current city scope.',
                    ),
                  )
                else
                  for (final incident in _incidents) ...[
                    LunasCard(
                      onTap: () =>
                          context.push('/engineering/incidents/${incident.id}'),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            incident.reportNumber,
                            style: Theme.of(context).textTheme.bodySmall,
                          ),
                          const SizedBox(height: AppSpacing.xs),
                          Text(
                            incident.categoryLabel,
                            style: Theme.of(context).textTheme.titleMedium
                                ?.copyWith(fontWeight: FontWeight.w800),
                          ),
                          const SizedBox(height: AppSpacing.xs),
                          Text(
                            incident.location.displayAddress,
                            style: Theme.of(context).textTheme.bodySmall,
                          ),
                          const SizedBox(height: AppSpacing.xs),
                          Text(
                            incident.sla?.isOverdue == true
                                ? 'SLA overdue'
                                : 'Status: ${incident.status}',
                            style: Theme.of(context).textTheme.bodySmall
                                ?.copyWith(
                                  color: incident.sla?.isOverdue == true
                                      ? AppColorsLight.critical
                                      : null,
                                ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: AppSpacing.sm),
                  ],
                const SizedBox(height: AppSpacing.lg),
                EngineeringSectionHeading(title: 'Engineering tools'),
                const SizedBox(height: AppSpacing.sm),
                _action(
                  context,
                  'City-wide incidents',
                  Icons.map_outlined,
                  EngineeringRoutes.incidents,
                ),
                _action(
                  context,
                  'SLA dashboard',
                  Icons.timer_outlined,
                  EngineeringRoutes.sla,
                ),
                _action(
                  context,
                  'Infrastructure analytics',
                  Icons.insights_outlined,
                  EngineeringRoutes.analytics,
                ),
                _action(
                  context,
                  'Performance reports',
                  Icons.bar_chart_rounded,
                  EngineeringRoutes.performance,
                ),
                const SizedBox(height: AppSpacing.sm),
                const LunasCard(
                  child: Text(
                    'Provider assignment and repair verification require backend workflow endpoints that are not currently available.',
                  ),
                ),
              ],
            ),
    );
  }

  Widget _metric(
    double width,
    String label,
    String value,
    IconData icon,
    Color color, {
    bool emphasized = false,
  }) => SizedBox(
    width: width,
    child: EngineeringMetricCard(
      label: label,
      value: value,
      icon: icon,
      color: color,
      emphasized: emphasized,
    ),
  );

  Widget _action(
    BuildContext context,
    String label,
    IconData icon,
    String route,
  ) => Padding(
    padding: const EdgeInsets.only(bottom: AppSpacing.sm),
    child: LunasCard(
      onTap: () => context.push(route),
      child: Row(
        children: [
          Icon(icon, color: Theme.of(context).colorScheme.primary),
          const SizedBox(width: AppSpacing.md),
          Expanded(
            child: Text(label, style: Theme.of(context).textTheme.titleMedium),
          ),
          const Icon(Icons.chevron_right_rounded),
        ],
      ),
    ),
  );
}
