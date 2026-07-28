import 'package:flutter/material.dart';
import 'package:lunas_mobile/core/theme/app_colors.dart';
import 'package:lunas_mobile/core/theme/app_spacing.dart';
import 'package:lunas_mobile/core/widgets/lunas_app_scaffold.dart';
import 'package:lunas_mobile/core/widgets/lunas_card.dart';
import 'package:lunas_mobile/features/profile/presentation/widgets/profile_widgets.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return LunasAppScaffold(
      title: 'Profile',
      subtitle: 'Your LUNAS citizen account',
      selectedIndex: 4,
      actions: [
        IconButton(
          onPressed: () => Navigator.pushNamed(context, '/settings'),
          tooltip: 'Settings',
          icon: const Icon(Icons.settings_outlined),
        ),
        const SizedBox(width: AppSpacing.sm),
      ],
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          LunasCard(
            child: Column(
              children: [
                const ProfileAvatar(),
                const SizedBox(height: AppSpacing.md),
                Text(
                  'Alex Dela Cruz',
                  style: Theme.of(context).textTheme.headlineLarge?.copyWith(
                    fontSize: 25,
                    fontWeight: FontWeight.w800,
                  ),
                ),
                Text(
                  'alex.delacruz@example.com',
                  style: Theme.of(context).textTheme.bodySmall,
                ),
                const SizedBox(height: AppSpacing.sm),
                const Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(
                      Icons.verified_rounded,
                      size: 18,
                      color: AppColorsLight.success,
                    ),
                    SizedBox(width: AppSpacing.xs),
                    Text('Verified Citizen'),
                  ],
                ),
                const SizedBox(height: AppSpacing.md),
                OutlinedButton.icon(
                  onPressed: () =>
                      Navigator.pushNamed(context, '/profile/edit'),
                  icon: const Icon(Icons.edit_outlined, size: 18),
                  label: const Text('Edit Profile'),
                ),
              ],
            ),
          ),
          const SizedBox(height: AppSpacing.xxl),
          Text(
            'Account Settings',
            style: Theme.of(
              context,
            ).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w800),
          ),
          const SizedBox(height: AppSpacing.sm),
          LunasCard(
            padding: EdgeInsets.zero,
            child: Column(
              children: [
                ProfileMenuTile(
                  icon: Icons.person_outline_rounded,
                  title: 'Account',
                  subtitle: 'Personal information and contact details',
                  onTap: () =>
                      Navigator.pushNamed(context, '/settings/account'),
                ),
                const Divider(height: 1),
                ProfileMenuTile(
                  icon: Icons.lock_outline_rounded,
                  title: 'Security',
                  subtitle: 'Password and account protection',
                  onTap: () =>
                      Navigator.pushNamed(context, '/settings/security'),
                ),
                const Divider(height: 1),
                ProfileMenuTile(
                  icon: Icons.tune_rounded,
                  title: 'Preferences',
                  subtitle: 'Notifications and app preferences',
                  onTap: () =>
                      Navigator.pushNamed(context, '/settings/preferences'),
                ),
              ],
            ),
          ),
          const SizedBox(height: AppSpacing.md),
          LunasCard(
            padding: EdgeInsets.zero,
            child: Column(
              children: [
                ProfileMenuTile(
                  icon: Icons.help_outline_rounded,
                  title: 'Help & Support',
                  subtitle: 'FAQs and contact support',
                  onTap: () => Navigator.pushNamed(context, '/settings/help'),
                ),
                const Divider(height: 1),
                ProfileMenuTile(
                  icon: Icons.info_outline_rounded,
                  title: 'About LUNAS',
                  subtitle: 'Version, policies, and information',
                  onTap: () => Navigator.pushNamed(context, '/settings/about'),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
