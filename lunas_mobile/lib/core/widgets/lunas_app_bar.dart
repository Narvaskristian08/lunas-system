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
      automaticallyImplyLeading: showBackButton,
      centerTitle: false,
      titleSpacing: AppSpacing.xl,
      title:
          titleWidget ??
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                title,
                style: theme.textTheme.titleLarge?.copyWith(
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
