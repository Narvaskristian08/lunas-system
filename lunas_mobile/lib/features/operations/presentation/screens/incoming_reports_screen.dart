import 'package:flutter/material.dart';
import 'package:lunas_mobile/core/theme/app_colors.dart';
import 'package:lunas_mobile/core/theme/app_spacing.dart';
import 'package:lunas_mobile/core/widgets/lunas_button.dart';
import 'package:lunas_mobile/core/widgets/lunas_card.dart';
import 'package:lunas_mobile/features/operations/presentation/screens/operations_routes.dart';
import 'package:lunas_mobile/features/operations/presentation/screens/operations_widgets.dart';

class IncomingReportsScreen extends StatelessWidget {
  const IncomingReportsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return OperationsPage(
      title: 'Incoming reports',
      subtitle: 'Review and validate citizen submissions',
      actions: [
        IconButton(
          tooltip: 'SLA monitoring',
          onPressed: () => Navigator.pushNamed(context, OperationsRoutes.slaMonitoring),
          icon: const Icon(Icons.timer_outlined),
        ),
        const SizedBox(width: AppSpacing.sm),
      ],
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          TextField(
            decoration: const InputDecoration(
              hintText: 'Search incidents...',
              prefixIcon: Icon(Icons.search_rounded),
            ),
          ),
          const SizedBox(height: AppSpacing.sm),
          Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: () => _showPrototypeMessage(context, 'Filters are a static UI control in this prototype.'),
                  icon: const Icon(Icons.filter_list_rounded),
                  label: const Text('Filter'),
                ),
              ),
              const SizedBox(width: AppSpacing.sm),
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: () => _showPrototypeMessage(context, 'Sorting is a static UI control in this prototype.'),
                  icon: const Icon(Icons.sort_rounded),
                  label: const Text('Sort'),
                ),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.lg),
          const Wrap(
            spacing: AppSpacing.xs,
            runSpacing: AppSpacing.xs,
            children: [
              OperationsBadge(
                label: '34 Pending',
                color: AppColorsLight.brandBase,
                icon: Icons.circle,
              ),
              OperationsBadge(
                label: '5 Critical',
                color: AppColorsLight.critical,
                icon: Icons.circle,
              ),
              OperationsBadge(
                label: '12 Validated today',
                color: AppColorsLight.success,
                icon: Icons.verified_outlined,
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.lg),
          _IncomingReportCard(
            report: _IncomingReport(
              id: 'INC-2026-0142',
              reportedAt: '2h ago',
              title: 'Deep pothole on A.B. Fernandez Ave.',
              location: 'Barangay Pantal, Dagupan City',
              priority: 'Medium priority',
              priorityColor: AppColorsLight.alert,
              confidence: '98% suggested match',
              sla: 'SLA: 46h left',
              icon: Icons.add_road_outlined,
            ),
          ),
          const SizedBox(height: AppSpacing.md),
          _IncomingReportCard(
            report: _IncomingReport(
              id: 'INC-2026-0143',
              reportedAt: '15m ago',
              title: 'Fallen tree blocking access road',
              location: 'Barangay Bonuan Gueset, Dagupan City',
              priority: 'High priority',
              priorityColor: AppColorsLight.critical,
              confidence: '92% suggested match',
              sla: 'SLA: 2h left',
              icon: Icons.park_outlined,
              isUrgent: true,
            ),
          ),
          const SizedBox(height: AppSpacing.md),
          _IncomingReportCard(
            report: _IncomingReport(
              id: 'INC-2026-0141',
              reportedAt: '5h ago',
              title: 'Broken streetlight near public market',
              location: 'Barangay 1, Dagupan City',
              priority: 'Low priority',
              priorityColor: AppColorsLight.success,
              confidence: '85% suggested match',
              sla: 'SLA: 67h left',
              icon: Icons.lightbulb_outline_rounded,
            ),
          ),
        ],
      ),
    );
  }

  void _showPrototypeMessage(BuildContext context, String message) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(message)));
  }
}

class _IncomingReportCard extends StatelessWidget {
  const _IncomingReportCard({required this.report});

  final _IncomingReport report;

  @override
  Widget build(BuildContext context) {
    return LunasCard(
      padding: const EdgeInsets.all(AppSpacing.md),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Text(
                  '#${report.id} • ${report.reportedAt}',
                  style: Theme.of(context).textTheme.bodySmall,
                ),
              ),
              Icon(Icons.more_vert_rounded, color: Theme.of(context).colorScheme.onSurfaceVariant),
            ],
          ),
          const SizedBox(height: AppSpacing.xs),
          Text(
            report.title,
            style: Theme.of(context).textTheme.titleLarge?.copyWith(
              fontWeight: FontWeight.w800,
            ),
          ),
          const SizedBox(height: AppSpacing.xxs),
          Text(report.location, style: Theme.of(context).textTheme.bodySmall),
          const SizedBox(height: AppSpacing.md),
          Stack(
            children: [
              OperationsVisualPlaceholder(
                icon: report.icon,
                label: 'Citizen evidence preview',
                detail: 'Visual evidence is reviewed by an official.',
                accent: report.priorityColor,
                height: 132,
              ),
              Positioned(
                right: AppSpacing.sm,
                bottom: AppSpacing.sm,
                child: OperationsBadge(
                  label: report.confidence,
                  color: AppColorsLight.brandBase,
                  icon: Icons.auto_awesome_outlined,
                ),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.sm),
          Wrap(
            spacing: AppSpacing.xs,
            runSpacing: AppSpacing.xs,
            children: [
              OperationsBadge(label: report.priority, color: report.priorityColor),
              OperationsBadge(
                label: 'Pending validation',
                color: Theme.of(context).colorScheme.onSurfaceVariant,
              ),
            ],
          ),
          const Padding(
            padding: EdgeInsets.symmetric(vertical: AppSpacing.sm),
            child: Divider(),
          ),
          Row(
            children: [
              Icon(
                report.isUrgent ? Icons.warning_amber_rounded : Icons.schedule_outlined,
                size: 18,
                color: report.isUrgent ? AppColorsLight.critical : AppColorsLight.textSecondary,
              ),
              const SizedBox(width: AppSpacing.xs),
              Expanded(
                child: Text(
                  report.sla,
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: report.isUrgent ? AppColorsLight.critical : null,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
              LunasButton(
                label: 'Validate',
                expand: false,
                onPressed: () => Navigator.pushNamed(context, OperationsRoutes.validateReport),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _IncomingReport {
  const _IncomingReport({
    required this.id,
    required this.reportedAt,
    required this.title,
    required this.location,
    required this.priority,
    required this.priorityColor,
    required this.confidence,
    required this.sla,
    required this.icon,
    this.isUrgent = false,
  });

  final String id;
  final String reportedAt;
  final String title;
  final String location;
  final String priority;
  final Color priorityColor;
  final String confidence;
  final String sla;
  final IconData icon;
  final bool isUrgent;
}
