import 'package:flutter/material.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:lunas_mobile/core/theme/app_spacing.dart';
import 'package:lunas_mobile/core/widgets/lunas_app_bar.dart';
import 'package:lunas_mobile/core/widgets/lunas_button.dart';
import 'package:lunas_mobile/core/widgets/lunas_card.dart';
import 'package:lunas_mobile/features/maps/data/services/location_service.dart';
import 'package:lunas_mobile/features/maps/domain/models/selected_location.dart';

class MapPickerScreen extends StatefulWidget {
  const MapPickerScreen({
    this.initialLocation,
    this.locationService = const LocationService(),
    super.key,
  });

  final SelectedLocation? initialLocation;
  final LocationService locationService;

  static Future<SelectedLocation?> open(
    BuildContext context, {
    SelectedLocation? initialLocation,
  }) {
    return Navigator.of(context).push<SelectedLocation>(
      MaterialPageRoute(
        builder: (_) => MapPickerScreen(initialLocation: initialLocation),
      ),
    );
  }

  @override
  State<MapPickerScreen> createState() => _MapPickerScreenState();
}

class _MapPickerScreenState extends State<MapPickerScreen> {
  static const _dagupan = LatLng(16.0433, 120.3333);

  GoogleMapController? _mapController;
  SelectedLocation? _selectedLocation;
  LatLng _cameraTarget = _dagupan;
  bool _isLocating = true;
  bool _isGeocoding = false;
  bool _hasLocationPermission = false;
  String? _locationMessage;

  @override
  void initState() {
    super.initState();
    final initialLocation = widget.initialLocation;
    if (initialLocation != null) {
      _selectedLocation = initialLocation;
      _cameraTarget = LatLng(
        initialLocation.latitude,
        initialLocation.longitude,
      );
    }
    _moveToCurrentLocation();
  }

  @override
  void dispose() {
    _mapController?.dispose();
    super.dispose();
  }

  Future<void> _moveToCurrentLocation() async {
    setState(() {
      _isLocating = true;
      _locationMessage = null;
    });
    try {
      final position = await widget.locationService.determinePosition();
      if (!mounted) return;
      setState(() => _hasLocationPermission = true);
      final target = LatLng(position.latitude, position.longitude);
      await _selectPoint(target);
      await _mapController?.animateCamera(
        CameraUpdate.newCameraPosition(
          CameraPosition(target: target, zoom: 17),
        ),
      );
    } on LocationServiceException catch (error) {
      if (!mounted) return;
      setState(() => _locationMessage = _messageFor(error.failure));
    } catch (_) {
      if (!mounted) return;
      setState(
        () => _locationMessage =
            'We could not retrieve your location. Please try again.',
      );
    } finally {
      if (mounted) setState(() => _isLocating = false);
    }
  }

  Future<void> _selectPoint(LatLng point) async {
    setState(() {
      _cameraTarget = point;
      _isGeocoding = true;
      _selectedLocation = SelectedLocation(
        latitude: point.latitude,
        longitude: point.longitude,
        address: 'Finding address…',
      );
    });
    final location = await widget.locationService.resolveLocation(
      latitude: point.latitude,
      longitude: point.longitude,
    );
    if (!mounted || _cameraTarget != point) return;
    setState(() {
      _selectedLocation = location;
      _isGeocoding = false;
    });
  }

  String _messageFor(LocationFailure failure) {
    return switch (failure) {
      LocationFailure.servicesDisabled =>
        'Location services are turned off. Enable GPS, then try again.',
      LocationFailure.permissionDenied =>
        'Location permission was denied. You can still tap the map to choose a location.',
      LocationFailure.permissionDeniedForever =>
        'Location permission is blocked. Enable it in your device settings, or tap the map.',
    };
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final selected = _selectedLocation;
    return Scaffold(
      appBar: const LunasAppBar(
        title: 'Choose Location',
        subtitle: 'Tap the map to place the report pin',
        showBackButton: true,
      ),
      body: Stack(
        children: [
          GoogleMap(
            initialCameraPosition: CameraPosition(
              target: _cameraTarget,
              zoom: selected == null ? 13 : 17,
            ),
            onMapCreated: (controller) => _mapController = controller,
            onTap: _selectPoint,
            myLocationEnabled: _hasLocationPermission,
            myLocationButtonEnabled: false,
            compassEnabled: true,
            zoomControlsEnabled: false,
            markers: selected == null
                ? const {}
                : {
                    Marker(
                      markerId: const MarkerId('selected-location'),
                      position: LatLng(selected.latitude, selected.longitude),
                    ),
                  },
          ),
          if (_isLocating)
            ColoredBox(
              color: theme.colorScheme.surface.withValues(alpha: .78),
              child: const Center(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    CircularProgressIndicator(),
                    SizedBox(height: AppSpacing.md),
                    Text('Getting your current location…'),
                  ],
                ),
              ),
            ),
          if (!_isLocating)
            Positioned(
              right: AppSpacing.lg,
              top: AppSpacing.lg,
              child: FloatingActionButton.small(
                heroTag: 'map-picker-current-location',
                tooltip: 'Center on my location',
                onPressed: _moveToCurrentLocation,
                child: const Icon(Icons.my_location_rounded),
              ),
            ),
          if (!_isLocating)
            Positioned(
              left: AppSpacing.md,
              right: AppSpacing.md,
              bottom: AppSpacing.md,
              child: SafeArea(
                top: false,
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    if (_locationMessage != null) ...[
                      Material(
                        color: theme.colorScheme.errorContainer,
                        borderRadius: BorderRadius.circular(12),
                        child: Padding(
                          padding: const EdgeInsets.all(AppSpacing.md),
                          child: Row(
                            children: [
                              Icon(
                                Icons.location_disabled_outlined,
                                color: theme.colorScheme.onErrorContainer,
                              ),
                              const SizedBox(width: AppSpacing.sm),
                              Expanded(child: Text(_locationMessage!)),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(height: AppSpacing.sm),
                    ],
                    LunasCard(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          Text(
                            selected?.address ??
                                'Tap anywhere on the map to place a pin.',
                            style: theme.textTheme.titleMedium,
                          ),
                          if (selected != null) ...[
                            const SizedBox(height: AppSpacing.xs),
                            Text(
                              selected.coordinates,
                              style: theme.textTheme.bodySmall,
                            ),
                          ],
                          const SizedBox(height: AppSpacing.md),
                          LunasButton(
                            label: _isGeocoding
                                ? 'Finding Address…'
                                : 'Use This Location',
                            icon: Icons.check_rounded,
                            isLoading: _isGeocoding,
                            onPressed: selected == null || _isGeocoding
                                ? null
                                : () => Navigator.pop(context, selected),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }
}
