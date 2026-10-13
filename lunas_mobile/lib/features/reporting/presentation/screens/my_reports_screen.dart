import 'dart:async';
import 'package:lunas_mobile/core/widgets/lunas_filter_button.dart';
import 'package:lunas_mobile/core/widgets/quiet_data_refresh.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:lunas_mobile/app/app_services.dart';
import 'package:lunas_mobile/core/network/api_exception.dart';
import 'package:lunas_mobile/core/theme/app_spacing.dart';
import 'package:lunas_mobile/features/citizen/presentation/widgets/citizen_scaffold.dart';
import 'package:lunas_mobile/core/widgets/lunas_state_view.dart';
import 'package:lunas_mobile/features/citizen/presentation/screens/citizen_dashboard_screen.dart';
import 'package:lunas_mobile/features/reporting/data/models/incident_report.dart';

class MyReportsScreen extends StatefulWidget {
  const MyReportsScreen({super.key, this.initialFilter});
  final String? initialFilter;

  @override
  State<MyReportsScreen> createState() => _MyReportsScreenState();
}

class _MyReportsScreenState extends State<MyReportsScreen>
    with WidgetsBindingObserver, QuietDataRefresh<MyReportsScreen> {
  bool _loading = true;
  String? _error;
  String _filter = 'all';
  String _query = '';
  final _searchController = TextEditingController();
  Timer? _debounce;
  int _page = 1, _pages = 1;
  bool _loadingMore = false;

  @override
  void dispose() {
    _debounce?.cancel();
    _searchController.dispose();
    super.dispose();
  }

  void _changeFilter(String value) {
    if (_filter == value) return;
    setState(() {
      _filter = value;
      _page = 1;
    });
    _load();
  }

  Future<void> _more() async {
    if (_loadingMore || _loading || _page >= _pages) return;
    setState(() => _loadingMore = true);
    final filter = _filter, query = _query;
    try {
      final result = await reportService.getMyReportsPage(
        page: _page + 1,
        filter: filter,
        search: query,
      );
      if (!mounted || filter != _filter || query != _query) return;
      setState(() {
        final ids = _reports.map((report) => report.id).toSet();
        _reports = [
          ..._reports,
          ...result.items.where((report) => ids.add(report.id)),
        ];
        _page = result.page;
        _pages = result.pages;
      });
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Could not load more reports. Please try again.'),
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _loadingMore = false);
    }
  }

  List<IncidentReport> _reports = const [];

  @override
  void didUpdateWidget(covariant MyReportsScreen oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.initialFilter != oldWidget.initialFilter) {
      _changeFilter(
        {'active', 'resolved', 'in_progress'}.contains(widget.initialFilter)
            ? widget.initialFilter!
            : 'all',
      );
    }
  }

  @override
  void initState() {
    super.initState();
    _filter =
        {
          'all',
          'active',
          'resolved',
          'in_progress',
        }.contains(widget.initialFilter)
        ? widget.initialFilter!
        : 'all';
    _load();
  }

  @override
  Future<void> refreshVisibleData() => _load(quiet: true);

  Future<void> _load({bool quiet = false}) =>
      loadScreenData(_loadData, quiet: quiet);

  Future<void> _loadData() async {
    if (!isQuietRefresh) {
      setState(() {
        _loading = true;
        _error = null;
      });
    }
    try {
      final filter = _filter, query = _query;
      final results = <IncidentReport>[];
      final requestedPages = isQuietRefresh ? _page : 1;
      var lastPage = 1, totalPages = 1;
      for (var index = 1; index <= requestedPages; index++) {
        final result = await reportService.getMyReportsPage(
          page: index,
          filter: filter,
          search: query,
        );
        results.addAll(result.items);
        lastPage = result.page;
        totalPages = result.pages;
        if (index >= totalPages) break;
      }
      if (filter != _filter || query != _query) return;
      final reports = results;
      if (mounted) {
        setState(() {
          _reports = reports;
          _page = lastPage;
          _pages = totalPages;
          _error = null;
        });
      }
    } on ApiException catch (error) {
      if (mounted && !isQuietRefresh) {
        setState(() => _error = error.message);
      }
    } finally {
      if (mounted) {
        setState(() => _loading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final filtered = _reports;
    final filterOptions = <(String, String)>[
      ('all', 'All'),
      ('active', 'Active'),
      ('in_progress', 'In Progress'),
      ('resolved', 'Resolved'),
    ];
    return CitizenScaffold(
      title: 'My Reports',
      showReportFab: true,
      fillAvailableHeight: _loading || _error != null || filtered.isEmpty,
      subtitle: 'Track the progress of your reports.',
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
          if (!_loading && _error == null) ...[
            TextField(
              controller: _searchController,
              maxLength: 100,
              onChanged: (value) {
                _debounce?.cancel();
                _debounce = Timer(const Duration(milliseconds: 300), () {
                  if (mounted) {
                    setState(() {
                      _query = value;
                      _page = 1;
                    });
                    _load();
                  }
                });
              },
              decoration: const InputDecoration(
                counterText: '',
                hintText: 'Search reports by ID, type, or location',
                prefixIcon: Icon(Icons.search_rounded),
              ),
            ),
            const SizedBox(height: AppSpacing.md),
          ],
          if (!_loading && _error == null)
            Row(
              children: [
                for (var index = 0; index < filterOptions.length; index++) ...[
                  if (index > 0) const SizedBox(width: AppSpacing.xs),
                  Expanded(
                    child: LunasFilterButton(
                      label: filterOptions[index].$2,
                      selected: _filter == filterOptions[index].$1,
                      onTap: () => _changeFilter(filterOptions[index].$1),
                    ),
                  ),
                ],
              ],
            ),
          const SizedBox(height: AppSpacing.md),
          if (_loading)
            const Expanded(
              child: LunasStateView(
                state: LunasViewState.loading,
                title: 'Loading your reports',
                message: 'Checking report status and history.',
              ),
            )
          else if (_error != null)
            Expanded(
              child: LunasStateView(
                state: LunasViewState.error,
                title: 'Could not load your reports',
                message: _error!,
                actionLabel: 'Try Again',
                onAction: _load,
              ),
            )
          else if (filtered.isEmpty)
            Expanded(
              child: Align(
                alignment: const Alignment(0, -.18),
                child: LunasStateView(
                  state: LunasViewState.empty,
                  title: _reports.isEmpty
                      ? 'No reports yet'
                      : 'No matching reports',
                  message: _reports.isEmpty
                      ? 'Start a report when you see an infrastructure concern.'
                      : _query.trim().isNotEmpty
                      ? 'Try another search or clear the search and filters.'
                      : 'Choose another status to see other reports.',
                  actionLabel: _reports.isEmpty ? 'Create report' : null,
                  onAction: _reports.isEmpty
                      ? () => context.push('/reports/new')
                      : null,
                ),
              ),
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
          if (!_loading && _error == null && _page < _pages)
            TextButton(
              onPressed: _loadingMore ? null : _more,
              child: Text(_loadingMore ? 'Loading…' : 'Load More'),
            ),
        ],
      ),
    );
  }
}
