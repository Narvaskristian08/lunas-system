import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:lunas_mobile/core/theme/app_colors.dart';
import 'package:lunas_mobile/core/theme/app_radius.dart';
import 'package:lunas_mobile/core/theme/app_spacing.dart';
import 'package:lunas_mobile/core/widgets/lunas_app_bar.dart';
import 'package:lunas_mobile/core/widgets/lunas_card.dart';

class AnalyticsLayout extends StatelessWidget {
  const AnalyticsLayout({
    required this.title,
    required this.subtitle,
    required this.activeRoute,
    required this.child,
    super.key,
  });

  final String title;
  final String subtitle;
  final String activeRoute;
  final Widget child;

  static const destinations = [
    ('Overview', '/analytics'),
    ('Charts', '/analytics/charts'),
    ('Reports', '/analytics/reports'),
    ('Trends', '/analytics/trends'),
    ('Performance', '/analytics/performance'),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: LunasAppBar(
        title: title,
        subtitle: subtitle,
        showBackButton: true,
      ),
      body: SafeArea(
        top: false,
        child: Column(
          children: [
            SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.fromLTRB(
                AppSpacing.xl,
                AppSpacing.sm,
                AppSpacing.xl,
                0,
              ),
              child: Row(
                children: [
                  for (final destination in destinations)
                    Padding(
                      padding: const EdgeInsets.only(right: AppSpacing.xs),
                      child: ChoiceChip(
                        label: Text(destination.$1),
                        selected: activeRoute == destination.$2,
                        onSelected: (_) {
                          if (activeRoute != destination.$2) {
                            Navigator.pushReplacementNamed(
                              context,
                              destination.$2,
                            );
                          }
                        },
                      ),
                    ),
                ],
              ),
            ),
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.fromLTRB(
                  AppSpacing.xl,
                  AppSpacing.xl,
                  AppSpacing.xl,
                  AppSpacing.hero,
                ),
                child: Align(
                  alignment: Alignment.topCenter,
                  child: ConstrainedBox(
                    constraints: const BoxConstraints(maxWidth: 820),
                    child: child,
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class AnalyticsMetricGrid extends StatelessWidget {
  const AnalyticsMetricGrid({required this.items, super.key});

  final List<AnalyticsMetric> items;

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final columns = constraints.maxWidth >= 680 ? 4 : 2;
        final width =
            (constraints.maxWidth - AppSpacing.sm * (columns - 1)) / columns;
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
                      Icon(item.icon, color: item.color, size: 22),
                      const SizedBox(height: AppSpacing.md),
                      Text(
                        item.value,
                        style: Theme.of(context).textTheme.headlineLarge
                            ?.copyWith(
                              fontSize: 25,
                              fontWeight: FontWeight.w800,
                            ),
                      ),
                      Text(
                        item.label,
                        style: Theme.of(context).textTheme.bodySmall,
                      ),
                      const SizedBox(height: AppSpacing.xs),
                      Text(
                        item.change,
                        style: Theme.of(context).textTheme.labelSmall?.copyWith(
                          color: item.positive
                              ? AppColorsLight.success
                              : AppColorsLight.critical,
                        ),
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

class AnalyticsMetric {
  const AnalyticsMetric({
    required this.value,
    required this.label,
    required this.change,
    required this.icon,
    required this.color,
    this.positive = true,
  });

  final String value;
  final String label;
  final String change;
  final IconData icon;
  final Color color;
  final bool positive;
}

class AnalyticsChartCard extends StatelessWidget {
  const AnalyticsChartCard({
    required this.title,
    required this.subtitle,
    required this.child,
    this.trailing,
    super.key,
  });

  final String title;
  final String subtitle;
  final Widget child;
  final Widget? trailing;

  @override
  Widget build(BuildContext context) {
    return LunasCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                    Text(
                      subtitle,
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                  ],
                ),
              ),
              ?trailing,
            ],
          ),
          const SizedBox(height: AppSpacing.xl),
          SizedBox(height: 190, child: child),
        ],
      ),
    );
  }
}

class LunasBarChart extends StatelessWidget {
  const LunasBarChart({
    required this.values,
    required this.labels,
    this.color = AppColorsLight.brandBase,
    super.key,
  });

