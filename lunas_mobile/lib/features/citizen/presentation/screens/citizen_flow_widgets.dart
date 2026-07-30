import 'package:flutter/material.dart';
import 'package:lunas_mobile/core/theme/app_radius.dart';
import 'package:lunas_mobile/core/theme/app_spacing.dart';
import 'package:lunas_mobile/core/widgets/lunas_card.dart';

/// Shared presentation pieces for the citizen report journey.
///
/// These widgets intentionally use illustrative surfaces instead of external
/// imagery. The real application will replace them with locally captured,
/// privacy-checked report photos and map data.
class CitizenFlowScroll extends StatelessWidget {
  const CitizenFlowScroll({required this.child, super.key});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      top: false,
      child: LayoutBuilder(
        builder: (context, constraints) {
          final horizontal = constraints.maxWidth < 360
              ? AppSpacing.md
              : AppSpacing.xl;
          return SingleChildScrollView(
            padding: EdgeInsets.fromLTRB(
              horizontal,
              AppSpacing.lg,
              horizontal,
              AppSpacing.hero,
            ),
            child: Align(
              alignment: Alignment.topCenter,
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 680),
                child: child,
              ),
            ),
          );
        },
      ),
    );
  }
}

class CitizenStatusPill extends StatelessWidget {
  const CitizenStatusPill({
    required this.label,
    required this.color,
    this.icon,
    super.key,
  });

  final String label;
  final Color color;
  final IconData? icon;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.sm,
        vertical: AppSpacing.xs,
      ),
      decoration: BoxDecoration(
        color: color.withValues(alpha: .13),
        borderRadius: BorderRadius.circular(AppRadius.pill),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (icon != null) ...[
            Icon(icon, color: color, size: 16),
            const SizedBox(width: AppSpacing.xs),
          ],
          Text(
            label,
            style: Theme.of(
              context,
            ).textTheme.labelLarge?.copyWith(color: color, fontSize: 12),
          ),
        ],
      ),
    );
  }
}

class CitizenSectionTitle extends StatelessWidget {
  const CitizenSectionTitle(this.title, {this.trailing, super.key});

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
            ).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w800),
          ),
        ),
        ?trailing,
      ],
    );
  }
}

class CitizenAccentCard extends StatelessWidget {
  const CitizenAccentCard({
    required this.accent,
    required this.child,
    this.color,
    super.key,
  });

  final Color accent;
  final Color? color;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Container(
      decoration: BoxDecoration(
        color: color ?? scheme.surface,
        borderRadius: AppRadius.card,
        border: Border(
          left: BorderSide(color: accent, width: 4),
          top: BorderSide(color: scheme.outlineVariant.withValues(alpha: .7)),
          right: BorderSide(color: scheme.outlineVariant.withValues(alpha: .7)),
          bottom: BorderSide(
            color: scheme.outlineVariant.withValues(alpha: .7),
          ),
        ),
        boxShadow: const [
          BoxShadow(
            color: Color(0x12000000),
            blurRadius: 14,
            offset: Offset(0, 5),
          ),
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.lg),
        child: child,
      ),
    );
  }
}

class CitizenDetailRow extends StatelessWidget {
  const CitizenDetailRow({
    required this.label,
    required this.value,
    this.valueColor,
    this.valueIcon,
    this.showDivider = true,
    super.key,
  });

