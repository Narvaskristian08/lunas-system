import 'package:go_router/go_router.dart';
import 'package:lunas_mobile/features/reporting/presentation/screens/barangay_picker_screen.dart';
import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:lunas_mobile/features/maps/domain/models/selected_location.dart';
import 'package:lunas_mobile/features/reporting/domain/models/barangay_suggestion.dart';
import 'package:lunas_mobile/features/reporting/presentation/screens/new_citizen_report_screen.dart';

const _barangays = ['Pantal', 'Poblacion Oeste', 'Lucao'];

void main() {
  test('uses an exact canonical reverse-geocoding suggestion', () {
    const location = SelectedLocation(
      latitude: 16.04,
      longitude: 120.33,
      address: 'Pantal, Dagupan City',
      barangayCandidates: ['Brgy. Pantal', 'Dagupan City'],
      reverseGeocodingSucceeded: true,
    );

    final result = resolveBarangaySuggestion(location, _barangays);

    expect(result.status, BarangaySuggestionStatus.matched);
    expect(result.barangay, 'Pantal');
  });

  test('does not guess after failed, ambiguous, or misspelled geocoding', () {
    const unavailable = SelectedLocation(
      latitude: 16.04,
      longitude: 120.33,
      address: 'Selected location',
    );
    const ambiguous = SelectedLocation(
      latitude: 16.04,
      longitude: 120.33,
      address: 'Boundary address',
      barangayCandidates: ['Pantal', 'Lucao'],
      reverseGeocodingSucceeded: true,
    );
    const misspelled = SelectedLocation(
      latitude: 16.04,
      longitude: 120.33,
      address: 'Pantalx',
      barangayCandidates: ['Pantalx'],
      reverseGeocodingSucceeded: true,
    );

    expect(
      resolveBarangaySuggestion(unavailable, _barangays).status,
      BarangaySuggestionStatus.unavailable,
    );
    expect(
      resolveBarangaySuggestion(ambiguous, _barangays).status,
      BarangaySuggestionStatus.ambiguous,
    );
    expect(
      resolveBarangaySuggestion(misspelled, _barangays).status,
      BarangaySuggestionStatus.noMatch,
    );
  });

  testWidgets('loads and searches only backend-provided barangays', (
    tester,
  ) async {
    final router = GoRouter(
      initialLocation: '/reports/new',
      routes: [
        GoRoute(
          path: '/reports/new',
          builder: (_, _) =>
              NewCitizenReportScreen(barangayLoader: () async => _barangays),
        ),
        GoRoute(
          path: '/reports/barangays',
          builder: (_, state) =>
              BarangayPickerScreen(barangays: state.extra as List<String>),
        ),
      ],
    );
    addTearDown(router.dispose);
    await tester.pumpWidget(MaterialApp.router(routerConfig: router));
    await tester.pumpAndSettle();

    final selector = find.text('Select Barangay');
    await tester.ensureVisible(selector);
    await tester.tap(selector);
    await tester.pumpAndSettle();
    await tester.enterText(find.byType(TextField), 'pantal');
    await tester.pumpAndSettle();
    expect(find.text('Pantal'), findsOneWidget);
    expect(find.text('Lucao'), findsNothing);

    await tester.tap(find.text('Pantal'));
    await tester.pumpAndSettle();
    expect(find.text('Confirmed for This Report Location'), findsOneWidget);
  });

  testWidgets('shows API loading and error states with retry', (tester) async {
    final firstLoad = Completer<List<String>>();
    var attempts = 0;
    Future<List<String>> loader() {
      attempts += 1;
      if (attempts == 1) return firstLoad.future;
      return Future.value(_barangays);
    }

    await tester.pumpWidget(
      MaterialApp(home: NewCitizenReportScreen(barangayLoader: loader)),
    );
    expect(find.text('Loading recognized barangays…'), findsOneWidget);

    firstLoad.completeError(Exception('offline'));
    await tester.pumpAndSettle();
    expect(find.text('Barangay list unavailable'), findsOneWidget);
    final retry = find.text('Try again');
    await tester.ensureVisible(retry);
    await tester.tap(retry);
    await tester.pumpAndSettle();
    expect(find.text('Select Barangay'), findsOneWidget);
    expect(attempts, 2);
  });
}
