import 'package:lunas_mobile/features/reporting/presentation/widgets/report_submitted_dialog.dart';
import 'package:lunas_mobile/core/widgets/quiet_data_refresh.dart';

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:lunas_mobile/app/app_services.dart';
import 'package:lunas_mobile/core/network/api_exception.dart';
import 'package:lunas_mobile/core/theme/app_colors.dart';
import 'package:lunas_mobile/core/theme/app_radius.dart';
import 'package:lunas_mobile/core/theme/app_spacing.dart';
import 'package:lunas_mobile/features/citizen/presentation/widgets/citizen_scaffold.dart';
import 'package:lunas_mobile/core/widgets/lunas_card.dart';
import 'package:lunas_mobile/core/widgets/lunas_state_view.dart';
import 'package:lunas_mobile/features/auth/presentation/widgets/auth_scope.dart';
import 'package:lunas_mobile/features/reporting/data/models/incident_report.dart';
import 'package:lunas_mobile/features/reporting/presentation/widgets/report_status_timeline.dart';
import 'package:lunas_mobile/features/reporting/presentation/widgets/reporting_widgets.dart';
import 'package:lunas_mobile/features/reporting/data/models/reporting_restriction.dart';

class CitizenDashboardScreen extends StatefulWidget {
  const CitizenDashboardScreen({this.submittedReport, super.key});
  final IncidentReport? submittedReport;

  @override
  State<CitizenDashboardScreen> createState() => _CitizenDashboardScreenState();
}

class _CitizenDashboardScreenState extends State<CitizenDashboardScreen>
    with WidgetsBindingObserver, QuietDataRefresh<CitizenDashboardScreen> {
  bool _loading = true;
  String? _error;
  List<IncidentReport> _reports = const [];

  @override
  void initState() {
    super.initState();
    if (widget.submittedReport == null) {
      _loadReports();
    } else {
      WidgetsBinding.instance.addPostFrameCallback((_) async {
        await _loadReports();
        if (!mounted) return;
        final destination = await showDialog<String>(
          context: context,
          barrierDismissible: false,
          builder: (_) =>
              ReportSubmittedDialog(report: widget.submittedReport!),
        );
        if (!mounted) return;
        if (destination != null) context.go(destination);
      });
    }
  }

  @override
  Future<void> refreshVisibleData() => _loadReports(silent: true);

  Future<void> _loadReports({bool silent = false}) =>
      loadScreenData(_loadReportsData, quiet: silent);

  Future<void> _loadReportsData() async {
    if (!isQuietRefresh) {
      setState(() {
        _loading = true;
        _error = null;
      });
    }
    try {
      final reports = await reportService.getMyReports(limit: 5);
      if (!mounted) return;
      setState(() {
        _reports = reports;
        _error = null;
      });
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
    final user = AuthScope.of(context).user;
    return CitizenScaffold(
      title: 'LUNAS',
      fillAvailableHeight: _loading,
      titleWidget: Image.asset(
        'assets/icons/lunas_logo.png',
        height: 30,
        width: 30,
        fit: BoxFit.contain,
        semanticLabel: 'LUNAS',
      ),
      actions: [
        IconButton(
          onPressed: _loading ? null : _loadReports,
          tooltip: 'Refresh reports',
          icon: const Icon(Icons.refresh_rounded),
        ),
        const SizedBox(width: AppSpacing.sm),
      ],
      body: _loading
          ? const LunasHomeLoadingView()
          : Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text(
                  'Good Morning${user == null || user.firstName.isEmpty ? '' : ', ${user.firstName}'}',
                  style: Theme.of(context).textTheme.headlineLarge?.copyWith(
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: AppSpacing.xs),
                const Text('Report local issues and track their progress.'),
                const SizedBox(height: AppSpacing.xl),
                _ActiveReportSummary(reports: _reports),
                const SizedBox(height: AppSpacing.md),
                _ReportCallout(
                  restriction: user?.reportingRestriction,
                  onCreate: () => context.push(
                    user?.reportingRestriction.isBlocked == true
                        ? '/reports/appeal'
                        : '/reports/new',
                  ),
                ),
                const SizedBox(height: AppSpacing.md),
                Row(
                  children: [
                    Expanded(
                      child: _DashboardAction(
                        icon: Icons.map_outlined,
                        title: 'View Map',
                        subtitle: 'Explore the Map',
                        onTap: () => context.push('/reports/location'),
                      ),
                    ),
                    const SizedBox(width: AppSpacing.sm),
                    Expanded(
                      child: _DashboardAction(
                        icon: Icons.insights_outlined,
                        title: 'City Insights',
                        subtitle: 'Coming Soon',
                        onTap: null,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: AppSpacing.xxl),
                if (_error != null)
                  LunasStateView(
                    state: LunasViewState.error,
                    title: 'Could not load reports',
                    message: _error!,
                    actionLabel: 'Try Again',
                    onAction: _loadReports,
                    compact: true,
                  )
                else ...[
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          'Recent Reports',
                          style: Theme.of(context).textTheme.titleLarge,
                        ),
                      ),
                      TextButton(
                        onPressed: () => context.go('/reports'),
                        child: const Text('View All'),
                      ),
                    ],
                  ),
                  if (_reports.isEmpty)
                    LunasStateView(
                      state: LunasViewState.empty,
                      title: 'No reports yet',
                      message:
                          'When you submit a report, its status and history will appear here.',
                      actionLabel: user?.reportingRestriction.isBlocked == true
                          ? 'Open Appeal'
                          : 'New Report',
                      onAction: () => context.push(
                        user?.reportingRestriction.isBlocked == true
                            ? '/reports/appeal'
                            : '/reports/new',
                      ),
                      compact: true,
                    )
                  else
                    ..._reports.map(
                      (report) => Padding(
                        padding: const EdgeInsets.only(bottom: AppSpacing.sm),
                        child: _ReportListCard(
                          report: report,
                          onTap: () => context.push('/reports/${report.id}'),
                        ),
                      ),
                    ),
                ],
              ],
            ),
    );
  }
}

