import 'package:flutter/material.dart';
import 'package:lunas_mobile/core/theme/app_spacing.dart';
import 'package:lunas_mobile/core/widgets/lunas_app_bar.dart';
import 'package:lunas_mobile/core/widgets/lunas_button.dart';
import 'package:lunas_mobile/core/widgets/lunas_text_field.dart';
import 'package:lunas_mobile/features/profile/presentation/widgets/profile_widgets.dart';

class EditProfileScreen extends StatefulWidget {
  const EditProfileScreen({super.key});

  @override
  State<EditProfileScreen> createState() => _EditProfileScreenState();
}

class _EditProfileScreenState extends State<EditProfileScreen> {
  final _formKey = GlobalKey<FormState>();
  final _name = TextEditingController(text: 'Alex Dela Cruz');
  final _email = TextEditingController(text: 'alex.delacruz@example.com');
  final _phone = TextEditingController(text: '9171234567');
  final _address = TextEditingController(text: 'Barangay 5, LUNAS City');
  bool _saving = false;

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
    setState(() => _saving = true);
    await Future<void>.delayed(const Duration(milliseconds: 350));
    if (!mounted) return;
    setState(() => _saving = false);
    ScaffoldMessenger.of(
      context,
    ).showSnackBar(const SnackBar(content: Text('Profile updated.')));
    Navigator.pop(context);
  }

  @override
  Widget build(BuildContext context) {
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
                      validator: (value) => (value?.trim().length ?? 0) == 10
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
