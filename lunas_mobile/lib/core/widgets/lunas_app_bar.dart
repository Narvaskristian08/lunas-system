import 'package:go_router/go_router.dart';
import 'package:flutter/material.dart';
import 'package:lunas_mobile/core/theme/app_spacing.dart';

class LunasAppBar extends StatelessWidget implements PreferredSizeWidget {
  const LunasAppBar({
    required this.title,
    this.subtitle,
    this.titleWidget,
    this.actions,
    this.showBackButton = false,
    super.key,
  });

  final String title;
  final String? subtitle;
  final Widget? titleWidget;
  final List<Widget>? actions;
  final bool showBackButton;

  @override
  Size get preferredSize => Size.fromHeight(subtitle == null ? 72 : 84);

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return AppBar(
      toolbarHeight: preferredSize.height,
      automaticallyImplyLeading: false,
      leadingWidth: showBackButton ? 64 : null,
      leading: showBackButton
          ? const Padding(
              padding: EdgeInsets.only(left: 12, right: 4),
              child: Center(child: LunasBackButton()),
            )
          : null,
      centerTitle: false,
      titleSpacing: showBackButton ? 0 : AppSpacing.xl,
      title:
          titleWidget ??
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                title,
                style: theme.textTheme.titleLarge?.copyWith(
                  color: theme.colorScheme.primary,
                  fontWeight: FontWeight.w700,
                  letterSpacing: -.3,
                ),
              ),
              if (subtitle != null) ...[
                const SizedBox(height: AppSpacing.xxs),
                Text(subtitle!, style: theme.textTheme.bodySmall),
              ],
            ],
          ),
      actions: actions,
    );
  }
}

class LunasBackButton extends StatelessWidget {
  const LunasBackButton({this.onPressed, super.key});
  final VoidCallback? onPressed;
  @override
  Widget build(BuildContext context) => IconButton(
    tooltip: 'Back',
    onPressed:
        onPressed ??
        () {
          if (context.canPop()) {
            context.pop();
            return;
          }
          final path = GoRouterState.of(context).uri.path;
          final segments = path
              .split('/')
              .where((segment) => segment.isNotEmpty)
              .toList();
          if (segments.length > 1) {
            context.go('/${segments.take(segments.length - 1).join('/')}');
          } else {
            context.go(path.startsWith('/repair') ? '/repair' : '/citizen');
          }
        },
    style: IconButton.styleFrom(
      foregroundColor: Theme.of(context).colorScheme.onSurface,
      minimumSize: const Size(48, 48),
      maximumSize: const Size(48, 48),
      padding: EdgeInsets.zero,
    ),
    icon: const Icon(Icons.arrow_back_rounded, size: 22),
  );
}
