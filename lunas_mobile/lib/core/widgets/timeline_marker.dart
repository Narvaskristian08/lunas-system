import 'package:flutter/material.dart';

/// Shared marker for report and repair timelines.
class TimelineMarker extends StatelessWidget {
  const TimelineMarker({
    required this.latest,
    required this.showLine,
    super.key,
  });

  final bool latest;
  final bool showLine;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    return SizedBox(
      width: 24,
      child: Column(
        children: [
          const SizedBox(height: 2),
          Container(
            width: 20,
            height: 20,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: latest ? colors.primary : colors.surface,
              border: latest
                  ? null
                  : Border.all(color: colors.primary, width: 1.5),
            ),
            child: latest
                ? Icon(Icons.check_rounded, size: 14, color: colors.onPrimary)
                : Center(
                    child: Container(
                      width: 8,
                      height: 8,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: colors.primary,
                      ),
                    ),
                  ),
          ),
          if (showLine)
            Expanded(child: Container(width: 1, color: colors.outlineVariant)),
        ],
      ),
    );
  }
}
