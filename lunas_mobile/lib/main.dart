import 'dart:async';

import 'package:flutter/material.dart';
import 'package:lunas_mobile/app/app_services.dart';
import 'package:lunas_mobile/core/routes/app_router.dart';
import 'package:lunas_mobile/core/theme/app_theme.dart';
import 'package:lunas_mobile/features/auth/presentation/widgets/auth_scope.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  configureAppServices();
  unawaited(authController.restoreSession());
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return AuthScope(
      controller: authController,
      child: MaterialApp.router(
        title: 'LUNAS Mobile',
        debugShowCheckedModeBanner: false,
        routerConfig: appRouter,
        theme: AppTheme.light,
        darkTheme: AppTheme.dark,
        // Stitch is authored as a light-first experience. Keep the mobile
        // app deterministic regardless of the host OS appearance setting.
        themeMode: ThemeMode.light,
      ),
    );
  }
}
