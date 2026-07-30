import 'package:flutter/material.dart';
import 'package:lunas_mobile/core/theme/app_colors.dart';
import 'package:lunas_mobile/core/theme/app_radius.dart';
import 'package:lunas_mobile/core/theme/app_spacing.dart';
import 'package:lunas_mobile/core/widgets/lunas_app_scaffold.dart';
import 'package:lunas_mobile/core/widgets/lunas_card.dart';

/// Static entry point for the role-specific UI prototypes.
///
/// Live role access must be determined by verified account permissions rather
/// than this selector.
class WorkspaceSelectorScreen extends StatelessWidget {
  const WorkspaceSelectorScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return LunasAppScaffold(
      title: 'LUNAS',
      subtitle: 'Workspace selector',
      showBackButton: true,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Container(
            padding: const EdgeInsets.all(AppSpacing.lg),
            decoration: BoxDecoration(
              color: AppColorsLight.brandBase,
              borderRadius: AppRadius.card,
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Icon(
                  Icons.location_city_outlined,
                  color: Colors.white,
                  size: 32,
                ),
                const SizedBox(height: AppSpacing.md),
                Text(
                  'Choose a workspace',
                  style: Theme.of(context).textTheme.headlineLarge?.copyWith(
                    color: Colors.white,
                    fontSize: 28,
                    fontWeight: FontWeight.w800,
                  ),
                ),
                const SizedBox(height: AppSpacing.xs),
                Text(
                  'Explore the connected LUNAS reporting and response flow.',
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: Colors.white.withValues(alpha: .86),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: AppSpacing.xl),
          Text(
            'Available prototypes',
            style: Theme.of(
              context,
            ).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w800),
          ),
          const SizedBox(height: AppSpacing.sm),
          _WorkspaceCard(
            icon: Icons.person_outline_rounded,
            title: 'Citizen portal',
            description:
                'Create reports, confirm AI suggestions, and track repair updates.',
            accent: AppColorsLight.brandBase,
            onTap: () => Navigator.pushNamedAndRemoveUntil(
              context,
              '/home',
              (route) => false,
            ),
          ),
          const SizedBox(height: AppSpacing.sm),
          _WorkspaceCard(
            icon: Icons.engineering_outlined,
            title: 'Repair personnel',
            description:
                'Review assigned work orders, update progress, and submit evidence.',
            accent: AppColorsLight.success,
            onTap: () => Navigator.pushNamed(context, '/repair'),
          ),
          const SizedBox(height: AppSpacing.sm),
          _WorkspaceCard(
            icon: Icons.account_balance_outlined,
            title: 'Official operations',
            description:
                'Validate reports, route work, monitor SLAs, and verify completion.',
            accent: AppColorsLight.alert,
            onTap: () => Navigator.pushNamed(context, '/official'),
          ),
          const SizedBox(height: AppSpacing.xl),
          Text(
            'Additional role workspaces',
            style: Theme.of(
              context,
            ).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w800),
          ),
          const SizedBox(height: AppSpacing.sm),
          _WorkspaceCard(
            icon: Icons.architecture_outlined,
            title: 'City engineering',
            description:
                'Oversee incidents, utility routing, targets, and city-wide performance.',
            accent: AppColorsLight.brandBase,
            onTap: () => Navigator.pushNamed(context, '/engineering'),
          ),
          const SizedBox(height: AppSpacing.sm),
          _WorkspaceCard(
            icon: Icons.location_city_outlined,
            title: 'Barangay workspace',
            description:
                'Manage neighborhood reports and local response insights.',
            accent: AppColorsLight.success,
            onTap: () => Navigator.pushNamed(context, '/barangay'),
          ),
          const SizedBox(height: AppSpacing.sm),
          _WorkspaceCard(
            icon: Icons.bolt_outlined,
            title: 'Utility provider',
            description:
                'Review external assignments and coordinate provider response.',
            accent: AppColorsLight.alert,
            onTap: () => Navigator.pushNamed(context, '/utility'),
          ),
          const SizedBox(height: AppSpacing.sm),
          _WorkspaceCard(
            icon: Icons.admin_panel_settings_outlined,
            title: 'System administration',
            description:
                'Review users, audits, announcements, and system configuration.',
            accent: AppColorsLight.critical,
            onTap: () => Navigator.pushNamed(context, '/admin'),
          ),
          const SizedBox(height: AppSpacing.xl),
          Container(
            padding: const EdgeInsets.all(AppSpacing.md),
            decoration: BoxDecoration(
              color: AppColorsLight.brandBase.withValues(alpha: .07),
              borderRadius: AppRadius.input,
              border: Border.all(
                color: AppColorsLight.brandBase.withValues(alpha: .18),
              ),
            ),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Icon(
                  Icons.verified_user_outlined,
                  color: AppColorsLight.brandBase,
                ),
                const SizedBox(width: AppSpacing.sm),
                Expanded(
                  child: Text(
                    'In the live product, official workspaces are available only after account and department verification.',
                    style: Theme.of(
                      context,
                    ).textTheme.bodySmall?.copyWith(height: 1.45),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: AppSpacing.md),
          OutlinedButton.icon(
            onPressed: () => Navigator.pushNamed(context, '/stitch-catalog'),
            icon: const Icon(Icons.dashboard_customize_outlined),
            label: const Text('Browse all Stitch screens'),
          ),
        ],
      ),
    );
  }
}

class _WorkspaceCard extends StatelessWidget {
  const _WorkspaceCard({
    required this.icon,
    required this.title,
    required this.description,
    required this.accent,
    required this.onTap,
  });

  final IconData icon;
  final String title;
  final String description;
  final Color accent;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return LunasCard(
      onTap: onTap,
      padding: const EdgeInsets.all(AppSpacing.md),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              color: accent.withValues(alpha: .12),
              borderRadius: AppRadius.input,
            ),
            child: Icon(icon, color: accent),
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
                Text(
                  description,
                  style: Theme.of(
                    context,
                  ).textTheme.bodySmall?.copyWith(height: 1.4),
                ),
              ],
            ),
          ),
          const SizedBox(width: AppSpacing.xs),
          Icon(Icons.arrow_forward_rounded, color: accent),
        ],
      ),
    );
  }
}
