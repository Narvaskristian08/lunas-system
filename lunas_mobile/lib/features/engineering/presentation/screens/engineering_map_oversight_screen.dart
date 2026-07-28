import 'package:flutter/material.dart';
import 'package:lunas_mobile/core/theme/app_colors.dart';
import 'package:lunas_mobile/core/theme/app_spacing.dart';
import 'package:lunas_mobile/core/widgets/lunas_card.dart';
import 'package:lunas_mobile/features/engineering/presentation/screens/engineering_routes.dart';
import 'package:lunas_mobile/features/engineering/presentation/screens/engineering_widgets.dart';

/// Schematic, asset-free map oversight screen for engineering operations.
class EngineeringMapOversightScreen extends StatefulWidget {
  const EngineeringMapOversightScreen({super.key});

  @override
  State<EngineeringMapOversightScreen> createState() =>
      _EngineeringMapOversightScreenState();
}

class _EngineeringMapOversightScreenState
    extends State<EngineeringMapOversightScreen> {
  String _layer = 'All assets';

  @override
  Widget build(BuildContext context) {
    return EngineeringPage(
      title: 'Infrastructure map',
      subtitle: 'City-wide operational oversight',
      actions: [
        IconButton(
          tooltip: 'Search assets',
          onPressed: () => showEngineeringNotice(
            context,
            'Asset search is a static control in this prototype.',
          ),
          icon: const Icon(Icons.search_rounded),
        ),
        IconButton(
          tooltip: 'Map filters',
          onPressed: () => showEngineeringNotice(
            context,
            'Map filters will use live incident data in a future integration.',
          ),
          icon: const Icon(Icons.tune_rounded),
        ),
        const SizedBox(width: AppSpacing.sm),
      ],
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: ['All assets', 'Water', 'Roads', 'Power', 'Drainage']
                  .map(
                    (layer) => Padding(
                      padding: const EdgeInsets.only(right: AppSpacing.xs),
                      child: ChoiceChip(
                        label: Text(layer),
                        selected: _layer == layer,
                        onSelected: (_) => setState(() => _layer = layer),
                      ),
                    ),
                  )
                  .toList(),
            ),
          ),
          const SizedBox(height: AppSpacing.md),
          const EngineeringVisualPanel(
            icon: Icons.map_outlined,
            label: 'Dagupan operational map',
            detail: 'Schematic map with incident markers',
            accent: AppColorsLight.brandBase,
            height: 280,
            markerLabel: '12 active alerts',
          ),
          const SizedBox(height: AppSpacing.md),
          LunasCard(
            color: Theme.of(context).colorScheme.primaryContainer.withValues(alpha: .38),
            child: Row(
              children: [
                const Icon(Icons.info_outline_rounded, color: AppColorsLight.brandBase),
                const SizedBox(width: AppSpacing.sm),
                Expanded(
                  child: Text(
                    '$_layer layer selected. Map locations are visual placeholders until approved location services are connected.',
                    style: Theme.of(context).textTheme.bodySmall,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: AppSpacing.xxl),
          const EngineeringSectionHeading(title: 'Regional overview'),
          const SizedBox(height: AppSpacing.sm),
          LayoutBuilder(
            builder: (context, constraints) {
              final columns = constraints.maxWidth >= 600 ? 3 : 1;
              final width =
                  (constraints.maxWidth - (columns - 1) * AppSpacing.sm) /
                  columns;
              return Wrap(
                spacing: AppSpacing.sm,
                runSpacing: AppSpacing.sm,
                children: [
                  SizedBox(
                    width: width,
                    child: const EngineeringMetricCard(
                      label: 'Asset health',
                      value: '85',
                      detail: 'out of 100',
                      icon: Icons.health_and_safety_outlined,
                      color: AppColorsLight.success,
                    ),
                  ),
                  SizedBox(
                    width: width,
                    child: const EngineeringMetricCard(
                      label: 'Critical alerts',
                      value: '12',
                      icon: Icons.warning_amber_rounded,
                      color: AppColorsLight.critical,
                      emphasized: true,
                    ),
                  ),
                  SizedBox(
                    width: width,
                    child: const EngineeringMetricCard(
                      label: 'SLA compliance',
                      value: '94.2%',
                      icon: Icons.verified_outlined,
                      color: AppColorsLight.brandBase,
                    ),
                  ),
                ],
              );
            },
          ),
          const SizedBox(height: AppSpacing.xxl),
          EngineeringSectionHeading(
            title: 'Recent critical alerts',
            trailing: TextButton(
              onPressed: () => Navigator.pushNamed(
                context,
                EngineeringRoutes.incidents,
              ),
              child: const Text('View queue'),
            ),
          ),
          const SizedBox(height: AppSpacing.sm),
          _MapAlert(
            icon: Icons.water_drop_outlined,
            title: 'Main water line rupture',
            detail:
                'Pressure drop detected near the Sector 4 junction. Immediate dispatch recommended.',
            zone: 'Barangay Pantal',
            time: '10m ago',
            urgency: 'High urgency',
            color: AppColorsLight.critical,
            onTap: () => Navigator.pushNamed(
              context,
              EngineeringRoutes.incidentDetails,
            ),
          ),
          const SizedBox(height: AppSpacing.sm),
          _MapAlert(
            icon: Icons.bolt_outlined,
            title: 'Transformer failure',
            detail:
                'Substation 12 is reporting an outage affecting nearby households.',
            zone: 'Barangay Bonuan',
            time: '1h ago',
            urgency: 'Medium urgency',
            color: AppColorsLight.alert,
            onTap: () => Navigator.pushNamed(
              context,
              EngineeringRoutes.utilityAssignment,
            ),
          ),
          const SizedBox(height: AppSpacing.xxl),
          LunasCard(
            child: Row(
              children: [
                Expanded(
                  child: Text(
                    'Explore city-wide performance indicators.',
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
                TextButton.icon(
                  onPressed: () => Navigator.pushNamed(
                    context,
                    EngineeringRoutes.analytics,
                  ),
                  icon: const Icon(Icons.analytics_outlined),
                  label: const Text('Insights'),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _MapAlert extends StatelessWidget {
  const _MapAlert({
    required this.icon,
    required this.title,
    required this.detail,
    required this.zone,
    required this.time,
    required this.urgency,
    required this.color,
    required this.onTap,
  });

  final IconData icon;
  final String title;
  final String detail;
  final String zone;
  final String time;
  final String urgency;
  final Color color;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return LunasCard(
      onTap: onTap,
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: color.withValues(alpha: .14),
              shape: BoxShape.circle,
            ),
            child: Icon(icon, color: color),
          ),
          const SizedBox(width: AppSpacing.md),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w800,
                  ),
                ),
                const SizedBox(height: AppSpacing.xxs),
                Text(detail, style: Theme.of(context).textTheme.bodySmall),
                const SizedBox(height: AppSpacing.sm),
                Wrap(
                  spacing: AppSpacing.xs,
                  runSpacing: AppSpacing.xs,
                  children: [
                    EngineeringBadge(label: zone, color: AppColorsLight.brandBase),
                    EngineeringBadge(label: urgency, color: color),
                    Text(time, style: Theme.of(context).textTheme.bodySmall),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(width: AppSpacing.xs),
          const Icon(Icons.chevron_right_rounded),
        ],
      ),
    );
  }
}
