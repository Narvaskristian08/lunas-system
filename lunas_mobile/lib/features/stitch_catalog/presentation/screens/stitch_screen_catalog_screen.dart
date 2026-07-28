import 'package:flutter/material.dart';
import 'package:lunas_mobile/core/theme/app_colors.dart';
import 'package:lunas_mobile/core/theme/app_radius.dart';
import 'package:lunas_mobile/core/theme/app_spacing.dart';
import 'package:lunas_mobile/core/widgets/lunas_app_scaffold.dart';
import 'package:lunas_mobile/core/widgets/lunas_card.dart';

/// Browse every supplied Stitch design by its source-folder name.
///
/// This catalogue intentionally keeps the source export visible to reviewers
/// while routing into the native Flutter implementation for each screen.
class StitchScreenCatalogScreen extends StatelessWidget {
  const StitchScreenCatalogScreen({super.key});

  static const _groups = [
    _CatalogGroup('Account and onboarding', [
      _CatalogEntry('splash_screen', 'Splash screen', '/'),
      _CatalogEntry('welcome_screen', 'Welcome', '/welcome'),
      _CatalogEntry('login_screen', 'Log in', '/login'),
      _CatalogEntry('forgot_password', 'Forgot password', '/forgot-password'),
      _CatalogEntry('reset_password', 'Reset password', '/reset-password'),
      _CatalogEntry(
        'select_registration_type',
        'Registration type',
        '/registration/type',
      ),
      _CatalogEntry(
        'citizen_registration_personal_info',
        'Citizen personal details',
        '/registration/citizen/personal',
      ),
      _CatalogEntry(
        'citizen_registration_credentials',
        'Citizen credentials',
        '/registration/citizen/credentials',
      ),
      _CatalogEntry(
        'contact_verification_otp',
        'Contact verification',
        '/registration/otp',
      ),
      _CatalogEntry(
        'official_role_selection',
        'Official role selection',
        '/registration/official-role',
      ),
      _CatalogEntry(
        'official_identity_documents',
        'Official documents',
        '/registration/official-documents',
      ),
      _CatalogEntry(
        'registration_pending_approval',
        'Pending approval',
        '/registration/pending',
      ),
    ]),
    _CatalogGroup('Citizen reporting', [
      _CatalogEntry('citizen_dashboard_1', 'Citizen dashboard', '/home'),
      _CatalogEntry(
        'citizen_dashboard_2',
        'Citizen dashboard — alternate',
        '/citizen/dashboard-alt',
      ),
      _CatalogEntry('my_drafts', 'My drafts', '/reports/drafts'),
      _CatalogEntry('my_reports', 'My reports', '/reports/history'),
      _CatalogEntry('report_hazard_form_1', 'Report hazard', '/reports/new'),
      _CatalogEntry(
        'report_hazard_form_2',
        'Report hazard — alternate',
        '/reports/new/alternate',
      ),
      _CatalogEntry(
        'ai_hazard_detection_result',
        'AI hazard suggestion',
        '/reports/ai-suggestion',
      ),
      _CatalogEntry(
        'confirm_report_details',
        'Confirm report details',
        '/reports/confirm',
      ),
      _CatalogEntry('pin_location_on_map', 'Pin location', '/reports/location'),
      _CatalogEntry('report_submitted', 'Report submitted', '/reports/status'),
      _CatalogEntry('report_details', 'Report details', '/reports/details'),
      _CatalogEntry('report_timeline', 'Report timeline', '/reports/timeline'),
      _CatalogEntry(
        'repair_evidence_viewer',
        'Repair evidence viewer',
        '/reports/evidence',
      ),
      _CatalogEntry(
        'report_resolved_summary',
        'Resolved report summary',
        '/reports/resolved',
      ),
    ]),
    _CatalogGroup('Repair personnel', [
      _CatalogEntry('repair_dashboard', 'Repair dashboard', '/repair'),
      _CatalogEntry('repair_tasks_list', 'Repair task list', '/repair/tasks-list'),
      _CatalogEntry(
        'assigned_work_orders',
        'Assigned work orders',
        '/repair/tasks',
      ),
      _CatalogEntry(
        'work_order_details',
        'Work order details',
        '/repair/work-order',
      ),
      _CatalogEntry('start_repair', 'Start repair', '/repair/start'),
      _CatalogEntry(
        'navigate_to_incident',
        'Navigate to incident',
        '/repair/navigate',
      ),
      _CatalogEntry('update_progress', 'Update progress', '/repair/progress'),
      _CatalogEntry(
        'upload_repair_evidence',
        'Upload repair evidence',
        '/repair/evidence',
      ),
      _CatalogEntry('ai_quality_check', 'AI quality check', '/repair/quality'),
      _CatalogEntry('confirm_completion', 'Confirm completion', '/repair/confirm'),
      _CatalogEntry('repair_submitted', 'Repair submitted', '/repair/submitted'),
      _CatalogEntry('completed_repairs', 'Completed repairs', '/repair/completed'),
      _CatalogEntry(
        'finished_repair_details',
        'Finished repair details',
        '/repair/finished',
      ),
    ]),
    _CatalogGroup('Official and barangay', [
      _CatalogEntry('incoming_reports', 'Incoming reports', '/official/incoming'),
      _CatalogEntry(
        'incident_details_official',
        'Official incident details',
        '/barangay/incidents/details',
      ),
      _CatalogEntry('validate_report', 'Validate report', '/official/validate'),
      _CatalogEntry('assign_personnel', 'Assign personnel', '/official/assign'),
      _CatalogEntry('repair_verification', 'Repair verification', '/official/verify'),
      _CatalogEntry('sla_monitoring', 'SLA monitoring', '/official/sla'),
      _CatalogEntry('barangay_dashboard', 'Barangay dashboard', '/barangay'),
      _CatalogEntry(
        'barangay_statistics',
        'Barangay statistics',
        '/barangay/statistics',
      ),
    ]),
    _CatalogGroup('City engineering', [
      _CatalogEntry('engineering_dashboard', 'Engineering dashboard', '/engineering'),
      _CatalogEntry(
        'city_wide_incidents',
        'City-wide incidents',
        '/engineering/incidents',
      ),
      _CatalogEntry(
        'incident_details_engineering',
        'Engineering incident details',
        '/engineering/incidents/details',
      ),
      _CatalogEntry(
        'engineering_map_oversight',
        'Map oversight',
        '/engineering/map',
      ),
      _CatalogEntry(
        'assign_utility_provider',
        'Assign utility provider',
        '/engineering/utility-assignment',
      ),
      _CatalogEntry('sla_dashboard', 'SLA dashboard', '/engineering/sla'),
      _CatalogEntry(
        'infrastructure_analytics',
        'Infrastructure analytics',
        '/engineering/analytics',
      ),
      _CatalogEntry(
        'performance_reports',
        'Performance reports',
        '/engineering/performance',
      ),
      _CatalogEntry(
        'repair_verification_engineering',
        'Engineering repair verification',
        '/engineering/verify',
      ),
    ]),
    _CatalogGroup('Utility provider', [
      _CatalogEntry('utility_dashboard', 'Utility dashboard', '/utility'),
      _CatalogEntry(
        'assigned_utility_incidents',
        'Assigned utility incidents',
        '/utility/incidents',
      ),
      _CatalogEntry(
        'utility_incident_details',
        'Utility incident details',
        '/utility/incidents/details',
      ),
      _CatalogEntry('accept_assignment', 'Accept assignment', '/utility/accept'),
    ]),
    _CatalogGroup('System administration', [
      _CatalogEntry('admin_dashboard', 'Admin dashboard', '/admin'),
      _CatalogEntry('user_management', 'User management', '/admin/users'),
      _CatalogEntry('user_details', 'User details', '/admin/users/details'),
      _CatalogEntry('verify_user_account', 'Verify user', '/admin/users/verify'),
      _CatalogEntry('audit_logs', 'Audit logs', '/admin/audit'),
      _CatalogEntry(
        'system_announcements',
        'System announcements',
        '/admin/announcements',
      ),
      _CatalogEntry(
        'create_system_announcement',
        'Create announcement',
        '/admin/announcements/create',
      ),
      _CatalogEntry('system_settings', 'System settings', '/admin/settings'),
    ]),
  ];

