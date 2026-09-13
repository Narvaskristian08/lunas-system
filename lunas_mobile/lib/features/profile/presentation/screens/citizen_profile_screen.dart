import 'package:flutter/material.dart';
import 'package:lunas_mobile/core/theme/app_spacing.dart';
import 'package:lunas_mobile/core/widgets/citizen_scaffold.dart';
import 'package:lunas_mobile/core/widgets/lunas_button.dart';
import 'package:lunas_mobile/features/auth/presentation/widgets/auth_scope.dart';
import 'package:lunas_mobile/features/profile/presentation/widgets/profile_widgets.dart';

class CitizenProfileScreen extends StatefulWidget {
  const CitizenProfileScreen({super.key});

  @override
  State<CitizenProfileScreen> createState() => _CitizenProfileScreenState();
}

class _CitizenProfileScreenState extends State<CitizenProfileScreen> {
  final _formKey = GlobalKey<FormState>();
  final _firstNameController = TextEditingController();
  final _lastNameController = TextEditingController();
  final _phoneController = TextEditingController();
  final _addressController = TextEditingController();
  bool _initialized = false;

  @override
  void dispose() {
    _firstNameController.dispose();
    _lastNameController.dispose();
    _phoneController.dispose();
    _addressController.dispose();
    super.dispose();
  }

  void _initialize() {
    if (_initialized) return;
    final user = AuthScope.of(context).user;
    _firstNameController.text = user?.firstName ?? '';
    _lastNameController.text = user?.lastName ?? '';
    _phoneController.text = user?.phone ?? '';
    _addressController.text = user?.address?['street']?.toString() ?? '';
    _initialized = true;
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    final auth = AuthScope.of(context);
    final success = await auth.updateProfile(
      firstName: _firstNameController.text.trim(),
      lastName: _lastNameController.text.trim(),
      phone: _phoneController.text.replaceAll(RegExp(r'\s+'), ''),
      address: _addressController.text.trim(),
    );
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          success
              ? 'Profile updated.'
              : auth.message ?? 'Could not update profile.',
        ),
      ),
    );
  }

  Future<void> _confirmLogout() async {
    final shouldLogout = await showDialog<bool>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: const Text('Sign out?'),
        content: const Text(
          'Your secure session will be removed from this device.',
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
    _initialize();
    final auth = AuthScope.of(context);
    final user = auth.user;
    final avatarInitial = user != null && user.firstName.isNotEmpty
        ? user.firstName[0].toUpperCase()
        : '?';
    return CitizenScaffold(
      title: 'Profile',
      subtitle: 'Your LUNAS citizen account',
      showReportFab: false,
      body: Form(
        key: _formKey,
        child: Column(
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
                  const SizedBox(height: AppSpacing.md),
                  TextFormField(
                    controller: _addressController,
                    textCapitalization: TextCapitalization.words,
                    decoration: const InputDecoration(
                      labelText: 'Address (optional)',
                      hintText: 'Street or area only',
                    ),
                  ),
                  const SizedBox(height: AppSpacing.lg),
                  LunasButton(
                    label: 'Save profile',
                    isLoading: auth.isSubmitting,
                    onPressed: auth.isSubmitting ? null : _save,
                  ),
                  const SizedBox(height: AppSpacing.sm),
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
      ),
    );
  }
}
