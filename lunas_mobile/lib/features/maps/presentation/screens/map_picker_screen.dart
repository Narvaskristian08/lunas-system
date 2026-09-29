import 'dart:async';

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
    this.showLocationConfirmation = true,
    this.locationService = const LocationService(),
    super.key,
  });

  final SelectedLocation? initialLocation;
  final bool showLocationConfirmation;
  final LocationService locationService;

  static Future<SelectedLocation?> open(
    BuildContext context, {
    SelectedLocation? initialLocation,
  }) {
    return Navigator.of(context).push<SelectedLocation>(
      MaterialPageRoute(
        builder: (_) => MapPickerScreen(
          initialLocation: initialLocation,
          showLocationConfirmation: true,
        ),
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
  bool _isLocating = false;
  bool _isGeocoding = false;
  bool _hasLocationPermission = false;

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
    _moveToCurrentLocation(userInitiated: false);
  }

  @override
  void dispose() {
    _mapController?.dispose();
    super.dispose();
  }

  Future<void> _moveToCurrentLocation({required bool userInitiated}) async {
    if (!mounted || _isLocating) return;
    setState(() {
      _isLocating = true;
    });
    try {
      final position = await widget.locationService.determinePosition();
      if (!mounted) return;
      setState(() {
        _hasLocationPermission = true;
      });
      final target = LatLng(position.latitude, position.longitude);
      await _selectPoint(target);
      await _animateCameraTo(target, zoom: 17);
    } on LocationServiceException catch (error) {
      if (!mounted) return;
      setState(() {
        _hasLocationPermission = false;
      });
      if (userInitiated) {
        _showLocationFeedback(
          _messageFor(error.failure),
          onSettings: error.failure == LocationFailure.permissionDeniedForever
              ? _openAppSettings
              : null,
        );
      }
    } catch (_) {
      if (!mounted) return;
      if (userInitiated) {
        _showLocationFeedback(
          'We could not retrieve your location. Please try again.',
        );
      }
    } finally {
      if (mounted) setState(() => _isLocating = false);
    }
  }

  void _showLocationFeedback(String message, {VoidCallback? onSettings}) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        action: onSettings == null
            ? null
            : SnackBarAction(label: 'Settings', onPressed: onSettings),
      ),
    );
  }

  void _onMapCreated(GoogleMapController controller) {
    if (!mounted) {
      controller.dispose();
      return;
    }
    _mapController = controller;
    unawaited(
      _animateCameraTo(
        _cameraTarget,
        zoom: _selectedLocation == null ? 13 : 17,
      ),
    );
  }

  Future<void> _animateCameraTo(LatLng target, {required double zoom}) async {
    final controller = _mapController;
    if (!mounted || controller == null) return;
    try {
      await controller.animateCamera(
        CameraUpdate.newCameraPosition(
          CameraPosition(target: target, zoom: zoom),
        ),
      );
    } catch (_) {
      // The native map can be torn down while a route is leaving. The map
      // remains usable on the next open, so this is intentionally not fatal.
    }
  }

  Future<void> _selectPoint(LatLng point) async {
    if (!mounted) return;
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
        'Location access is disabled. Enable it in device settings to use your current location.',
    };
  }

  Future<void> _openAppSettings() async {
    final opened = await widget.locationService.openAppSettings();
    if (!mounted || opened) return;
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Open LUNAS settings to enable location access.'),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final selected = _selectedLocation;
    return Scaffold(
      appBar: widget.showLocationConfirmation
          ? const LunasAppBar(
              title: 'Choose Location',
              subtitle: 'Tap the map to place the report pin',
              showBackButton: true,
            )
          : null,
      body: Stack(
        children: [
          GoogleMap(
            initialCameraPosition: CameraPosition(
              target: _cameraTarget,
              zoom: selected == null ? 13 : 17,
            ),
            onMapCreated: _onMapCreated,
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
                onPressed: () =>
                    _moveToCurrentLocation(userInitiated: true),
                child: const Icon(Icons.my_location_rounded),
              ),
            ),
          if (!_isLocating && widget.showLocationConfirmation)
            Positioned(
              left: AppSpacing.md,
              right: AppSpacing.md,
              bottom: AppSpacing.md,
              child: SafeArea(
                top: false,
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    LunasCard(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          Text(
                            'Selected location',
                            style: theme.textTheme.labelLarge?.copyWith(
                              color: theme.colorScheme.primary,
                              fontWeight: FontWeight.w800,
                              letterSpacing: .5,
                            ),
                          ),
                          const SizedBox(height: AppSpacing.xs),
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
