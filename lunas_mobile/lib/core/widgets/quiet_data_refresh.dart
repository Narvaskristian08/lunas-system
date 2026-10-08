import 'dart:async';

import 'package:flutter/widgets.dart';

/// Polls visible read-only data without recreating screens or form state.
mixin QuietDataRefresh<T extends StatefulWidget> on State<T>
    implements WidgetsBindingObserver {
  Timer? _dataRefreshTimer;
  Future<void>? _dataRequest;
  bool _quietRefresh = false;

  bool get isQuietRefresh => _quietRefresh;
  bool get dataRequestInFlight => _dataRequest != null;
  bool get canRefreshData => true;
  Future<void> refreshVisibleData();
  Future<void> waitForDataRequest() async {
    await _dataRequest;
  }

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _dataRefreshTimer = Timer.periodic(
      const Duration(seconds: 15),
      (_) => _poll(),
    );
  }

  void _poll() {
    if (!mounted ||
        !canRefreshData ||
        dataRequestInFlight ||
        WidgetsBinding.instance.lifecycleState != AppLifecycleState.resumed ||
        ModalRoute.of(context)?.isCurrent != true) {
      return;
    }
    unawaited(refreshVisibleData());
  }

  /// Manual reloads wait for a poll; polls never overlap another data request.
  Future<void> loadScreenData(
    Future<void> Function() load, {
    bool quiet = false,
  }) async {
    if (_dataRequest != null) {
      if (quiet) return;
      await _dataRequest;
      if (!mounted) return;
      return loadScreenData(load);
    }
    _quietRefresh = quiet;
    final completion = Completer<void>();
    _dataRequest = completion.future;
    try {
      await load();
    } catch (_) {
      if (!quiet) rethrow;
    } finally {
      _quietRefresh = false;
      _dataRequest = null;
      completion.complete();
    }
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) _poll();
  }

  @override
  void dispose() {
    _dataRefreshTimer?.cancel();
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }
}
