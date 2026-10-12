import 'package:lunas_mobile/core/theme/app_radius.dart';
import 'package:lunas_mobile/features/profile/presentation/screens/change_password_screen.dart';
import 'package:flutter/material.dart';
import 'package:lunas_mobile/core/theme/app_spacing.dart';
import 'package:lunas_mobile/features/repair/presentation/widgets/repair_widgets.dart';
import 'package:lunas_mobile/core/widgets/lunas_app_bar.dart';
import 'package:lunas_mobile/features/auth/presentation/widgets/auth_scope.dart';
import 'package:lunas_mobile/features/profile/presentation/widgets/profile_widgets.dart';

class RepairProfileScreen extends StatefulWidget {
  const RepairProfileScreen({super.key});

  @override
  State<RepairProfileScreen> createState() => _RepairProfileScreenState();
}

class _RepairProfileScreenState extends State<RepairProfileScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) async {
      if (!mounted) return;
      final refreshed = await AuthScope.of(context).refreshProfile();
      if (!refreshed && mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text(
              'Could not refresh account details. Please try again later.',
            ),
          ),
        );
      }
    });
  }

  Future<void> _confirmLogout() async {
    final shouldLogout = await showDialog<bool>(
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
    if (shouldLogout == true && mounted) await AuthScope.of(context).logout();
  }

  @override
  Widget build(BuildContext context) {
    final auth = AuthScope.of(context);
    final user = auth.user;
    final avatarInitial = user != null && user.firstName.isNotEmpty
        ? user.firstName[0].toUpperCase()
        : '?';
    return RepairPage(
      backgroundColor: Colors.white,
      appBar: const LunasAppBar(
        title: 'My Profile',
        subtitle: 'View your account details and security.',
      ),
      selectedNavigationIndex: 3,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const SizedBox(height: AppSpacing.xs),
          Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Padding(
                padding: const EdgeInsets.symmetric(vertical: AppSpacing.xxs),
                child: Column(
                  children: [
                    ProfileAvatar(
                      radius: 36,
                      initials: avatarInitial,
                      imageUrl: user?.profileImage,
                    ),
                    const SizedBox(height: AppSpacing.sm),
                    Text(
                      user?.fullName ?? 'Repair Personnel',
                      textAlign: TextAlign.center,
                      style: Theme.of(context).textTheme.titleLarge?.copyWith(
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const SizedBox(height: AppSpacing.xxs),
                    Text(
                      user?.email ?? '',
                      textAlign: TextAlign.center,
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: Theme.of(context).colorScheme.onSurfaceVariant,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: AppSpacing.lg),
              Theme(
                data: Theme.of(
                  context,
                ).copyWith(dividerColor: Colors.transparent),
                child: ExpansionTile(
                  key: const PageStorageKey('repair-personal-details'),
                  initiallyExpanded: false,
                  collapsedBackgroundColor: Colors.white,
                  backgroundColor: Colors.white,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                    side: const BorderSide(color: Color(0xFFE2E8F0)),
                  ),
                  collapsedShape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                    side: const BorderSide(color: Color(0xFFE2E8F0)),
                  ),
                  clipBehavior: Clip.antiAlias,
                  tilePadding: const EdgeInsets.symmetric(
                    horizontal: AppSpacing.sm,
                  ),
                  childrenPadding: const EdgeInsets.symmetric(
                    horizontal: AppSpacing.sm,
                  ),
                  title: Text(
                    'Account Details',
                    style: Theme.of(context).textTheme.titleSmall?.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  children: [
                    const Divider(height: 1, color: Color(0xFFE2E8F0)),
                    _ProfileDetail(
                      label: 'Utility Provider',
                      value: user?.repairOrganization ?? '',
                    ),
                    _ProfileDetail(
                      label: 'Account Type',
                      value: user?.repairAccountType == 'team'
                          ? 'Team Leader'
                          : 'Individual',
                    ),
                    if (user?.repairAccountType == 'team')
                      _ProfileDetail(
                        label: 'Team Name',
                        value: user?.repairTeam ?? '',
                      ),
                    _ProfileDetail(
                      label: 'First Name',
                      value: user?.firstName ?? '',
                    ),
                    if (user?.middleName?.trim().isNotEmpty ?? false)
                      _ProfileDetail(
                        label: 'Middle Name',
                        value: user!.middleName!,
                      ),
                    _ProfileDetail(
                      label: 'Last Name',
                      value: user?.lastName ?? '',
                    ),
                    if (user?.suffix?.trim().isNotEmpty ?? false)
                      _ProfileDetail(label: 'Suffix', value: user!.suffix!),
                    _ProfileDetail(
                      label: 'Email Address',
                      value: user?.email ?? '',
                    ),
                    _ProfileDetail(
                      label: 'Contact Number',
                      value: user?.phone ?? '',
                      last: true,
                    ),
                  ],
                ),
              ),
              const SizedBox(height: AppSpacing.sm),
              SizedBox(
                width: double.infinity,
                child: DecoratedBox(
                  decoration: BoxDecoration(
                    color: const Color(0xFFF7F8FA),
                    borderRadius: BorderRadius.circular(24),
                  ),
                  child: Padding(
                    padding: const EdgeInsets.only(right: 16),
                    child: Row(
                      mainAxisSize: MainAxisSize.max,
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        IconButton(
                          tooltip:
                              'Contact your utility provider to request corrections.',
                          icon: const Icon(
                            Icons.info_outline_rounded,
                            size: 18,
                          ),
                          color: Theme.of(context).colorScheme.onSurfaceVariant,
                          onPressed: () => showDialog<void>(
                            context: context,
                            builder: (dialogContext) => AlertDialog(
                              title: const Text('Provider-Managed Account'),
                              content: const Text(
                                'Your account details are managed by your utility provider. Contact them to request corrections.',
                              ),
                              actions: [
                                TextButton(
                                  onPressed: () => Navigator.pop(dialogContext),
                                  child: const Text('Got It'),
                                ),
                              ],
                            ),
                          ),
                        ),
                        Flexible(
                          child: Text(
                            'Managed by your utility provider',
                            textAlign: TextAlign.center,
                            style: Theme.of(context).textTheme.bodySmall
                                ?.copyWith(
                                  color: Theme.of(
                                    context,
                                  ).colorScheme.onSurfaceVariant,
                                ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
              const SizedBox(height: AppSpacing.lg),
              SizedBox(
                height: 54,
                child: OutlinedButton(
                  style: OutlinedButton.styleFrom(
                    shape: RoundedRectangleBorder(
                      borderRadius: AppRadius.button,
                    ),
                  ),
                  onPressed: auth.isSubmitting
                      ? null
                      : () => Navigator.of(context, rootNavigator: true).push(
                          MaterialPageRoute<void>(
                            builder: (_) => const ChangePasswordScreen(),
                          ),
                        ),
                  child: const Text('Change Password'),
                ),
              ),
              const SizedBox(height: AppSpacing.lg),
              SizedBox(
                height: 54,
                child: TextButton.icon(
                  style: TextButton.styleFrom(
                    shape: RoundedRectangleBorder(
                      borderRadius: AppRadius.button,
                    ),
                  ),
                  onPressed: auth.isSubmitting ? null : _confirmLogout,
                  icon: const Icon(Icons.logout_rounded, size: 20),
                  label: const Text('Sign Out'),
                ),
              ),
              const SizedBox(height: AppSpacing.xl),
            ],
          ),
        ],
      ),
    );
  }
}

class _ProfileDetail extends StatelessWidget {
  const _ProfileDetail({
    required this.label,
    required this.value,
    this.last = false,
  });
  final String label;
  final String value;
  final bool last;
  @override
  Widget build(BuildContext context) => Column(
    children: [
      Padding(
        padding: const EdgeInsets.symmetric(vertical: 14),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              flex: 2,
              child: Text(
                label,
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: Theme.of(context).colorScheme.onSurfaceVariant,
                ),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              flex: 3,
              child: Text(
                value.trim().isEmpty ? 'Not provided' : value,
                textAlign: TextAlign.right,
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  fontWeight: value.trim().isEmpty
                      ? FontWeight.normal
                      : FontWeight.w500,
                  height: 1.4,
                ),
              ),
            ),
          ],
        ),
      ),
      if (!last) const Divider(height: 1, color: Color(0xFFF1F5F9)),
    ],
  );
}
