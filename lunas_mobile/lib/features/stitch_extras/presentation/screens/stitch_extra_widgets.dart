import 'package:flutter/material.dart';
import 'package:lunas_mobile/core/theme/app_colors.dart';
import 'package:lunas_mobile/core/theme/app_radius.dart';
import 'package:lunas_mobile/core/theme/app_spacing.dart';
import 'package:lunas_mobile/core/widgets/lunas_card.dart';

class StitchMapPlaceholder extends StatelessWidget {
  const StitchMapPlaceholder({
    required this.title,
    required this.subtitle,
    this.height = 260,
    this.showRoute = false,
    super.key,
  });

  final String title;
  final String subtitle;
  final double height;
  final bool showRoute;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      image: true,
      label: '$title map preview',
      child: Container(
        height: height,
        decoration: BoxDecoration(
          borderRadius: AppRadius.card,
          color: Theme.of(context).colorScheme.primaryContainer,
          border: Border.all(
            color: Theme.of(context).colorScheme.primary.withValues(alpha: .2),
          ),
        ),
        child: Stack(
          children: [
            const Positioned.fill(child: _MapGrid()),
            if (showRoute)
              const Positioned.fill(
                child: CustomPaint(painter: _RoutePainter()),
              ),
            const Align(
              alignment: Alignment(-.52, .5),
              child: _MapMarker(
                icon: Icons.my_location_rounded,
                color: AppColorsLight.brandBase,
              ),
            ),
            const Align(
              alignment: Alignment(.52, -.4),
              child: _MapMarker(
                icon: Icons.warning_amber_rounded,
                color: AppColorsLight.critical,
              ),
            ),
            Positioned(
              left: AppSpacing.md,
              right: AppSpacing.md,
              bottom: AppSpacing.md,
              child: Container(
                padding: const EdgeInsets.all(AppSpacing.sm),
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: .92),
                  borderRadius: AppRadius.input,
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                    Text(subtitle, style: Theme.of(context).textTheme.bodySmall),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class StitchEvidenceComparison extends StatelessWidget {
  const StitchEvidenceComparison({super.key});

  @override
  Widget build(BuildContext context) {
    return LunasCard(
      padding: EdgeInsets.zero,
      child: SizedBox(
        height: 190,
        child: Row(
          children: const [
            Expanded(
              child: _EvidencePanel(
                label: 'Before',
                icon: Icons.warning_amber_rounded,
                color: AppColorsLight.critical,
                detail: 'Damaged road surface',
              ),
            ),
            SizedBox(width: 3),
            Expanded(
              child: _EvidencePanel(
                label: 'After',
                icon: Icons.check_circle_outline_rounded,
                color: AppColorsLight.success,
                detail: 'Repaired road surface',
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class StitchStatusPill extends StatelessWidget {
  const StitchStatusPill({
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
        color: color.withValues(alpha: .12),
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
            style: Theme.of(context).textTheme.labelSmall?.copyWith(
              color: color,
              letterSpacing: .2,
            ),
          ),
        ],
      ),
    );
  }
}

class _MapGrid extends StatelessWidget {
  const _MapGrid();

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: AppRadius.card,
      child: CustomPaint(
        painter: _MapGridPainter(
          lineColor: AppColorsLight.brandBase.withValues(alpha: .16),
        ),
        child: const SizedBox.expand(),
      ),
    );
  }
}

class _MapMarker extends StatelessWidget {
  const _MapMarker({required this.icon, required this.color});

  final IconData icon;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 42,
      height: 42,
      decoration: BoxDecoration(
        color: color,
        shape: BoxShape.circle,
        border: Border.all(color: Colors.white, width: 3),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: .18),
            blurRadius: 8,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Icon(icon, color: Colors.white, size: 22),
    );
  }
}

class _EvidencePanel extends StatelessWidget {
  const _EvidencePanel({
    required this.label,
    required this.icon,
    required this.color,
    required this.detail,
  });

  final String label;
  final IconData icon;
  final Color color;
  final String detail;

  @override
  Widget build(BuildContext context) {
    return Container(
      color: color.withValues(alpha: .1),
      child: Stack(
        children: [
          Center(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(icon, color: color, size: 46),
                const SizedBox(height: AppSpacing.xs),
                Text(
                  detail,
                  textAlign: TextAlign.center,
                  style: Theme.of(context).textTheme.bodySmall,
                ),
              ],
            ),
          ),
          Positioned(
            left: AppSpacing.sm,
            bottom: AppSpacing.sm,
            child: StitchStatusPill(label: label, color: color),
          ),
        ],
      ),
    );
  }
}

class _MapGridPainter extends CustomPainter {
  const _MapGridPainter({required this.lineColor});

  final Color lineColor;

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = lineColor
      ..strokeWidth = 2;
    for (var offset = -size.height; offset < size.width; offset += 38) {
      canvas.drawLine(
        Offset(offset, 0),
        Offset(offset + size.height, size.height),
        paint,
      );
    }
    for (var offset = 20.0; offset < size.height; offset += 46) {
      canvas.drawLine(Offset(0, offset), Offset(size.width, offset - 20), paint);
    }
  }

  @override
  bool shouldRepaint(_MapGridPainter oldDelegate) =>
      oldDelegate.lineColor != lineColor;
}

class _RoutePainter extends CustomPainter {
  const _RoutePainter();

  @override
  void paint(Canvas canvas, Size size) {
    final route = Path()
      ..moveTo(size.width * .23, size.height * .73)
      ..quadraticBezierTo(
        size.width * .42,
        size.height * .48,
        size.width * .58,
        size.height * .5,
      )
      ..quadraticBezierTo(
        size.width * .69,
        size.height * .42,
        size.width * .75,
        size.height * .25,
      );
    canvas.drawPath(
      route,
      Paint()
        ..color = AppColorsLight.brandBase
        ..strokeWidth = 5
        ..style = PaintingStyle.stroke
        ..strokeCap = StrokeCap.round,
    );
  }

  @override
  bool shouldRepaint(_RoutePainter oldDelegate) => false;
}
