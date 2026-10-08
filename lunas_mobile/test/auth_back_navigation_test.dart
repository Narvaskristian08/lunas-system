import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:lunas_mobile/features/auth/presentation/widgets/auth_layout.dart';

void main() {
  for (final pushed in [false, true]) {
    testWidgets('registration back returns to login (pushed: $pushed)', (
      tester,
    ) async {
      final router = GoRouter(
        initialLocation: pushed ? '/login' : '/register',
        routes: [
          GoRoute(
            path: '/login',
            builder: (_, _) => const Scaffold(body: Text('Login page')),
          ),
          GoRoute(
            path: '/register',
            builder: (_, _) => const AuthLayout(
              showBrand: false,
              showBackButton: true,
              child: Text('Create account'),
            ),
          ),
        ],
      );
      addTearDown(router.dispose);
      await tester.pumpWidget(MaterialApp.router(routerConfig: router));
      if (pushed) router.push('/register');
      await tester.pumpAndSettle();
      await tester.tap(find.byTooltip('Back'));
      await tester.pumpAndSettle();
      expect(find.text('Login page'), findsOneWidget);
    });
  }
}
