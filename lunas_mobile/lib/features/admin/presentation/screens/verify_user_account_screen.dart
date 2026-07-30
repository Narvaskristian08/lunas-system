import 'package:flutter/material.dart';
import 'package:lunas_mobile/core/theme/app_colors.dart';
import 'package:lunas_mobile/core/theme/app_spacing.dart';
import 'package:lunas_mobile/core/widgets/lunas_card.dart';
import 'package:lunas_mobile/features/admin/presentation/screens/admin_widgets.dart';

/// Review surface for a pending utility-provider account application.
class VerifyUserAccountScreen extends StatefulWidget {
  const VerifyUserAccountScreen({super.key});

  @override
  State<VerifyUserAccountScreen> createState() =>
      _VerifyUserAccountScreenState();
}

class _VerifyUserAccountScreenState extends State<VerifyUserAccountScreen> {
  bool _approved = false;

  @override
  Widget build(BuildContext context) {
    return AdminPage(
      title: 'Verify user account',
      subtitle: 'Review a new account application',
      showBackButton: true,
      bottomAction: _ReviewActionBar(
        approved: _approved,
        onRequestMore: () => showAdminMessage(
          context,
          'A request-for-information draft was prepared.',
        ),
        onApprove: () {
          setState(() => _approved = true);
          showAdminMessage(
            context,
            'Sarah Jenkins is approved in this static prototype.',
          );
        },
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          LunasCard(
            child: Column(
              children: [
                const CircleAvatar(
                  radius: 34,
                  backgroundColor: Color(0xFFDCE6FF),
                  foregroundColor: AppColorsLight.brandBase,
                  child: Text(
                    'SJ',
                    style: TextStyle(fontSize: 21, fontWeight: FontWeight.w800),
                  ),
                ),
                const SizedBox(height: AppSpacing.sm),
                Text(
                  'Sarah Jenkins',
                  style: Theme.of(
                    context,
                  ).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w800),
                ),
                const SizedBox(height: AppSpacing.xxs),
                const Text('Utility provider applicant'),
                const SizedBox(height: AppSpacing.sm),
                AdminStatusPill(
                  label: _approved
                      ? 'Approved for access'
                      : 'Pending verification',
                  color: _approved
                      ? AppColorsLight.success
                      : AppColorsLight.alert,
                  icon: _approved
                      ? Icons.check_circle_outline_rounded
                      : Icons.pending_outlined,
                ),
              ],
            ),
          ),
          const SizedBox(height: AppSpacing.xl),
          const AdminSectionTitle(title: 'Submitted details'),
          const SizedBox(height: AppSpacing.sm),
          LunasCard(
            child: const Column(
              children: [
                AdminDetailRow(
                  label: 'Organization',
                  value: 'Dagupan Electric Corporation',
                  icon: Icons.domain_outlined,
                ),
                SizedBox(height: AppSpacing.lg),
                AdminDetailRow(
                  label: 'Email address',
                  value: 'sarah.jenkins@decorp.ph',
                  icon: Icons.mail_outline_rounded,
                ),
                SizedBox(height: AppSpacing.lg),
                AdminDetailRow(
                  label: 'Phone number',
                  value: '+63 917 555 0144',
                  icon: Icons.call_outlined,
                ),
                SizedBox(height: AppSpacing.lg),
                AdminDetailRow(
                  label: 'Role requested',
                  value: 'Utility incident coordinator',
                  icon: Icons.badge_outlined,
                ),
              ],
            ),
          ),
          const SizedBox(height: AppSpacing.xl),
          const AdminSectionTitle(title: 'Submitted identification'),
          const SizedBox(height: AppSpacing.sm),
          LunasCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const AdminVisualPlaceholder(
                  icon: Icons.badge_outlined,
                  label: 'Company ID — front',
                  detail: 'Static document placeholder',
                  color: AppColorsLight.brandBase,
                ),
                const SizedBox(height: AppSpacing.md),
                TextButton.icon(
                  onPressed: () => showAdminMessage(
                    context,
                    'Document zoom is unavailable in this static UI.',
                  ),
                  icon: const Icon(Icons.zoom_in_rounded),
                  label: const Text('Inspect document'),
                ),
              ],
            ),
          ),
          const SizedBox(height: AppSpacing.xl),
          const AdminSectionTitle(title: 'Verification checklist'),
          const SizedBox(height: AppSpacing.sm),
          const LunasCard(
            child: Column(
              children: [
                _VerificationCheck(
                  title: 'ID document is valid and legible',
                  detail: 'Check visual clarity and expiration details.',
                ),
                Divider(height: AppSpacing.xl),
                _VerificationCheck(
                  title: 'Organization is recognized and active',
                  detail:
                      'Confirm the listed provider is a current Dagupan partner.',
                ),
                Divider(height: AppSpacing.xl),
                _VerificationCheck(
                  title: 'Email domain matches organization',
                  detail:
                      'Verify the corporate email suffix against known records.',
                ),
              ],
            ),
          ),
          const SizedBox(height: AppSpacing.xl),
          Text(
            'A real approval must record the reviewer, decision time, role scope, and verification evidence in the audit log.',
            style: Theme.of(context).textTheme.bodySmall,
          ),
        ],
      ),
    );
  }
}

class _VerificationCheck extends StatelessWidget {
  const _VerificationCheck({required this.title, required this.detail});

  final String title;
  final String detail;

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Icon(
          Icons.check_circle_outline_rounded,
          color: AppColorsLight.success,
        ),
        const SizedBox(width: AppSpacing.sm),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: Theme.of(
                  context,
                ).textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.w800),
              ),
              const SizedBox(height: AppSpacing.xxs),
              Text(detail, style: Theme.of(context).textTheme.bodySmall),
            ],
          ),
        ),
      ],
    );
  }
}

class _ReviewActionBar extends StatelessWidget {
  const _ReviewActionBar({
    required this.approved,
    required this.onRequestMore,
    required this.onApprove,
  });

  final bool approved;
  final VoidCallback onRequestMore;
  final VoidCallback onApprove;

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      top: false,
      child: Container(
        padding: const EdgeInsets.fromLTRB(
          AppSpacing.xl,
          AppSpacing.sm,
          AppSpacing.xl,
          AppSpacing.md,
        ),
        decoration: BoxDecoration(
          color: Theme.of(context).colorScheme.surface,
          border: Border(
            top: BorderSide(
              color: Theme.of(context).colorScheme.outlineVariant,
            ),
          ),
        ),
        child: Row(
          children: [
            Expanded(
              child: OutlinedButton(
                onPressed: onRequestMore,
                child: const Text('Request info'),
              ),
            ),
            const SizedBox(width: AppSpacing.sm),
            Expanded(
              flex: 2,
              child: ElevatedButton.icon(
                onPressed: approved ? null : onApprove,
                icon: Icon(
                  approved
                      ? Icons.check_circle_rounded
                      : Icons.verified_user_outlined,
                ),
                label: Text(approved ? 'Account approved' : 'Approve account'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
