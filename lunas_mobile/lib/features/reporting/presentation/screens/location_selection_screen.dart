import 'package:flutter/material.dart';
import 'package:lunas_mobile/core/theme/app_colors.dart';
import 'package:lunas_mobile/core/theme/app_radius.dart';
import 'package:lunas_mobile/core/theme/app_spacing.dart';
import 'package:lunas_mobile/core/widgets/lunas_app_bar.dart';
import 'package:lunas_mobile/core/widgets/lunas_button.dart';
import 'package:lunas_mobile/core/widgets/lunas_card.dart';
import 'package:lunas_mobile/features/maps/presentation/widgets/map_widgets.dart';

class LocationSelectionScreen extends StatefulWidget {
  const LocationSelectionScreen({super.key});

  @override
  State<LocationSelectionScreen> createState() =>
      _LocationSelectionScreenState();
}

class _LocationSelectionScreenState extends State<LocationSelectionScreen> {
  String _coordinates = '14.5995° N, 120.9842° E';
  String _address = 'Rizal Avenue, Barangay 5';
  bool _gpsLocated = true;

  void _selectPoint(TapUpDetails details) {
    final latitude = 14.5900 + details.localPosition.dy / 10000;
    final longitude = 120.9700 + details.localPosition.dx / 10000;
    setState(() {
      _coordinates =
          '${latitude.toStringAsFixed(4)}° N, ${longitude.toStringAsFixed(4)}° E';
      _address = 'Pinned location, LUNAS City';
      _gpsLocated = false;
    });
  }

  void _useGps() {
    setState(() {
      _coordinates = '14.5995° N, 120.9842° E';
      _address = 'Rizal Avenue, Barangay 5';
      _gpsLocated = true;
    });
    ScaffoldMessenger.of(
      context,
    ).showSnackBar(const SnackBar(content: Text('GPS location updated.')));
  }

  Future<void> _confirm() async {
    final confirmed = await Navigator.pushNamed<bool>(
      context,
      '/reports/location/confirm',
      arguments: (_address, _coordinates),
    );
    if (confirmed == true && mounted) {
      Navigator.pop(context, '$_address • $_coordinates');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: const LunasAppBar(
        title: 'Select Location',
        subtitle: 'Pin the exact location of the issue',
        showBackButton: true,
      ),
      body: SafeArea(
        top: false,
        child: LayoutBuilder(
          builder: (context, constraints) {
            final mapHeight = constraints.maxHeight.clamp(300.0, 520.0) * .58;
            return SingleChildScrollView(
              padding: const EdgeInsets.fromLTRB(
                AppSpacing.xl,
                AppSpacing.md,
                AppSpacing.xl,
                AppSpacing.xl,
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  TextField(
                    decoration: InputDecoration(
                      hintText: 'Search for a street or landmark',
                      prefixIcon: const Icon(Icons.search_rounded),
                      suffixIcon: IconButton(
                        onPressed: _useGps,
                        tooltip: 'Use GPS',
                        icon: const Icon(Icons.my_location_rounded),
                      ),
                    ),
                  ),
                  const SizedBox(height: AppSpacing.md),
                  LunasMapCanvas(
                    height: mapHeight,
                    markers: const [
                      MapMarkerData(
                        id: 'selected',
                        title: 'Selected Location',
                        location: '',
                        status: '',
                        color: AppColorsLight.critical,
                        alignment: Alignment.center,
                        icon: Icons.location_on_rounded,
                      ),
                    ],
                    selectedMarker: 'selected',
                    onMapTap: _selectPoint,
                    onGpsTap: _useGps,
                  ),
                  const SizedBox(height: AppSpacing.md),
                  if (_gpsLocated)
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: AppSpacing.sm,
                        vertical: AppSpacing.xs,
                      ),
                      decoration: BoxDecoration(
                        color: AppColorsLight.success.withValues(alpha: .1),
                        borderRadius: BorderRadius.circular(AppRadius.pill),
                      ),
                      child: const Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(
                            Icons.gps_fixed_rounded,
                            size: 17,
                            color: AppColorsLight.success,
                          ),
                          SizedBox(width: AppSpacing.xs),
                          Text('GPS location detected'),
                        ],
                      ),
                    ),
                  const SizedBox(height: AppSpacing.sm),
                  LunasCard(
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Icon(
                          Icons.location_on_outlined,
                          color: AppColorsLight.brandBase,
                        ),
                        const SizedBox(width: AppSpacing.md),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                _address,
                                style: Theme.of(context).textTheme.titleMedium
                                    ?.copyWith(fontWeight: FontWeight.w700),
                              ),
                              const SizedBox(height: AppSpacing.xxs),
                              Text(
                                _coordinates,
                                style: Theme.of(context).textTheme.bodySmall,
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: AppSpacing.md),
                  LunasButton(
                    label: 'Confirm This Location',
                    icon: Icons.check_rounded,
                    onPressed: _confirm,
                  ),
                ],
              ),
            );
          },
        ),
      ),
    );
  }
}
