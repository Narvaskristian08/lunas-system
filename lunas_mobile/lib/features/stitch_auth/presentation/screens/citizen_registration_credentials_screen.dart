import 'package:flutter/material.dart';
import 'package:lunas_mobile/core/theme/app_colors.dart';
import 'package:lunas_mobile/core/theme/app_radius.dart';
import 'package:lunas_mobile/core/theme/app_spacing.dart';
import 'package:lunas_mobile/core/widgets/lunas_button.dart';
import 'package:lunas_mobile/features/stitch_auth/presentation/screens/stitch_auth_widgets.dart';

/// Account-security step for a citizen account.
class CitizenRegistrationCredentialsScreen extends StatefulWidget {
  const CitizenRegistrationCredentialsScreen({super.key});

  @override
  State<CitizenRegistrationCredentialsScreen> createState() =>
      _CitizenRegistrationCredentialsScreenState();
}

class _CitizenRegistrationCredentialsScreenState
    extends State<CitizenRegistrationCredentialsScreen> {
  bool _useMobileAsPrimary = true;
  bool _obscurePassword = true;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return StitchAuthPage(
      subtitle: 'Citizen registration',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const RegistrationProgress(
            step: 2,
            totalSteps: 4,
            title: 'Account Security',
            detail: 'Set the contact details and password for your citizen account.',
          ),
          const SizedBox(height: AppSpacing.xxl),
          TextFormField(
            keyboardType: TextInputType.phone,
            decoration: const InputDecoration(
              labelText: 'Mobile Number',
              hintText: '+63 917 000 0000',
              prefixIcon: Icon(Icons.smartphone_outlined),
            ),
          ),
          const SizedBox(height: AppSpacing.md),
          TextFormField(
            keyboardType: TextInputType.emailAddress,
            decoration: const InputDecoration(
              labelText: 'Email Address',
              hintText: 'citizen@example.com',
              prefixIcon: Icon(Icons.mail_outline_rounded),
            ),
          ),
          const SizedBox(height: AppSpacing.xs),
          CheckboxListTile(
            value: _useMobileAsPrimary,
            onChanged: (value) =>
                setState(() => _useMobileAsPrimary = value ?? false),
            contentPadding: EdgeInsets.zero,
            controlAffinity: ListTileControlAffinity.leading,
            title: Text(
              'Use mobile number as primary contact',
              style: theme.textTheme.bodyMedium,
            ),
          ),
          const SizedBox(height: AppSpacing.sm),
          TextFormField(
            obscureText: _obscurePassword,
            decoration: InputDecoration(
              labelText: 'Create Password',
              hintText: '••••••••••••',
              prefixIcon: const Icon(Icons.lock_outline_rounded),
              suffixIcon: IconButton(
                tooltip: _obscurePassword ? 'Show password' : 'Hide password',
                onPressed: () => setState(() => _obscurePassword = !_obscurePassword),
                icon: Icon(
                  _obscurePassword
                      ? Icons.visibility_outlined
                      : Icons.visibility_off_outlined,
                ),
              ),
            ),
          ),
          const SizedBox(height: AppSpacing.sm),
          Container(
            padding: const EdgeInsets.all(AppSpacing.md),
            decoration: BoxDecoration(
              color: theme.colorScheme.primaryContainer.withValues(alpha: .38),
              borderRadius: AppRadius.card,
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: const [
                _PasswordRule(
                  met: true,
                  label: 'At least 8 characters',
                ),
                SizedBox(height: AppSpacing.xs),
                _PasswordRule(
                  met: true,
                  label: 'Includes uppercase and lowercase letters',
                ),
                SizedBox(height: AppSpacing.xs),
                _PasswordRule(
                  met: true,
                  label: 'Includes a number or symbol',
                ),
              ],
            ),
          ),
          const SizedBox(height: AppSpacing.md),
          TextFormField(
            obscureText: _obscurePassword,
            decoration: const InputDecoration(
              labelText: 'Confirm Password',
              hintText: '••••••••••••',
              prefixIcon: Icon(Icons.lock_reset_outlined),
            ),
          ),
          const SizedBox(height: AppSpacing.lg),
          const StitchInfoNotice(
            icon: Icons.verified_user_outlined,
            title: 'Contact privacy',
            message:
                'Contact details are used only for account verification and report updates. This static screen does not store or transmit form data.',
            color: AppColorsLight.brandBase,
          ),
          const SizedBox(height: AppSpacing.xxl),
          LunasButton(
            label: 'Continue to Verification',
            icon: Icons.verified_user_outlined,
            onPressed: () =>
                Navigator.pushNamed(context, '/registration/otp'),
          ),
          const SizedBox(height: AppSpacing.sm),
          TextButton(
            onPressed: () => Navigator.maybePop(context),
            child: const Text('Back to personal information'),
          ),
        ],
      ),
    );
  }
}

class _PasswordRule extends StatelessWidget {
  const _PasswordRule({required this.met, required this.label});

  final bool met;
  final String label;

  @override
  Widget build(BuildContext context) {
    final color = met
        ? AppColorsLight.success
        : Theme.of(context).colorScheme.onSurfaceVariant;
    return Row(
      children: [
        Icon(
          met ? Icons.check_circle_outline_rounded : Icons.circle_outlined,
          color: color,
          size: 18,
        ),
        const SizedBox(width: AppSpacing.xs),
        Expanded(
          child: Text(
            label,
            style: Theme.of(context).textTheme.bodySmall?.copyWith(color: color),
          ),
        ),
      ],
    );
  }
}
