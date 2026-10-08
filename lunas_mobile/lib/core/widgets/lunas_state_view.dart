import 'package:flutter/material.dart';
import 'package:lunas_mobile/core/theme/app_colors.dart';
import 'package:lunas_mobile/core/theme/app_spacing.dart';

enum LunasViewState { loading, empty, success, error }

class LunasStateView extends StatelessWidget {
  const LunasStateView({
    required this.state,
    required this.title,
    required this.message,
    this.actionLabel,
    this.onAction,
    this.compact = false,
    super.key,
  });

  final LunasViewState state;
  final String title;
  final String message;
  final String? actionLabel;
  final VoidCallback? onAction;
  final bool compact;

  @override
  Widget build(BuildContext context) {
    final (icon, color) = switch (state) {
      LunasViewState.loading => (
        Icons.hourglass_top_rounded,
        AppColorsLight.brandBase,
      ),
      LunasViewState.empty => (
        Icons.inbox_outlined,
        AppColorsLight.textSecondary,
      ),
      LunasViewState.success => (
        Icons.check_circle_rounded,
        AppColorsLight.success,
      ),
      LunasViewState.error => (
        Icons.error_outline_rounded,
        AppColorsLight.critical,
      ),
    };
    final content = Semantics(
      liveRegion: true,
      child: Padding(
        padding: EdgeInsets.symmetric(
          vertical: compact ? AppSpacing.xl : AppSpacing.hero,
          horizontal: AppSpacing.md,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (state == LunasViewState.loading)
              const SizedBox.square(
                dimension: 42,
                child: CircularProgressIndicator(strokeWidth: 3),
              )
            else
              Icon(icon, color: color, size: compact ? 42 : 58),
            const SizedBox(height: AppSpacing.md),
            Text(
              title,
              textAlign: TextAlign.center,
              style: Theme.of(
                context,
              ).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w700),
            ),
            const SizedBox(height: AppSpacing.xs),
            Text(
              message,
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.bodyMedium,
            ),
            if (actionLabel != null && onAction != null) ...[
              const SizedBox(height: AppSpacing.lg),
              FilledButton(onPressed: onAction, child: Text(actionLabel!)),
            ],
          ],
        ),
      ),
    );
    if (state != LunasViewState.loading) return content;
    if (compact) {
      return Transform.translate(offset: const Offset(0, -12), child: content);
    }
    return SizedBox(
      height: (MediaQuery.sizeOf(context).height - 200).clamp(
        240.0,
        double.infinity,
      ),
      child: Align(alignment: const Alignment(0, -.18), child: content),
    );
  }
}
