import 'package:flutter/material.dart';
import 'package:lunas_mobile/core/theme/app_colors.dart';
import 'package:lunas_mobile/core/theme/app_radius.dart';
import 'package:lunas_mobile/core/theme/app_spacing.dart';
import 'package:lunas_mobile/core/widgets/lunas_button.dart';
import 'package:lunas_mobile/core/widgets/lunas_card.dart';
import 'package:lunas_mobile/features/admin/presentation/screens/admin_routes.dart';
import 'package:lunas_mobile/features/admin/presentation/screens/admin_widgets.dart';

/// System-level overview for authorized LUNAS administrators.
class AdminDashboardScreen extends StatelessWidget {
  const AdminDashboardScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return AdminPage(
      title: 'System Admin',
      selectedNavigationIndex: 0,
      actions: [
        IconButton(
          tooltip: 'System settings',
          onPressed: () => Navigator.pushNamed(context, AdminRoutes.settings),
          icon: const Icon(Icons.settings_outlined),
        ),
        const SizedBox(width: AppSpacing.sm),
      ],
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(
            'Good morning, Admin',
            style: Theme.of(context).textTheme.headlineLarge?.copyWith(
              fontSize: 30,
              fontWeight: FontWeight.w800,
            ),
          ),
          const SizedBox(height: AppSpacing.xxs),
          Text(
            'Dagupan City • Operations overview',
            style: Theme.of(context).textTheme.bodyMedium,
          ),
          const SizedBox(height: AppSpacing.sm),
          const Align(
            alignment: Alignment.centerLeft,
            child: AdminStatusPill(
              label: 'System healthy',
              color: AppColorsLight.success,
              icon: Icons.check_circle_outline_rounded,
            ),
          ),
          const SizedBox(height: AppSpacing.xl),
          LayoutBuilder(
            builder: (context, constraints) {
              final compact = constraints.maxWidth < 560;
              final width = compact
                  ? (constraints.maxWidth - AppSpacing.sm) / 2
                  : (constraints.maxWidth - (AppSpacing.sm * 3)) / 4;
              return Wrap(
                spacing: AppSpacing.sm,
                runSpacing: AppSpacing.sm,
                children: [
                  SizedBox(
                    width: width,
                    child: AdminMetricCard(
                      label: 'Total users',
                      value: '1,248',
                      icon: Icons.group_outlined,
                      color: AppColorsLight.brandBase,
                      onTap: () =>
                          Navigator.pushNamed(context, AdminRoutes.users),
                    ),
                  ),
                  SizedBox(
                    width: width,
                    child: const AdminMetricCard(
                      label: 'Active users',
                      value: '842',
                      icon: Icons.how_to_reg_outlined,
                      color: AppColorsLight.success,
                    ),
                  ),
                  SizedBox(
                    width: width,
                    child: AdminMetricCard(
                      label: 'Pending review',
                      value: '12',
                      icon: Icons.hourglass_empty_rounded,
                      color: AppColorsLight.alert,
                      onTap: () =>
                          Navigator.pushNamed(context, AdminRoutes.verifyUser),
                    ),
                  ),
                  SizedBox(
                    width: width,
                    child: AdminMetricCard(
                      label: 'Security alerts',
                      value: '3',
                      icon: Icons.warning_amber_rounded,
                      color: AppColorsLight.critical,
                      onTap: () =>
                          Navigator.pushNamed(context, AdminRoutes.auditLogs),
                    ),
                  ),
                ],
              );
            },
          ),
          const SizedBox(height: AppSpacing.xxl),
          const AdminSectionTitle(title: 'Quick actions'),
          const SizedBox(height: AppSpacing.sm),
          LunasButton(
            label: 'Manage users',
            icon: Icons.manage_accounts_outlined,
            onPressed: () => Navigator.pushNamed(context, AdminRoutes.users),
          ),
          const SizedBox(height: AppSpacing.sm),
          OutlinedButton.icon(
            onPressed: () =>
                Navigator.pushNamed(context, AdminRoutes.auditLogs),
            icon: const Icon(Icons.receipt_long_outlined),
            label: const Text('Review audit logs'),
          ),
          const SizedBox(height: AppSpacing.sm),
          OutlinedButton.icon(
            onPressed: () =>
                Navigator.pushNamed(context, AdminRoutes.createAnnouncement),
            icon: const Icon(Icons.campaign_outlined),
            label: const Text('Create announcement'),
          ),
          const SizedBox(height: AppSpacing.xxl),
          AdminSectionTitle(
            title: 'Recent system activity',
            actionLabel: 'View audit',
            onAction: () => Navigator.pushNamed(context, AdminRoutes.auditLogs),
          ),
          const SizedBox(height: AppSpacing.sm),
          LunasCard(
            padding: EdgeInsets.zero,
            child: Column(
              children: const [
                _ActivityRow(
                  icon: Icons.person_add_alt_1_outlined,
                  color: AppColorsLight.brandBase,
                  title: 'Admin approval completed',
                  detail: 'Three Dagupan field technicians were verified.',
                  time: '10 minutes ago',
                ),
                Divider(height: 1),
                _ActivityRow(
                  icon: Icons.security_outlined,
                  color: AppColorsLight.critical,
                  title: 'Access attempt flagged',
                  detail:
                      'An automated check requested an administrator review.',
                  time: '45 minutes ago',
                ),
              ],
            ),
          ),
          const SizedBox(height: AppSpacing.xl),
          Container(
            padding: const EdgeInsets.all(AppSpacing.md),
            decoration: BoxDecoration(
              color: AppColorsLight.brandBase.withValues(alpha: .07),
              border: Border.all(
                color: AppColorsLight.brandBase.withValues(alpha: .16),
              ),
              borderRadius: AppRadius.input,
            ),
            child: const Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Icon(
                  Icons.verified_user_outlined,
                  color: AppColorsLight.brandBase,
                ),
                SizedBox(width: AppSpacing.sm),
                Expanded(
                  child: Text(
                    'This prototype presents administrative actions only. Live changes require verified authorization and an immutable audit record.',
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _ActivityRow extends StatelessWidget {
  const _ActivityRow({
    required this.icon,
    required this.color,
    required this.title,
    required this.detail,
    required this.time,
  });

  final IconData icon;
  final Color color;
  final String title;
  final String detail;
  final String time;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(AppSpacing.md),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          CircleAvatar(
            backgroundColor: color.withValues(alpha: .12),
            foregroundColor: color,
            child: Icon(icon),
          ),
          const SizedBox(width: AppSpacing.md),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: Theme.of(
                    context,
                  ).textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.w800),
                ),
                const SizedBox(height: AppSpacing.xxs),
                Text(detail, style: Theme.of(context).textTheme.bodySmall),
                const SizedBox(height: AppSpacing.xs),
                Text(time, style: Theme.of(context).textTheme.bodySmall),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
