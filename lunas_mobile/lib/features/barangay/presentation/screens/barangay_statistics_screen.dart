import 'package:flutter/material.dart';
import 'package:lunas_mobile/core/theme/app_colors.dart';
import 'package:lunas_mobile/core/theme/app_spacing.dart';
import 'package:lunas_mobile/core/widgets/lunas_card.dart';
import 'package:lunas_mobile/features/barangay/presentation/screens/barangay_widgets.dart';

/// Local operational insights for a Barangay official.
class BarangayStatisticsScreen extends StatefulWidget {
  const BarangayStatisticsScreen({super.key});

  @override
  State<BarangayStatisticsScreen> createState() => _BarangayStatisticsScreenState();
}

class _BarangayStatisticsScreenState extends State<BarangayStatisticsScreen> {
  String _period = 'This year';

  @override
  Widget build(BuildContext context) {
    return BarangayPage(
      title: 'Barangay statistics',
      subtitle: 'Local response insights',
      actions: [
        IconButton(
          tooltip: 'Download insights',
          onPressed: () => showBarangayNotice(
            context,
            'Statistics export is a visual-only control in this prototype.',
          ),
          icon: const Icon(Icons.download_outlined),
        ),
        const SizedBox(width: AppSpacing.sm),
      ],
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(
            'Real-time insights and operational metrics for Barangay Pantal.',
            style: Theme.of(context).textTheme.bodyMedium,
          ),
          const SizedBox(height: AppSpacing.xl),
          LayoutBuilder(
            builder: (context, constraints) {
              final columns = constraints.maxWidth >= 640 ? 3 : 1;
              final width =
                  (constraints.maxWidth - (columns - 1) * AppSpacing.sm) /
                  columns;
              return Wrap(
                spacing: AppSpacing.sm,
                runSpacing: AppSpacing.sm,
                children: [
                  SizedBox(
                    width: width,
                    child: const BarangayMetricCard(
                      label: 'Total incidents',
                      value: '124',
                      detail: '↑ 8% from prior period',
                      icon: Icons.assignment_late_outlined,
                      color: AppColorsLight.brandBase,
                    ),
                  ),
                  SizedBox(
                    width: width,
                    child: const BarangayMetricCard(
                      label: 'Resolution rate',
                      value: '92%',
                      detail: 'within the recorded period',
                      icon: Icons.task_alt_rounded,
                      color: AppColorsLight.success,
                    ),
                  ),
                  SizedBox(
                    width: width,
                    child: const BarangayMetricCard(
                      label: 'Avg. resolution time',
                      value: '3.2 days',
                      detail: 'validated completed reports',
                      icon: Icons.hourglass_top_outlined,
                      color: AppColorsLight.alert,
                    ),
                  ),
                ],
              );
            },
          ),
          const SizedBox(height: AppSpacing.xxl),
          const BarangaySectionHeading(title: 'Incidents by category'),
          const SizedBox(height: AppSpacing.sm),
          Align(
            alignment: Alignment.centerLeft,
            child: SegmentedButton<String>(
              segments: const [
                ButtonSegment(value: 'Last 6 months', label: Text('6 mo')),
                ButtonSegment(value: 'This year', label: Text('Year')),
              ],
              selected: {_period},
              showSelectedIcon: false,
              onSelectionChanged: (value) => setState(() => _period = value.first),
            ),
          ),
          const SizedBox(height: AppSpacing.sm),
          LunasCard(
            child: Column(
              children: [
                _CategoryCount(
                  label: 'Road',
                  value: _period == 'This year' ? 45 : 28,
                  max: 68,
                  icon: Icons.add_road_outlined,
                  color: AppColorsLight.brandBase,
                ),
                const SizedBox(height: AppSpacing.lg),
                _CategoryCount(
                  label: 'Water',
                  value: _period == 'This year' ? 68 : 42,
                  max: 68,
                  icon: Icons.water_drop_outlined,
                  color: AppColorsLight.success,
                ),
                const SizedBox(height: AppSpacing.lg),
                _CategoryCount(
                  label: 'Electric',
                  value: _period == 'This year' ? 22 : 14,
                  max: 68,
                  icon: Icons.bolt_outlined,
                  color: AppColorsLight.alert,
                ),
              ],
            ),
          ),
          const SizedBox(height: AppSpacing.xxl),
          const BarangaySectionHeading(title: 'Priority distribution'),
          const SizedBox(height: AppSpacing.sm),
          LunasCard(
            child: Column(
              children: const [
                _PriorityDistribution(
                  label: 'High priority',
                  value: .15,
                  percent: '15%',
                  color: AppColorsLight.critical,
                ),
                SizedBox(height: AppSpacing.lg),
                _PriorityDistribution(
                  label: 'Medium priority',
                  value: .50,
                  percent: '50%',
                  color: AppColorsLight.alert,
                ),
                SizedBox(height: AppSpacing.lg),
                _PriorityDistribution(
                  label: 'Low priority',
                  value: .35,
                  percent: '35%',
                  color: AppColorsLight.success,
                ),
              ],
            ),
          ),
          const SizedBox(height: AppSpacing.xxl),
          const BarangaySectionHeading(title: 'Recent activity'),
          const SizedBox(height: AppSpacing.sm),
          const _ActivityCard(
            icon: Icons.fact_check_outlined,
            title: 'Pothole report on Main Street validated',
            detail: 'Assigned to Road Works Team Alpha. Priority escalated to Medium.',
            time: '10m ago',
            color: AppColorsLight.brandBase,
          ),
          const SizedBox(height: AppSpacing.sm),
          const _ActivityCard(
            icon: Icons.assignment_ind_outlined,
            title: 'Water pipe leak repaired at Block 4',
            detail: 'Marked as resolved by Technician Reyes. Evidence was attached.',
            time: '2h ago',
            color: AppColorsLight.success,
          ),
          const SizedBox(height: AppSpacing.sm),
          const _ActivityCard(
            icon: Icons.campaign_outlined,
            title: 'Community announcement published',
            detail: 'Regarding a scheduled power interruption over the weekend.',
            time: 'Yesterday',
            color: AppColorsLight.alert,
          ),
          const SizedBox(height: AppSpacing.xl),
          LunasCard(
            color: Theme.of(context).colorScheme.primaryContainer.withValues(alpha: .40),
            child: const BarangayInfoRow(
              icon: Icons.analytics_outlined,
              label: 'Interpretation note',
              value:
                  'Figures are static prototype data and must be confirmed against verified operational records before public use.',
            ),
          ),
        ],
      ),
    );
  }
}

