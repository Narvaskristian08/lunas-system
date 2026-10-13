import 'package:lunas_mobile/core/widgets/lunas_confirmation_dialog.dart';
import 'package:lunas_mobile/core/theme/app_radius.dart';
import 'package:lunas_mobile/features/profile/presentation/screens/change_password_screen.dart';
import 'package:lunas_mobile/core/widgets/lunas_button.dart';
import 'package:lunas_mobile/features/profile/presentation/screens/edit_citizen_profile_screen.dart';
import 'package:flutter/material.dart';
import 'package:lunas_mobile/core/theme/app_spacing.dart';
import 'package:lunas_mobile/features/citizen/presentation/widgets/citizen_scaffold.dart';
import 'package:lunas_mobile/features/auth/presentation/widgets/auth_scope.dart';
import 'package:lunas_mobile/features/profile/presentation/widgets/profile_widgets.dart';
import 'package:lunas_mobile/features/profile/presentation/utils/phone_number_formatter.dart';

class CitizenProfileScreen extends StatefulWidget {
  const CitizenProfileScreen({super.key});

  @override
  State<CitizenProfileScreen> createState() => _CitizenProfileScreenState();
}

class _CitizenProfileScreenState extends State<CitizenProfileScreen> {
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
              'Could not refresh profile details. Please try again later.',
            ),
          ),
        );
      }
    });
  }

  Future<void> _confirmLogout() async {
    final shouldLogout = await showDialog<bool>(
      context: context,
      builder: (dialogContext) => LunasConfirmationDialog(
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
    return CitizenScaffold(
      backgroundColor: Colors.white,
      title: 'My Profile',
      subtitle: 'Manage your details and security.',
      showReportFab: false,

      body: Column(
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
                      user?.fullName ?? 'Citizen',
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
              Container(
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: const Color(0xFFE2E8F0)),
                ),
                clipBehavior: Clip.antiAlias,
                child: Padding(
                  padding: const EdgeInsets.symmetric(
                    horizontal: AppSpacing.sm,
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Padding(
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        child: Text(
                          'Personal Details',
                          style: Theme.of(context).textTheme.titleSmall
                              ?.copyWith(fontWeight: FontWeight.w600),
                        ),
                      ),
                      const Divider(height: 1, color: Color(0xFFE2E8F0)),
                      _ProfileDetail(
                        label: 'First Name',
                        value: user?.firstName ?? '',
                      ),
                      if (user?.middleName?.isNotEmpty ?? false)
                        _ProfileDetail(
                          label: 'Middle Name',
                          value: user!.middleName!,
                        ),
                      _ProfileDetail(
                        label: 'Last Name',
                        value: user?.lastName ?? '',
                      ),
                      if (user?.suffix?.isNotEmpty ?? false)
                        _ProfileDetail(label: 'Suffix', value: user!.suffix!),
                      _ProfileDetail(
                        label: 'Mobile Number',
                        value: formatPhilippineMobileNumber(user?.phone ?? ''),
                      ),
                      _ProfileDetail(
                        label: 'Address',
                        value: user?.address?['street']?.toString() ?? '',
                        last: true,
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: AppSpacing.lg),
              LunasButton(
                label: 'Edit Personal Details',
                onPressed: auth.isSubmitting
                    ? null
                    : () => Navigator.of(context, rootNavigator: true).push(
                        MaterialPageRoute<void>(
                          builder: (_) => const EditCitizenProfileScreen(),
                        ),
                      ),
              ),
              const SizedBox(height: AppSpacing.sm),
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
        child: LayoutBuilder(
          builder: (context, constraints) {
            final stack =
                constraints.maxWidth < 320 ||
                MediaQuery.textScalerOf(context).scale(14) >= 19;
            final labelText = Text(
              label,
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: Theme.of(context).colorScheme.onSurfaceVariant,
              ),
            );
            final displayValue = value.trim().isEmpty ? 'Not provided' : value;
            final valueText = Text(
              displayValue,
              textAlign: stack ? TextAlign.left : TextAlign.right,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: Theme.of(context).colorScheme.onSurface,
                fontWeight: value.trim().isEmpty
                    ? FontWeight.normal
                    : FontWeight.w500,
                height: 1.4,
              ),
            );
            if (stack) {
              return Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  labelText,
                  const SizedBox(height: AppSpacing.xxs),
                  valueText,
                ],
              );
            }
            return Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(flex: 2, child: labelText),
                const SizedBox(width: 12),
                Expanded(flex: 3, child: valueText),
              ],
            );
          },
        ),
      ),
      if (!last) const Divider(height: 1, color: Color(0xFFF1F5F9)),
    ],
  );
}
