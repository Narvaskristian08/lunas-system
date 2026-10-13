import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:url_launcher/url_launcher.dart';

/// Shared report and repair map, with visible attribution and normal HTTP
/// caching. Only visible tiles are requested; there is no bulk/offline download.
class LunasStreetMap extends StatefulWidget {
  const LunasStreetMap({
    required this.options,
    this.controller,
    this.layers = const [],
    super.key,
  });

  final MapOptions options;
  final MapController? controller;
  final List<Widget> layers;

  @override
  State<LunasStreetMap> createState() => _LunasStreetMapState();
}

class _LunasStreetMapState extends State<LunasStreetMap> {
  late final NetworkTileProvider _tiles = NetworkTileProvider(
    cachingProvider: BuiltInMapCachingProvider.getOrCreateInstance(
      maxCacheSize: 64000000,
    ),
  );
  bool _tileError = false;

  @override
  Widget build(BuildContext context) => Stack(
    children: [
      FlutterMap(
        mapController: widget.controller,
        options: widget.options,
        children: [
          TileLayer(
            urlTemplate: const String.fromEnvironment(
              'LUNAS_MAP_TILE_URL',
              defaultValue: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
            ),
            userAgentPackageName:
                'LUNAS-mobile (+https://lunas-system.vercel.app)',
            tileProvider: _tiles,
            maxNativeZoom: 19,
            panBuffer: 0,
            errorTileCallback: (_, _, _) {
              if (_tileError) return;
              WidgetsBinding.instance.addPostFrameCallback((_) {
                if (mounted && !_tileError) setState(() => _tileError = true);
              });
            },
          ),
          ...widget.layers,
        ],
      ),
      Positioned(
        left: 8,
        top: 8,
        child: Material(
          color: Theme.of(context).colorScheme.surface,
          borderRadius: BorderRadius.circular(6),
          child: InkWell(
            onTap: () => launchUrl(
              Uri.parse('https://www.openstreetmap.org/copyright'),
              mode: LaunchMode.externalApplication,
            ),
            child: const Padding(
              padding: EdgeInsets.symmetric(horizontal: 8, vertical: 5),
              child: Text(
                '© OpenStreetMap contributors',
                style: TextStyle(fontSize: 11),
              ),
            ),
          ),
        ),
      ),
      if (_tileError)
        const Positioned(
          top: 42,
          left: 8,
          right: 8,
          child: Material(
            child: Padding(
              padding: EdgeInsets.all(8),
              child: Text(
                'Some map tiles could not load. Check your internet connection. You can still use GPS or select a pin.',
              ),
            ),
          ),
        ),
    ],
  );
}
