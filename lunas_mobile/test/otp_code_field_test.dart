import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:lunas_mobile/features/auth/presentation/widgets/otp_code_field.dart';
void main() {
  testWidgets('six boxes accept a pasted code and advance focus', (tester) async {
    final controllers = List.generate(6, (_) => TextEditingController());
    final nodes = List.generate(6, (_) => FocusNode());
    await tester.pumpWidget(MaterialApp(home: Scaffold(body: OtpCodeField(controllers: controllers, focusNodes: nodes))));
    expect(find.byType(TextField), findsNWidgets(6));
    await tester.enterText(find.byType(TextField).first, '123456');
    await tester.pump();
    expect(controllers.map((item) => item.text).join(), '123456');
    await tester.enterText(find.byType(TextField).first, '9');
    await tester.pump();
    expect(nodes[1].hasFocus, isTrue);
    await tester.pumpWidget(const SizedBox());
    for (final controller in controllers) { controller.dispose(); }
    for (final node in nodes) { node.dispose(); }
  });
}
