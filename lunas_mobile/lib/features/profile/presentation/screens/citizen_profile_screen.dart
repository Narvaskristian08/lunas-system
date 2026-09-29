import 'package:flutter/material.dart';
import 'package:lunas_mobile/core/theme/app_spacing.dart';
import 'package:lunas_mobile/core/widgets/citizen_scaffold.dart';
import 'package:lunas_mobile/features/auth/presentation/widgets/auth_scope.dart';
import 'package:lunas_mobile/features/profile/presentation/widgets/profile_widgets.dart';

class CitizenProfileScreen extends StatefulWidget {
  const CitizenProfileScreen({super.key});

  @override
  State<CitizenProfileScreen> createState() => _CitizenProfileScreenState();
}

class _CitizenProfileScreenState extends State<CitizenProfileScreen> {
  Future<void> _confirmLogout() async {
    final shouldLogout = await showDialog<bool>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: const Text('Sign out?'),
        content: const Text(
          'You will be signed out on this device.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogContext, false),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(dialogContext, true),
            child: const Text('Sign out'),
          ),
        ],
      ),
    );
    if (shouldLogout == true && mounted) await AuthScope.of(context).logout();
  }

  @override
  Widget build(BuildContext context) {
    final auth = AuthScope.of(context);
    final user = auth.user;
    final avatarInitial = user != null && user.firstName.isNotEmpty
        ? user.firstName[0].toUpperCase()
        : '?';
    return CitizenScaffold(
      title: 'Profile',
      subtitle: 'Your LUNAS citizen account',
      showReportFab: false,
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          ProfileHero(
            name: user?.fullName ?? 'Citizen',
            email: user?.email ?? '',
            role: 'Citizen account',
            initials: avatarInitial,
            imageUrl: user?.profileImage,
          ),
          const SizedBox(height: AppSpacing.md),
          ProfileSection(
            title: 'Account details',
            child: Column(
              children: [
                ProfileReadOnlyField(
                  label: 'First name',
                  value: user?.firstName ?? '',
                ),
                const SizedBox(height: AppSpacing.md),
                ProfileReadOnlyField(
                  label: 'Last name',
                  value: user?.lastName ?? '',
                ),
                const SizedBox(height: AppSpacing.md),
                ProfileReadOnlyField(
                  label: 'Mobile number',
                  value: user?.phone ?? '',
                ),
                const SizedBox(height: AppSpacing.md),
                ProfileReadOnlyField(
                  label: 'Address (optional)',
                  value: user?.address?['street']?.toString() ?? '',
                ),
                const SizedBox(height: AppSpacing.lg),
                OutlinedButton.icon(
                  onPressed: auth.isSubmitting ? null : _confirmLogout,
                  icon: const Icon(Icons.logout_rounded),
                  label: const Text('Sign out'),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
