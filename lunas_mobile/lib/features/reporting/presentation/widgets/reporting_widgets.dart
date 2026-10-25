import 'package:flutter/material.dart';
import 'package:lunas_mobile/core/theme/app_radius.dart';
import 'package:lunas_mobile/core/theme/app_spacing.dart';
import 'package:lunas_mobile/core/widgets/lunas_card.dart';
import 'package:lunas_mobile/features/reporting/data/models/incident_report.dart';

int reportWorkflowStep(IncidentReport report) {
  final status = report.status.toLowerCase();
  if (status == 'closed' || status == 'resolved') {
    return 5;
  }
  if (report.agencyStatus == 'work_completed' ||
      status.contains('completion') ||
      status == 'agency_completed') {
    return 4;
  }
  if (status == 'tanod_verified' ||
      status == 'provider_assigned' ||
      status == 'prioritized' ||
      status == 'barangay_validated') {
    return 3;
  }
  if (status == 'tanod_assigned' ||
      status == 'tanod_in_progress' ||
      status == 'tanod_rejected' ||
      status == 'clarification_required') {
    return 2;
  }
  return 1;
}

class ReportWorkflowProgress extends StatelessWidget {
  const ReportWorkflowProgress({required this.report, super.key});

  final IncidentReport report;

  static const stages = <String>[
    'Submitted',
    'Barangay review',
    'Agency work',
    'Final check',
    'Completed',
  ];

  @override
  Widget build(BuildContext context) {
    final step = reportWorkflowStep(report);
    final theme = Theme.of(context);
    return Semantics(
      label:
          'Report progress: ${stages[step - 1]}, step $step of ${stages.length}',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  'Progress',
                  style: theme.textTheme.labelLarge?.copyWith(
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
              Text(
                'Step $step of ${stages.length}',
                style: theme.textTheme.labelMedium,
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.xs),
          Row(
            children: [
              for (var index = 0; index < stages.length; index++) ...[
                Expanded(
                  child: Container(
                    height: 7,
                    decoration: BoxDecoration(
                      color: index < step
                          ? theme.colorScheme.primary
                          : theme.colorScheme.surfaceContainerHighest,
                      borderRadius: BorderRadius.circular(AppRadius.pill),
                    ),
                  ),
                ),
                if (index < stages.length - 1) const SizedBox(width: 3),
              ],
            ],
          ),
          const SizedBox(height: AppSpacing.xs),
          Text(
            stages[step - 1],
            style: theme.textTheme.bodySmall?.copyWith(
              fontWeight: FontWeight.w600,
              color: theme.colorScheme.primary,
            ),
          ),
        ],
      ),
    );
  }
}

class ReportSectionTitle extends StatelessWidget {
  const ReportSectionTitle(this.title, {this.trailing, super.key});

  final String title;
  final Widget? trailing;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: Text(
            title,
            style: Theme.of(
              context,
            ).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w700),
          ),
        ),
        trailing ?? const SizedBox.shrink(),
      ],
    );
  }
}

class ReportProgressIndicator extends StatelessWidget {
  const ReportProgressIndicator({
    required this.current,
    this.total = 4,
    super.key,
  });
  final int current;
  final int total;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Row(
          children: [
            Text(
              'Step $current of $total',
              style: theme.textTheme.labelLarge?.copyWith(
                fontWeight: FontWeight.w700,
              ),
            ),
            const Spacer(),
            Text(
              '${(current / total * 100).round()}%',
              style: theme.textTheme.labelMedium,
            ),
          ],
        ),
        const SizedBox(height: AppSpacing.xs),
        ClipRRect(
          borderRadius: BorderRadius.circular(AppRadius.pill),
          child: LinearProgressIndicator(value: current / total, minHeight: 8),
        ),
      ],
    );
  }
}

class ReportStatusChip extends StatelessWidget {
  const ReportStatusChip({
    required this.label,
    this.icon,
    this.isCritical = false,
    this.color,
    this.maxWidth = 180,
    super.key,
  });

