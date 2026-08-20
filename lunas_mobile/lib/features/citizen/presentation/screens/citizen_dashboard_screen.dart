import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:lunas_mobile/core/app_services.dart';
import 'package:lunas_mobile/core/network/api_exception.dart';
import 'package:lunas_mobile/core/theme/app_colors.dart';
import 'package:lunas_mobile/core/theme/app_radius.dart';
import 'package:lunas_mobile/core/theme/app_spacing.dart';
import 'package:lunas_mobile/core/widgets/citizen_scaffold.dart';
import 'package:lunas_mobile/core/widgets/lunas_card.dart';
import 'package:lunas_mobile/core/widgets/lunas_state_view.dart';
import 'package:lunas_mobile/features/auth/presentation/widgets/auth_scope.dart';
import 'package:lunas_mobile/features/reporting/data/models/incident_report.dart';
import 'package:lunas_mobile/features/reporting/presentation/widgets/report_status_timeline.dart';
import 'package:lunas_mobile/features/reporting/presentation/widgets/reporting_widgets.dart';

class CitizenDashboardScreen extends StatefulWidget {
  const CitizenDashboardScreen({super.key});

  @override
  State<CitizenDashboardScreen> createState() => _CitizenDashboardScreenState();
}

class _CitizenDashboardScreenState extends State<CitizenDashboardScreen> {
  bool _loading = true;
  String? _error;
  List<IncidentReport> _reports = const [];

  @override
  void initState() {
    super.initState();
    _loadReports();
  }

  Future<void> _loadReports() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final reports = await reportService.getMyReports(limit: 5);
      if (!mounted) return;
      setState(() => _reports = reports);
    } on ApiException catch (error) {
      if (mounted) setState(() => _error = error.message);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = AuthScope.of(context).user;
    return CitizenScaffold(
      title: 'LUNAS',
      subtitle: 'Citizen reporting',
      selectedIndex: 0,
      actions: [
        IconButton(
          onPressed: _loading ? null : _loadReports,
          tooltip: 'Refresh reports',
          icon: const Icon(Icons.refresh_rounded),
        ),
        const SizedBox(width: AppSpacing.sm),
      ],
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(
            'Hello${user == null || user.firstName.isEmpty ? '' : ', ${user.firstName}'}',
            style: Theme.of(
              context,
            ).textTheme.headlineLarge?.copyWith(fontWeight: FontWeight.w800),
          ),
          const SizedBox(height: AppSpacing.xs),
          const Text(
            'Report an infrastructure concern and follow its current maintenance status here.',
          ),
          const SizedBox(height: AppSpacing.xl),
          _ReportCallout(onCreate: () => context.push('/reports/new')),
          const SizedBox(height: AppSpacing.xxl),
          if (_loading)
            const LunasStateView(
              state: LunasViewState.loading,
              title: 'Loading your reports',
              message: 'Getting your current report summary.',
              compact: true,
            )
          else if (_error != null)
            LunasStateView(
              state: LunasViewState.error,
              title: 'Could not load reports',
              message: _error!,
              actionLabel: 'Try again',
              onAction: _loadReports,
              compact: true,
            )
          else ...[
            _ReportSummary(reports: _reports),
            const SizedBox(height: AppSpacing.xxl),
            Row(
              children: [
                Expanded(
                  child: Text(
                    'Recent reports',
                    style: Theme.of(context).textTheme.titleLarge,
                  ),
                ),
                TextButton(
                  onPressed: () => context.go('/reports'),
                  child: const Text('View all'),
                ),
              ],
            ),
            if (_reports.isEmpty)
              LunasStateView(
                state: LunasViewState.empty,
                title: 'No reports yet',
                message:
                    'When you submit a report, its status and history will appear here.',
                actionLabel: 'Create report',
                onAction: () => context.push('/reports/new'),
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
  const _ReportCallout({required this.onCreate});
  final VoidCallback onCreate;

  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.all(AppSpacing.lg),
    decoration: BoxDecoration(
      gradient: const LinearGradient(
        colors: [Color(0xFF004D99), Color(0xFF087CC7)],
      ),
      borderRadius: AppRadius.card,
    ),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Icon(Icons.campaign_outlined, color: Colors.white, size: 30),
        const SizedBox(height: AppSpacing.md),
        Text(
          'Spot an infrastructure problem?',
          style: Theme.of(context).textTheme.titleLarge?.copyWith(
            color: Colors.white,
            fontWeight: FontWeight.w800,
          ),
        ),
        const SizedBox(height: AppSpacing.xs),
        Text(
          'Add clear evidence, confirm the location, and submit it for official review.',
          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
            color: Colors.white.withValues(alpha: .9),
          ),
        ),
        const SizedBox(height: AppSpacing.lg),
        FilledButton.icon(
          style: FilledButton.styleFrom(
            backgroundColor: Colors.white,
            foregroundColor: AppColorsLight.brandBase,
          ),
          onPressed: onCreate,
          icon: const Icon(Icons.add_a_photo_outlined),
          label: const Text('Start a report'),
        ),
      ],
    ),
  );
}

class _ReportSummary extends StatelessWidget {
  const _ReportSummary({required this.reports});
  final List<IncidentReport> reports;

  @override
  Widget build(BuildContext context) {
    final active = reports
        .where((report) => !{'closed', 'rejected'}.contains(report.status))
        .length;
    final submitted = reports
        .where((report) => report.status == 'submitted')
        .length;
    return Wrap(
      spacing: AppSpacing.sm,
      runSpacing: AppSpacing.sm,
      children: [
        _SummaryCard(
          label: 'Loaded reports',
          value: '${reports.length}',
          icon: Icons.assignment_outlined,
        ),
        _SummaryCard(
          label: 'Awaiting review',
          value: '$submitted',
          icon: Icons.rate_review_outlined,
        ),
        _SummaryCard(
          label: 'Active',
          value: '$active',
          icon: Icons.pending_actions_outlined,
        ),
      ],
    );
  }
}

class _SummaryCard extends StatelessWidget {
  const _SummaryCard({
    required this.label,
    required this.value,
    required this.icon,
  });
  final String label;
  final String value;
  final IconData icon;

  @override
  Widget build(BuildContext context) => SizedBox(
    width: 160,
    child: LunasCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: Theme.of(context).colorScheme.primary),
          const SizedBox(height: AppSpacing.md),
          Text(value, style: Theme.of(context).textTheme.headlineSmall),
          Text(label, style: Theme.of(context).textTheme.bodySmall),
        ],
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
        Text(report.reportNumber, style: Theme.of(context).textTheme.bodySmall),
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