class _ReportCallout extends StatelessWidget {
  const _ReportCallout({required this.onCreate, this.restriction});
  final VoidCallback onCreate;
  final ReportingRestriction? restriction;

  @override
  Widget build(BuildContext context) {
    final blocked = restriction?.isBlocked == true;
    return Container(
      padding: const EdgeInsets.all(AppSpacing.lg),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF004D99), Color(0xFF087CC7)],
        ),
        borderRadius: AppRadius.card,
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  blocked ? 'Report submission paused' : 'Report an Issue',
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    color: Colors.white,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: AppSpacing.xs),
                Text(
                  blocked
                      ? 'You can appeal the current reporting restriction.'
                      : 'Report a local infrastructure concern.',
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: Colors.white.withValues(alpha: .9),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: AppSpacing.md),
          IconButton.filledTonal(
            tooltip: 'Start a report',
            onPressed: onCreate,
            icon: Icon(
              blocked ? Icons.rate_review_outlined : Icons.add_rounded,
              size: 24,
            ),
            style: IconButton.styleFrom(
              fixedSize: const Size.square(48),
              padding: EdgeInsets.zero,
              shape: const CircleBorder(),
              backgroundColor: Colors.white.withValues(alpha: .18),
              foregroundColor: Colors.white,
            ),
          ),
        ],
      ),
    );
  }
}

class _ActiveReportSummary extends StatelessWidget {
  const _ActiveReportSummary({required this.reports});
  final List<IncidentReport> reports;

  @override
  Widget build(BuildContext context) {
    final active = reports
        .where(
          (report) => !{
            'resolved',
            'closed',
            'rejected',
            'duplicate',
          }.contains(report.status),
        )
        .length;
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: () => context.go('/reports'),
        borderRadius: AppRadius.card,
        child: Ink(
          padding: const EdgeInsets.all(AppSpacing.lg),
          decoration: BoxDecoration(
            color: const Color(0xFFE1EAFF),
            borderRadius: AppRadius.card,
            border: Border.all(color: const Color(0xFFD1DDF7)),
          ),
          child: Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Active Reports',
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                    const SizedBox(height: AppSpacing.xs),
                    Text(
                      active == 0
                          ? 'No reports awaiting review or repair.'
                          : 'Reports still being reviewed or repaired.',
                      style: Theme.of(context).textTheme.bodyMedium,
                    ),
                  ],
                ),
              ),
              CircleAvatar(
                radius: 24,
                backgroundColor: AppColorsLight.info,
                child: Text(
                  '$active',
                  style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                    fontSize: 24,
                    height: 1,
                    color: Colors.white,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _DashboardAction extends StatelessWidget {
  const _DashboardAction({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.onTap,
  });

  final IconData icon;
  final String title;
  final String subtitle;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) => Material(
    color: onTap == null ? const Color(0xFFEDEFF2) : const Color(0xFFE1EAFF),
    borderRadius: AppRadius.card,
    child: InkWell(
      onTap: onTap,
      borderRadius: AppRadius.card,
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.md),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(
              icon,
              color: onTap == null
                  ? const Color(0xFF8A919C)
                  : AppColorsLight.brandBase,
              size: 28,
            ),
            const SizedBox(height: AppSpacing.md),
            Text(
              title,
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                color: onTap == null ? const Color(0xFF747C88) : null,
              ),
            ),
            Text(subtitle, style: Theme.of(context).textTheme.bodySmall),
          ],
        ),
      ),
    ),
  );
}

class ReportListCard extends StatelessWidget {
  const ReportListCard({required this.report, required this.onTap, super.key});
  final IncidentReport report;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) =>
      _ReportListCard(report: report, onTap: onTap);
}

class _ReportListCard extends StatelessWidget {
  const _ReportListCard({required this.report, required this.onTap});
  final IncidentReport report;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) => LunasCard(
    onTap: onTap,
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Icon(
              categoryIcon(report.category),
              color: Theme.of(context).colorScheme.primary,
            ),
            const SizedBox(width: AppSpacing.sm),
            Expanded(
              child: Text(
                report.categoryLabel,
                style: Theme.of(context).textTheme.titleMedium,
              ),
            ),
            ReportStatusChip(label: report.statusChipLabel),
          ],
        ),
        const SizedBox(height: AppSpacing.sm),
        Text(
          report.reportNumber,
          style: Theme.of(
            context,
          ).textTheme.bodySmall?.copyWith(fontFamily: 'RobotoMono'),
        ),
        const SizedBox(height: AppSpacing.xxs),
        Text(
          report.location.displayAddress,
          style: Theme.of(context).textTheme.bodySmall,
        ),
        if (report.repair != null) ...[
          const SizedBox(height: AppSpacing.xxs),
          Text(
            report.repair!.citizenStatusLabel,
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
              color: Theme.of(context).colorScheme.primary,
              fontWeight: FontWeight.w700,
            ),
          ),
        ],
      ],
    ),
  );
}
