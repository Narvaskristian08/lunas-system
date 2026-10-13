import 'package:go_router/go_router.dart';
import 'dart:async';
import 'package:lunas_mobile/features/maps/domain/models/location_integrity.dart';

import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:lunas_mobile/features/maps/presentation/widgets/lunas_street_map.dart';
import 'package:lunas_mobile/core/theme/app_spacing.dart';
import 'package:lunas_mobile/core/widgets/lunas_app_bar.dart';
import 'package:lunas_mobile/core/widgets/lunas_button.dart';
import 'package:lunas_mobile/core/widgets/lunas_card.dart';
import 'package:lunas_mobile/core/widgets/lunas_state_view.dart';
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
    return context.push<SelectedLocation>(
      '/reports/location?mode=picker',
      extra: initialLocation,
    );
  }

  @override
  State<MapPickerScreen> createState() => _MapPickerScreenState();
}

class _MapPickerScreenState extends State<MapPickerScreen> {
  static const _dagupan = LatLng(16.0433, 120.3333);

  final _mapController = MapController();
  bool _mapReady = false;
  StreamSubscription<Position>? _positionSubscription;
  SelectedLocation? _selectedLocation;
  LatLng _cameraTarget = _dagupan;
  GpsFix? _gpsFix;
  String _pinSource = 'map_pin';
  bool _isLocating = false;
  bool _isGeocoding = false;

  @override
  void initState() {
    super.initState();
    final initialLocation = widget.initialLocation;
    if (initialLocation != null) {
      _selectedLocation = initialLocation;
      _pinSource = initialLocation.pinSource;
      _gpsFix = initialLocation.gpsFix;
      _cameraTarget = LatLng(
        initialLocation.latitude,
        initialLocation.longitude,
      );
    }
    _moveToCurrentLocation(userInitiated: initialLocation == null);
  }

