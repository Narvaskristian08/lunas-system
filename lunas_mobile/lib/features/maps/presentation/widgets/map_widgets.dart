import 'package:go_router/go_router.dart';
import 'package:flutter/material.dart';
import 'package:lunas_mobile/core/theme/app_colors.dart';
import 'package:lunas_mobile/core/theme/app_radius.dart';
import 'package:lunas_mobile/core/theme/app_spacing.dart';
import 'package:lunas_mobile/core/widgets/lunas_card.dart';
import 'package:lunas_mobile/features/reporting/presentation/widgets/reporting_widgets.dart';

class LunasMapCanvas extends StatelessWidget {
  const LunasMapCanvas({
    required this.markers,
    this.selectedMarker,
    this.onMarkerTap,
    this.onMapTap,
    this.onGpsTap,
    this.height,
    super.key,
  });

  final List<MapMarkerData> markers;
  final String? selectedMarker;
  final ValueChanged<MapMarkerData>? onMarkerTap;
  final GestureTapUpCallback? onMapTap;
  final VoidCallback? onGpsTap;
  final double? height;

  @override
  Widget build(BuildContext context) {
    final canvas = GestureDetector(
      onTapUp: onMapTap,
      child: Container(
        decoration: BoxDecoration(
          color: const Color(0xFFE9F0F4),
          borderRadius: AppRadius.card,
        ),
        child: ClipRRect(
          borderRadius: AppRadius.card,
          child: Stack(
            fit: StackFit.expand,
            children: [
              const CustomPaint(painter: _StreetMapPainter()),
              for (final marker in markers)
                Align(
                  alignment: marker.alignment,
                  child: GestureDetector(
                    onTap: () => onMarkerTap?.call(marker),
                    child: AnimatedScale(
                      scale: selectedMarker == marker.id ? 1.22 : 1,
                      duration: const Duration(milliseconds: 180),
                      child: Icon(
                        Icons.location_on_rounded,
                        size: selectedMarker == marker.id ? 45 : 37,
                        color: marker.color,
                        shadows: const [
                          Shadow(color: Color(0x33000000), blurRadius: 4),
                        ],
                      ),
                    ),
                  ),
                ),
              if (onGpsTap != null)
                Positioned(
                  right: AppSpacing.md,
                  bottom: AppSpacing.md,
                  child: FloatingActionButton.small(
                    heroTag: null,
                    onPressed: onGpsTap,
                    tooltip: 'Use GPS location',
                    child: const Icon(Icons.my_location_rounded),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
    return height == null
        ? AspectRatio(aspectRatio: 1.05, child: canvas)
        : SizedBox(height: height, child: canvas);
  }
}

class MapMarkerData {
  const MapMarkerData({
    required this.id,
    required this.title,
    required this.location,
    required this.status,
    required this.color,
    required this.alignment,
    required this.icon,
  });

  final String id;
  final String title;
  final String location;
  final String status;
  final Color color;
  final Alignment alignment;
  final IconData icon;
}

class NearbyReportCard extends StatelessWidget {
  const NearbyReportCard({
    required this.marker,
    required this.onTap,
    super.key,
  });

  final MapMarkerData marker;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return LunasCard(
      onTap: onTap,
      padding: const EdgeInsets.all(AppSpacing.md),
      child: Row(
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: marker.color.withValues(alpha: .1),
              borderRadius: BorderRadius.circular(AppRadius.sm),
            ),
            child: Icon(marker.icon, color: marker.color),
          ),
          const SizedBox(width: AppSpacing.md),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  marker.title,
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w700,
                  ),
                ),
                Text(
                  marker.location,
                  style: Theme.of(context).textTheme.bodySmall,
                ),
              ],
            ),
          ),
          ReportStatusChip(label: marker.status, color: marker.color),
        ],
      ),
    );
  }
}

class MarkerDetailsSheet extends StatelessWidget {
  const MarkerDetailsSheet({required this.marker, super.key});

  final MapMarkerData marker;

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.xl),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Center(
              child: Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: AppColorsLight.divider,
                  borderRadius: BorderRadius.circular(AppRadius.pill),
                ),
              ),
            ),
            const SizedBox(height: AppSpacing.lg),
            Row(
              children: [
                Expanded(
                  child: Text(
                    marker.title,
                    style: Theme.of(context).textTheme.titleLarge?.copyWith(
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
                ReportStatusChip(label: marker.status, color: marker.color),
              ],
            ),
            const SizedBox(height: AppSpacing.xs),
            Text(marker.id, style: Theme.of(context).textTheme.bodySmall),
            const SizedBox(height: AppSpacing.md),
            Row(
              children: [
                const Icon(Icons.location_on_outlined, size: 18),
                const SizedBox(width: AppSpacing.xs),
                Expanded(child: Text(marker.location)),
              ],
            ),
            const SizedBox(height: AppSpacing.lg),
            FilledButton(
              onPressed: () {
                final router = GoRouter.of(context);
                Navigator.pop(context); // Dismiss the marker sheet.
                router.push('/reports/${Uri.encodeComponent(marker.id)}');
              },
              child: const Text('View Report Details'),
            ),
          ],
        ),
      ),
    );
  }
}

class _StreetMapPainter extends CustomPainter {
  const _StreetMapPainter();

  @override
  void paint(Canvas canvas, Size size) {
    final minor = Paint()
      ..color = const Color(0xFFFFFFFF)
      ..strokeWidth = 5
      ..style = PaintingStyle.stroke;
    final major = Paint()
      ..color = const Color(0xFFD2DEE5)
      ..strokeWidth = 10
      ..style = PaintingStyle.stroke;
    final water = Paint()..color = const Color(0xFFBFDDEB);
    canvas.drawRect(
      Rect.fromLTWH(0, size.height * .72, size.width, size.height * .28),
      water,
    );
    for (var index = 1; index < 6; index++) {
      final y = size.height * index / 7;
      canvas.drawLine(
        Offset(0, y),
        Offset(size.width, y * .88),
        index == 3 ? major : minor,
      );
    }
    for (var index = 1; index < 6; index++) {
      final x = size.width * index / 6;
      canvas.drawLine(
        Offset(x, 0),
        Offset(x * .85, size.height),
        index == 2 ? major : minor,
      );
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
