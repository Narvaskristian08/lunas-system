import 'package:flutter/material.dart';
import 'package:lunas_mobile/core/theme/app_spacing.dart';
import 'package:lunas_mobile/core/widgets/lunas_app_bar.dart';
import 'package:lunas_mobile/core/widgets/lunas_button.dart';
import 'package:lunas_mobile/core/widgets/lunas_text_field.dart';
import 'package:lunas_mobile/features/profile/presentation/widgets/profile_widgets.dart';
import 'package:lunas_mobile/features/auth/presentation/widgets/auth_scope.dart';

class EditProfileScreen extends StatefulWidget {
  const EditProfileScreen({super.key});

  @override
  State<EditProfileScreen> createState() => _EditProfileScreenState();
}

class _EditProfileScreenState extends State<EditProfileScreen> {
  final _formKey = GlobalKey<FormState>();
  final _name = TextEditingController();
  final _email = TextEditingController();
  final _phone = TextEditingController();
  final _address = TextEditingController();
  bool _saving = false;
  bool _initialized = false;

  @override
  void dispose() {
    _name.dispose();
    _email.dispose();
    _phone.dispose();
    _address.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    final auth = AuthScope.of(context);
    final parts = _name.text.trim().split(RegExp(r'\s+'));
    final firstName = parts.isEmpty ? '' : parts.first;
    final lastName = parts.length > 1 ? parts.sublist(1).join(' ') : '';
    setState(() => _saving = true);
    final success = await auth.updateProfile(
      firstName: firstName,
      lastName: lastName,
      phone: _phone.text.replaceAll(RegExp(r'\s+'), ''),
      address: _address.text.trim(),
    );
    if (!mounted) return;
    setState(() => _saving = false);
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          success
              ? 'Profile updated.'
              : auth.message ?? 'Could not update profile.',
        ),
      ),
    );
    if (success) Navigator.pop(context);
  }

  @override
  Widget build(BuildContext context) {
    if (!_initialized) {
      final user = AuthScope.of(context).user;
      _name.text = user?.fullName ?? '';
      _email.text = user?.email ?? '';
      _phone.text = user?.phone ?? '';
      _address.text = user?.address?['street']?.toString() ?? '';
      _initialized = true;
    }
    return Scaffold(
      appBar: const LunasAppBar(
        title: 'Edit Profile',
        subtitle: 'Update your personal information',
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
              constraints: const BoxConstraints(maxWidth: 540),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    const Center(child: ProfileAvatar(radius: 48)),
                    const SizedBox(height: AppSpacing.sm),
                    TextButton.icon(
                      onPressed: () =>
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                              content: Text('Photo selector opened.'),
                            ),
                          ),
                      icon: const Icon(Icons.camera_alt_outlined),
                      label: const Text('Change Photo'),
                    ),
                    const SizedBox(height: AppSpacing.xl),
                    LunasTextField(
                      controller: _name,
                      label: 'Full Name',
                      prefixIcon: Icons.person_outline_rounded,
                      validator: (value) => (value?.trim().length ?? 0) < 2
                          ? 'Enter your full name'
                          : null,
                    ),
                    const SizedBox(height: AppSpacing.md),
                    LunasTextField(
                      controller: _email,
                      label: 'Email Address',
                      prefixIcon: Icons.mail_outline_rounded,
                      keyboardType: TextInputType.emailAddress,
                      validator: (value) => (value?.contains('@') ?? false)
                          ? null
                          : 'Enter a valid email',
                    ),
                    const SizedBox(height: AppSpacing.md),
                    LunasTextField(
                      controller: _phone,
                      label: 'Mobile Number',
                      prefixIcon: Icons.phone_outlined,
                      keyboardType: TextInputType.phone,
                      validator: (value) =>
                          RegExp(r'^(\+639|09)\d{9}$').hasMatch(
                            value?.replaceAll(RegExp(r'\s+'), '') ?? '',
                          )
                          ? null
                          : 'Enter a valid mobile number',
                    ),
                    const SizedBox(height: AppSpacing.md),
                    LunasTextField(
                      controller: _address,
                      label: 'Address',
                      prefixIcon: Icons.location_on_outlined,
                    ),
                    const SizedBox(height: AppSpacing.xl),
                    LunasButton(
                      label: 'Save Changes',
                      isLoading: _saving,
                      onPressed: _save,
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
