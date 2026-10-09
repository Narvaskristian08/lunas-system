import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:lunas_mobile/core/theme/app_colors.dart';
import 'package:lunas_mobile/core/theme/app_radius.dart';
import 'package:lunas_mobile/core/theme/app_spacing.dart';
import 'package:lunas_mobile/core/widgets/lunas_app_bar.dart';

class AuthLayout extends StatelessWidget {
  const AuthLayout({
    required this.child,
    this.showBrand = true,
    this.showBackButton = false,
    this.scrollable = true,
    this.maxWidth = 440,
    this.footer,
    super.key,
  });

  final Widget child;
  final bool showBrand;
  final bool showBackButton;
  final bool scrollable;
  final double maxWidth;
  final Widget? footer;

  @override
  Widget build(BuildContext context) {
    final viewInsets = MediaQuery.viewInsetsOf(context);
    final body = SafeArea(
      child: LayoutBuilder(
        builder: (context, constraints) {
          final horizontal = constraints.maxWidth < 360
              ? AppSpacing.md
              : AppSpacing.xl;
          final content = ConstrainedBox(
            constraints: BoxConstraints(
              minHeight: (constraints.maxHeight - AppSpacing.xl * 2).clamp(
                0.0,
                double.infinity,
              ),
              maxWidth: maxWidth,
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                if (showBackButton)
                  Align(
                    alignment: Alignment.centerLeft,
                    child: LunasBackButton(
                      onPressed: () {
                        if (context.canPop()) {
                          context.pop();
                        } else {
                          context.go('/login');
                        }
                      },
                    ),
                  )
                else if (showBrand)
                  const Align(
                    alignment: Alignment.centerLeft,
                    child: LunasBrand(),
                  ),
                if (showBrand || showBackButton)
                  const SizedBox(height: AppSpacing.xxl),
                if (scrollable) child else Expanded(child: child),
                if (footer != null) ...[
                  const SizedBox(height: AppSpacing.lg),
                  if (scrollable) const Spacer(),
                  footer!,
                ],
              ],
            ),
          );
          final padded = Padding(
            padding: EdgeInsets.fromLTRB(
              horizontal,
              AppSpacing.xl,
              horizontal,
              AppSpacing.xl + viewInsets.bottom,
            ),
            child: Align(
              alignment: Alignment.topCenter,
              child: footer != null && scrollable
                  ? IntrinsicHeight(child: content)
                  : content,
            ),
          );
          return scrollable ? SingleChildScrollView(child: padded) : padded;
        },
      ),
    );

    return Scaffold(
      backgroundColor: Theme.of(context).colorScheme.surfaceContainerLowest,
      body: DecoratedBox(
        decoration: const BoxDecoration(
          gradient: RadialGradient(
            center: Alignment(-.55, -.75),
            radius: 1.35,
            colors: [Color(0xFFE9F0FF), Color(0xFFF9F9FF)],
          ),
        ),
        child: body,
      ),
    );
  }
}

class LunasBrand extends StatelessWidget {
  const LunasBrand({
    this.centered = false,
    this.large = false,
    this.showSubtitle = true,
    this.showTitle = true,
    super.key,
  });

  final bool centered;
  final bool large;
  final bool showSubtitle;
  final bool showTitle;

  @override
  Widget build(BuildContext context) {
    final title = Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: centered
          ? CrossAxisAlignment.center
          : CrossAxisAlignment.start,
      children: [
        if (showTitle)
          Text(
            'LUNAS',
            style: Theme.of(context).textTheme.titleLarge?.copyWith(
              color: AppColorsLight.brandBase,
              fontSize: large ? 30 : 19,
              fontWeight: FontWeight.w700,
              letterSpacing: large ? 1.2 : 2.2,
            ),
          ),
        if (showTitle && showSubtitle)
          Text(
            'URBAN INFRASTRUCTURE',
            style: Theme.of(context).textTheme.labelSmall?.copyWith(
              color: AppColorsLight.textSecondary,
              fontSize: large ? 9 : 7,
              letterSpacing: 1.5,
            ),
          ),
      ],
    );
    final mark = SizedBox.square(
      dimension: large ? 72 : 42,
      child: Image.asset('assets/icons/lunas_logo.png', fit: BoxFit.contain),
    );
    if (centered) {
      return Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          mark,
          if (showTitle) ...[const SizedBox(height: AppSpacing.sm), title],
        ],
      );
    }
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        mark,
        if (showTitle) ...[const SizedBox(width: AppSpacing.sm), title],
      ],
    );
  }
}