  final String label;
  final String value;
  final Color? valueColor;
  final IconData? valueIcon;
  final bool showDivider;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final valueStyle = theme.textTheme.titleMedium?.copyWith(
      color: valueColor,
      fontWeight: FontWeight.w700,
    );
    return Column(
      children: [
        Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(child: Text(label, style: theme.textTheme.bodyLarge)),
            const SizedBox(width: AppSpacing.md),
            Flexible(
              child: Row(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (valueIcon != null) ...[
                    Icon(valueIcon, color: valueColor, size: 19),
                    const SizedBox(width: AppSpacing.xs),
                  ],
                  Flexible(
                    child: Text(
                      value,
                      textAlign: TextAlign.end,
                      style: valueStyle,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
        if (showDivider) ...[
          const SizedBox(height: AppSpacing.sm),
          Divider(color: theme.colorScheme.outlineVariant),
          const SizedBox(height: AppSpacing.sm),
        ],
      ],
    );
  }
}

class CitizenPhotoPlaceholder extends StatelessWidget {
  const CitizenPhotoPlaceholder({
    required this.label,
    this.showDetection = false,
    this.isAfter = false,
    this.aspectRatio = 16 / 10,
    super.key,
  });

  final String label;
  final bool showDetection;
  final bool isAfter;
  final double aspectRatio;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final detectionColor = scheme.error;
    return Semantics(
      image: true,
      label: label,
      child: ClipRRect(
        borderRadius: AppRadius.card,
        child: AspectRatio(
          aspectRatio: aspectRatio,
          child: LayoutBuilder(
            builder: (context, constraints) {
              final width = constraints.maxWidth;
              final height = constraints.maxHeight;
              return Stack(
                fit: StackFit.expand,
                children: [
                  DecoratedBox(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                        colors: isAfter
                            ? const [Color(0xFFD9E2E8), Color(0xFF707A82)]
                            : const [Color(0xFFE4E7E8), Color(0xFF74777A)],
                      ),
                    ),
                  ),
                  Positioned(
                    top: height * .1,
                    left: -width * .08,
                    child: Transform.rotate(
                      angle: -.12,
                      child: Container(
                        height: height * .09,
                        width: width * 1.2,
                        color: Colors.white.withValues(alpha: .55),
                      ),
                    ),
                  ),
                  Positioned(
                    top: height * .62,
                    left: -width * .08,
                    child: Transform.rotate(
                      angle: -.12,
                      child: Container(
                        height: height * .06,
                        width: width * 1.2,
                        color: Colors.white.withValues(alpha: .42),
                      ),
                    ),
                  ),
                  Align(
                    alignment: const Alignment(0, .15),
                    child: Container(
                      width: width * (isAfter ? .52 : .58),
                      height: height * (isAfter ? .22 : .3),
                      decoration: BoxDecoration(
                        color: isAfter
                            ? const Color(0xFF29343A)
                            : const Color(0xFF272727),
                        borderRadius: BorderRadius.circular(height * .2),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: .35),
                            blurRadius: 14,
                            offset: const Offset(0, 7),
                          ),
                        ],
                      ),
                    ),
                  ),
                  if (isAfter)
                    Align(
                      alignment: const Alignment(0, .15),
                      child: Icon(
                        Icons.check_circle_rounded,
                        color: const Color(0xFF9EF39A),
                        size: height * .19,
                      ),
                    ),
                  if (showDetection) ...[
                    Positioned(
                      left: width * .17,
                      top: height * .24,
                      width: width * .66,
                      height: height * .53,
                      child: DecoratedBox(
                        decoration: BoxDecoration(
                          border: Border.all(color: detectionColor, width: 3),
                          color: detectionColor.withValues(alpha: .08),
                        ),
                      ),
                    ),
                    Positioned(
                      left: width * .17,
                      top: height * .13,
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: AppSpacing.sm,
                          vertical: AppSpacing.xs,
                        ),
                        decoration: BoxDecoration(
                          color: detectionColor,
                          borderRadius: const BorderRadius.vertical(
                            top: Radius.circular(AppRadius.xs),
                            bottom: Radius.circular(AppRadius.xs),
                          ),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(
                              Icons.warning_amber_rounded,
                              color: Colors.white,
                              size: 16,
                            ),
                            const SizedBox(width: AppSpacing.xs),
                            Text(
                              label,
                              style: Theme.of(context).textTheme.labelLarge
                                  ?.copyWith(color: Colors.white),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ],
              );
            },
          ),
        ),
      ),
    );
  }
}

class CitizenMapPreview extends StatelessWidget {
  const CitizenMapPreview({
    required this.locationLabel,
    this.compact = false,
    super.key,
  });

