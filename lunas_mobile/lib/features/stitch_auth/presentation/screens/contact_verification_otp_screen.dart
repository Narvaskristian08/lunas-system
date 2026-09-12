import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:lunas_mobile/core/theme/app_colors.dart';
import 'package:lunas_mobile/core/theme/app_radius.dart';
import 'package:lunas_mobile/core/theme/app_spacing.dart';
import 'package:lunas_mobile/core/widgets/lunas_button.dart';
import 'package:lunas_mobile/features/stitch_auth/presentation/screens/stitch_auth_widgets.dart';

/// Contact-verification UI. A live implementation must verify the code on a
/// server; this screen only demonstrates the protected registration step.
class ContactVerificationOtpScreen extends StatelessWidget {
  const ContactVerificationOtpScreen({super.key});

  void _verify(BuildContext context) {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text(
          'Contact verification is not connected to an OTP endpoint yet.',
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return StitchAuthPage(
      subtitle: 'Contact verification',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const Center(child: StitchBrandMark()),
          const SizedBox(height: AppSpacing.lg),
          Text(
            'Verify Your Contact',
            textAlign: TextAlign.center,
            style: theme.textTheme.headlineLarge?.copyWith(
              fontWeight: FontWeight.w800,
            ),
          ),
          const SizedBox(height: AppSpacing.sm),
          Text(
            'We sent a six-digit verification code to +63 917 ••• 4567. Enter it below to continue.',
            textAlign: TextAlign.center,
            style: theme.textTheme.bodyMedium,
          ),
          const SizedBox(height: AppSpacing.xxl),
          Row(
            children: List.generate(
              6,
              (index) => Expanded(
                child: Padding(
                  padding: EdgeInsets.only(
                    right: index == 5 ? 0 : AppSpacing.xs,
                  ),
                  child: TextField(
                    maxLength: 1,
                    textAlign: TextAlign.center,
                    keyboardType: TextInputType.number,
                    inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                    onChanged: (value) {
                      if (value.isNotEmpty && index < 5) {
                        FocusScope.of(context).nextFocus();
                      }
                    },
                    decoration: InputDecoration(
                      counterText: '',
                      filled: true,
                      fillColor: theme.colorScheme.surfaceContainerHighest
                          .withValues(alpha: .38),
                      contentPadding: const EdgeInsets.symmetric(vertical: 14),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(AppRadius.sm),
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ),
          const SizedBox(height: AppSpacing.md),
          Row(
            children: [
              Icon(
                Icons.schedule_outlined,
                size: 18,
                color: theme.colorScheme.onSurfaceVariant,
              ),
              const SizedBox(width: AppSpacing.xs),
              Expanded(
                child: Text(
                  'Code expires in 04:59',
                  style: theme.textTheme.bodySmall,
                ),
              ),
              TextButton(
                onPressed: () => ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text(
                      'Resend is unavailable until OTP delivery is connected.',
                    ),
                  ),
                ),
                child: const Text('Resend Code'),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.xl),
          const StitchInfoNotice(
            icon: Icons.shield_outlined,
            title: 'Secure verification',
            message:
                'In the live app, verification is completed through an authenticated server-side flow. This prototype never validates a code locally.',
            color: AppColorsLight.brandBase,
          ),
          const SizedBox(height: AppSpacing.xxl),
          LunasButton(
            label: 'Verify Contact',
            icon: Icons.verified_user_outlined,
            onPressed: () => _verify(context),
          ),
          const SizedBox(height: AppSpacing.sm),
          SizedBox(
            width: double.infinity,
            child: OutlinedButton(
              onPressed: () => Navigator.maybePop(context),
              child: const Text('Change Phone Number'),
            ),
          ),
        ],
      ),
    );
  }
}
