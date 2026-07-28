import 'package:flutter/material.dart';
import 'package:lunas_mobile/core/theme/app_colors.dart';
import 'package:lunas_mobile/core/theme/app_spacing.dart';
import 'package:lunas_mobile/core/widgets/lunas_button.dart';
import 'package:lunas_mobile/core/widgets/lunas_card.dart';
import 'package:lunas_mobile/features/admin/presentation/screens/admin_widgets.dart';

/// Static system configuration surface for administrators.
class SystemSettingsScreen extends StatefulWidget {
  const SystemSettingsScreen({super.key});

  @override
  State<SystemSettingsScreen> createState() => _SystemSettingsScreenState();
}

class _SystemSettingsScreenState extends State<SystemSettingsScreen> {
  bool _deviceNotifications = true;
  bool _slaAlerts = true;
  bool _securityAlerts = true;
  String _timeout = '30 minutes';

  @override
  Widget build(BuildContext context) {
    return AdminPage(
      title: 'System settings',
      subtitle: 'Manage LUNAS configuration and alerts',
      showBackButton: true,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const AdminSectionTitle(title: 'General'),
          const SizedBox(height: AppSpacing.sm),
          LunasCard(
            child: TextFormField(
              initialValue: 'LUNAS',
              decoration: const InputDecoration(
                labelText: 'System name',
                helperText: 'The display name used across verified LUNAS dashboards.',
                prefixIcon: Icon(Icons.badge_outlined),
              ),
            ),
          ),
          const SizedBox(height: AppSpacing.xl),
          const AdminSectionTitle(title: 'Notifications'),
          const SizedBox(height: AppSpacing.sm),
          LunasCard(
            padding: EdgeInsets.zero,
            child: Column(
              children: [
                SwitchListTile.adaptive(
                  value: _deviceNotifications,
                  onChanged: (value) => setState(() => _deviceNotifications = value),
                  secondary: const Icon(Icons.notifications_active_outlined),
                  title: const Text('Field-device notifications'),
                  subtitle: const Text('Allow routine response alerts on mobile field devices.'),
                ),
                const Divider(height: 1),
                SwitchListTile.adaptive(
                  value: _slaAlerts,
                  onChanged: (value) => setState(() => _slaAlerts = value),
                  secondary: const Icon(Icons.timer_outlined),
                  title: const Text('SLA warning alerts'),
                  subtitle: const Text('Notify teams when critical work approaches an SLA limit.'),
                ),
                const Divider(height: 1),
                SwitchListTile.adaptive(
                  value: _securityAlerts,
                  onChanged: (value) => setState(() => _securityAlerts = value),
                  secondary: const Icon(Icons.security_outlined),
                  title: const Text('Security access alerts'),
                  subtitle: const Text('Immediately flag unusual account access attempts.'),
                ),
              ],
            ),
          ),
          const SizedBox(height: AppSpacing.xl),
          const AdminSectionTitle(title: 'Security'),
          const SizedBox(height: AppSpacing.sm),
          LunasCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                DropdownButtonFormField<String>(
                  value: _timeout,
                  decoration: const InputDecoration(
                    labelText: 'Session timeout',
                    helperText: 'Automatic sign-out duration for inactive users.',
                    prefixIcon: Icon(Icons.timer_outlined),
                  ),
                  items: const [
                    DropdownMenuItem(value: '15 minutes', child: Text('15 minutes')),
                    DropdownMenuItem(value: '30 minutes', child: Text('30 minutes')),
                    DropdownMenuItem(value: '1 hour', child: Text('1 hour')),
                  ],
                  onChanged: (value) => setState(() => _timeout = value ?? _timeout),
                ),
                const SizedBox(height: AppSpacing.lg),
                Container(
                  padding: const EdgeInsets.all(AppSpacing.md),
                  decoration: BoxDecoration(
                    color: AppColorsLight.alert.withValues(alpha: .08),
                    border: Border.all(color: AppColorsLight.alert.withValues(alpha: .22)),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Icon(Icons.info_outline_rounded, color: AppColorsLight.alert),
                      SizedBox(width: AppSpacing.sm),
                      Expanded(
                        child: Text('Production security settings require additional confirmation and an audit event.'),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: AppSpacing.xl),
          LunasButton(
            label: 'Save settings',
            icon: Icons.save_outlined,
            onPressed: () => showAdminMessage(context, 'Settings are saved locally for this static prototype.'),
          ),
        ],
      ),
    );
  }
}
