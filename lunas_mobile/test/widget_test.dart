import 'package:flutter_test/flutter_test.dart';

import 'package:lunas_mobile/main.dart';

void main() {
  testWidgets('shows the LUNAS splash screen on launch', (
    WidgetTester tester,
  ) async {
    await tester.pumpWidget(const MyApp());

    expect(find.text('LUNAS'), findsOneWidget);
    expect(find.text('Your city. Your voice. Your LUNAS.'), findsOneWidget);
    expect(find.text('Restoring your secure session…'), findsOneWidget);
  });
}
