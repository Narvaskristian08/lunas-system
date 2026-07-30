import 'package:flutter/material.dart';
import 'package:lunas_mobile/core/theme/app_radius.dart';
import 'package:lunas_mobile/core/theme/app_spacing.dart';
import 'package:lunas_mobile/core/widgets/lunas_card.dart';
import 'package:lunas_mobile/features/admin/presentation/screens/admin_routes.dart';

/// Feature-local shell for the system administration prototypes.
///
/// The pages are intentionally static. Production access and administrative
/// actions must still be enforced by backend role and audit controls.
class AdminPage extends StatelessWidget {
  const AdminPage({
    required this.title,
    required this.child,
    this.subtitle,
    this.selectedNavigationIndex,
    this.showBackButton = false,
    this.actions,
    this.bottomAction,
    super.key,
  });

  final String title;
  final String? subtitle;
  final Widget child;
  final int? selectedNavigationIndex;
  final bool showBackButton;
  final List<Widget>? actions;
  final Widget? bottomAction;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AdminAppBar(
        title: title,
        subtitle: subtitle,
        showBackButton: showBackButton,
        actions: actions,
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
                bottomAction == null ? AppSpacing.hero : AppSpacing.xxl,
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
      bottomNavigationBar:
          bottomAction ??
          (selectedNavigationIndex == null
              ? null
              : AdminBottomNavigation(selectedIndex: selectedNavigationIndex!)),
    );
  }
}

class AdminAppBar extends StatelessWidget implements PreferredSizeWidget {
  const AdminAppBar({
    required this.title,
    this.subtitle,
    this.showBackButton = false,
    this.actions,
    super.key,
  });

  final String title;
  final String? subtitle;
  final bool showBackButton;
  final List<Widget>? actions;

  @override
  Size get preferredSize => Size.fromHeight(subtitle == null ? 72 : 84);

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return AppBar(
      automaticallyImplyLeading: false,
      toolbarHeight: preferredSize.height,
      leadingWidth: showBackButton ? 64 : 0,
      leading: showBackButton
          ? IconButton(
              tooltip: 'Back',
              onPressed: () => Navigator.of(context).maybePop(),
              icon: const Icon(Icons.arrow_back_rounded),
            )
          : null,
      titleSpacing: showBackButton ? 0 : AppSpacing.xl,
      title: Row(
        children: [
          if (!showBackButton) ...[
            Icon(
              Icons.admin_panel_settings_outlined,
              color: theme.colorScheme.primary,
            ),
            const SizedBox(width: AppSpacing.sm),
          ],
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  title,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: theme.textTheme.titleLarge?.copyWith(
                    color: theme.colorScheme.primary,
                    fontWeight: FontWeight.w800,
                  ),
                ),
                if (subtitle != null) ...[
                  const SizedBox(height: AppSpacing.xxs),
                  Text(subtitle!, style: theme.textTheme.bodySmall),
                ],
              ],
            ),
          ),
        ],
      ),
      actions: actions,
    );
  }
}

class AdminBottomNavigation extends StatelessWidget {
  const AdminBottomNavigation({required this.selectedIndex, super.key});

  final int selectedIndex;

  @override
  Widget build(BuildContext context) {
    return NavigationBar(
      height: 72,
      selectedIndex: selectedIndex,
      onDestinationSelected: (index) {
        if (index == selectedIndex) return;
        final route = switch (index) {
          0 => AdminRoutes.dashboard,
          1 => AdminRoutes.users,
          2 => AdminRoutes.auditLogs,
          3 => AdminRoutes.announcements,
          _ => AdminRoutes.profile,
        };
        Navigator.pushReplacementNamed(context, route);
      },
      destinations: const [
        NavigationDestination(
          icon: Icon(Icons.dashboard_outlined),
          selectedIcon: Icon(Icons.dashboard_rounded),
          label: 'Dashboard',
        ),
        NavigationDestination(
          icon: Icon(Icons.group_outlined),
          selectedIcon: Icon(Icons.group_rounded),
          label: 'Users',
        ),
        NavigationDestination(
          icon: Icon(Icons.security_outlined),
          selectedIcon: Icon(Icons.security_rounded),
          label: 'Audit',
        ),
        NavigationDestination(
          icon: Icon(Icons.campaign_outlined),
          selectedIcon: Icon(Icons.campaign_rounded),
          label: 'Alerts',
        ),
        NavigationDestination(
          icon: Icon(Icons.account_circle_outlined),
          selectedIcon: Icon(Icons.account_circle_rounded),
          label: 'Profile',
        ),
      ],
    );
  }
}

