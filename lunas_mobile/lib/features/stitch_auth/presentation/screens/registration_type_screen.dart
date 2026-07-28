import 'package:flutter/material.dart';
import 'package:lunas_mobile/core/theme/app_colors.dart';
import 'package:lunas_mobile/core/theme/app_spacing.dart';
import 'package:lunas_mobile/core/widgets/lunas_button.dart';
import 'package:lunas_mobile/features/stitch_auth/presentation/screens/stitch_auth_widgets.dart';

/// Chooses the account workflow before registration begins.
class RegistrationTypeScreen extends StatefulWidget {
  const RegistrationTypeScreen({super.key});

  @override
  State<RegistrationTypeScreen> createState() => _RegistrationTypeScreenState();
}

class _RegistrationTypeScreenState extends State<RegistrationTypeScreen> {
  _RegistrationType? _type;

  void _continue() {
    final route = switch (_type) {
      _RegistrationType.citizen => '/registration/citizen/personal',
      _RegistrationType.official => '/registration/official-role',
      null => null,
    };
    if (route == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Choose an account type to continue.')),
      );
      return;
    }
    Navigator.pushNamed(context, route);
  }

  @override
  Widget build(BuildContext context) {
    return StitchAuthPage(
      subtitle: 'Create an account',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const Center(child: StitchBrandMark()),
          const SizedBox(height: AppSpacing.lg),
          Text(
            'Create Your LUNAS Account',
            textAlign: TextAlign.center,
            style: Theme.of(context).textTheme.headlineLarge?.copyWith(
              fontWeight: FontWeight.w800,
            ),
          ),
          const SizedBox(height: AppSpacing.sm),
          Text(
            'Choose the workspace that matches how you will use LUNAS.',
            textAlign: TextAlign.center,
            style: Theme.of(context).textTheme.bodyMedium,
          ),
          const SizedBox(height: AppSpacing.xxl),
          StitchSelectionCard(
            icon: Icons.person_outline_rounded,
            title: 'Citizen',
            description:
                'Report local infrastructure concerns and follow every response update.',
            color: AppColorsLight.brandBase,
            selected: _type == _RegistrationType.citizen,
            onTap: () => setState(() => _type = _RegistrationType.citizen),
          ),
          const SizedBox(height: AppSpacing.md),
          StitchSelectionCard(
            icon: Icons.badge_outlined,
            title: 'Authorized Personnel',
            description:
                'Access approved workflows for validation, repair, and infrastructure operations.',
            color: AppColorsLight.alert,
            badge: 'Verification required',
            selected: _type == _RegistrationType.official,
            onTap: () => setState(() => _type = _RegistrationType.official),
          ),
          const SizedBox(height: AppSpacing.lg),
          const StitchInfoNotice(
            icon: Icons.verified_user_outlined,
            title: 'Verification required',
            message:
                'Authorized personnel accounts are manually reviewed by the relevant Dagupan City office before restricted tools are enabled.',
            color: AppColorsLight.alert,
          ),
          const SizedBox(height: AppSpacing.xxl),
          LunasButton(
            label: 'Continue',
            icon: Icons.arrow_forward_rounded,
            onPressed: _continue,
          ),
          const SizedBox(height: AppSpacing.sm),
          TextButton(
            onPressed: () => Navigator.pushNamed(context, '/login'),
            child: const Text('Already have an account? Log in'),
          ),
        ],
      ),
    );
  }
}

enum _RegistrationType { citizen, official }