  @override
  Widget build(BuildContext context) {
    return LunasAppScaffold(
      title: 'Stitch screen catalogue',
      subtitle: '68 supplied designs • native Flutter routes',
      showBackButton: true,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Container(
            padding: const EdgeInsets.all(AppSpacing.md),
            decoration: BoxDecoration(
              color: AppColorsLight.brandBase.withValues(alpha: .08),
              borderRadius: AppRadius.input,
              border: Border.all(
                color: AppColorsLight.brandBase.withValues(alpha: .18),
              ),
            ),
            child: const Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Icon(Icons.dashboard_customize_outlined,
                    color: AppColorsLight.brandBase),
                SizedBox(width: AppSpacing.sm),
                Expanded(
                  child: Text(
                    'Each item opens the corresponding native Flutter screen. Source-folder names are retained for design review.'),
                ),
              ],
            ),
          ),
          const SizedBox(height: AppSpacing.xl),
          for (final group in _groups) ...[
            _CatalogGroupCard(group: group),
            const SizedBox(height: AppSpacing.md),
          ],
        ],
      ),
    );
  }
}

class _CatalogGroupCard extends StatelessWidget {
  const _CatalogGroupCard({required this.group});

  final _CatalogGroup group;

  @override
  Widget build(BuildContext context) {
    return LunasCard(
      padding: EdgeInsets.zero,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.all(AppSpacing.md),
            child: Text(
              group.title,
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w800,
                  ),
            ),
          ),
          for (var index = 0; index < group.entries.length; index++) ...[
            if (index != 0) const Divider(height: 1),
            InkWell(
              onTap: () => Navigator.pushNamed(context, group.entries[index].route),
              child: Padding(
                padding: const EdgeInsets.all(AppSpacing.md),
                child: Row(
                  children: [
                    Container(
                      width: 36,
                      height: 36,
                      decoration: BoxDecoration(
                        color: AppColorsLight.brandBase.withValues(alpha: .1),
                        borderRadius: BorderRadius.circular(AppRadius.xs),
                      ),
                      child: const Icon(
                        Icons.open_in_new_rounded,
                        size: 18,
                        color: AppColorsLight.brandBase,
                      ),
                    ),
                    const SizedBox(width: AppSpacing.sm),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            group.entries[index].title,
                            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                  color: Theme.of(context).colorScheme.onSurface,
                                  fontWeight: FontWeight.w700,
                                ),
                          ),
                          const SizedBox(height: AppSpacing.xxs),
                          Text(
                            group.entries[index].source,
                            style: Theme.of(context).textTheme.labelSmall?.copyWith(
                                  fontFamily: 'RobotoMono',
                                  letterSpacing: 0,
                                ),
                          ),
                        ],
                      ),
                    ),
                    const Icon(Icons.chevron_right_rounded),
                  ],
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _CatalogGroup {
  const _CatalogGroup(this.title, this.entries);

  final String title;
  final List<_CatalogEntry> entries;
}

class _CatalogEntry {
  const _CatalogEntry(this.source, this.title, this.route);

  final String source;
  final String title;
  final String route;
}
