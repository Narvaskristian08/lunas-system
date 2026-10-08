import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

class CitizenBottomNavigation extends StatelessWidget {
  const CitizenBottomNavigation({super.key});

  static const _destinations = <_CitizenDestination>[
    _CitizenDestination(
      label: 'Home',
      icon: Icons.home_outlined,
      selectedIcon: Icons.home_rounded,
      route: '/citizen',
    ),
    _CitizenDestination(
      label: 'Reports',
      icon: Icons.description_outlined,
      selectedIcon: Icons.description_rounded,
      route: '/reports',
    ),
    _CitizenDestination(
      label: 'Maps',
      icon: Icons.map_outlined,
      selectedIcon: Icons.map_rounded,
      route: '/reports/location',
    ),
    _CitizenDestination(
      label: 'Notifications',
      icon: Icons.notifications_none_rounded,
      selectedIcon: Icons.notifications_rounded,
      route: '/notifications',
    ),
    _CitizenDestination(
      label: 'Profile',
      icon: Icons.person_outline_rounded,
      selectedIcon: Icons.person_rounded,
      route: '/profile',
    ),
  ];

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final path = GoRouterState.of(context).uri.path;
    final selectedIndex = _selectedIndexFor(path);
    final isNarrow = MediaQuery.sizeOf(context).width < 360;
    final inactiveColor = theme.colorScheme.onSurfaceVariant;
    final activeColor = theme.colorScheme.primary;

    return SafeArea(
      top: false,
      minimum: EdgeInsets.fromLTRB(isNarrow ? 6 : 10, 6, isNarrow ? 6 : 10, 8),
      child: DecoratedBox(
        decoration: BoxDecoration(
          color: theme.colorScheme.surface,
          border: Border.all(color: theme.colorScheme.outlineVariant),
          borderRadius: BorderRadius.circular(16),
          boxShadow: const [
            BoxShadow(
              color: Color(0x14000000),
              blurRadius: 14,
              offset: Offset(0, -2),
            ),
          ],
        ),
        child: SizedBox(
          height: 60,
          child: Row(
            children: List.generate(_destinations.length, (index) {
              final destination = _destinations[index];
              final isSelected = index == selectedIndex;
              return Expanded(
                child: Semantics(
                  selected: isSelected,
                  button: true,
                  label: destination.label,
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 2),
                    child: Material(
                      color: Colors.transparent,
                      child: InkWell(
                        borderRadius: BorderRadius.circular(14),
                        onTap: isSelected
                            ? null
                            : () => context.go(destination.route),
                        child: Padding(
                          padding: const EdgeInsets.symmetric(vertical: 5),
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              AnimatedContainer(
                                duration: const Duration(milliseconds: 220),
                                curve: Curves.easeOutCubic,
                                width: isNarrow ? 46 : 52,
                                height: 28,
                                decoration: BoxDecoration(
                                  color: isSelected
                                      ? activeColor
                                      : Colors.transparent,
                                  borderRadius: BorderRadius.circular(18),
                                ),
                                child: AnimatedSwitcher(
                                  duration: const Duration(milliseconds: 180),
                                  child: Icon(
                                    isSelected
                                        ? destination.selectedIcon
                                        : destination.icon,
                                    key: ValueKey(isSelected),
                                    size: 21,
                                    color: isSelected
                                        ? theme.colorScheme.onPrimary
                                        : inactiveColor,
                                  ),
                                ),
                              ),
                              const SizedBox(height: 2),
                              Text(
                                destination.label,
                                maxLines: 1,
                                overflow: TextOverflow.fade,
                                softWrap: false,
                                style: theme.textTheme.labelSmall?.copyWith(
                                  color: isSelected
                                      ? activeColor
                                      : inactiveColor,
                                  fontSize: isNarrow ? 10 : 11,
                                  letterSpacing: 0,
                                  fontWeight: isSelected
                                      ? FontWeight.w700
                                      : FontWeight.w600,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
              );
            }),
          ),
        ),
      ),
    );
  }

  int _selectedIndexFor(String path) {
    if (path == '/citizen') return 0;
    if (path == '/reports') return 1;
    if (path == '/reports/location') return 2;
    if (path == '/notifications' || path.startsWith('/notifications/')) {
      return 3;
    }
    if (path == '/profile') return 4;
    if (path.startsWith('/reports/')) return 1;
    return 0;
  }
}

class _CitizenDestination {
  const _CitizenDestination({
    required this.label,
    required this.icon,
    required this.selectedIcon,
    required this.route,
  });

  final String label;
  final IconData icon;
  final IconData selectedIcon;
  final String route;
}
