import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:lunas_mobile/core/widgets/quiet_data_refresh.dart';

class _Screen extends StatefulWidget {
  const _Screen({super.key});
  @override
  State<_Screen> createState() => _ScreenState();
}

class _ScreenState extends State<_Screen>
    with WidgetsBindingObserver, QuietDataRefresh<_Screen> {
  int calls = 0;
  bool busy = false;
  bool fail = false;
  Completer<void>? pending;
  final text = TextEditingController();

  @override
  bool get canRefreshData => !busy;
  @override
  Future<void> refreshVisibleData() => loadScreenData(() async {
    calls++;
    await pending?.future;
    if (fail) throw StateError('offline');
    if (mounted) setState(() {});
  }, quiet: true);

  @override
  void dispose() {
    text.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) =>
      Scaffold(body: TextField(controller: text));
}

void main() {
  testWidgets('polls at 15 seconds without replacing typed text', (
    tester,
  ) async {
    final key = GlobalKey<_ScreenState>();
    await tester.pumpWidget(MaterialApp(home: _Screen(key: key)));
    tester.binding.handleAppLifecycleStateChanged(AppLifecycleState.resumed);
    await tester.pump();
    final initial = key.currentState!.calls;
    await tester.enterText(find.byType(TextField), 'Unsaved draft');
    await tester.pump(const Duration(seconds: 14));
    expect(key.currentState!.calls, initial);
    await tester.pump(const Duration(seconds: 1));
    expect(key.currentState!.calls, initial + 1);
    expect(find.text('Unsaved draft'), findsOneWidget);
    await tester.pumpWidget(const SizedBox());
  });

  testWidgets('pauses for actions, background, and covered routes', (
    tester,
  ) async {
    final key = GlobalKey<_ScreenState>();
    await tester.pumpWidget(MaterialApp(home: _Screen(key: key)));
    tester.binding.handleAppLifecycleStateChanged(AppLifecycleState.resumed);
    await tester.pump();
    final initial = key.currentState!.calls;
    key.currentState!.busy = true;
    await tester.pump(const Duration(seconds: 15));
    expect(key.currentState!.calls, initial);
    key.currentState!.busy = false;
    tester.binding.handleAppLifecycleStateChanged(AppLifecycleState.inactive);
    tester.binding.handleAppLifecycleStateChanged(AppLifecycleState.hidden);
    tester.binding.handleAppLifecycleStateChanged(AppLifecycleState.paused);
    await tester.pump(const Duration(seconds: 15));
    expect(key.currentState!.calls, initial);
    tester.binding.handleAppLifecycleStateChanged(AppLifecycleState.hidden);
    tester.binding.handleAppLifecycleStateChanged(AppLifecycleState.inactive);
    tester.binding.handleAppLifecycleStateChanged(AppLifecycleState.resumed);
    await tester.pump();
    expect(key.currentState!.calls, initial + 1);
    Navigator.of(key.currentContext!).push(
      MaterialPageRoute<void>(
        builder: (_) => const Scaffold(body: Text('Form')),
      ),
    );
    await tester.pumpAndSettle();
    await tester.pump(const Duration(seconds: 15));
    expect(key.currentState!.calls, initial + 1);
    await tester.pumpWidget(const SizedBox());
  });

  testWidgets('skips overlapping polls and keeps data on failure', (
    tester,
  ) async {
    final key = GlobalKey<_ScreenState>();
    await tester.pumpWidget(MaterialApp(home: _Screen(key: key)));
    tester.binding.handleAppLifecycleStateChanged(AppLifecycleState.resumed);
    await tester.pump();
    final state = key.currentState!;
    state.pending = Completer<void>();
    final initial = state.calls;
    await tester.pump(const Duration(seconds: 15));
    await tester.pump(const Duration(seconds: 30));
    expect(state.calls, initial + 1);
    state.pending!.complete();
    await tester.pump();
    state.pending = null;
    state.fail = true;
    await tester.enterText(find.byType(TextField), 'Keep me');
    await tester.pump(const Duration(seconds: 15));
    expect(tester.takeException(), isNull);
    expect(find.text('Keep me'), findsOneWidget);
    await tester.pumpWidget(const SizedBox());
    await tester.pump(const Duration(seconds: 30));
  });
}