  final List<double> values;
  final List<String> labels;
  final Color color;

  @override
  Widget build(BuildContext context) {
    final maxValue = values.reduce(math.max);
    return Row(
      crossAxisAlignment: CrossAxisAlignment.end,
      children: [
        for (var index = 0; index < values.length; index++)
          Expanded(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 4),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  Expanded(
                    child: Align(
                      alignment: Alignment.bottomCenter,
                      child: FractionallySizedBox(
                        heightFactor: values[index] / maxValue,
                        child: Container(
                          decoration: BoxDecoration(
                            color: color.withValues(
                              alpha: .45 + index / values.length * .5,
                            ),
                            borderRadius: const BorderRadius.vertical(
                              top: Radius.circular(AppRadius.xs),
                            ),
                          ),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: AppSpacing.xs),
                  Text(
                    labels[index],
                    style: Theme.of(context).textTheme.labelSmall,
                  ),
                ],
              ),
            ),
          ),
      ],
    );
  }
}

class LunasLineChart extends StatelessWidget {
  const LunasLineChart({
    required this.values,
    this.color = AppColorsLight.brandBase,
    super.key,
  });

  final List<double> values;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return CustomPaint(
      painter: _LineChartPainter(values: values, color: color),
      child: const SizedBox.expand(),
    );
  }
}

class LunasDonutChart extends StatelessWidget {
  const LunasDonutChart({
    required this.value,
    required this.label,
    this.color = AppColorsLight.success,
    super.key,
  });

  final double value;
  final String label;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Stack(
      alignment: Alignment.center,
      children: [
        SizedBox.square(
          dimension: 150,
          child: CircularProgressIndicator(
            value: value,
            strokeWidth: 18,
            color: color,
            backgroundColor: color.withValues(alpha: .12),
          ),
        ),
        Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              '${(value * 100).round()}%',
              style: Theme.of(
                context,
              ).textTheme.headlineLarge?.copyWith(fontWeight: FontWeight.w800),
            ),
            Text(label, style: Theme.of(context).textTheme.bodySmall),
          ],
        ),
      ],
    );
  }
}

class PerformanceRow extends StatelessWidget {
  const PerformanceRow({
    required this.label,
    required this.value,
    required this.progress,
    required this.color,
    super.key,
  });

  final String label;
  final String value;
  final double progress;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Row(
          children: [
            Expanded(child: Text(label)),
            Text(
              value,
              style: Theme.of(
                context,
              ).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700),
            ),
          ],
        ),
        const SizedBox(height: AppSpacing.xs),
        ClipRRect(
          borderRadius: BorderRadius.circular(AppRadius.pill),
          child: LinearProgressIndicator(
            value: progress,
            minHeight: 8,
            color: color,
            backgroundColor: color.withValues(alpha: .12),
          ),
        ),
      ],
    );
  }
}

class _LineChartPainter extends CustomPainter {
  const _LineChartPainter({required this.values, required this.color});

  final List<double> values;
  final Color color;

  @override
  void paint(Canvas canvas, Size size) {
    final grid = Paint()
      ..color = AppColorsLight.divider
      ..strokeWidth = 1;
    for (var index = 1; index < 5; index++) {
      final y = size.height * index / 5;
      canvas.drawLine(Offset(0, y), Offset(size.width, y), grid);
    }
    final maxValue = values.reduce(math.max);
    final minValue = values.reduce(math.min);
    final range = math.max(maxValue - minValue, 1);
    final path = Path();
    for (var index = 0; index < values.length; index++) {
      final x = size.width * index / (values.length - 1);
      final y =
          size.height -
          ((values[index] - minValue) / range * size.height * .8) -
          size.height * .1;
      if (index == 0) {
        path.moveTo(x, y);
      } else {
        path.lineTo(x, y);
      }
    }
    canvas.drawPath(
      path,
      Paint()
        ..color = color
        ..strokeWidth = 3
        ..strokeCap = StrokeCap.round
        ..strokeJoin = StrokeJoin.round
        ..style = PaintingStyle.stroke,
    );
  }

  @override
  bool shouldRepaint(covariant _LineChartPainter oldDelegate) =>
      oldDelegate.values != values || oldDelegate.color != color;
}
