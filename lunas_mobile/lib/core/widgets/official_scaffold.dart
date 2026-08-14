import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:lunas_mobile/core/theme/app_spacing.dart';
import 'package:lunas_mobile/core/widgets/lunas_app_bar.dart';

/// Shared shell for the 50% official validation workspace.
///
/// The router decides who may enter `/official`; this widget only provides
/// navigation between official-facing screens. Backend authorization remains
/// authoritative for all incident data and decisions.
class OfficialScaffold extends StatelessWidget {
  const OfficialScaffold({
    required this.title,
    required this.body,
    required this.selectedIndex,
    this.subtitle,
    this.actions,
    this.showBackButton = false,
    super.key,
  });

  final String title;
  final String? subtitle;
  final Widget body;
  final int selectedIndex;
  final List<Widget>? actions;
  final bool showBackButton;

  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: LunasAppBar(
      title: title,
      subtitle: subtitle,
      actions: actions,
      showBackButton: showBackButton,
    ),
    body: SafeArea(
      top: false,
      child: LayoutBuilder(
        builder: (context, _) => SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(
            AppSpacing.xl,
            AppSpacing.md,
            AppSpacing.xl,
            AppSpacing.hero,
          ),
          child: Align(
            alignment: Alignment.topCenter,
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 960),
              child: body,
            ),
          ),
        ),
      ),
    ),
    bottomNavigationBar: NavigationBar(
      selectedIndex: selectedIndex,
      onDestinationSelected: (index) {
        switch (index) {
          case 0:
            context.go('/official');
            break;
          case 1:
            context.go('/official/validation');
            break;
          case 2:
            context.go('/official/profile');
            break;
        }
      },
      destinations: const [
        NavigationDestination(
          icon: Icon(Icons.space_dashboard_outlined),
          selectedIcon: Icon(Icons.space_dashboard_rounded),
          label: 'Overview',
        ),
        NavigationDestination(
          icon: Icon(Icons.fact_check_outlined),
          selectedIcon: Icon(Icons.fact_check_rounded),
          label: 'Validation',
        ),
        NavigationDestination(
          icon: Icon(Icons.account_circle_outlined),
          selectedIcon: Icon(Icons.account_circle_rounded),
          label: 'Account',
        ),
      ],
    ),
  );
}
