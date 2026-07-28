import 'package:flutter/material.dart';
import 'package:lunas_mobile/core/theme/app_colors.dart';
import 'package:lunas_mobile/core/theme/app_radius.dart';
import 'package:lunas_mobile/core/theme/app_spacing.dart';

class AuthLayout extends StatelessWidget {
  const AuthLayout({
    required this.child,
    this.showBrand = true,
    this.showBackButton = false,
    this.scrollable = true,
    this.maxWidth = 440,
    super.key,
  });

  final Widget child;
  final bool showBrand;
  final bool showBackButton;
  final bool scrollable;
  final double maxWidth;

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
              minHeight: constraints.maxHeight - AppSpacing.xl * 2,
              maxWidth: maxWidth,
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                if (showBackButton)
                  Align(
                    alignment: Alignment.centerLeft,
                    child: IconButton(
                      onPressed: () => Navigator.maybePop(context),
                      tooltip: 'Back',
                      icon: const Icon(Icons.arrow_back_rounded),
                    ),
                  )
                else if (showBrand)
                  const Align(
                    alignment: Alignment.centerLeft,
                    child: LunasBrand(),
                  ),
                if (showBrand || showBackButton)
                  const SizedBox(height: AppSpacing.xxl),
                Expanded(child: child),
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
            child: Align(alignment: Alignment.topCenter, child: content),
          );
          return scrollable
              ? SingleChildScrollView(child: IntrinsicHeight(child: padded))
              : padded;
        },
      ),
    );

    return Scaffold(backgroundColor: Colors.white, body: body);
  }
}

class LunasBrand extends StatelessWidget {
  const LunasBrand({
    this.centered = false,
    this.large = false,
    this.showSubtitle = true,
    super.key,
  });

  final bool centered;
  final bool large;
  final bool showSubtitle;

  @override
  Widget build(BuildContext context) {
    final title = Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: centered
          ? CrossAxisAlignment.center
          : CrossAxisAlignment.start,
      children: [
        Text(
          'LUNAS',
          style: Theme.of(context).textTheme.titleLarge?.copyWith(
            color: AppColorsLight.brandBase,
            fontSize: large ? 24 : 19,
            fontWeight: FontWeight.w800,
            letterSpacing: large ? 3.2 : 2.2,
          ),
        ),
        if (showSubtitle)
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
    final mark = Container(
      width: large ? 72 : 42,
      height: large ? 72 : 42,
      padding: EdgeInsets.all(large ? 13 : 8),
      decoration: BoxDecoration(
        color: AppColorsLight.brandBase,
        borderRadius: BorderRadius.circular(large ? 18 : 11),
        boxShadow: [
          BoxShadow(
            color: AppColorsLight.brandBase.withValues(alpha: .18),
            blurRadius: 18,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Image.asset(
        'assets/icons/lunas_logo.png',
        fit: BoxFit.contain,
        errorBuilder: (_, _, _) =>
            const Icon(Icons.location_city_rounded, color: Colors.white),
      ),
    );
    if (centered) {
      return Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          mark,
          const SizedBox(height: AppSpacing.sm),
          title,
        ],
      );
    }
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        mark,
        const SizedBox(width: AppSpacing.sm),
        title,
      ],
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
            fontWeight: FontWeight.w800,
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
