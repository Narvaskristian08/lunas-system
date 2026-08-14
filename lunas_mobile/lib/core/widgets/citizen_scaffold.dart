import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:lunas_mobile/core/theme/app_spacing.dart';
import 'package:lunas_mobile/core/widgets/lunas_app_bar.dart';

/// Shell for citizen reporting routes. Server authorization remains the source
/// of truth for every API request; the official workspace has its own shell.
class CitizenScaffold extends StatelessWidget {
  const CitizenScaffold({
    required this.title,
    required this.body,
    required this.selectedIndex,
    this.subtitle,
    this.actions,
    this.floatingActionButton,
    this.showReportFab = true,
    this.showBackButton = false,
    super.key,
  });

  final String title;
  final String? subtitle;
  final Widget body;
  final int selectedIndex;
  final List<Widget>? actions;
  final Widget? floatingActionButton;
  final bool showReportFab;
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
              constraints: const BoxConstraints(maxWidth: 760),
              child: body,
            ),
          ),
        ),
      ),
    ),
    floatingActionButton: floatingActionButton ?? (showReportFab
        ? FloatingActionButton.extended(
          onPressed: () => context.push('/reports/new'),
          icon: const Icon(Icons.add_a_photo_outlined),
          label: const Text('New report'),
        )
        : null),
    bottomNavigationBar: NavigationBar(
      selectedIndex: selectedIndex,
      onDestinationSelected: (index) {
        switch (index) {
          case 0:
            context.go('/citizen');
            break;
          case 1:
            context.go('/reports');
            break;
          case 2:
            context.go('/profile');
            break;
        }
      },
      destinations: const [
        NavigationDestination(
          icon: Icon(Icons.home_outlined),
          selectedIcon: Icon(Icons.home_rounded),
          label: 'Home',
        ),
        NavigationDestination(
          icon: Icon(Icons.assignment_outlined),
          selectedIcon: Icon(Icons.assignment_rounded),
          label: 'My reports',
        ),
        NavigationDestination(
          icon: Icon(Icons.person_outline_rounded),
          selectedIcon: Icon(Icons.person_rounded),
          label: 'Profile',
        ),
      ],
    ),
  );
}
