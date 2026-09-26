import 'package:flutter/material.dart';
import 'package:lunas_mobile/features/repair/presentation/screens/official_work_orders_screen.dart';

/// Provider-specific entry point for the server-scoped work-order monitor.
/// The shared monitor is read-only on mobile; repair and assignment actions
/// remain restricted to the role-specific workflow screens and API policies.
class UtilityWorkOrdersScreen extends StatelessWidget {
  const UtilityWorkOrdersScreen({super.key});

  @override
  Widget build(BuildContext context) => const OfficialWorkOrdersScreen(
    title: 'Provider work orders',
    subtitle: 'Work routed to your utility organization',
    emptyMessage: 'No work orders have been routed to this provider yet.',
  );
}