class AdminMetricCard extends StatelessWidget {
  const AdminMetricCard({
    required this.label,
    required this.value,
    required this.icon,
    required this.color,
    this.onTap,
    super.key,
  });

  final String label;
  final String value;
  final IconData icon;
  final Color color;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return LunasCard(
      onTap: onTap,
      padding: const EdgeInsets.all(AppSpacing.md),
      child: Container(
        decoration: BoxDecoration(
          border: Border(left: BorderSide(color: color, width: 4)),
          borderRadius: BorderRadius.circular(AppRadius.xs),
        ),
        padding: const EdgeInsets.only(left: AppSpacing.sm),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(
                    label,
                    style: Theme.of(context).textTheme.bodySmall,
                  ),
                ),
                Icon(icon, color: color),
              ],
            ),
            const SizedBox(height: AppSpacing.md),
            Text(
              value,
              style: Theme.of(
                context,
              ).textTheme.displayMedium?.copyWith(fontWeight: FontWeight.w800),
            ),
          ],
        ),
      ),
    );
  }
}

class AdminStatusPill extends StatelessWidget {
  const AdminStatusPill({
    required this.label,
    required this.color,
    this.icon,
    super.key,
  });

  final String label;
  final Color color;
  final IconData? icon;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.sm,
        vertical: AppSpacing.xs,
      ),
      decoration: BoxDecoration(
        color: color.withValues(alpha: .12),
        border: Border.all(color: color.withValues(alpha: .25)),
        borderRadius: BorderRadius.circular(AppRadius.pill),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (icon != null) ...[
            Icon(icon, size: 15, color: color),
            const SizedBox(width: AppSpacing.xxs),
          ],
          Text(
            label,
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
              color: color,
              fontWeight: FontWeight.w700,
            ),
          ),
        ],
      ),
    );
  }
}

class AdminSectionTitle extends StatelessWidget {
  const AdminSectionTitle({
    required this.title,
    this.actionLabel,
    this.onAction,
    super.key,
  });

  final String title;
  final String? actionLabel;
  final VoidCallback? onAction;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: Text(
            title,
            style: Theme.of(
              context,
            ).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w800),
          ),
        ),
        if (actionLabel != null)
          TextButton(onPressed: onAction, child: Text(actionLabel!)),
      ],
    );
  }
}

class AdminDetailRow extends StatelessWidget {
  const AdminDetailRow({
    required this.label,
    required this.value,
    this.icon,
    this.trailing,
    super.key,
  });

  final String label;
  final String value;
  final IconData? icon;
  final Widget? trailing;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (icon != null) ...[
          Icon(icon, size: 20, color: theme.colorScheme.onSurfaceVariant),
          const SizedBox(width: AppSpacing.sm),
        ],
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(label, style: theme.textTheme.bodySmall),
              const SizedBox(height: AppSpacing.xxs),
              Text(
                value,
                style: theme.textTheme.bodyMedium?.copyWith(
                  color: theme.colorScheme.onSurface,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ],
          ),
        ),
        if (trailing != null) ...[
          const SizedBox(width: AppSpacing.sm),
          trailing!,
        ],
      ],
    );
  }
}

class AdminVisualPlaceholder extends StatelessWidget {
  const AdminVisualPlaceholder({
    required this.icon,
    required this.label,
    required this.color,
    this.detail,
    this.height = 144,
    super.key,
  });

  final IconData icon;
  final String label;
  final Color color;
  final String? detail;
  final double height;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      image: true,
      label: '$label placeholder',
      child: Container(
        height: height,
        width: double.infinity,
        decoration: BoxDecoration(
          color: color.withValues(alpha: .08),
          border: Border.all(color: color.withValues(alpha: .25)),
          borderRadius: AppRadius.input,
        ),
        child: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(icon, size: 36, color: color),
              const SizedBox(height: AppSpacing.xs),
              Text(
                label,
                style: Theme.of(
                  context,
                ).textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.w700),
              ),
              if (detail != null) ...[
                const SizedBox(height: AppSpacing.xxs),
                Text(detail!, style: Theme.of(context).textTheme.bodySmall),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

void showAdminMessage(BuildContext context, String message) {
  ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(message)));
}
