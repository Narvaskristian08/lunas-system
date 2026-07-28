import 'package:flutter/material.dart';
import 'package:lunas_mobile/core/theme/app_colors.dart';
import 'package:lunas_mobile/core/theme/app_spacing.dart';
import 'package:lunas_mobile/core/widgets/lunas_app_scaffold.dart';
import 'package:lunas_mobile/features/maps/presentation/widgets/map_widgets.dart';
import 'package:lunas_mobile/features/reporting/presentation/widgets/reporting_widgets.dart';

class MapScreen extends StatefulWidget {
  const MapScreen({super.key});

  @override
  State<MapScreen> createState() => _MapScreenState();
}

class _MapScreenState extends State<MapScreen> {
  String _filter = 'All';
  String? _selectedMarker;

  static const _markers = [
    MapMarkerData(
      id: 'RPT-2026-0142',
      title: 'Broken Streetlight',
      location: 'Rizal Avenue • 0.4 km away',
      status: 'In Progress',
      color: AppColorsLight.alert,
      alignment: Alignment(-.52, -.35),
      icon: Icons.lightbulb_outline_rounded,
    ),
    MapMarkerData(
      id: 'RPT-2026-0118',
      title: 'Road Surface Damage',
      location: 'Mabini Street • 0.8 km away',
      status: 'Verified',
      color: AppColorsLight.info,
      alignment: Alignment(.38, -.52),
      icon: Icons.add_road_rounded,
    ),
    MapMarkerData(
      id: 'RPT-2026-0093',
      title: 'Clogged Drainage',
      location: 'Quezon Street • 1.2 km away',
      status: 'Resolved',
      color: AppColorsLight.success,
      alignment: Alignment(.5, .28),
      icon: Icons.water_damage_outlined,
    ),
  ];

  void _showMarker(MapMarkerData marker) {
    setState(() => _selectedMarker = marker.id);
    showModalBottomSheet<void>(
      context: context,
      showDragHandle: false,
      isScrollControlled: true,
      builder: (_) => MarkerDetailsSheet(marker: marker),
    );
  }

  @override
  Widget build(BuildContext context) {
    return LunasAppScaffold(
      title: 'Incident Map',
      subtitle: 'Reports near your location',
      selectedIndex: 2,
      actions: [
        IconButton(
          onPressed: () => Navigator.pushNamed(context, '/reports/location'),
          tooltip: 'Select location',
          icon: const Icon(Icons.my_location_rounded),
        ),
        const SizedBox(width: AppSpacing.xs),
      ],
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: [
                for (final filter in ['All', 'Active', 'Resolved'])
                  Padding(
                    padding: const EdgeInsets.only(right: AppSpacing.xs),
                    child: ChoiceChip(
                      label: Text(filter),
                      selected: _filter == filter,
                      onSelected: (_) => setState(() => _filter = filter),
                    ),
                  ),
              ],
            ),
          ),
          const SizedBox(height: AppSpacing.md),
          LunasMapCanvas(
            markers: _markers,
            selectedMarker: _selectedMarker,
            onMarkerTap: _showMarker,
            onGpsTap: () {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Centered on your GPS location.')),
              );
            },
          ),
          const SizedBox(height: AppSpacing.md),
          const Row(
            children: [
              ReportStatusChip(
                label: '3 nearby reports',
                icon: Icons.near_me_outlined,
                color: AppColorsLight.brandBase,
              ),
              Spacer(),
              Text('Within 2 km'),
            ],
          ),
          const SizedBox(height: AppSpacing.xxl),
          Text(
            'Nearby Reports',
            style: Theme.of(
              context,
            ).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w800),
          ),
          const SizedBox(height: AppSpacing.md),
          for (final marker in _markers) ...[
            NearbyReportCard(marker: marker, onTap: () => _showMarker(marker)),
            const SizedBox(height: AppSpacing.sm),
          ],
        ],
      ),
    );
  }
}
