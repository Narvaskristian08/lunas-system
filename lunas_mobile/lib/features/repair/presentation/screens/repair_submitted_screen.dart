import 'package:flutter/material.dart';
import 'package:lunas_mobile/core/theme/app_colors.dart';
import 'package:lunas_mobile/core/theme/app_spacing.dart';
import 'package:lunas_mobile/core/widgets/lunas_card.dart';
import 'package:lunas_mobile/features/repair/presentation/screens/repair_routes.dart';
import 'package:lunas_mobile/features/repair/presentation/screens/repair_widgets.dart';

/// Confirmation shown after a technician submits completion evidence.
class RepairSubmittedScreen extends StatelessWidget {
  const RepairSubmittedScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(AppSpacing.xl),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 520),
              child: LunasCard(
                padding: const EdgeInsets.all(AppSpacing.xxl),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(
                      width: 96,
                      height: 96,
                      decoration: BoxDecoration(
                        color: AppColorsLight.success.withValues(alpha: .16),
                        shape: BoxShape.circle,
                      ),
                      child: Center(
                        child: Container(
                          width: 68,
                          height: 68,
                          decoration: const BoxDecoration(
                            color: AppColorsLight.success,
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(
                            Icons.check_rounded,
                            color: Colors.white,
                            size: 42,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: AppSpacing.xl),
                    Text(
                      'Repair submitted successfully',
                      textAlign: TextAlign.center,
                      style: theme.textTheme.headlineLarge?.copyWith(
                        fontSize: 28,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                    const SizedBox(height: AppSpacing.md),
                    Text(
                      'Work Order #WO-2026-0142 is now pending official verification. You will receive notifications as the status changes.',
                      textAlign: TextAlign.center,
                      style: theme.textTheme.bodyMedium?.copyWith(height: 1.45),
                    ),
                    const SizedBox(height: AppSpacing.xl),
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(AppSpacing.md),
                      decoration: BoxDecoration(
                        color: theme.colorScheme.primaryContainer.withValues(
                          alpha: .55,
                        ),
                        border: const Border(
                          left: BorderSide(
                            color: AppColorsLight.success,
                            width: 4,
                          ),
                        ),
                      ),
                      child: Row(
                        children: [
                          CircleAvatar(
                            backgroundColor: AppColorsLight.success.withValues(
                              alpha: .14,
                            ),
                            foregroundColor: AppColorsLight.success,
                            child: const Icon(Icons.pending_actions_outlined),
                          ),
                          const SizedBox(width: AppSpacing.sm),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'Current status',
                                  style: theme.textTheme.titleMedium?.copyWith(
                                    fontWeight: FontWeight.w800,
                                  ),
                                ),
                                Text(
                                  'Pending verification',
                                  style: theme.textTheme.bodySmall,
                                ),
                              ],
                            ),
                          ),
                          const RepairStatusChip(
                            label: 'Just now',
                            color: AppColorsLight.success,
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: AppSpacing.xl),
                    RepairPrimaryButton(
                      label: 'View repair history',
                      icon: Icons.history_rounded,
                      onPressed: () =>
                          Navigator.pushNamed(context, RepairRoutes.completed),
                    ),
                    const SizedBox(height: AppSpacing.sm),
                    RepairSecondaryButton(
                      label: 'Open official verification',
                      icon: Icons.fact_check_outlined,
                      onPressed: () => Navigator.pushNamed(
                        context,
                        RepairRoutes.officialVerification,
                      ),
                    ),
                    const SizedBox(height: AppSpacing.sm),
                    RepairSecondaryButton(
                      label: 'Return to dashboard',
                      icon: Icons.dashboard_outlined,
                      onPressed: () => Navigator.pushNamedAndRemoveUntil(
                        context,
                        RepairRoutes.dashboard,
                        (route) => false,
                      ),
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
