import 'package:lunas_mobile/core/widgets/quiet_data_refresh.dart';
import 'package:flutter/material.dart';
import 'package:lunas_mobile/app/app_services.dart';
import 'package:lunas_mobile/core/network/api_exception.dart';
import 'package:lunas_mobile/core/theme/app_spacing.dart';
import 'package:lunas_mobile/core/widgets/lunas_app_bar.dart';
import 'package:lunas_mobile/core/widgets/lunas_card.dart';
import 'package:lunas_mobile/core/widgets/lunas_state_view.dart';
import 'package:lunas_mobile/features/reporting/data/models/incident_report.dart';
import 'package:lunas_mobile/features/reporting/presentation/widgets/report_status_timeline.dart';

/// Citizen timeline backed by the report/history endpoints.
class ReportTimelineScreen extends StatefulWidget {
  const ReportTimelineScreen({required this.reportId, super.key});
  final String reportId;

  @override
  State<ReportTimelineScreen> createState() => _ReportTimelineScreenState();
}

class _ReportTimelineScreenState extends State<ReportTimelineScreen>
    with WidgetsBindingObserver, QuietDataRefresh<ReportTimelineScreen> {
  bool _loading = true;
  String? _error;
  IncidentReport? _report;
  List<ReportStatusEvent> _events = const [];

  @override
  void initState() {
    super.initState();
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
      final report = await reportService.getReport(widget.reportId);
      List<ReportStatusEvent> events;
      try {
        events = await reportService.getHistory(widget.reportId);
      } on ApiException {
        events = report.statusHistory;
      }
      if (mounted) {
        setState(() {
          _error = null;
          _report = report;
          _events = events;
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
    if (_loading) {
      return const Scaffold(
        body: LunasStateView(
          state: LunasViewState.loading,
          title: 'Loading timeline',
          message: 'Getting the latest report activity.',
        ),
      );
    }
    if (_error != null || _report == null) {
      return Scaffold(
        appBar: const LunasAppBar(
          title: 'Report Timeline',
          showBackButton: true,
        ),
        body: LunasStateView(
          state: LunasViewState.error,
          title: 'Could not load timeline',
          message: _error ?? 'Report unavailable.',
          actionLabel: 'Try Again',
          onAction: _load,
        ),
      );
    }
    final report = _report!;
    return Scaffold(
      appBar: LunasAppBar(
        title: 'Report Timeline',
        subtitle: report.reportNumber,
        showBackButton: true,
      ),
      body: SafeArea(
        top: false,
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(
            AppSpacing.xl,
            AppSpacing.md,
            AppSpacing.xl,
            AppSpacing.xxl,
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              LunasCard(
                child: _events.isEmpty
                    ? const Text(
                        'No updates yet. Report activity will appear here.',
                      )
                    : ReportStatusTimeline(events: _events),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
