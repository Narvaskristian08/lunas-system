import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:lunas_mobile/core/theme/app_colors.dart';
import 'package:lunas_mobile/core/theme/app_radius.dart';
import 'package:lunas_mobile/core/theme/app_spacing.dart';
import 'package:lunas_mobile/core/widgets/lunas_app_bar.dart';
import 'package:lunas_mobile/core/widgets/lunas_button.dart';
import 'package:lunas_mobile/core/widgets/lunas_card.dart';
import 'package:lunas_mobile/features/notifications/presentation/widgets/notification_widgets.dart';

class NotificationDetailsScreen extends StatelessWidget {
  const NotificationDetailsScreen({this.item, super.key});

  final NotificationData? item;

  @override
  Widget build(BuildContext context) {
    final item =
        this.item ??
        GoRouterState.of(context).extra as NotificationData? ??
        const NotificationData(
          id: 'notification',
          title: 'LUNAS update',
          message: 'A new update is available for your account.',
          time: 'Just now',
          icon: Icons.notifications_outlined,
          color: AppColorsLight.brandBase,
          kind: NotificationKind.update,
        );
    return Scaffold(
      appBar: const LunasAppBar(
        title: 'Notification Details',
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
              constraints: const BoxConstraints(maxWidth: 560),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Center(
                    child: Container(
                      width: 72,
                      height: 72,
                      decoration: BoxDecoration(
                        color: item.color.withValues(alpha: .1),
                        borderRadius: BorderRadius.circular(AppRadius.lg),
                      ),
                      child: Icon(item.icon, color: item.color, size: 35),
                    ),
                  ),
                  const SizedBox(height: AppSpacing.xl),
                  Text(
                    item.title,
                    textAlign: TextAlign.center,
                    style: Theme.of(context).textTheme.headlineLarge?.copyWith(
                      fontSize: 27,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  const SizedBox(height: AppSpacing.xs),
                  Text(
                    item.time,
                    textAlign: TextAlign.center,
                    style: Theme.of(context).textTheme.bodySmall,
                  ),
                  const SizedBox(height: AppSpacing.xxl),
                  LunasCard(
                    child: Text(
                      item.message,
                      style: Theme.of(
                        context,
                      ).textTheme.bodyMedium?.copyWith(height: 1.6),
                    ),
                  ),
                  if (item.reportId != null || item.location != null) ...[
                    const SizedBox(height: AppSpacing.md),
                    LunasCard(
                      child: Column(
                        children: [
                          if (item.reportId != null)
                            _DetailRow(
                              icon: Icons.description_outlined,
                              label: 'Report ID',
                              value: item.reportId!,
                            ),
                          if (item.reportId != null && item.location != null)
                            const Divider(height: AppSpacing.xl),
                          if (item.location != null)
                            _DetailRow(
                              icon: Icons.location_on_outlined,
                              label: 'Location',
                              value: item.location!,
                            ),
                        ],
                      ),
                    ),
                  ],
                  if (item.reportId != null) ...[
                    const SizedBox(height: AppSpacing.xl),
                    LunasButton(
                      label: 'View Report',
                      icon: Icons.arrow_forward_rounded,
                      onPressed: () => Navigator.pushNamed(
                        context,
                        '/reports/details',
                        arguments: item.reportId,
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _DetailRow extends StatelessWidget {
  const _DetailRow({
    required this.icon,
    required this.label,
    required this.value,
  });

  final IconData icon;
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(icon, color: AppColorsLight.brandBase, size: 21),
        const SizedBox(width: AppSpacing.md),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(label, style: Theme.of(context).textTheme.labelSmall),
              Text(value, style: Theme.of(context).textTheme.titleMedium),
            ],
          ),
        ),
      ],
    );
  }
}