class AuthPanel extends StatelessWidget {
  const AuthPanel({required this.child, this.padding, super.key});

  final Widget child;
  final EdgeInsetsGeometry? padding;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: padding ?? const EdgeInsets.all(AppSpacing.xl),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: const Color(0xFFE4E8F0)),
        boxShadow: const [
          BoxShadow(
            color: Color(0x14001B3D),
            blurRadius: 20,
            offset: Offset(0, 10),
          ),
        ],
      ),
      child: child,
    );
  }
}

class AuthHeading extends StatelessWidget {
  const AuthHeading({
    required this.title,
    required this.description,
    this.eyebrow,
    this.centered = false,
    super.key,
  });

  final String? eyebrow;
  final String title;
  final String description;
  final bool centered;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Column(
      crossAxisAlignment: centered
          ? CrossAxisAlignment.center
          : CrossAxisAlignment.start,
      children: [
        if (eyebrow != null) ...[
          Text(
            eyebrow!.toUpperCase(),
            textAlign: centered ? TextAlign.center : TextAlign.start,
            style: theme.textTheme.labelSmall?.copyWith(
              color: AppColorsLight.brandBase,
            ),
          ),
          const SizedBox(height: AppSpacing.xs),
        ],
        Text(
          title,
          textAlign: centered ? TextAlign.center : TextAlign.start,
          style: theme.textTheme.headlineLarge?.copyWith(
            fontSize: 28,
            fontWeight: FontWeight.w700,
            letterSpacing: -.6,
          ),
        ),
        const SizedBox(height: AppSpacing.xs),
        Text(
          description,
          textAlign: centered ? TextAlign.center : TextAlign.start,
          style: theme.textTheme.bodyMedium?.copyWith(height: 1.55),
        ),
      ],
    );
  }
}

class SecurityNotice extends StatelessWidget {
  const SecurityNotice({required this.text, super.key});

  final String text;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        color: const Color(0xFFF4F8FD),
        borderRadius: AppRadius.input,
        border: Border.all(color: const Color(0xFFD7E6F7)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Icon(
            Icons.verified_user_outlined,
            color: AppColorsLight.brandBase,
            size: 20,
          ),
          const SizedBox(width: AppSpacing.sm),
          Expanded(
            child: Text(text, style: Theme.of(context).textTheme.bodySmall),
          ),
        ],
      ),
    );
  }
}

class AuthDivider extends StatelessWidget {
  const AuthDivider({this.label = 'or continue with', super.key});

  final String label;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        const Expanded(child: Divider()),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: AppSpacing.sm),
          child: Text(label, style: Theme.of(context).textTheme.bodySmall),
        ),
        const Expanded(child: Divider()),
      ],
    );
  }
}

class AuthOutlineButton extends StatelessWidget {
  const AuthOutlineButton({
    required this.label,
    required this.icon,
    required this.onPressed,
    super.key,
  });

  final String label;
  final IconData icon;
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    return OutlinedButton.icon(
      onPressed: onPressed,
      icon: Icon(icon, size: 19),
      label: Text(label),
      style: OutlinedButton.styleFrom(
        minimumSize: const Size.fromHeight(50),
        foregroundColor: AppColorsLight.textPrimary,
        side: const BorderSide(color: AppColorsLight.divider),
        shape: RoundedRectangleBorder(borderRadius: AppRadius.input),
      ),
    );
  }
}
