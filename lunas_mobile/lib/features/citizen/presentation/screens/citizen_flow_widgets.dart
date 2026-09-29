import 'package:flutter/material.dart';
import 'package:lunas_mobile/core/theme/app_radius.dart';
import 'package:lunas_mobile/core/theme/app_spacing.dart';

class CitizenStatusPill extends StatelessWidget {
  const CitizenStatusPill({
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
        color: color.withValues(alpha: .13),
        borderRadius: BorderRadius.circular(AppRadius.pill),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (icon != null) ...[
            Icon(icon, color: color, size: 16),
            const SizedBox(width: AppSpacing.xs),
          ],
          Text(
            label,
            style: Theme.of(
              context,
            ).textTheme.labelLarge?.copyWith(color: color, fontSize: 12),
          ),
        ],
      ),
    );
  }
}

class CitizenAccentCard extends StatelessWidget {
  const CitizenAccentCard({
    required this.accent,
    required this.child,
    this.color,
    super.key,
  });

  final Color accent;
  final Color? color;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Container(
      decoration: BoxDecoration(
        color: color ?? scheme.surface,
        borderRadius: AppRadius.card,
        border: Border(
          left: BorderSide(color: accent, width: 4),
          top: BorderSide(color: scheme.outlineVariant.withValues(alpha: .7)),
          right: BorderSide(color: scheme.outlineVariant.withValues(alpha: .7)),
          bottom: BorderSide(
            color: scheme.outlineVariant.withValues(alpha: .7),
          ),
        ),
        boxShadow: const [
          BoxShadow(
            color: Color(0x12000000),
            blurRadius: 14,
            offset: Offset(0, 5),
          ),
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.lg),
        child: child,
      ),
    );
  }
}
