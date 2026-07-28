import 'package:flutter/material.dart';
import 'package:lunas_mobile/core/theme/app_colors.dart';
import 'package:lunas_mobile/core/theme/app_spacing.dart';
import 'package:lunas_mobile/core/widgets/lunas_app_bar.dart';
import 'package:lunas_mobile/core/widgets/lunas_card.dart';
import 'package:lunas_mobile/features/profile/presentation/widgets/profile_widgets.dart';

class SettingsScreen extends StatelessWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: const LunasAppBar(
        title: 'Settings',
        subtitle: 'Manage your LUNAS experience',
        showBackButton: true,
      ),
      body: SafeArea(
        top: false,
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(
            AppSpacing.xl,
            AppSpacing.md,
            AppSpacing.xl,
            AppSpacing.hero,
          ),
          child: Align(
            alignment: Alignment.topCenter,
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 680),
              child: Column(
                children: [
                  LunasCard(
                    padding: EdgeInsets.zero,
                    child: Column(
                      children: [
                        ProfileMenuTile(
                          icon: Icons.person_outline,
                          title: 'Account',
                          subtitle: 'Personal details and account data',
                          onTap: () =>
                              Navigator.pushNamed(context, '/settings/account'),
                        ),
                        const Divider(height: 1),
                        ProfileMenuTile(
                          icon: Icons.security_outlined,
                          title: 'Security',
                          subtitle: 'Password and authentication',
                          onTap: () => Navigator.pushNamed(
                            context,
                            '/settings/security',
                          ),
                        ),
                        const Divider(height: 1),
                        ProfileMenuTile(
                          icon: Icons.tune_rounded,
                          title: 'Preferences',
                          subtitle: 'Notifications and display options',
                          onTap: () => Navigator.pushNamed(
                            context,
                            '/settings/preferences',
                          ),
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
                          icon: Icons.help_outline,
                          title: 'Help',
                          subtitle: 'Get answers and contact support',
                          onTap: () =>
                              Navigator.pushNamed(context, '/settings/help'),
                        ),
                        const Divider(height: 1),
                        ProfileMenuTile(
                          icon: Icons.info_outline,
                          title: 'About',
                          subtitle: 'App information and policies',
                          onTap: () =>
                              Navigator.pushNamed(context, '/settings/about'),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: AppSpacing.md),
                  LunasCard(
                    padding: EdgeInsets.zero,
                    child: ProfileMenuTile(
                      icon: Icons.logout_rounded,
                      title: 'Sign Out',
                      subtitle: 'Sign out of your LUNAS account',
                      color: AppColorsLight.critical,
                      onTap: () => Navigator.pushNamedAndRemoveUntil(
                        context,
                        '/login',
                        (_) => false,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
