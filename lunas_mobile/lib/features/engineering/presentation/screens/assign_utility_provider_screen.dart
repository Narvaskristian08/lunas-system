import 'package:flutter/material.dart';
import 'package:lunas_mobile/core/theme/app_colors.dart';
import 'package:lunas_mobile/core/theme/app_spacing.dart';
import 'package:lunas_mobile/core/widgets/lunas_card.dart';
import 'package:lunas_mobile/features/engineering/presentation/screens/engineering_widgets.dart';

/// Engineering dispatch form for assigning a verified utility incident.
class AssignUtilityProviderScreen extends StatefulWidget {
  const AssignUtilityProviderScreen({super.key});

  @override
  State<AssignUtilityProviderScreen> createState() =>
      _AssignUtilityProviderScreenState();
}

class _AssignUtilityProviderScreenState
    extends State<AssignUtilityProviderScreen> {
  String _provider = 'Dagupan Water District';

  static const _providers = [
    _Provider(
      name: 'Dagupan Water District',
      service: 'Water infrastructure',
      response: 'Est. response: 1 hr 15 mins',
      availability: 'Available',
      icon: Icons.water_drop_outlined,
      color: AppColorsLight.brandBase,
    ),
    _Provider(
      name: 'Northern Luzon Power Response',
      service: 'Electricity',
      response: 'Est. response: 45 mins',
      availability: 'Available',
      icon: Icons.bolt_outlined,
      color: AppColorsLight.alert,
    ),
    _Provider(
      name: 'City telecom coordination desk',
      service: 'Telecommunications',
      response: 'Est. response: 3+ hrs',
      availability: 'High volume',
      icon: Icons.router_outlined,
      color: AppColorsLight.critical,
    ),
  ];

  @override
  Widget build(BuildContext context) {
    return EngineeringPage(
      title: 'Assign utility provider',
      subtitle: 'INC-2026-089 · Main water rupture',
      bottomAction: EngineeringActionBar(
        secondaryLabel: 'Cancel',
        onSecondary: () => Navigator.maybePop(context),
        primaryLabel: 'Dispatch provider',
        primaryIcon: Icons.send_outlined,
        onPrimary: () => showEngineeringNotice(
          context,
          'Dispatch staged for $_provider. An authorized engineer must confirm it in the live workflow.',
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          LunasCard(
            color: AppColorsLight.critical.withValues(alpha: .08),
            child: const EngineeringInfoRow(
              icon: Icons.report_problem_outlined,
              label: 'Incident priority',
              value:
                  'Critical water-infrastructure incident near A.B. Fernandez Ave., Barangay Pantal.',
              color: AppColorsLight.critical,
            ),
          ),
          const SizedBox(height: AppSpacing.xxl),
          const EngineeringSectionHeading(
            title: 'Select provider',
            description:
                'Availability is static sample data for this prototype.',
          ),
          const SizedBox(height: AppSpacing.sm),
          for (final provider in _providers) ...[
            _ProviderCard(
              provider: provider,
              selected: _provider == provider.name,
              onTap: () => setState(() => _provider = provider.name),
            ),
            const SizedBox(height: AppSpacing.sm),
          ],
          const SizedBox(height: AppSpacing.xl),
          const EngineeringSectionHeading(title: 'Dispatch instructions'),
          const SizedBox(height: AppSpacing.sm),
          TextFormField(
            maxLines: 5,
            decoration: const InputDecoration(
              alignLabelWithHint: true,
              hintText:
                  'Add access notes, coordination contacts, safety controls, or traffic requirements…',
              prefixIcon: Padding(
                padding: EdgeInsets.only(bottom: 84),
                child: Icon(Icons.edit_note_outlined),
              ),
            ),
          ),
          const SizedBox(height: AppSpacing.xl),
          LunasCard(
            color: Theme.of(
              context,
            ).colorScheme.primaryContainer.withValues(alpha: .40),
            child: const EngineeringInfoRow(
              icon: Icons.gavel_outlined,
              label: 'Dispatch control',
              value:
                  'Provider assignment does not close the incident. Engineering retains oversight and confirms repair verification.',
            ),
          ),
        ],
      ),
    );
  }
}

class _ProviderCard extends StatelessWidget {
  const _ProviderCard({
    required this.provider,
    required this.selected,
    required this.onTap,
  });

  final _Provider provider;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    return LunasCard(
      onTap: onTap,
      color: selected ? colors.primaryContainer.withValues(alpha: .48) : null,
      padding: const EdgeInsets.all(AppSpacing.md),
      child: Row(
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: provider.color.withValues(alpha: .14),
              shape: BoxShape.circle,
            ),
            child: Icon(provider.icon, color: provider.color),
          ),
          const SizedBox(width: AppSpacing.sm),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        provider.name,
                        style: Theme.of(context).textTheme.titleMedium
                            ?.copyWith(fontWeight: FontWeight.w800),
                      ),
                    ),
                    EngineeringBadge(
                      label: provider.availability,
                      color: provider.availability == 'Available'
                          ? AppColorsLight.success
                          : AppColorsLight.alert,
                    ),
                  ],
                ),
                const SizedBox(height: AppSpacing.xxs),
                Text(
                  provider.service,
                  style: Theme.of(context).textTheme.bodySmall,
                ),
                const SizedBox(height: AppSpacing.xxs),
                Text(
                  provider.response,
                  style: Theme.of(context).textTheme.bodySmall,
                ),
              ],
            ),
          ),
          const SizedBox(width: AppSpacing.xs),
          Icon(
            selected
                ? Icons.check_circle_rounded
                : Icons.radio_button_unchecked_rounded,
            color: selected ? colors.primary : colors.outline,
          ),
        ],
      ),
    );
  }
}

class _Provider {
  const _Provider({
    required this.name,
    required this.service,
    required this.response,
    required this.availability,
    required this.icon,
    required this.color,
  });

  final String name;
  final String service;
  final String response;
  final String availability;
  final IconData icon;
  final Color color;
}
