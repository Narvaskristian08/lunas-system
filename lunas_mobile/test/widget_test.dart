import 'package:flutter_test/flutter_test.dart';

import 'package:lunas_mobile/main.dart';

void main() {
  testWidgets('shows the LUNAS splash screen on launch', (
    WidgetTester tester,
  ) async {
    await tester.pumpWidget(const MyApp());

    expect(find.text('LUNAS'), findsOneWidget);
    expect(
      find.text(
        'AI-Assisted Urban Infrastructure\nMaintenance and Monitoring System',
      ),
      findsOneWidget,
    );
    expect(find.text('Loading your account…'), findsOneWidget);
  });
}
