import 'package:flutter/material.dart';
import 'package:lunas_mobile/core/theme/app_spacing.dart';
import 'package:lunas_mobile/core/widgets/lunas_button.dart';
import 'package:lunas_mobile/features/stitch_auth/presentation/screens/stitch_auth_widgets.dart';

/// First step of the citizen registration prototype.
class CitizenRegistrationPersonalInfoScreen extends StatefulWidget {
  const CitizenRegistrationPersonalInfoScreen({super.key});

  @override
  State<CitizenRegistrationPersonalInfoScreen> createState() =>
      _CitizenRegistrationPersonalInfoScreenState();
}

class _CitizenRegistrationPersonalInfoScreenState
    extends State<CitizenRegistrationPersonalInfoScreen> {
  String _barangay = 'Pantal';

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return StitchAuthPage(
      subtitle: 'Citizen registration',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const RegistrationProgress(
            step: 1,
            totalSteps: 4,
            title: 'Create Citizen Account',
            detail: 'Provide your personal information to begin registration.',
          ),
          const SizedBox(height: AppSpacing.xxl),
          Text('Personal information', style: theme.textTheme.titleLarge),
          const SizedBox(height: AppSpacing.md),
          TextFormField(
            decoration: const InputDecoration(
              labelText: 'First Name',
              hintText: 'Juan',
              prefixIcon: Icon(Icons.person_outline_rounded),
            ),
            textInputAction: TextInputAction.next,
          ),
          const SizedBox(height: AppSpacing.md),
          TextFormField(
            decoration: const InputDecoration(
              labelText: 'Middle Name (Optional)',
              hintText: 'Santos',
              prefixIcon: Icon(Icons.person_outline_rounded),
            ),
            textInputAction: TextInputAction.next,
          ),
          const SizedBox(height: AppSpacing.md),
          TextFormField(
            decoration: const InputDecoration(
              labelText: 'Last Name',
              hintText: 'Dela Cruz',
              prefixIcon: Icon(Icons.person_outline_rounded),
            ),
            textInputAction: TextInputAction.next,
          ),
          const SizedBox(height: AppSpacing.md),
          TextFormField(
            readOnly: true,
            onTap: () => ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text(
                  'Date selection is represented in this static UI.',
                ),
              ),
            ),
            decoration: const InputDecoration(
              labelText: 'Date of Birth',
              hintText: 'Select your date of birth',
              prefixIcon: Icon(Icons.calendar_today_outlined),
            ),
          ),
          const SizedBox(height: AppSpacing.md),
          DropdownButtonFormField<String>(
            initialValue: _barangay,
            isExpanded: true,
            decoration: const InputDecoration(
              labelText: 'Barangay (Dagupan City)',
              prefixIcon: Icon(Icons.location_on_outlined),
            ),
            items: const [
              DropdownMenuItem(
                value: 'Bonuan Boquig',
                child: Text('Bonuan Boquig'),
              ),
              DropdownMenuItem(
                value: 'Bonuan Gueset',
                child: Text('Bonuan Gueset'),
              ),
              DropdownMenuItem(value: 'Lucao', child: Text('Lucao')),
              DropdownMenuItem(value: 'Malued', child: Text('Malued')),
              DropdownMenuItem(value: 'Mayombo', child: Text('Mayombo')),
              DropdownMenuItem(value: 'Pantal', child: Text('Pantal')),
              DropdownMenuItem(value: 'Tapuac', child: Text('Tapuac')),
            ],
            onChanged: (value) {
              if (value != null) setState(() => _barangay = value);
            },
          ),
          const SizedBox(height: AppSpacing.xxl),
          LunasButton(
            label: 'Continue to Account Security',
            icon: Icons.arrow_forward_rounded,
            onPressed: () => ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text(
                  'Use the supported citizen registration form to create an account.',
                ),
              ),
            ),
          ),
          const SizedBox(height: AppSpacing.sm),
          TextButton(
            onPressed: () => Navigator.maybePop(context),
            child: const Text('Back to account type'),
          ),
        ],
      ),
    );
  }
}
