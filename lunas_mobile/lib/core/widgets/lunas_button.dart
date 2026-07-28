import 'package:flutter/material.dart';
import 'package:lunas_mobile/core/theme/app_radius.dart';

class LunasButton extends StatelessWidget {
  const LunasButton({
    required this.label,
    required this.onPressed,
    this.icon,
    this.isLoading = false,
    this.expand = true,
    super.key,
  });

  final String label;
  final VoidCallback? onPressed;
  final IconData? icon;
  final bool isLoading;
  final bool expand;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    final enabled = onPressed != null && !isLoading;
    final content = isLoading
        ? const SizedBox.square(
            dimension: 20,
            child: CircularProgressIndicator(strokeWidth: 2),
          )
        : Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(label),
              if (icon != null) ...[
                const SizedBox(width: 8),
                Icon(icon, size: 18),
              ],
            ],
          );
    final button = ElevatedButton(
      onPressed: enabled ? onPressed : null,
      style: ElevatedButton.styleFrom(
        backgroundColor: colors.primary,
        disabledBackgroundColor: colors.onSurface.withValues(alpha: .12),
        foregroundColor: colors.onPrimary,
        elevation: 0,
        shape: RoundedRectangleBorder(borderRadius: AppRadius.button),
      ),
      child: content,
    );
    return expand ? SizedBox(width: double.infinity, child: button) : button;
  }
}
