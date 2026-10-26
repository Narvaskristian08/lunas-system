import 'package:lunas_mobile/features/reporting/presentation/widgets/agency_schedule_card.dart';
import 'package:lunas_mobile/core/theme/app_radius.dart';
import 'package:lunas_mobile/features/reporting/presentation/widgets/report_submitted_dialog.dart';
import 'package:lunas_mobile/core/widgets/quiet_data_refresh.dart';

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:lunas_mobile/app/app_services.dart';
import 'package:lunas_mobile/core/theme/app_spacing.dart';
import 'package:lunas_mobile/core/theme/text_styles.dart';
import 'package:lunas_mobile/features/citizen/presentation/widgets/citizen_scaffold.dart';
import 'package:lunas_mobile/core/widgets/lunas_card.dart';
import 'package:lunas_mobile/core/widgets/lunas_state_view.dart';
import 'package:lunas_mobile/features/auth/presentation/widgets/auth_scope.dart';
import 'package:lunas_mobile/features/reporting/data/models/incident_report.dart';
import 'package:lunas_mobile/features/reporting/presentation/widgets/report_status_timeline.dart';
import 'package:lunas_mobile/features/reporting/presentation/widgets/reporting_widgets.dart';
import 'package:lunas_mobile/features/reporting/data/models/reporting_restriction.dart';
import 'package:lunas_mobile/features/reporting/data/models/daily_report_limit.dart';

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
  int? _activeTotal;
  int? _resolvedTotal;
  DailyReportLimit? _dailyReportLimit;

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
    Future<void> loadRecent() async {
      try {
        final reports = await reportService.getMyReports(limit: 5);
        if (mounted) {
          setState(() {
            _reports = reports;
            _error = null;
          });
        }
      } catch (_) {
        if (mounted && !isQuietRefresh) {
          setState(
            () =>
                _error = 'Could not refresh recent reports. Please try again.',
          );
        }
      }
    }

    Future<void> loadTotal(String filter) async {
      try {
        final result = await reportService.getMyReportsPage(
          limit: 1,
          filter: filter,
        );
        if (mounted) {
          setState(() {
            if (filter == 'active') {
              _activeTotal = result.total;
            } else {
              _resolvedTotal = result.total;
            }
          });
        }
      } catch (_) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Could not refresh the $filter report count.'),
            ),
          );
        }
      }
    }

    Future<void> loadDailyLimit() async {
      try {
        final limit = await reportService.getDailyReportLimit();
        if (mounted) setState(() => _dailyReportLimit = limit);
      } catch (_) {
        // The API remains authoritative if the display endpoint is unavailable.
        if (mounted) setState(() => _dailyReportLimit = null);
      }
    }

    await Future.wait([
      loadRecent(),
      loadTotal('active'),
      loadTotal('resolved'),
      loadDailyLimit(),
    ]);
    if (mounted) setState(() => _loading = false);
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
                  'Hello${user == null || user.firstName.isEmpty ? '' : ', ${user.firstName}'}',
                  style: Theme.of(context).textTheme.headlineLarge?.copyWith(
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: AppSpacing.xs),
                const Text('Report local issues and track their progress.'),
                const SizedBox(height: AppSpacing.xl),
                IntrinsicHeight(
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Expanded(
                        child: _ReportSummaryCard(
                          title: 'Active Reports',
                          count: _activeTotal,
                          subtitle: 'Under review or repair',
                          icon: Icons.pending_actions_rounded,
                          color: const Color(0xFF0055A4),
                          background: const Color(0xFFE8F0FF),
                          filter: 'active',
                        ),
                      ),
                      const SizedBox(width: AppSpacing.sm),
                      Expanded(
                        child: _ReportSummaryCard(
                          title: 'Resolved',
                          count: _resolvedTotal,
                          subtitle: 'Verified and completed',
                          icon: Icons.task_alt_rounded,
                          color: const Color(0xFF18734B),
                          background: const Color(0xFFE8F5EE),
                          filter: 'resolved',
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: AppSpacing.md),
                _ReportCallout(
                  restriction: user?.reportingRestriction,
                  dailyLimit: _dailyReportLimit,
                  onCreate: () => context.push(
                    user?.reportingRestriction.isBlocked == true
                        ? '/reports/appeal'
                        : '/reports/new',
                  ),
                ),
                const SizedBox(height: AppSpacing.xl),
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
  const _ReportCallout({
    required this.onCreate,
    this.restriction,
    this.dailyLimit,
  });
  final VoidCallback onCreate;
  final ReportingRestriction? restriction;
  final DailyReportLimit? dailyLimit;

  @override
  Widget build(BuildContext context) {
    final blocked = restriction?.isBlocked == true;
    final limitReached = dailyLimit?.isExhausted == true;
    final disabled = blocked || limitReached;
    return GestureDetector(
      onTap: disabled ? null : onCreate,
      child: Container(
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
                    blocked
                        ? 'Report submission paused'
                        : limitReached
                        ? 'Daily report limit reached'
                        : 'Report an Issue',
                    style: Theme.of(context).textTheme.titleLarge?.copyWith(
                      color: Colors.white,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const SizedBox(height: AppSpacing.xs),
                  Text(
                    blocked
                        ? 'You can appeal the current reporting restriction.'
                        : limitReached
                        ? dailyLimit!.resetLabel
                        : dailyLimit?.remainingLabel ??
                              'Report a local infrastructure concern.',
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
              onPressed: disabled ? null : onCreate,
              icon: Icon(
                blocked
                    ? Icons.rate_review_outlined
                    : limitReached
                    ? Icons.schedule_outlined
                    : Icons.add_rounded,
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
      ),
    );
  }
}

class _ReportSummaryCard extends StatelessWidget {
  const _ReportSummaryCard({
    required this.title,
    required this.count,
    required this.subtitle,
    required this.icon,
    required this.color,
    required this.background,
    required this.filter,
  });

  final String title;
  final int? count;
  final String subtitle;
  final IconData icon;
  final Color color;
  final Color background;
  final String filter;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Semantics(
      button: true,
      label: '$title: ${count ?? "unavailable"}. View reports.',
      onTap: () => context.go('/reports?filter=$filter'),
      excludeSemantics: true,
      child: Material(
        color: theme.brightness == Brightness.dark
            ? theme.colorScheme.surfaceContainerHigh
            : background,
        shape: RoundedRectangleBorder(
          borderRadius: AppRadius.card,
          side: BorderSide(color: color.withValues(alpha: .15)),
        ),
        clipBehavior: Clip.antiAlias,
        child: InkWell(
          onTap: () => context.go('/reports?filter=$filter'),
          child: Padding(
            padding: const EdgeInsets.all(AppSpacing.md),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Icon(icon, color: color, size: 24),
                const SizedBox(height: AppSpacing.sm),
                Text(
                  count?.toString() ?? '—',
                  style: theme.textTheme.headlineLarge?.copyWith(
                    color: color,
                    fontWeight: FontWeight.w800,
                    height: 1.1,
                  ),
                ),
                const SizedBox(height: AppSpacing.xs),
                Text(
                  title,
                  style: theme.textTheme.titleSmall?.copyWith(
                    color: theme.colorScheme.onSurface,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: AppSpacing.xxs),
                Text(
                  subtitle,
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: theme.colorScheme.onSurfaceVariant,
                    height: 1.4,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
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
        ReportStatusHeader(
          title: report.categoryLabel,
          status: report.statusChipLabel,
          leading: Icon(
            categoryIcon(report.category),
            color: Theme.of(context).colorScheme.primary,
          ),
        ),
        const SizedBox(height: AppSpacing.sm),
        Text(
          report.reportNumber,
          style: AppTextStyles.technicalHash.copyWith(
            color: Theme.of(context).colorScheme.onSurfaceVariant,
          ),
        ),
        const SizedBox(height: AppSpacing.xxs),
        Text(
          report.location.displayAddress,
          style: Theme.of(context).textTheme.bodySmall,
        ),
        const SizedBox(height: AppSpacing.md),
        ReportWorkflowProgress(report: report),
        const Padding(
          padding: EdgeInsets.symmetric(vertical: AppSpacing.sm),
          child: Divider(height: 1),
        ),
        if (report.agencyStatusLabel != null) ...[
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(AppSpacing.sm),
            decoration: BoxDecoration(
              color: Theme.of(
                context,
              ).colorScheme.primaryContainer.withValues(alpha: 0.35),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Icon(
                  Icons.engineering_outlined,
                  size: 20,
                  color: Theme.of(context).colorScheme.primary,
                ),
                const SizedBox(width: AppSpacing.xs),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Agency status',
                        style: Theme.of(context).textTheme.labelMedium,
                      ),
                      const SizedBox(height: AppSpacing.xxs),
                      Text(
                        report.agencyStatusLabel!,
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: AppSpacing.sm),
        ],
        AgencyScheduleCard(schedule: report.agencySchedule, compact: true),
        if (report.location.needsReview) ...[
          const SizedBox(height: AppSpacing.xs),
          _LocationReviewNotice(compact: true),
        ],
      ],
    ),
  );
}

class _LocationReviewNotice extends StatelessWidget {
  const _LocationReviewNotice({this.compact = false});

  final bool compact;

  @override
  Widget build(BuildContext context) {
    final color = Theme.of(context).colorScheme.error;
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(
          Icons.location_off_outlined,
          size: compact ? 15 : 18,
          color: color,
        ),
        const SizedBox(width: AppSpacing.xs),
        Flexible(
          child: Text(
            'Location Needs Review',
            style: Theme.of(context).textTheme.labelMedium?.copyWith(
              color: color,
              fontWeight: FontWeight.w700,
            ),
          ),
        ),
      ],
    );
  }
}
