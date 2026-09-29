import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:lunas_mobile/core/theme/app_spacing.dart';
import 'package:lunas_mobile/core/widgets/lunas_app_bar.dart';

/// Shell for citizen reporting routes. Server authorization remains the source
/// of truth for every API request; repair personnel use their own shell.
class CitizenScaffold extends StatelessWidget {
  const CitizenScaffold({
    required this.title,
    required this.body,
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
    floatingActionButton:
        floatingActionButton ??
        (showReportFab
            ? FloatingActionButton.extended(
                onPressed: () => context.push('/reports/new'),
                icon: const Icon(Icons.add_a_photo_outlined),
                label: const Text('New report'),
              )
            : null),
  );
}
