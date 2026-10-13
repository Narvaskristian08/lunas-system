import 'package:flutter/material.dart';

class LunasFilterButton extends StatelessWidget {
  const LunasFilterButton({
    super.key,
    required this.label,
    required this.selected,
    required this.onTap,
  });
  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height:
          34 *
          (MediaQuery.textScalerOf(context).scale(12) / 12).clamp(1.0, 3.0),
      child: OutlinedButton(
        onPressed: onTap,
        style: OutlinedButton.styleFrom(
          padding: EdgeInsets.zero,
          minimumSize: Size.zero,
          tapTargetSize: MaterialTapTargetSize.shrinkWrap,
          backgroundColor: selected
              ? Theme.of(context).colorScheme.primary.withValues(alpha: .1)
              : Colors.white,
          foregroundColor: Theme.of(context).colorScheme.onSurface,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          textStyle: Theme.of(context).textTheme.labelMedium?.copyWith(
            fontWeight: selected ? FontWeight.w700 : FontWeight.w500,
          ),
        ),
        child: Text(label, textAlign: TextAlign.center),
      ),
    );
  }
}
