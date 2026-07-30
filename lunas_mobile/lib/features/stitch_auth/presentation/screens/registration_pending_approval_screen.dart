import 'package:flutter/material.dart';
import 'package:lunas_mobile/core/theme/app_colors.dart';
import 'package:lunas_mobile/core/theme/app_radius.dart';
import 'package:lunas_mobile/core/theme/app_spacing.dart';
import 'package:lunas_mobile/core/widgets/lunas_button.dart';
import 'package:lunas_mobile/core/widgets/lunas_card.dart';

/// Submission confirmation for personnel registrations awaiting review.
class RegistrationPendingApprovalScreen extends StatelessWidget {
  const RegistrationPendingApprovalScreen({super.key});

  void _showRecordMessage(BuildContext context) {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text(
          'Registration status is a static preview until account services are connected.',
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(AppSpacing.xl),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 560),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Align(
                    alignment: Alignment.center,
                    child: Container(
                      width: 92,
                      height: 92,
                      decoration: BoxDecoration(
                        color: AppColorsLight.alert.withValues(alpha: .16),
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(
                        Icons.pending_actions_outlined,
                        size: 48,
                        color: AppColorsLight.alert,
                      ),
                    ),
                  ),
                  const SizedBox(height: AppSpacing.xl),
                  Text(
                    'Registration Submitted',
                    textAlign: TextAlign.center,
                    style: theme.textTheme.headlineLarge?.copyWith(
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  const SizedBox(height: AppSpacing.sm),
                  Text(
                    'Your personnel registration has been submitted for department verification. We will notify you when an authorized administrator finishes the review.',
                    textAlign: TextAlign.center,
                    style: theme.textTheme.bodyMedium?.copyWith(height: 1.45),
                  ),
                  const SizedBox(height: AppSpacing.xxl),
                  LunasCard(
                    child: Column(
                      children: [
                        const _StatusRow(
                          icon: Icons.history_rounded,
                          label: 'Status',
                          value: 'Pending Review',
                          color: AppColorsLight.alert,
                        ),
                        const Padding(
                          padding: EdgeInsets.symmetric(
                            vertical: AppSpacing.md,
                          ),
                          child: Divider(),
                        ),
                        const _StatusRow(
                          icon: Icons.tag_rounded,
                          label: 'Reference',
                          value: 'REG-2026-00421',
                          color: AppColorsLight.brandBase,
                        ),
                        const Padding(
                          padding: EdgeInsets.symmetric(
                            vertical: AppSpacing.md,
                          ),
                          child: Divider(),
                        ),
                        _StatusRow(
                          icon: Icons.schedule_outlined,
                          label: 'Review priority',
                          value: 'Standard',
                          color: theme.colorScheme.onSurfaceVariant,
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: AppSpacing.lg),
                  Container(
                    padding: const EdgeInsets.all(AppSpacing.md),
                    decoration: BoxDecoration(
                      color: theme.colorScheme.primaryContainer.withValues(
                        alpha: .46,
                      ),
                      borderRadius: AppRadius.card,
                    ),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Icon(
                          Icons.info_outline_rounded,
                          color: theme.colorScheme.primary,
                        ),
                        const SizedBox(width: AppSpacing.sm),
                        Expanded(
                          child: Text(
                            'Official access remains unavailable until a city administrator verifies the role and identity documents.',
                            style: theme.textTheme.bodySmall,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: AppSpacing.xxl),
                  LunasButton(
                    label: 'View Registration Status',
                    icon: Icons.visibility_outlined,
                    onPressed: () => _showRecordMessage(context),
                  ),
                  const SizedBox(height: AppSpacing.sm),
                  OutlinedButton.icon(
                    onPressed: () => Navigator.pushNamedAndRemoveUntil(
                      context,
                      '/login',
                      (route) => false,
                    ),
                    icon: const Icon(Icons.logout_rounded),
                    label: const Text('Return to Log In'),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _StatusRow extends StatelessWidget {
  const _StatusRow({
    required this.icon,
    required this.label,
    required this.value,
    required this.color,
  });

  final IconData icon;
  final String label;
  final String value;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Container(
          width: 40,
          height: 40,
          decoration: BoxDecoration(
            color: color.withValues(alpha: .13),
            shape: BoxShape.circle,
          ),
          child: Icon(icon, color: color, size: 20),
        ),
        const SizedBox(width: AppSpacing.sm),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(label, style: Theme.of(context).textTheme.bodySmall),
              const SizedBox(height: AppSpacing.xxs),
              Text(
                value,
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  color: color,
                  fontWeight: FontWeight.w800,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