  final String locationLabel;
  final bool compact;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final height = compact ? 108.0 : 152.0;
    return Semantics(
      image: true,
      label: 'Map preview: $locationLabel',
      child: ClipRRect(
        borderRadius: AppRadius.input,
        child: SizedBox(
          height: height,
          child: Stack(
            fit: StackFit.expand,
            children: [
              ColoredBox(color: scheme.primaryContainer.withValues(alpha: .4)),
              ...List<Widget>.generate(
                4,
                (index) => Positioned(
                  top: 16.0 + (index * 32),
                  left: -20,
                  right: -20,
                  child: Transform.rotate(
                    angle: index.isEven ? -.1 : .08,
                    child: Container(
                      height: index == 1 ? 13 : 7,
                      color: scheme.surface.withValues(alpha: .92),
                    ),
                  ),
                ),
              ),
              ...List<Widget>.generate(
                3,
                (index) => Positioned(
                  top: -10,
                  bottom: -10,
                  left: 50.0 + (index * 82),
                  child: Transform.rotate(
                    angle: index == 1 ? .22 : -.08,
                    child: Container(
                      width: index == 1 ? 12 : 6,
                      color: scheme.surface.withValues(alpha: .9),
                    ),
                  ),
                ),
              ),
              Center(
                child: Container(
                  width: 42,
                  height: 42,
                  decoration: BoxDecoration(
                    color: scheme.primary,
                    shape: BoxShape.circle,
                    border: Border.all(color: Colors.white, width: 4),
                    boxShadow: const [
                      BoxShadow(
                        color: Color(0x33000000),
                        blurRadius: 8,
                        offset: Offset(0, 3),
                      ),
                    ],
                  ),
                  child: const Icon(
                    Icons.location_on_rounded,
                    color: Colors.white,
                    size: 22,
                  ),
                ),
              ),
              Positioned(
                left: AppSpacing.sm,
                bottom: AppSpacing.sm,
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: AppSpacing.sm,
                    vertical: AppSpacing.xxs,
                  ),
                  decoration: BoxDecoration(
                    color: scheme.surface.withValues(alpha: .94),
                    borderRadius: BorderRadius.circular(AppRadius.xs),
                  ),
                  child: Text(
                    locationLabel,
                    style: Theme.of(context).textTheme.labelSmall,
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

class CitizenPhotoComparison extends StatelessWidget {
  const CitizenPhotoComparison({super.key});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: _ComparisonPhoto(
            label: 'Before',
            labelColor: Theme.of(context).colorScheme.secondary,
            isAfter: false,
          ),
        ),
        const SizedBox(width: AppSpacing.sm),
        Expanded(
          child: _ComparisonPhoto(
            label: 'After',
            labelColor: const Color(0xFF1B6D24),
            isAfter: true,
          ),
        ),
      ],
    );
  }
}

class _ComparisonPhoto extends StatelessWidget {
  const _ComparisonPhoto({
    required this.label,
    required this.labelColor,
    required this.isAfter,
  });

  final String label;
  final Color labelColor;
  final bool isAfter;

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        CitizenPhotoPlaceholder(
          label: '$label repair evidence',
          isAfter: isAfter,
          aspectRatio: 1.22,
        ),
        Positioned(
          left: AppSpacing.xs,
          bottom: AppSpacing.xs,
          child: CitizenStatusPill(
            label: label,
            color: labelColor,
            icon: isAfter ? Icons.verified_rounded : null,
          ),
        ),
      ],
    );
  }
}

class CitizenTimeline extends StatelessWidget {
  const CitizenTimeline({required this.events, super.key});

  final List<CitizenTimelineEvent> events;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        for (var index = 0; index < events.length; index++)
          _CitizenTimelineItem(
            event: events[index],
            showLine: index != events.length - 1,
          ),
      ],
    );
  }
}

class CitizenTimelineEvent {
  const CitizenTimelineEvent({
    required this.title,
    required this.time,
    required this.detail,
    required this.icon,
    required this.color,
    this.isCurrent = false,
  });

  final String title;
  final String time;
  final String detail;
  final IconData icon;
  final Color color;
  final bool isCurrent;
}

class _CitizenTimelineItem extends StatelessWidget {
  const _CitizenTimelineItem({required this.event, required this.showLine});

  final CitizenTimelineEvent event;
  final bool showLine;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return IntrinsicHeight(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          SizedBox(
            width: 48,
            child: Column(
              children: [
                Container(
                  width: 42,
                  height: 42,
                  decoration: BoxDecoration(
                    color: event.color.withValues(alpha: .16),
                    shape: BoxShape.circle,
                    border: event.isCurrent
                        ? Border.all(color: event.color, width: 3)
                        : null,
                  ),
                  child: Icon(event.icon, color: event.color),
                ),
                if (showLine)
                  Expanded(
                    child: Container(width: 2, color: scheme.primaryContainer),
                  ),
              ],
            ),
          ),
          const SizedBox(width: AppSpacing.sm),
          Expanded(
            child: Padding(
              padding: const EdgeInsets.only(bottom: AppSpacing.md),
              child: LunasCard(
                color: event.isCurrent
                    ? scheme.primaryContainer.withValues(alpha: .5)
                    : null,
                padding: const EdgeInsets.all(AppSpacing.md),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      event.title,
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                    const SizedBox(height: AppSpacing.xs),
                    Text(
                      event.time,
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: event.color,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const SizedBox(height: AppSpacing.xs),
                    Text(event.detail),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
