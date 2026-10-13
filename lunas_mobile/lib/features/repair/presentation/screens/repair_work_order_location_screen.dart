import 'package:lunas_mobile/core/widgets/quiet_data_refresh.dart';
import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:lunas_mobile/features/maps/presentation/widgets/lunas_street_map.dart';
import 'package:lunas_mobile/app/app_services.dart';
import 'package:lunas_mobile/core/network/api_exception.dart';
import 'package:lunas_mobile/core/theme/app_spacing.dart';
import 'package:lunas_mobile/core/widgets/lunas_card.dart';
import 'package:lunas_mobile/core/widgets/lunas_state_view.dart';
import 'package:lunas_mobile/features/repair/data/models/repair_models.dart';
import 'package:lunas_mobile/features/repair/presentation/widgets/repair_widgets.dart';

/// Read-only incident location for an assigned repair. It never modifies the
/// citizen-reported pin or starts background personnel tracking.
class RepairWorkOrderLocationScreen extends StatefulWidget {
  const RepairWorkOrderLocationScreen({required this.workOrderId, super.key});

  final String workOrderId;

  @override
  State<RepairWorkOrderLocationScreen> createState() =>
      _RepairWorkOrderLocationScreenState();
}

class _RepairWorkOrderLocationScreenState
    extends State<RepairWorkOrderLocationScreen>
    with
        WidgetsBindingObserver,
        QuietDataRefresh<RepairWorkOrderLocationScreen> {
  bool _loading = true;
  String? _error;
  RepairWorkOrder? _workOrder;

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  Future<void> refreshVisibleData() => _load(quiet: true);

  Future<void> _load({bool quiet = false}) =>
      loadScreenData(_loadData, quiet: quiet);

  Future<void> _loadData() async {
    if (!isQuietRefresh) {
      setState(() {
        _loading = true;
        _error = null;
      });
    }
    try {
      final workOrder = await repairService.getWorkOrder(widget.workOrderId);
      if (mounted) {
        setState(() {
          if (isQuietRefresh && !canRefreshData) return;
          _workOrder = workOrder;
          _error = null;
        });
      }
    } on ApiException catch (error) {
      if (mounted && !isQuietRefresh) {
        setState(() => _error = error.message);
      }
    } finally {
      if (mounted) {
        setState(() => _loading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Scaffold(
        body: SafeArea(
          child: LunasStateView(
            state: LunasViewState.loading,
            title: 'Loading work location',
            message: 'Getting the incident location returned by the server.',
          ),
        ),
      );
    }
    if (_error != null || _workOrder == null) {
      return Scaffold(
        appBar: const RepairAppBar(
          title: 'Work Location',
          showBackButton: true,
        ),
        body: SafeArea(
          child: LunasStateView(
            state: LunasViewState.error,
            title: 'Could not open the location',
            message: _error ?? 'This work order is unavailable.',
            actionLabel: 'Try Again',
            onAction: _load,
          ),
        ),
      );
    }
    final workOrder = _workOrder!;
    final location = workOrder.location;
    final hasCoordinates = location.hasValidCoordinates;
    return RepairPage(
      appBar: RepairAppBar(
        title: 'Work Location',
        subtitle: workOrder.orderNumber,
        showBackButton: true,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          LunasCard(
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Icon(Icons.location_on_outlined),
                const SizedBox(width: AppSpacing.md),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Reported location',
                        style: Theme.of(context).textTheme.titleMedium,
                      ),
                      const SizedBox(height: AppSpacing.xs),
                      Text(location.displayAddress),
                      if (hasCoordinates) ...[
                        const SizedBox(height: AppSpacing.xs),
                        Text(
                          '${location.latitude!.toStringAsFixed(6)}, ${location.longitude!.toStringAsFixed(6)}',
                          style: Theme.of(context).textTheme.bodySmall,
                        ),
                      ],
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: AppSpacing.lg),
          if (hasCoordinates)
            _IncidentMap(
              latitude: location.latitude!,
              longitude: location.longitude!,
            )
          else
            const LunasCard(
              child: Text(
                'The server did not provide coordinates for this incident location.',
              ),
            ),
          const SizedBox(height: AppSpacing.lg),
          const LunasCard(
            child: Text(
              'This is the citizen-reported incident pin. A repair-progress update attaches your current location only when you explicitly choose to do so.',
            ),
          ),
        ],
      ),
    );
  }
}

class _IncidentMap extends StatelessWidget {
  const _IncidentMap({required this.latitude, required this.longitude});

  final double latitude;
  final double longitude;

  @override
  Widget build(BuildContext context) {
    final position = LatLng(latitude, longitude);
    return ClipRRect(
      borderRadius: BorderRadius.circular(14),
      child: SizedBox(
        height: 360,
        child: LunasStreetMap(
          options: MapOptions(
            initialCenter: position,
            initialZoom: 16,
            maxZoom: 19,
          ),
          layers: [
            MarkerLayer(
              markers: [
                Marker(
                  point: position,
                  width: 44,
                  height: 44,
                  alignment: Alignment.topCenter,
                  child: const Icon(
                    Icons.location_on,
                    size: 44,
                    color: Colors.red,
                    semanticLabel: 'Reported incident location',
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
