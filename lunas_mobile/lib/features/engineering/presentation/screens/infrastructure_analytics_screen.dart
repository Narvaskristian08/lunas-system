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

/// City analytics shown only from the authenticated engineering workspace.
class InfrastructureAnalyticsScreen extends StatefulWidget {
  const InfrastructureAnalyticsScreen({super.key});

  @override
  State<InfrastructureAnalyticsScreen> createState() =>
      _InfrastructureAnalyticsScreenState();
}

class _InfrastructureAnalyticsScreenState
    extends State<InfrastructureAnalyticsScreen> {
  bool _loading = true;
  String? _error;
  Map<String, dynamic> _data = const {};

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
      final payload = await validationService.getAnalytics();
      final raw = payload['data'];
      if (mounted) {
        setState(
          () => _data = raw is Map
              ? Map<String, dynamic>.from(raw)
              : <String, dynamic>{},
        );
      }
    } on ApiException catch (error) {
      if (mounted) setState(() => _error = error.message);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  List<Map<String, dynamic>> _rows(String key) {
    final value = _data[key];
    if (value is! List) return const [];
    return value
        .whereType<Map>()
        .map((row) => Map<String, dynamic>.from(row))
        .toList();
  }

  @override
  Widget build(BuildContext context) => EngineeringPage(
    title: 'Infrastructure analytics',
    subtitle: 'City-level trends returned by LUNAS',
    actions: [
      IconButton(
        onPressed: _loading ? null : _load,
        tooltip: 'Refresh analytics',
        icon: const Icon(Icons.refresh_rounded),
      ),
      const SizedBox(width: AppSpacing.sm),
    ],
    child: _loading
        ? const LunasStateView(
            state: LunasViewState.loading,
            title: 'Loading analytics',
            message: 'Getting city-wide incident and resolution data.',
          )
        : _error != null
        ? LunasStateView(
            state: LunasViewState.error,
            title: 'Could not load analytics',
            message: _error!,
            actionLabel: 'Retry',
            onAction: _load,
          )
        : Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              EngineeringMetricCard(
                label: 'Average resolution time',
                value: '${_data['avgResolutionTime'] ?? '—'} hrs',
                icon: Icons.timelapse_rounded,
                color: AppColorsLight.brandBase,
              ),
              const SizedBox(height: AppSpacing.lg),
              EngineeringSectionHeading(
                title: 'Incidents by barangay',
                description: 'Counts from the authorized city analytics API.',
              ),
              const SizedBox(height: AppSpacing.sm),
              if (_rows('topBarangays').isEmpty)
                const LunasCard(
                  child: Text('No barangay distribution data is available.'),
                )
              else
                for (final row in _rows('topBarangays'))
                  Padding(
                    padding: const EdgeInsets.only(bottom: AppSpacing.xs),
                    child: LunasCard(
                      child: Row(
                        children: [
                          Expanded(
                            child: Text(
                              (row['_id'] ?? 'Unspecified').toString(),
                            ),
                          ),
                          Text(
                            '${row['count'] ?? 0} incidents',
                            style: Theme.of(context).textTheme.labelLarge
                                ?.copyWith(fontWeight: FontWeight.w700),
                          ),
                        ],
                      ),
                    ),
                  ),
              const SizedBox(height: AppSpacing.lg),
              EngineeringSectionHeading(
                title: 'Incident trend',
                description: 'Daily incident volume returned by the backend.',
              ),
              const SizedBox(height: AppSpacing.sm),
              if (_rows('incidentsOverTime').isEmpty)
                const LunasCard(
                  child: Text('No incident trend data is available.'),
                )
              else
                LunasCard(
                  child: Column(
                    children: [
                      for (final row in _rows('incidentsOverTime'))
                        ListTile(
                          dense: true,
                          contentPadding: EdgeInsets.zero,
                          leading: const Icon(
                            Icons.trending_up_rounded,
                            color: AppColorsLight.brandBase,
                          ),
                          title: Text(
                            '${row['_id']?['year'] ?? ''}-${row['_id']?['month'] ?? ''}-${row['_id']?['day'] ?? ''}',
                          ),
                          trailing: Text('${row['count'] ?? 0}'),
                        ),
                    ],
                  ),
                ),
              const SizedBox(height: AppSpacing.md),
              LunasCard(
                onTap: () => context.push(EngineeringRoutes.performance),
                child: const Row(
                  children: [
                    Icon(Icons.bar_chart_rounded),
                    SizedBox(width: AppSpacing.md),
                    Expanded(child: Text('Open performance reports')),
                    Icon(Icons.chevron_right_rounded),
                  ],
                ),
              ),
              const SizedBox(height: AppSpacing.md),
              const LunasCard(
                child: Text(
                  'Infrastructure health scores and heat-map data are not returned by the current analytics API.',
                ),
              ),
            ],
          ),
  );
}
