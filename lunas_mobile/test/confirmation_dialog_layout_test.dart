import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:lunas_mobile/core/theme/app_theme.dart';
import 'package:lunas_mobile/core/widgets/lunas_confirmation_dialog.dart';

void main() {
  for (final scale in [1.0, 2.0]) {
    testWidgets('confirmation stays usable at 320px and text scale $scale', (
      tester,
    ) async {
      tester.view.physicalSize = const Size(320, 640);
      tester.view.devicePixelRatio = 1;
      addTearDown(tester.view.resetPhysicalSize);
      addTearDown(tester.view.resetDevicePixelRatio);
      var confirmed = false;
      await tester.pumpWidget(
        MaterialApp(
          theme: AppTheme.light,
          builder: (context, child) => MediaQuery(
            data: MediaQuery.of(
              context,
            ).copyWith(textScaler: TextScaler.linear(scale)),
            child: child!,
          ),
          home: Builder(
            builder: (context) => Scaffold(
              body: TextButton(
                onPressed: () => showDialog<void>(
                  context: context,
                  builder: (context) => LunasConfirmationDialog(
                    title: const Text('Provider-Managed Account'),
                    content: const Text(
                      'Your account details are managed by your utility provider. Contact them to request corrections.',
                    ),
                    actions: [
                      TextButton(
                        onPressed: () => Navigator.pop(context),
                        child: const Text('Cancel'),
                      ),
                      FilledButton(
                        onPressed: () {
                          confirmed = true;
                          Navigator.pop(context);
                        },
                        child: const Text('Confirm Account Changes'),
                      ),
                    ],
                  ),
                ),
                child: const Text('Open'),
              ),
            ),
          ),
        ),
      );
      await tester.tap(find.text('Open'));
      await tester.pumpAndSettle();
      final confirm = find.byType(FilledButton);
      final cancel = find.widgetWithText(TextButton, 'Cancel');
      expect(tester.getSize(confirm).width, tester.getSize(cancel).width);
      expect(tester.getSize(confirm).height, greaterThanOrEqualTo(48));
      expect(tester.getSize(cancel).height, greaterThanOrEqualTo(48));
      expect(
        tester.getTopLeft(confirm).dy,
        lessThan(tester.getTopLeft(cancel).dy),
      );
      expect(tester.takeException(), isNull);
      await tester.ensureVisible(confirm);
      await tester.tap(confirm);
      await tester.pumpAndSettle();
      expect(confirmed, isTrue);
      expect(find.byType(Dialog), findsNothing);
    });
  }
}
