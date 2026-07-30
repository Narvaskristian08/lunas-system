import 'package:flutter/material.dart';
import 'package:lunas_mobile/core/theme/app_colors.dart';
import 'package:lunas_mobile/core/theme/app_spacing.dart';
import 'package:lunas_mobile/core/widgets/lunas_card.dart';
import 'package:lunas_mobile/features/admin/presentation/screens/admin_routes.dart';
import 'package:lunas_mobile/features/admin/presentation/screens/admin_widgets.dart';

/// Account-review detail screen for an individual LUNAS user.
class UserDetailsScreen extends StatelessWidget {
  const UserDetailsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return AdminPage(
      title: 'User details',
      subtitle: 'Account review',
      showBackButton: true,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          LunasCard(
            child: Column(
              children: [
                const CircleAvatar(
                  radius: 36,
                  backgroundColor: Color(0xFFDCE6FF),
                  foregroundColor: AppColorsLight.brandBase,
                  child: Text(
                    'JD',
                    style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800),
                  ),
                ),
                const SizedBox(height: AppSpacing.sm),
                Text(
                  'Juan Dela Cruz',
                  style: Theme.of(
                    context,
                  ).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w800),
                ),
                const SizedBox(height: AppSpacing.xxs),
                const Text('ID: USR-DAG-9284'),
                const SizedBox(height: AppSpacing.sm),
                const AdminStatusPill(
                  label: 'Verified account',
                  color: AppColorsLight.success,
                  icon: Icons.verified_outlined,
                ),
                const SizedBox(height: AppSpacing.lg),
                Wrap(
                  alignment: WrapAlignment.center,
                  spacing: AppSpacing.sm,
                  runSpacing: AppSpacing.sm,
                  children: [
                    OutlinedButton.icon(
                      onPressed: () =>
                          Navigator.pushNamed(context, AdminRoutes.verifyUser),
                      icon: const Icon(Icons.fact_check_outlined),
                      label: const Text('Review ID'),
                    ),
                    OutlinedButton.icon(
                      onPressed: () => showAdminMessage(
                        context,
                        'Password-reset workflow is a prototype action.',
                      ),
                      icon: const Icon(Icons.lock_reset_outlined),
                      label: const Text('Reset access'),
                    ),
                    OutlinedButton.icon(
                      onPressed: () => showAdminMessage(
                        context,
                        'Access review opened for Juan Dela Cruz.',
                      ),
                      icon: const Icon(Icons.block_outlined),
                      label: const Text('Review access'),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: AppSpacing.xl),
          const AdminSectionTitle(title: 'Account information'),
          const SizedBox(height: AppSpacing.sm),
          LunasCard(
            child: const Column(
              children: [
                AdminDetailRow(
                  label: 'Email address',
                  value: 'juan.delacruz@decorp.ph',
                  icon: Icons.mail_outline_rounded,
                ),
                SizedBox(height: AppSpacing.lg),
                AdminDetailRow(
                  label: 'Contact number',
                  value: '+63 917 555 0198',
                  icon: Icons.call_outlined,
                ),
                SizedBox(height: AppSpacing.lg),
                AdminDetailRow(
                  label: 'Registered date',
                  value: '14 October 2026',
                  icon: Icons.calendar_today_outlined,
                ),
                SizedBox(height: AppSpacing.lg),
                AdminDetailRow(
                  label: 'Last login',
                  value: 'Today, 08:42 AM',
                  icon: Icons.history_rounded,
                ),
              ],
            ),
          ),
          const SizedBox(height: AppSpacing.xl),
          const AdminSectionTitle(title: 'Role and assignment'),
          const SizedBox(height: AppSpacing.sm),
          LunasCard(
            child: const Column(
              children: [
                AdminDetailRow(
                  label: 'Primary role',
                  value: 'Field technician',
                  icon: Icons.engineering_outlined,
                ),
                SizedBox(height: AppSpacing.lg),
                AdminDetailRow(
                  label: 'Department / agency',
                  value: 'Dagupan Electric Corporation',
                  icon: Icons.domain_outlined,
                ),
                SizedBox(height: AppSpacing.lg),
                AdminDetailRow(
                  label: 'Assigned zones',
                  value: 'North District • Central Hub',
                  icon: Icons.map_outlined,
                ),
                SizedBox(height: AppSpacing.lg),
                AdminDetailRow(
                  label: 'Clearance level',
                  value: 'Verified utility responder',
                  icon: Icons.verified_user_outlined,
                ),
              ],
            ),
          ),
          const SizedBox(height: AppSpacing.xl),
          const AdminSectionTitle(title: 'Identity verification'),
          const SizedBox(height: AppSpacing.sm),
          LunasCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const AdminStatusPill(
                  label: 'Government ID verified',
                  color: AppColorsLight.success,
                  icon: Icons.verified_rounded,
                ),
                const SizedBox(height: AppSpacing.sm),
                Text(
                  'Identity was verified from the submitted document on 14 October 2026.',
                  style: Theme.of(context).textTheme.bodySmall,
                ),
                const SizedBox(height: AppSpacing.md),
                const AdminVisualPlaceholder(
                  icon: Icons.badge_outlined,
                  label: 'Driver’s license document',
                  detail: 'Expires 10/2028',
                  color: AppColorsLight.brandBase,
                  height: 132,
                ),
                const SizedBox(height: AppSpacing.sm),
                TextButton.icon(
                  onPressed: () => showAdminMessage(
                    context,
                    'Document preview is not included in this static prototype.',
                  ),
                  icon: const Icon(Icons.zoom_in_rounded),
                  label: const Text('View submitted document'),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