  @override
  void dispose() {
    _positionSubscription?.cancel();
    _mapController.dispose();
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
        _gpsFix = GpsFix(
          longitude: position.longitude,
          latitude: position.latitude,
          accuracyMeters: position.accuracy,
          capturedAt: position.timestamp,
        );
      });
      _positionSubscription ??= widget.locationService.watchPosition().listen(
        (position) {
          if (!mounted) return;
          setState(() {
            _gpsFix = GpsFix(
              longitude: position.longitude,
              latitude: position.latitude,
              accuracyMeters: position.accuracy,
              capturedAt: position.timestamp,
            );
          });
        },
        onError: (Object error) {
          if (!mounted) return;
          _showLocationFeedback(
            'Live location is unavailable. Tap My location to retry.',
          );
          _positionSubscription?.cancel();
          _positionSubscription = null;
        },
      );
      final target = LatLng(position.latitude, position.longitude);
      if (userInitiated || _selectedLocation == null) {
        await _selectPoint(target, source: 'gps');
        await _animateCameraTo(target, zoom: 17);
      }
    } on LocationServiceException catch (error) {
      if (!mounted) return;
      setState(() {
        _gpsFix = null;
      });
      if (userInitiated) {
        _showLocationFeedback(
          _messageFor(error.failure),
          onSettings: error.failure == LocationFailure.permissionDeniedForever
              ? _openAppSettings
              : error.failure == LocationFailure.servicesDisabled
              ? () {
                  unawaited(widget.locationService.openLocationSettings());
                }
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

  void _onMapReady() {
    if (!mounted) return;
    _mapReady = true;
    unawaited(
      _animateCameraTo(
        _cameraTarget,
        zoom: _selectedLocation == null ? 13 : 17,
      ),
    );
  }

  Future<void> _animateCameraTo(LatLng target, {required double zoom}) async {
    if (!mounted || !_mapReady) return;
    try {
      _mapController.move(target, zoom);
    } catch (_) {
      // The native map can be torn down while a route is leaving. The map
      // remains usable on the next open, so this is intentionally not fatal.
    }
  }

  Future<void> _selectPoint(LatLng point, {String source = 'map_pin'}) async {
    if (!mounted) return;
    setState(() {
      _pinSource = source;
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
      appBar: LunasAppBar(
        title: 'Maps',
        subtitle: widget.showLocationConfirmation
            ? 'Confirm the location of your report.'
            : 'Explore locations around you.',
        showBackButton: widget.showLocationConfirmation,
        actions: [
          IconButton(
            tooltip: 'My location',
            onPressed: _isLocating
                ? null
                : () => _moveToCurrentLocation(userInitiated: true),
            icon: const Icon(Icons.my_location_rounded),
          ),
          const SizedBox(width: AppSpacing.sm),
        ],
      ),
      body: Stack(
        children: [
          LunasStreetMap(
            controller: _mapController,
            options: MapOptions(
              initialCenter: _cameraTarget,
              initialZoom: selected == null ? 13 : 17,
              maxZoom: 19,
              onMapReady: _onMapReady,
              onTap: (_, point) => _selectPoint(point),
            ),
            layers: [
              if (_gpsFix != null)
                CircleLayer(
                  circles: [
                    CircleMarker(
                      point: LatLng(_gpsFix!.latitude, _gpsFix!.longitude),
                      radius: _gpsFix!.accuracyMeters,
                      useRadiusInMeter: true,
                      color: theme.colorScheme.primary.withValues(alpha: .12),
                      borderColor: theme.colorScheme.primary.withValues(
                        alpha: .45,
                      ),
                      borderStrokeWidth: 1,
                    ),
                  ],
                ),
              MarkerLayer(
                markers: [
                  if (_gpsFix != null)
                    Marker(
                      point: LatLng(_gpsFix!.latitude, _gpsFix!.longitude),
                      width: 18,
                      height: 18,
                      child: Container(
                        decoration: BoxDecoration(
                          color: Colors.blue,
                          shape: BoxShape.circle,
                          border: Border.all(color: Colors.white, width: 3),
                        ),
                      ),
                    ),
                  if (selected != null)
                    Marker(
                      point: LatLng(selected.latitude, selected.longitude),
                      width: 44,
                      height: 44,
                      alignment: Alignment.topCenter,
                      child: Icon(
                        Icons.location_on,
                        color: theme.colorScheme.error,
                        size: 44,
                        semanticLabel: 'Selected report location',
                      ),
                    ),
                ],
              ),
            ],
          ),
          if (!widget.showLocationConfirmation &&
              !_isLocating &&
              _gpsFix != null)
            Positioned(
              left: AppSpacing.md,
              right: 88,
              bottom: AppSpacing.md,
              child: LunasCard(
                child: Text(
                  'Your current location · GPS accuracy ±${_gpsFix!.accuracyMeters.round()} m',
                  style: theme.textTheme.bodyMedium,
                ),
              ),
            ),
          if (_isLocating)
            ColoredBox(
              color: theme.colorScheme.surface.withValues(alpha: .78),
              child: const Align(
                alignment: Alignment(0, -.18),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    SizedBox.square(
                      dimension: 42,
                      child: LunasLoadingIndicator(),
                    ),
                    SizedBox(height: AppSpacing.md),
                    Text('Getting your current location…'),
                  ],
                ),
              ),
            ),
          if (!_isLocating)
            Positioned(
              right: AppSpacing.md,
              top: widget.showLocationConfirmation ? AppSpacing.lg : null,
              bottom: widget.showLocationConfirmation ? null : AppSpacing.md,
              child: FloatingActionButton(
                heroTag: 'map-picker-current-location',
                tooltip: 'Center on my location',
                onPressed: () => _moveToCurrentLocation(userInitiated: true),
                child: const Icon(Icons.my_location_rounded, size: 24),
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
                      padding: const EdgeInsets.all(AppSpacing.lg),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          Text(
                            'Selected Location',
                            style: theme.textTheme.labelLarge?.copyWith(
                              color: theme.colorScheme.primary,
                              fontWeight: FontWeight.w700,
                              letterSpacing: .5,
                            ),
                          ),
                          const SizedBox(height: AppSpacing.xs),
                          Text(
                            selected?.address ??
                                'Tap anywhere on the map to place a pin.',
                            style: theme.textTheme.titleMedium,
                          ),
                          const SizedBox(height: AppSpacing.lg),
                          LunasButton(
                            label: _isGeocoding
                                ? 'Finding Address…'
                                : 'Use This Location',
                            isLoading: _isGeocoding,
                            onPressed: selected == null || _isGeocoding
                                ? null
                                : () => context.pop(
                                    SelectedLocation(
                                      latitude: selected.latitude,
                                      longitude: selected.longitude,
                                      address: selected.address,
                                      city: selected.city,
                                      countryCode: selected.countryCode,
                                      pinSource: _pinSource,
                                      gpsFix: _gpsFix,
                                      barangayCandidates:
                                          selected.barangayCandidates,
                                      reverseGeocodingSucceeded:
                                          selected.reverseGeocodingSucceeded,
                                    ),
                                  ),
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
