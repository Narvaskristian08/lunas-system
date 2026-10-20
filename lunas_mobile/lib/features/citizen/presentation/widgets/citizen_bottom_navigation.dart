import 'package:lunas_mobile/core/widgets/lunas_navigation_bar.dart';
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
    final path = GoRouterState.of(context).uri.path;
    final selectedIndex = _selectedIndexFor(path);
    return LunasNavigationBar(
      selectedIndex: selectedIndex,
      onDestinationSelected: (index) {
        if (index == selectedIndex) return;
        context.go(_destinations[index].route);
      },
      destinations: [
        for (final destination in _destinations)
          NavigationDestination(
            icon: Icon(destination.icon, size: 22),
            selectedIcon: Icon(destination.selectedIcon, size: 22),
            label: destination.label,
          ),
      ],
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
