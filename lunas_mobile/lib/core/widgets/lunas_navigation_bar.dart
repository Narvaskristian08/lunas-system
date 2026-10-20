import 'package:flutter/material.dart';

/// Shared visual treatment for the role-specific mobile destinations.
class LunasNavigationBar extends StatelessWidget {
  const LunasNavigationBar({
    required this.selectedIndex,
    required this.onDestinationSelected,
    required this.destinations,
    super.key,
  });

  final int selectedIndex;
  final ValueChanged<int> onDestinationSelected;
  final List<Widget> destinations;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colors = theme.colorScheme;
    return DecoratedBox(
      decoration: BoxDecoration(
        color: colors.surface,
        border: Border(top: BorderSide(color: colors.outlineVariant)),
        boxShadow: [
          BoxShadow(
            color: colors.shadow.withValues(alpha: .06),
            blurRadius: 20,
            offset: const Offset(0, -4),
          ),
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.fromLTRB(4, 6, 4, 2),
        child: NavigationBarTheme(
          data: theme.navigationBarTheme.copyWith(
            iconTheme: WidgetStateProperty.resolveWith(
              (states) => IconThemeData(
                color: states.contains(WidgetState.selected)
                    ? colors.primary
                    : colors.onSurfaceVariant,
                size: 24,
              ),
            ),
            labelTextStyle: WidgetStateProperty.resolveWith(
              (states) => theme.textTheme.labelSmall!.copyWith(
                fontSize: 11,
                height: 1.2,
                letterSpacing: 0,
                fontWeight: states.contains(WidgetState.selected)
                    ? FontWeight.w700
                    : FontWeight.w500,
                color: states.contains(WidgetState.selected)
                    ? colors.primary
                    : colors.onSurfaceVariant,
              ),
            ),
          ),
          child: NavigationBar(
            selectedIndex: selectedIndex,
            onDestinationSelected: onDestinationSelected,
            destinations: destinations,
            height: 76,
            elevation: 0,
            backgroundColor: Colors.transparent,
            surfaceTintColor: Colors.transparent,
            indicatorColor: colors.primary.withValues(alpha: .12),
            indicatorShape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(14),
            ),
            labelBehavior: NavigationDestinationLabelBehavior.alwaysShow,
            animationDuration: const Duration(milliseconds: 200),
          ),
        ),
      ),
    );
  }
}