  final String label;
  final IconData? icon;
  final bool isCritical;
  final Color? color;
  final double maxWidth;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final chipColor =
        color ??
        (isCritical ? theme.colorScheme.error : theme.colorScheme.tertiary);
    return Semantics(
      label: label,
      child: ConstrainedBox(
        constraints: BoxConstraints(maxWidth: maxWidth),
        child: Container(
          padding: const EdgeInsets.symmetric(
            horizontal: AppSpacing.sm,
            vertical: AppSpacing.xs,
          ),
          decoration: BoxDecoration(
            color: chipColor.withValues(alpha: .12),
            borderRadius: BorderRadius.circular(AppRadius.pill),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              if (icon != null) ...[
                Icon(icon, size: 16, color: chipColor),
                const SizedBox(width: AppSpacing.xs),
              ],
              Flexible(
                child: Text(
                  label.toUpperCase(),
                  maxLines: 2,
                  textAlign: TextAlign.center,
                  style: theme.textTheme.labelSmall?.copyWith(color: chipColor),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class ReportStatusHeader extends StatelessWidget {
  const ReportStatusHeader({
    required this.title,
    required this.status,
    this.leading,
    this.statusColor,
    this.titleStyle,
    super.key,
  });

  final String title;
  final String status;
  final Widget? leading;
  final Color? statusColor;
  final TextStyle? titleStyle;

  @override
  Widget build(BuildContext context) {
    final resolvedTitleStyle =
        titleStyle ?? Theme.of(context).textTheme.titleMedium;
    final statusStyle = Theme.of(context).textTheme.labelSmall;
    final scaler = MediaQuery.textScalerOf(context);

    double textWidth(String value, TextStyle? style) {
      final painter = TextPainter(
        text: TextSpan(text: value, style: style),
        textDirection: Directionality.of(context),
        textScaler: scaler,
        maxLines: 1,
      )..layout();
      return painter.width;
    }

    return LayoutBuilder(
      builder: (context, constraints) {
        final leadingWidth = leading == null ? 0.0 : 24 + AppSpacing.sm;
        final titleWidth = textWidth(title, resolvedTitleStyle);
        final statusWidth =
            textWidth(status.toUpperCase(), statusStyle) + AppSpacing.sm * 2;
        final requiredWidth =
            leadingWidth + titleWidth + AppSpacing.sm + statusWidth;
        final useSecondRow = requiredWidth > constraints.maxWidth;

        final titleRow = Row(
          children: [
            if (leading != null) ...[
              SizedBox(width: 24, height: 24, child: leading),
              const SizedBox(width: AppSpacing.sm),
            ],
            Expanded(
              child: Text(
                title,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: resolvedTitleStyle,
              ),
            ),
          ],
        );

        if (useSecondRow) {
          return Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              titleRow,
              const SizedBox(height: AppSpacing.xs),
              Align(
                alignment: Alignment.centerRight,
                child: ReportStatusChip(
                  label: status,
                  color: statusColor,
                  maxWidth: constraints.maxWidth.clamp(0.0, 180.0),
                ),
              ),
            ],
          );
        }

        return Row(
          children: [
            Expanded(child: titleRow),
            const SizedBox(width: AppSpacing.sm),
            ReportStatusChip(label: status, color: statusColor),
          ],
        );
      },
    );
  }
}

class ReportCategoryTile extends StatelessWidget {
  const ReportCategoryTile({
    required this.label,
    required this.icon,
    required this.color,
    required this.selected,
    required this.onTap,
    this.description,
    super.key,
  });

  final String label;
  final String? description;
  final IconData icon;
  final Color color;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context).textTheme;
    final titleStyle = theme.titleMedium?.copyWith(
      fontWeight: FontWeight.w700,
      height: 1.4,
    );
    final descriptionStyle = theme.bodySmall?.copyWith(height: 1.4);
    final scaler = MediaQuery.textScalerOf(context);
    final contentHeight =
        scaler.scale(titleStyle?.fontSize ?? 16) * 1.4 +
        scaler.scale(descriptionStyle?.fontSize ?? 12) * 1.4 * 2;
    return Semantics(
      selected: selected,
      child: LunasCard(
        onTap: onTap,
        padding: const EdgeInsets.all(AppSpacing.md),
        color: selected ? color.withValues(alpha: .08) : Colors.white,
        child: SizedBox(
          height: contentHeight,
          child: Row(
            children: [
              Container(
                width: 46,
                height: 46,
                decoration: BoxDecoration(
                  color: Colors.transparent,
                  borderRadius: BorderRadius.circular(AppRadius.sm),
                ),
                child: Icon(icon, color: color, size: 26),
              ),
              const SizedBox(width: AppSpacing.md),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      label,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: titleStyle,
                    ),
                    SizedBox(
                      height:
                          scaler.scale(descriptionStyle?.fontSize ?? 12) *
                          1.4 *
                          2,
                      child: Text(
                        description ?? '',
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: descriptionStyle,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class ReportMetadataGrid extends StatelessWidget {
  const ReportMetadataGrid({required this.items, super.key});

  final List<({String label, String value, IconData icon})> items;

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final columns = constraints.maxWidth >= 560 ? 4 : 2;
        final width =
            (constraints.maxWidth - (AppSpacing.sm * (columns - 1))) / columns;
        return Wrap(
          spacing: AppSpacing.sm,
          runSpacing: AppSpacing.sm,
          children: [
            for (final item in items)
              SizedBox(
                width: width,
                child: LunasCard(
                  padding: const EdgeInsets.all(AppSpacing.md),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Icon(
                        item.icon,
                        size: 18,
                        color: Theme.of(context).colorScheme.primary,
                      ),
                      const SizedBox(height: AppSpacing.sm),
                      Text(
                        item.label.toUpperCase(),
                        style: Theme.of(context).textTheme.labelSmall,
                      ),
                      const SizedBox(height: AppSpacing.xxs),
                      Text(
                        item.value,
                        style: Theme.of(context).textTheme.titleMedium,
                      ),
                    ],
                  ),
                ),
              ),
          ],
        );
      },
    );
  }
}

class AuditTimeline extends StatelessWidget {
  const AuditTimeline({super.key});

  @override
  Widget build(BuildContext context) {
    const events = [
      ('Report submitted', 'Today, 9:42 AM', true),
      (
        'AI triage suggestion ready',
        'A Barangay official will validate the suggestion.',
        true,
      ),
      ('Official validation', 'Waiting for assignment.', false),
    ];
    return Column(
      children: [
        for (var index = 0; index < events.length; index++)
          _TimelineEvent(
            title: events[index].$1,
            detail: events[index].$2,
            completed: events[index].$3,
            showLine: index != events.length - 1,
          ),
      ],
    );
  }
}

class _TimelineEvent extends StatelessWidget {
  const _TimelineEvent({
    required this.title,
    required this.detail,
    required this.completed,
    required this.showLine,
  });

  final String title;
  final String detail;
  final bool completed;
  final bool showLine;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final color = completed
        ? theme.colorScheme.tertiary
        : theme.colorScheme.outline;
    return IntrinsicHeight(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          SizedBox(
            width: 28,
            child: Column(
              children: [
                Icon(
                  completed
                      ? Icons.check_circle_rounded
                      : Icons.radio_button_unchecked_rounded,
                  color: color,
                  size: 20,
                ),
                if (showLine)
                  Expanded(
                    child: Container(
                      width: 2,
                      color: theme.colorScheme.outlineVariant,
                    ),
                  ),
              ],
            ),
          ),
          const SizedBox(width: AppSpacing.sm),
          Expanded(
            child: Padding(
              padding: const EdgeInsets.only(bottom: AppSpacing.xl),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, style: theme.textTheme.titleMedium),
                  Text(detail, style: theme.textTheme.bodySmall),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

IconData reportCategoryIcon(String code) => switch (code) {
  'road' => Icons.add_road_rounded,
  'drainage' => Icons.water_damage_outlined,
  'electrical' => Icons.electric_bolt_outlined,
  'water' => Icons.water_drop_outlined,
  'streetlight' => Icons.lightbulb_outline_rounded,
  _ => Icons.report_problem_outlined,
};
