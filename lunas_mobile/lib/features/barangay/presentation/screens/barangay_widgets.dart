import 'package:flutter/material.dart';
import 'package:lunas_mobile/core/theme/app_radius.dart';
import 'package:lunas_mobile/core/theme/app_spacing.dart';
import 'package:lunas_mobile/core/widgets/lunas_app_bar.dart';
import 'package:lunas_mobile/core/widgets/lunas_card.dart';

/// Feature-local building blocks for the Barangay official workspace.
class BarangayPage extends StatelessWidget {
  const BarangayPage({
    required this.title,
    required this.child,
    this.subtitle,
    this.actions,
    this.showBackButton = true,
    this.bottomAction,
    super.key,
  });

  final String title;
  final String? subtitle;
  final Widget child;
  final List<Widget>? actions;
  final bool showBackButton;
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

class BarangaySectionHeading extends StatelessWidget {
  const BarangaySectionHeading({
    required this.title,
    this.description,
    this.trailing,
    super.key,
  });

  final String title;
  final String? description;
  final Widget? trailing;

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
                style: Theme.of(context).textTheme.titleLarge?.copyWith(
                  fontWeight: FontWeight.w800,
                ),
              ),
              if (description != null) ...[
                const SizedBox(height: AppSpacing.xxs),
                Text(description!, style: Theme.of(context).textTheme.bodySmall),
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

class BarangayBadge extends StatelessWidget {
  const BarangayBadge({
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
              fontWeight: FontWeight.w800,
            ),
          ),
        ],
      ),
    );
  }
}

class BarangayMetricCard extends StatelessWidget {
  const BarangayMetricCard({
    required this.label,
    required this.value,
    required this.icon,
    required this.color,
    this.detail,
    this.emphasized = false,
    super.key,
  });

  final String label;
  final String value;
  final IconData icon;
  final Color color;
  final String? detail;
  final bool emphasized;

  @override
  Widget build(BuildContext context) {
    return LunasCard(
      color: emphasized ? color.withValues(alpha: .12) : null,
      padding: const EdgeInsets.all(AppSpacing.md),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  label,
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
              Icon(icon, color: color),
            ],
          ),
          const SizedBox(height: AppSpacing.md),
          Text(
            value,
            style: Theme.of(context).textTheme.headlineLarge?.copyWith(
              color: emphasized ? color : null,
              fontWeight: FontWeight.w800,
            ),
          ),
          if (detail != null) ...[
            const SizedBox(height: AppSpacing.xxs),
            Text(detail!, style: Theme.of(context).textTheme.bodySmall),
          ],
        ],
      ),
    );
  }
}

class BarangayInfoRow extends StatelessWidget {
  const BarangayInfoRow({
    required this.icon,
    required this.label,
    required this.value,
    this.color,
    super.key,
  });

  final IconData icon;
  final String label;
  final String value;
  final Color? color;

  @override
  Widget build(BuildContext context) {
    final accent = color ?? Theme.of(context).colorScheme.primary;
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, size: 20, color: accent),
        const SizedBox(width: AppSpacing.sm),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(label, style: Theme.of(context).textTheme.bodySmall),
              const SizedBox(height: AppSpacing.xxs),
              Text(
                value,
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  fontWeight: FontWeight.w700,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class BarangayVisualPanel extends StatelessWidget {
  const BarangayVisualPanel({
    required this.icon,
    required this.label,
    required this.detail,
    required this.accent,
    this.height = 180,
    this.badge,
    super.key,
  });

  final IconData icon;
  final String label;
  final String detail;
  final Color accent;
  final double height;
  final String? badge;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      image: true,
      label: '$label schematic visual',
      child: Container(
        height: height,
        width: double.infinity,
        decoration: BoxDecoration(
          borderRadius: AppRadius.input,
          border: Border.all(color: accent.withValues(alpha: .28)),
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [accent.withValues(alpha: .22), accent.withValues(alpha: .06)],
          ),
        ),
        child: Stack(
          children: [
            Positioned(
              top: AppSpacing.sm,
              right: AppSpacing.sm,
              child: Icon(Icons.grid_4x4_rounded, color: accent.withValues(alpha: .42)),
            ),
            Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    width: 56,
                    height: 56,
                    decoration: BoxDecoration(
                      color: accent.withValues(alpha: .16),
                      shape: BoxShape.circle,
                    ),
                    child: Icon(icon, size: 30, color: accent),
                  ),
                  const SizedBox(height: AppSpacing.sm),
                  Text(
                    label,
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  const SizedBox(height: AppSpacing.xxs),
                  Text(detail, style: Theme.of(context).textTheme.bodySmall),
                ],
              ),
            ),
            if (badge != null)
              Positioned(
                left: AppSpacing.sm,
                bottom: AppSpacing.sm,
                child: BarangayBadge(
                  label: badge!,
                  color: accent,
                  icon: Icons.location_on_outlined,
                ),
              ),
          ],
        ),
      ),
    );
  }
}