class _CategoryCount extends StatelessWidget {
  const _CategoryCount({
    required this.label,
    required this.value,
    required this.max,
    required this.icon,
    required this.color,
  });

  final String label;
  final int value;
  final int max;
  final IconData icon;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(icon, color: color),
        const SizedBox(width: AppSpacing.sm),
        SizedBox(
          width: 70,
          child: Text(
            label,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              fontWeight: FontWeight.w700,
            ),
          ),
        ),
        Expanded(
          child: BarangayProgressBar(value: value / max, color: color),
        ),
        const SizedBox(width: AppSpacing.sm),
        Text('$value', style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w800)),
      ],
    );
  }
}

class _PriorityDistribution extends StatelessWidget {
  const _PriorityDistribution({
    required this.label,
    required this.value,
    required this.percent,
    required this.color,
  });

  final String label;
  final double value;
  final String percent;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: BarangayProgressBar(value: value, color: color, label: label),
        ),
        const SizedBox(width: AppSpacing.md),
        Text(
          percent,
          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
            color: color,
            fontWeight: FontWeight.w800,
          ),
        ),
      ],
    );
  }
}

class _ActivityCard extends StatelessWidget {
  const _ActivityCard({
    required this.icon,
    required this.title,
    required this.detail,
    required this.time,
    required this.color,
  });

  final IconData icon;
  final String title;
  final String detail;
  final String time;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return LunasCard(
      padding: const EdgeInsets.all(AppSpacing.md),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 42,
            height: 42,
            decoration: BoxDecoration(
              color: color.withValues(alpha: .13),
              shape: BoxShape.circle,
            ),
            child: Icon(icon, color: color),
          ),
          const SizedBox(width: AppSpacing.sm),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    fontWeight: FontWeight.w800,
                  ),
                ),
                const SizedBox(height: AppSpacing.xxs),
                Text(detail, style: Theme.of(context).textTheme.bodySmall),
                const SizedBox(height: AppSpacing.xs),
                Text(time, style: Theme.of(context).textTheme.bodySmall),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
