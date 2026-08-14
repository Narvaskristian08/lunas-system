import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:lunas_mobile/core/app_services.dart';
import 'package:lunas_mobile/core/network/api_exception.dart';
import 'package:lunas_mobile/core/theme/app_spacing.dart';
import 'package:lunas_mobile/core/widgets/citizen_scaffold.dart';
import 'package:lunas_mobile/core/widgets/lunas_state_view.dart';
import 'package:lunas_mobile/features/citizen/presentation/screens/citizen_dashboard_screen.dart';
import 'package:lunas_mobile/features/reporting/data/models/incident_report.dart';

class MyReportsScreen extends StatefulWidget {
  const MyReportsScreen({super.key});

  @override
  State<MyReportsScreen> createState() => _MyReportsScreenState();
}

class _MyReportsScreenState extends State<MyReportsScreen> {
  bool _loading = true;
  String? _error;
  String _filter = 'all';
  List<IncidentReport> _reports = const [];

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
      final reports = await reportService.getMyReports(limit: 50);
      if (mounted) setState(() => _reports = reports);
    } on ApiException catch (error) {
      if (mounted) setState(() => _error = error.message);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final filtered = _filter == 'all'
        ? _reports
        : _reports.where((report) => report.status == _filter).toList();
    final filterOptions = <(String, String)>[
      ('all', 'All'),
      ('submitted', 'Submitted'),
      ('validated', 'Validated'),
      ('rejected', 'Rejected'),
      ('duplicate', 'Marked duplicate'),
      ('in_progress', 'In progress'),
      ('closed', 'Closed'),
    ];
    return CitizenScaffold(
      title: 'My reports',
      subtitle: 'Only reports submitted by your account',
      selectedIndex: 1,
      actions: [
        IconButton(
          onPressed: _loading ? null : _load,
          tooltip: 'Refresh reports',
          icon: const Icon(Icons.refresh_rounded),
        ),
        const SizedBox(width: AppSpacing.sm),
      ],
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          if (!_loading && _error == null && _reports.isNotEmpty)
            SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: [
                  for (final option in filterOptions)
                    Padding(
                      padding: const EdgeInsets.only(right: AppSpacing.xs),
                      child: ChoiceChip(
                        label: Text(option.$2),
                        selected: _filter == option.$1,
                        onSelected: (_) => setState(() => _filter = option.$1),
                      ),
                    ),
                ],
              ),
            ),
          const SizedBox(height: AppSpacing.md),
          if (_loading)
            const LunasStateView(
              state: LunasViewState.loading,
              title: 'Loading your reports',
              message: 'Checking report status and history.',
            )
          else if (_error != null)
            LunasStateView(
              state: LunasViewState.error,
              title: 'Could not load your reports',
              message: _error!,
              actionLabel: 'Try again',
              onAction: _load,
            )
          else if (filtered.isEmpty)
            LunasStateView(
              state: LunasViewState.empty,
              title: _reports.isEmpty ? 'No reports yet' : 'No matching reports',
              message: _reports.isEmpty
                  ? 'Start a report when you see an infrastructure concern.'
                  : 'Choose another status to see other reports.',
              actionLabel: _reports.isEmpty ? 'Create report' : null,
              onAction: _reports.isEmpty ? () => context.push('/reports/new') : null,
            )
          else
            ...filtered.map(
              (report) => Padding(
                padding: const EdgeInsets.only(bottom: AppSpacing.sm),
                child: ReportListCard(
                  report: report,
                  onTap: () => context.push('/reports/${report.id}'),
                ),
              ),
            ),
        ],
      ),
    );
  }
}
