import 'package:flutter/material.dart';
import 'package:lunas_mobile/core/theme/app_spacing.dart';
import 'package:lunas_mobile/core/widgets/lunas_app_bar.dart';
import 'package:lunas_mobile/core/widgets/lunas_bottom_navigation.dart';

class LunasAppScaffold extends StatelessWidget {
  const LunasAppScaffold({
    required this.title,
    this.selectedIndex,
    required this.child,
    this.subtitle,
    this.actions,
    this.floatingActionButton,
    this.showBackButton = false,
    super.key,
  });

  final String title;
  final String? subtitle;
  final int? selectedIndex;
  final Widget child;
  final List<Widget>? actions;
  final Widget? floatingActionButton;
  final bool showBackButton;

  static const _routes = [
    '/home',
    '/dashboard',
    '/maps',
    '/reports/new',
    '/profile',
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: LunasAppBar(
        title: title,
        subtitle: subtitle,
        actions: actions,
        showBackButton: showBackButton,
      ),
      body: SafeArea(
        top: false,
        child: LayoutBuilder(
          builder: (context, constraints) {
            final horizontalPadding = constraints.maxWidth < 360
                ? AppSpacing.md
                : AppSpacing.xl;
            return SingleChildScrollView(
              padding: EdgeInsets.fromLTRB(
                horizontalPadding,
                AppSpacing.md,
                horizontalPadding,
                AppSpacing.hero,
              ),
              child: Align(
                alignment: Alignment.topCenter,
                child: ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 820),
                  child: child,
                ),
              ),
            );
          },
        ),
      ),
      floatingActionButton: floatingActionButton,
      bottomNavigationBar: selectedIndex == null
          ? null
          : LunasBottomNavigation(
              selectedIndex: selectedIndex!,
              onDestinationSelected: (index) {
                if (index == selectedIndex) return;
                Navigator.pushReplacementNamed(context, _routes[index]);
              },
            ),
    );
  }
}
