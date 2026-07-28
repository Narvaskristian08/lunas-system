import 'package:flutter/material.dart';
import 'package:lunas_mobile/core/theme/app_colors.dart';
import 'package:lunas_mobile/core/theme/app_spacing.dart';
import 'package:lunas_mobile/core/widgets/lunas_button.dart';
import 'package:lunas_mobile/features/stitch_auth/presentation/screens/stitch_auth_widgets.dart';

/// Restricted-workspace role selection for personnel registration.
class OfficialRoleSelectionScreen extends StatefulWidget {
  const OfficialRoleSelectionScreen({super.key});

  @override
  State<OfficialRoleSelectionScreen> createState() =>
      _OfficialRoleSelectionScreenState();
}

class _OfficialRoleSelectionScreenState extends State<OfficialRoleSelectionScreen> {
  _OfficialRole? _role;

  void _continue() {
    if (_role == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Select an official role to continue.')),
      );
      return;
    }
    Navigator.pushNamed(context, '/registration/official-documents');
  }

  @override
  Widget build(BuildContext context) {
    return StitchAuthPage(
      subtitle: 'Authorized personnel registration',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const Center(child: StitchBrandMark()),
          const SizedBox(height: AppSpacing.lg),
          Text(
            'Select Your Official Role',
            textAlign: TextAlign.center,
            style: Theme.of(context).textTheme.headlineLarge?.copyWith(
              fontWeight: FontWeight.w800,
            ),
          ),
          const SizedBox(height: AppSpacing.sm),
          Text(
            'Identify your Dagupan City department before submitting documents for review.',
            textAlign: TextAlign.center,
            style: Theme.of(context).textTheme.bodyMedium,
          ),
          const SizedBox(height: AppSpacing.xxl),
          for (final role in _officialRoles) ...[
            StitchSelectionCard(
              icon: role.icon,
              title: role.title,
              description: role.description,
              color: role.color,
              badge: 'Verification required',
              selected: _role == role.role,
              onTap: () => setState(() => _role = role.role),
            ),
            const SizedBox(height: AppSpacing.md),
          ],
          const StitchInfoNotice(
            icon: Icons.lock_outline_rounded,
            title: 'Restricted access',
            message:
                'Role selection does not grant access by itself. City administration verifies department authority before official tools can be used.',
            color: AppColorsLight.alert,
          ),
          const SizedBox(height: AppSpacing.xxl),
          LunasButton(
            label: 'Continue to Identity Documents',
            icon: Icons.arrow_forward_rounded,
            onPressed: _continue,
          ),
        ],
      ),
    );
  }
}

const _officialRoles = [
  _OfficialRoleOption(
    role: _OfficialRole.repair,
    title: 'Repair Personnel',
    description:
        'Field technicians responsible for physical maintenance, repair, and infrastructure inspection.',
    icon: Icons.engineering_outlined,
    color: AppColorsLight.brandBase,
  ),
  _OfficialRoleOption(
    role: _OfficialRole.barangay,
    title: 'Barangay Official',
    description:
        'Community leaders managing local reports and neighborhood-level resource allocation.',
    icon: Icons.account_balance_outlined,
    color: AppColorsLight.alert,
  ),
  _OfficialRoleOption(
    role: _OfficialRole.engineering,
    title: 'City Engineering Personnel',
    description:
        'Planning staff responsible for city-scale construction and structural integrity.',
    icon: Icons.architecture_outlined,
    color: AppColorsLight.success,
  ),
  _OfficialRoleOption(
    role: _OfficialRole.utility,
    title: 'Utility Provider Personnel',
    description:
        'Authorized partners maintaining water, electricity, and telecommunications infrastructure.',
    icon: Icons.bolt_outlined,
    color: AppColorsLight.info,
  ),
];

enum _OfficialRole { repair, barangay, engineering, utility }

class _OfficialRoleOption {
  const _OfficialRoleOption({
    required this.role,
    required this.title,
    required this.description,
    required this.icon,
    required this.color,
  });

  final _OfficialRole role;
  final String title;
  final String description;
  final IconData icon;
  final Color color;
}
