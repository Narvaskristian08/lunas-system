import 'package:lunas_mobile/core/widgets/lunas_app_bar.dart';
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
        title: const Text('Sign Out?'),
        content: const Text('You will be signed out on this device.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogContext, false),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(dialogContext, true),
            child: const Text('Sign Out'),
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
      appBar: const LunasAppBar(
        title: 'My Profile',
        subtitle: 'View your account details.',
      ),
      selectedNavigationIndex: 3,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          ProfileHero(
            name: user?.fullName ?? 'Repair Personnel',
            email: user?.email ?? '',
            role: roleLabel(user?.role ?? 'repair_personnel'),
            initials: initial,
            imageUrl: user?.profileImage,
          ),
          const SizedBox(height: AppSpacing.md),
          ProfileSection(
            title: 'Account Details',
            child: Column(
              children: [
                ProfileReadOnlyField(
                  label: 'First Name',
                  value: user?.firstName ?? '',
                ),
                const SizedBox(height: AppSpacing.md),
                ProfileReadOnlyField(
                  label: 'Last Name',
                  value: user?.lastName ?? '',
                ),
                const SizedBox(height: AppSpacing.md),
                ProfileReadOnlyField(
                  label: 'Mobile Number',
                  value: user?.phone ?? '',
                ),
                const SizedBox(height: AppSpacing.md),
                ProfileReadOnlyField(
                  label: 'Address',
                  value: user?.address?['street']?.toString() ?? '',
                ),
                if (user?.barangay?.trim().isNotEmpty == true) ...[
                  const SizedBox(height: AppSpacing.md),
                  ProfileReadOnlyField(
                    label: 'Assigned Barangay',
                    value: user!.barangay!,
                  ),
                ],
              ],
            ),
          ),
          const SizedBox(height: AppSpacing.xl),
          OutlinedButton.icon(
            onPressed: auth.isSubmitting ? null : _signOut,
            icon: const Icon(Icons.logout_rounded, size: 20),
            label: const Text('Sign Out'),
          ),
        ],
      ),
    );
  }
}
