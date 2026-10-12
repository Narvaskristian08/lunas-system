import 'package:flutter/material.dart';
import 'package:lunas_mobile/core/theme/app_spacing.dart';
import 'package:lunas_mobile/features/citizen/presentation/widgets/citizen_scaffold.dart';
import 'package:lunas_mobile/features/auth/presentation/widgets/auth_scope.dart';
import 'package:lunas_mobile/features/profile/presentation/widgets/profile_widgets.dart';

class CitizenProfileScreen extends StatefulWidget {
  const CitizenProfileScreen({super.key});

  @override
  State<CitizenProfileScreen> createState() => _CitizenProfileScreenState();
}

class _CitizenProfileScreenState extends State<CitizenProfileScreen> {
  Future<void> _editPhone() async {
    final auth = AuthScope.of(context);
    final user = auth.user;
    if (user == null) return;
    final controller = TextEditingController(text: user.phone);
    final key = GlobalKey<FormState>();
    bool saving = false;
    String? error;
    await showDialog<void>(
      context: context,
      barrierDismissible: false,
      builder: (dialogContext) => StatefulBuilder(
        builder: (context, update) => PopScope(
          canPop: !saving,
          child: AlertDialog(
            title: const Text('Mobile Number'),
            content: Form(
              key: key,
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  TextFormField(
                    controller: controller,
                    keyboardType: TextInputType.phone,
                    decoration: const InputDecoration(
                      labelText: 'Mobile Number',
                      hintText: '09171234567',
                    ),
                    validator: (value) =>
                        RegExp(
                          r'^(\+639|09)\d{9}$',
                        ).hasMatch((value ?? '').replaceAll(RegExp(r'\s+'), ''))
                        ? null
                        : 'Enter a valid Philippine mobile number.',
                  ),
                  if (error != null)
                    Padding(
                      padding: const EdgeInsets.only(top: 12),
                      child: Text(
                        error!,
                        style: TextStyle(
                          color: Theme.of(context).colorScheme.error,
                        ),
                      ),
                    ),
                ],
              ),
            ),
            actions: [
              TextButton(
                onPressed: saving ? null : () => Navigator.pop(dialogContext),
                child: const Text('Cancel'),
              ),
              FilledButton(
                onPressed: saving
                    ? null
                    : () async {
                        if (!key.currentState!.validate()) return;
                        update(() {
                          saving = true;
                          error = null;
                        });
                        final success = await auth.updateProfile(
                          firstName: user.firstName,
                          lastName: user.lastName,
                          phone: controller.text.replaceAll(RegExp(r'\s+'), ''),
                        );
                        if (!dialogContext.mounted) return;
                        if (success) {
                          Navigator.pop(dialogContext);
                        } else {
                          update(() {
                            saving = false;
                            error =
                                auth.message ?? 'Could not save mobile number.';
                          });
                        }
                      },
                child: Text(saving ? 'Saving…' : 'Save'),
              ),
            ],
          ),
        ),
      ),
    );
    // Dispose after the dialog's closing animation releases the input.
    await Future<void>.delayed(const Duration(milliseconds: 300));
    controller.dispose();
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
    return CitizenScaffold(
      title: 'My Profile',
      subtitle: 'View your account details.',
      showReportFab: false,
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          ProfileHero(
            name: user?.fullName ?? 'Citizen',
            email: user?.email ?? '',
            role: 'Citizen Account',
            initials: avatarInitial,
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
                Align(
                  alignment: Alignment.centerLeft,
                  child: TextButton(
                    onPressed: auth.isSubmitting ? null : _editPhone,
                    child: Text(
                      (user?.phone.isEmpty ?? true)
                          ? 'Add Mobile Number'
                          : 'Update Mobile Number',
                    ),
                  ),
                ),
                const SizedBox(height: AppSpacing.md),
                ProfileReadOnlyField(
                  label: 'Address',
                  value: user?.address?['street']?.toString() ?? '',
                ),
              ],
            ),
          ),
          const SizedBox(height: AppSpacing.xl),
          OutlinedButton.icon(
            onPressed: auth.isSubmitting ? null : _confirmLogout,
            icon: const Icon(Icons.logout_rounded, size: 20),
            label: const Text('Sign Out'),
          ),
        ],
      ),
    );
  }
}
