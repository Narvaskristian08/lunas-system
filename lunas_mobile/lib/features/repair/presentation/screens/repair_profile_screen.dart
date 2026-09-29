import 'package:flutter/material.dart';
import 'package:lunas_mobile/core/theme/app_spacing.dart';
import 'package:lunas_mobile/features/auth/domain/auth_role_policy.dart';
import 'package:lunas_mobile/features/auth/presentation/widgets/auth_scope.dart';
import 'package:lunas_mobile/features/repair/presentation/screens/repair_widgets.dart';
import 'package:lunas_mobile/features/profile/presentation/widgets/profile_widgets.dart';

/// Account controls for the repair workspace. Profile edits
/// continue to use the established authenticated account flow.
class RepairProfileScreen extends StatefulWidget {
  const RepairProfileScreen({super.key});

  @override
  State<RepairProfileScreen> createState() => _RepairProfileScreenState();
}

class _RepairProfileScreenState extends State<RepairProfileScreen> {
  final _formKey = GlobalKey<FormState>();
  final _firstNameController = TextEditingController();
  final _lastNameController = TextEditingController();
  final _phoneController = TextEditingController();
  bool _initialized = false;

  @override
  void dispose() {
    _firstNameController.dispose();
    _lastNameController.dispose();
    _phoneController.dispose();
    super.dispose();
  }

  void _initialize() {
    if (_initialized) return;
    final user = AuthScope.of(context).user;
    _firstNameController.text = user?.firstName ?? '';
    _lastNameController.text = user?.lastName ?? '';
    _phoneController.text = user?.phone ?? '';
    _initialized = true;
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    final auth = AuthScope.of(context);
    final saved = await auth.updateProfile(
      firstName: _firstNameController.text.trim(),
      lastName: _lastNameController.text.trim(),
      phone: _phoneController.text.replaceAll(RegExp(r'\s+'), ''),
    );
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          saved
              ? 'Account details updated.'
              : auth.message ?? 'Could not update account details.',
        ),
      ),
    );
  }

  Future<void> _signOut() async {
    final confirmed = await showDialog<bool>(
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
    if (confirmed == true && mounted) await AuthScope.of(context).logout();
  }

  @override
  Widget build(BuildContext context) {
    _initialize();
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
      selectedNavigationIndex: 2,
      child: Form(
        key: _formKey,
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
                  TextFormField(
                    controller: _firstNameController,
                    textCapitalization: TextCapitalization.words,
                    decoration: const InputDecoration(labelText: 'First name'),
                    validator: (value) => value == null || value.trim().isEmpty
                        ? 'Enter your first name.'
                        : null,
                  ),
                  const SizedBox(height: AppSpacing.md),
                  TextFormField(
                    controller: _lastNameController,
                    textCapitalization: TextCapitalization.words,
                    decoration: const InputDecoration(labelText: 'Last name'),
                    validator: (value) => value == null || value.trim().isEmpty
                        ? 'Enter your last name.'
                        : null,
                  ),
                  const SizedBox(height: AppSpacing.md),
                  TextFormField(
                    controller: _phoneController,
                    keyboardType: TextInputType.phone,
                    decoration: const InputDecoration(
                      labelText: 'Mobile number',
                    ),
                    validator: (value) =>
                        RegExp(
                          r'^(\+639|09)\d{9}$',
                        ).hasMatch(value?.replaceAll(RegExp(r'\s+'), '') ?? '')
                        ? null
                        : 'Enter a valid Philippine mobile number.',
                  ),
                  const SizedBox(height: AppSpacing.lg),
                  FilledButton.icon(
                    onPressed: auth.isSubmitting ? null : _save,
                    icon: const Icon(Icons.save_outlined),
                    label: const Text('Save account details'),
                  ),
                  const SizedBox(height: AppSpacing.sm),
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
      ),
    );
  }
}
