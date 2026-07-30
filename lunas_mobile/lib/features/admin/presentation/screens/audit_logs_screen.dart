import 'package:flutter/material.dart';
import 'package:lunas_mobile/core/theme/app_colors.dart';
import 'package:lunas_mobile/core/theme/app_spacing.dart';
import 'package:lunas_mobile/core/widgets/lunas_card.dart';
import 'package:lunas_mobile/features/admin/presentation/screens/admin_widgets.dart';

/// Static audit-log browsing interface. Audit entries are illustrative only.
class AuditLogsScreen extends StatelessWidget {
  const AuditLogsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return AdminPage(
      title: 'System audit logs',
      subtitle: 'Track administrative actions and system events',
      selectedNavigationIndex: 2,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          TextField(
            decoration: const InputDecoration(
              hintText: 'Search event ID, user, or action',
              prefixIcon: Icon(Icons.search_rounded),
            ),
          ),
          const SizedBox(height: AppSpacing.sm),
          Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: () => showAdminMessage(
                    context,
                    'Date-range selection is a static prototype control.',
                  ),
                  icon: const Icon(Icons.calendar_today_outlined, size: 18),
                  label: const Text('Last 7 days'),
                ),
              ),
              const SizedBox(width: AppSpacing.sm),
              IconButton.outlined(
                tooltip: 'Filter logs',
                onPressed: () => showAdminMessage(
                  context,
                  'Log filters are a static prototype control.',
                ),
                icon: const Icon(Icons.filter_list_rounded),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.lg),
          const AdminSectionTitle(title: 'Recent events'),
          const SizedBox(height: AppSpacing.sm),
          for (final log in _auditLogs) ...[
            _AuditLogCard(log: log),
            const SizedBox(height: AppSpacing.sm),
          ],
          const SizedBox(height: AppSpacing.md),
          Text(
            'Live audit logs should be tamper-evident and server generated; these entries are design-time sample data.',
            style: Theme.of(context).textTheme.bodySmall,
          ),
        ],
      ),
    );
  }
}

const _auditLogs = [
  _AuditLog(
    id: '#LOG-9402',
    action: 'Updated user role',
    detail: 'Admin reassigned a responder role for Barangay Tapuac.',
    time: 'Today, 09:34 AM',
    icon: Icons.person_outline_rounded,
    color: AppColorsLight.info,
  ),
  _AuditLog(
    id: '#LOG-9401',
    action: 'Multiple failed logins',
    detail: 'Rate limiting was applied to a device authentication attempt.',
    time: 'Today, 08:48 AM',
    icon: Icons.desktop_windows_outlined,
    color: AppColorsLight.alert,
  ),
  _AuditLog(
    id: '#LOG-9400',
    action: 'Data sync retry required',
    detail: 'The report queue flagged a retry for review.',
    time: 'Yesterday, 04:16 PM',
    icon: Icons.storage_outlined,
    color: AppColorsLight.critical,
  ),
  _AuditLog(
    id: '#LOG-9399',
    action: 'Monthly performance report exported',
    detail: 'An authorized official generated the October report.',
    time: 'Yesterday, 02:05 PM',
    icon: Icons.file_download_outlined,
    color: AppColorsLight.brandBase,
  ),
];

class _AuditLog {
  const _AuditLog({
    required this.id,
    required this.action,
    required this.detail,
    required this.time,
    required this.icon,
    required this.color,
  });

  final String id;
  final String action;
  final String detail;
  final String time;
  final IconData icon;
  final Color color;
}

class _AuditLogCard extends StatelessWidget {
  const _AuditLogCard({required this.log});

  final _AuditLog log;

  @override
  Widget build(BuildContext context) {
    return LunasCard(
      padding: const EdgeInsets.all(AppSpacing.md),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          CircleAvatar(
            backgroundColor: log.color.withValues(alpha: .12),
            foregroundColor: log.color,
            child: Icon(log.icon),
          ),
          const SizedBox(width: AppSpacing.md),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        log.id,
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                    ),
                    AdminStatusPill(label: 'Recorded', color: log.color),
                  ],
                ),
                const SizedBox(height: AppSpacing.xs),
                Text(
                  log.action,
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w800,
                  ),
                ),
                const SizedBox(height: AppSpacing.xxs),
                Text(log.detail, style: Theme.of(context).textTheme.bodySmall),
                const SizedBox(height: AppSpacing.xs),
                Text(log.time, style: Theme.of(context).textTheme.bodySmall),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
