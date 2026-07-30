import 'package:flutter/material.dart';
import 'package:lunas_mobile/core/theme/app_radius.dart';
import 'package:lunas_mobile/core/theme/app_spacing.dart';
import 'package:lunas_mobile/core/widgets/lunas_app_bar.dart';
import 'package:lunas_mobile/core/widgets/lunas_card.dart';

/// Shared, feature-local building blocks for the official operations screens.
class OperationsPage extends StatelessWidget {
  const OperationsPage({
    required this.title,
    required this.child,
    this.subtitle,
    this.showBackButton = true,
    this.actions,
    this.bottomAction,
    super.key,
  });

  final String title;
  final String? subtitle;
  final Widget child;
  final bool showBackButton;
  final List<Widget>? actions;
  final Widget? bottomAction;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: LunasAppBar(
        title: title,
        subtitle: subtitle,
        showBackButton: showBackButton,
        actions: actions,
      ),
      body: SafeArea(
        top: false,
        child: LayoutBuilder(
          builder: (context, constraints) {
            final padding = constraints.maxWidth < 360
                ? AppSpacing.md
                : AppSpacing.xl;
            return SingleChildScrollView(
              padding: EdgeInsets.fromLTRB(
                padding,
                AppSpacing.md,
                padding,
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
      bottomNavigationBar: bottomAction,
    );
  }
}

class OperationsActionBar extends StatelessWidget {
  const OperationsActionBar({
    required this.primaryLabel,
    required this.onPrimary,
    required this.secondaryLabel,
    required this.onSecondary,
    this.primaryIcon,
    this.secondaryIsDestructive = false,
    super.key,
  });

  final String primaryLabel;
  final VoidCallback onPrimary;
  final String secondaryLabel;
  final VoidCallback onSecondary;
  final IconData? primaryIcon;
  final bool secondaryIsDestructive;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    final secondaryColor = secondaryIsDestructive
        ? colors.error
        : colors.primary;
    return SafeArea(
      top: false,
      child: Container(
        padding: const EdgeInsets.fromLTRB(
          AppSpacing.xl,
          AppSpacing.sm,
          AppSpacing.xl,
          AppSpacing.md,
        ),
        decoration: BoxDecoration(
          color: colors.surface,
          border: Border(top: BorderSide(color: colors.outlineVariant)),
        ),
        child: Row(
          children: [
            Expanded(
              child: OutlinedButton(
                onPressed: onSecondary,
                style: OutlinedButton.styleFrom(
                  foregroundColor: secondaryColor,
                  side: BorderSide(color: secondaryColor),
                  minimumSize: const Size.fromHeight(52),
                ),
                child: Text(secondaryLabel),
              ),
            ),
            const SizedBox(width: AppSpacing.sm),
            Expanded(
              flex: 2,
              child: ElevatedButton.icon(
                onPressed: onPrimary,
                icon: primaryIcon == null
                    ? const SizedBox.shrink()
                    : Icon(primaryIcon),
                label: Text(primaryLabel),
                style: ElevatedButton.styleFrom(
                  minimumSize: const Size.fromHeight(52),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class OperationsSectionHeading extends StatelessWidget {
  const OperationsSectionHeading({
    required this.title,
    this.trailing,
    this.description,
    super.key,
  });

  final String title;
  final Widget? trailing;
  final String? description;

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: Theme.of(
                  context,
                ).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w800),
              ),
              if (description != null) ...[
                const SizedBox(height: AppSpacing.xxs),
                Text(
                  description!,
                  style: Theme.of(context).textTheme.bodySmall,
                ),
              ],
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

class OperationsBadge extends StatelessWidget {
  const OperationsBadge({
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
        borderRadius: BorderRadius.circular(AppRadius.pill),
        border: Border.all(color: color.withValues(alpha: .28)),
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

class OperationsVisualPlaceholder extends StatelessWidget {
  const OperationsVisualPlaceholder({
    required this.icon,
    required this.label,
    required this.accent,
    this.detail,
    this.height = 150,
    super.key,
  });

  final IconData icon;
  final String label;
  final Color accent;
  final String? detail;
  final double height;

  @override
  Widget build(BuildContext context) {
    final onSurface = Theme.of(context).colorScheme.onSurface;
    return Semantics(
      label: '$label visual placeholder',
      image: true,
      child: Container(
        height: height,
        width: double.infinity,
        decoration: BoxDecoration(
          borderRadius: AppRadius.input,
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              accent.withValues(alpha: .20),
              accent.withValues(alpha: .06),
            ],
          ),
          border: Border.all(color: accent.withValues(alpha: .25)),
        ),
        child: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(icon, size: 38, color: accent),
              const SizedBox(height: AppSpacing.xs),
              Text(
                label,
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: onSurface,
                  fontWeight: FontWeight.w700,
                ),
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

class OperationsMetricCard extends StatelessWidget {
  const OperationsMetricCard({
    required this.label,
    required this.value,
    required this.icon,
    required this.color,
    this.emphasized = false,
    super.key,
  });

  final String label;
  final String value;
  final IconData icon;
  final Color color;
  final bool emphasized;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    return LunasCard(
      color: emphasized ? color.withValues(alpha: .13) : colors.surface,
      padding: const EdgeInsets.all(AppSpacing.md),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  label,
                  style: Theme.of(context).textTheme.bodyMedium,
                ),
              ),
              Icon(icon, color: color),
            ],
          ),
          const SizedBox(height: AppSpacing.md),
          Text(
            value,
            style: Theme.of(context).textTheme.displayMedium?.copyWith(
              color: emphasized ? color : null,
              fontWeight: FontWeight.w800,
            ),
          ),
        ],
      ),
    );
  }
}

class OperationsInfoRow extends StatelessWidget {
  const OperationsInfoRow({
    required this.icon,
    required this.label,
    required this.value,
    this.valueColor,
    super.key,
  });

  final IconData icon;
  final String label;
  final String value;
  final Color? valueColor;

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, size: 19, color: Theme.of(context).colorScheme.primary),
        const SizedBox(width: AppSpacing.sm),
        Expanded(
          child: RichText(
            text: TextSpan(
              style: Theme.of(context).textTheme.bodySmall,
              children: [
                TextSpan(text: '$label: '),
                TextSpan(
                  text: value,
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color:
                        valueColor ?? Theme.of(context).colorScheme.onSurface,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}