class BarangayProgressBar extends StatelessWidget {
  const BarangayProgressBar({
    required this.value,
    required this.color,
    this.label,
    super.key,
  });

  final double value;
  final Color color;
  final String? label;

  @override
  Widget build(BuildContext context) {
    final safeValue = value.clamp(0.0, 1.0).toDouble();
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (label != null) ...[
          Text(label!, style: Theme.of(context).textTheme.bodySmall),
          const SizedBox(height: AppSpacing.xs),
        ],
        ClipRRect(
          borderRadius: BorderRadius.circular(AppRadius.pill),
          child: LinearProgressIndicator(
            value: safeValue,
            minHeight: 9,
            backgroundColor: color.withValues(alpha: .16),
            valueColor: AlwaysStoppedAnimation<Color>(color),
          ),
        ),
      ],
    );
  }
}

class BarangayTimelineItem extends StatelessWidget {
  const BarangayTimelineItem({
    required this.title,
    required this.description,
    required this.time,
    required this.color,
    this.isLast = false,
    super.key,
  });

  final String title;
  final String description;
  final String time;
  final Color color;
  final bool isLast;

  @override
  Widget build(BuildContext context) {
    return IntrinsicHeight(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          SizedBox(
            width: 28,
            child: Column(
              children: [
                Container(
                  width: 12,
                  height: 12,
                  margin: const EdgeInsets.only(top: AppSpacing.xs),
                  decoration: BoxDecoration(color: color, shape: BoxShape.circle),
                ),
                if (!isLast)
                  Expanded(
                    child: Container(
                      width: 2,
                      color: Theme.of(context).colorScheme.outlineVariant,
                    ),
                  ),
              ],
            ),
          ),
          const SizedBox(width: AppSpacing.xs),
          Expanded(
            child: Padding(
              padding: const EdgeInsets.only(bottom: AppSpacing.lg),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  const SizedBox(height: AppSpacing.xxs),
                  Text(description, style: Theme.of(context).textTheme.bodySmall),
                  const SizedBox(height: AppSpacing.xxs),
                  Text(time, style: Theme.of(context).textTheme.bodySmall),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class BarangayActionBar extends StatelessWidget {
  const BarangayActionBar({
    required this.primaryLabel,
    required this.onPrimary,
    required this.secondaryLabel,
    required this.onSecondary,
    this.primaryIcon,
    this.secondaryColor,
    super.key,
  });

  final String primaryLabel;
  final VoidCallback onPrimary;
  final String secondaryLabel;
  final VoidCallback onSecondary;
  final IconData? primaryIcon;
  final Color? secondaryColor;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    final outline = secondaryColor ?? colors.primary;
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
                  foregroundColor: outline,
                  side: BorderSide(color: outline),
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
                icon: primaryIcon == null ? const SizedBox.shrink() : Icon(primaryIcon),
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

void showBarangayNotice(BuildContext context, String message) {
  ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(message)));
}
