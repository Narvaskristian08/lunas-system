import 'package:flutter/material.dart';
import 'package:lunas_mobile/core/app_services.dart';
import 'package:lunas_mobile/core/network/api_exception.dart';
import 'package:lunas_mobile/core/theme/app_spacing.dart';
import 'package:lunas_mobile/core/widgets/lunas_card.dart';
import 'package:lunas_mobile/core/widgets/lunas_state_view.dart';

/// Barangay statistics from the server-enforced jurisdiction scope.
class OfficialStatisticsScreen extends StatefulWidget {
  const OfficialStatisticsScreen({super.key});

  @override
  State<OfficialStatisticsScreen> createState() =>
      _OfficialStatisticsScreenState();
}

class _OfficialStatisticsScreenState extends State<OfficialStatisticsScreen> {
  bool _loading = true;
  String? _error;
  Map<String, dynamic> _incidents = const {};

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
      final payload = await validationService.getDashboardStats();
      final data = payload['data'];
      final incidents = data is Map ? data['incidents'] : null;
      if (mounted) {
        setState(
          () => _incidents = incidents is Map
              ? Map<String, dynamic>.from(incidents)
              : <String, dynamic>{},
        );
      }
    } on ApiException catch (error) {
      if (mounted) setState(() => _error = error.message);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  List<Map<String, dynamic>> _items(String key) {
    final value = _incidents[key];
    return value is List
        ? value
              .whereType<Map>()
              .map((item) => Map<String, dynamic>.from(item))
              .toList()
        : const [];
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(
      title: const Text('Barangay statistics'),
      actions: [
        IconButton(
          onPressed: _loading ? null : _load,
          tooltip: 'Refresh statistics',
          icon: const Icon(Icons.refresh_rounded),
        ),
      ],
    ),
    body: _loading
        ? const LunasStateView(
            state: LunasViewState.loading,
            title: 'Loading barangay statistics',
            message: 'Getting data in your authorized jurisdiction.',
          )
        : _error != null
        ? LunasStateView(
            state: LunasViewState.error,
            title: 'Could not load statistics',
            message: _error!,
            actionLabel: 'Retry',
            onAction: _load,
          )
        : ListView(
            padding: const EdgeInsets.all(AppSpacing.lg),
            children: [
              Wrap(
                spacing: AppSpacing.sm,
                runSpacing: AppSpacing.sm,
                children: [
                  _metric(context, 'Total incidents', _incidents['total']),
                  _metric(context, 'Pending validation', _incidents['pending']),
                  _metric(context, 'Active', _incidents['inProgress']),
                  _metric(context, 'Overdue', _incidents['overdue']),
                  _metric(context, 'Completed', _incidents['completed']),
                ],
              ),
              const SizedBox(height: AppSpacing.lg),
              Text(
                'By category',
                style: Theme.of(context).textTheme.titleLarge,
              ),
              const SizedBox(height: AppSpacing.sm),
              if (_items('byCategory').isEmpty)
                const LunasCard(
                  child: Text('No category breakdown is available.'),
                )
              else
                for (final item in _items('byCategory'))
                  ListTile(
                    title: Text((item['_id'] ?? 'Unspecified').toString()),
                    trailing: Text('${item['count'] ?? 0}'),
                  ),
              const SizedBox(height: AppSpacing.lg),
              Text(
                'By priority',
                style: Theme.of(context).textTheme.titleLarge,
              ),
              const SizedBox(height: AppSpacing.sm),
              if (_items('byPriority').isEmpty)
                const LunasCard(
                  child: Text('No priority breakdown is available.'),
                )
              else
                for (final item in _items('byPriority'))
                  ListTile(
                    title: Text((item['_id'] ?? 'Unspecified').toString()),
                    trailing: Text('${item['count'] ?? 0}'),
                  ),
            ],
          ),
  );

  Widget _metric(BuildContext context, String title, Object? value) => SizedBox(
    width: 155,
    child: LunasCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: Theme.of(context).textTheme.bodySmall),
          const SizedBox(height: AppSpacing.sm),
          Text(
            '${value ?? 0}',
            style: Theme.of(
              context,
            ).textTheme.headlineMedium?.copyWith(fontWeight: FontWeight.w800),
          ),
        ],
      ),
    ),
  );
}
