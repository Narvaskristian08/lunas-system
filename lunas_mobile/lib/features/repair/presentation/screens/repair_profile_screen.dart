import 'package:flutter/material.dart';
import 'package:lunas_mobile/core/theme/app_spacing.dart';
import 'package:lunas_mobile/features/auth/domain/auth_role_policy.dart';
import 'package:lunas_mobile/features/auth/presentation/widgets/auth_scope.dart';
import 'package:lunas_mobile/features/repair/presentation/screens/repair_widgets.dart';
import 'package:lunas_mobile/features/profile/presentation/widgets/profile_widgets.dart';

/// Read-only account information for the repair workspace.
class RepairProfileScreen extends StatefulWidget {
  const RepairProfileScreen({super.key});

  @override
  State<RepairProfileScreen> createState() => _RepairProfileScreenState();
}

class _RepairProfileScreenState extends State<RepairProfileScreen> {
  Future<void> _signOut() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: const Text('Sign out?'),
        content: const Text('You will be signed out on this device.'),
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
    if (confirmed == true && mounted) await AuthScope.of(context).logout();
  }

  @override
  Widget build(BuildContext context) {
    final auth = AuthScope.of(context);
    final user = auth.user;
    final initial = user?.firstName.trim().isNotEmpty == true
        ? user!.firstName.trim().substring(0, 1).toUpperCase()
        : '?';
    return RepairPage(
      appBar: const RepairAppBar(
        title: 'Repair account',
        subtitle: 'Profile and account access',
      ),
      selectedNavigationIndex: 3,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          ProfileHero(
            name: user?.fullName ?? 'Repair personnel',
            email: user?.email ?? '',
            role: roleLabel(user?.role ?? 'repair_personnel'),
            initials: initial,
            imageUrl: user?.profileImage,
          ),
          const SizedBox(height: AppSpacing.md),
          if (user?.barangay?.trim().isNotEmpty == true)
            Padding(
              padding: const EdgeInsets.only(bottom: AppSpacing.md),
              child: Text('Assigned barangay: ${user!.barangay}'),
            ),
          ProfileSection(
            title: 'Account details',
            icon: Icons.engineering_outlined,
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
                const SizedBox(height: AppSpacing.lg),
                OutlinedButton.icon(
                  onPressed: auth.isSubmitting ? null : _signOut,
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
