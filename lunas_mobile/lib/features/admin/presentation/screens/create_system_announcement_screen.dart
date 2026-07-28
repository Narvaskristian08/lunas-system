import 'package:flutter/material.dart';
import 'package:lunas_mobile/core/theme/app_colors.dart';
import 'package:lunas_mobile/core/theme/app_spacing.dart';
import 'package:lunas_mobile/core/widgets/lunas_button.dart';
import 'package:lunas_mobile/core/widgets/lunas_card.dart';
import 'package:lunas_mobile/features/admin/presentation/screens/admin_routes.dart';
import 'package:lunas_mobile/features/admin/presentation/screens/admin_widgets.dart';

/// Static composition form for a system announcement.
class CreateSystemAnnouncementScreen extends StatefulWidget {
  const CreateSystemAnnouncementScreen({super.key});

  @override
  State<CreateSystemAnnouncementScreen> createState() => _CreateSystemAnnouncementScreenState();
}

class _CreateSystemAnnouncementScreenState extends State<CreateSystemAnnouncementScreen> {
  String _audience = 'All LUNAS users';
  String _priority = 'Standard';
  bool _sendPush = true;
  bool _schedulePublication = false;

  @override
  Widget build(BuildContext context) {
    return AdminPage(
      title: 'Create announcement',
      subtitle: 'Draft a system-wide message',
      showBackButton: true,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const AdminSectionTitle(title: 'Message details'),
          const SizedBox(height: AppSpacing.sm),
          LunasCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                TextFormField(
                  decoration: const InputDecoration(
                    labelText: 'Title',
                    hintText: 'e.g. Scheduled maintenance update',
                    prefixIcon: Icon(Icons.title_rounded),
                  ),
                ),
                const SizedBox(height: AppSpacing.md),
                TextFormField(
                  minLines: 5,
                  maxLines: 7,
                  decoration: const InputDecoration(
                    labelText: 'Message body',
                    hintText: 'Explain what users need to know or do...',
                    alignLabelWithHint: true,
                    prefixIcon: Padding(
                      padding: EdgeInsets.only(bottom: 88),
                      child: Icon(Icons.subject_rounded),
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: AppSpacing.xl),
          const AdminSectionTitle(title: 'Targeting and priority'),
          const SizedBox(height: AppSpacing.sm),
          LunasCard(
            child: Column(
              children: [
                DropdownButtonFormField<String>(
                  value: _audience,
                  decoration: const InputDecoration(
                    labelText: 'Target audience',
                    prefixIcon: Icon(Icons.groups_outlined),
                  ),
                  items: const [
                    DropdownMenuItem(value: 'All LUNAS users', child: Text('All LUNAS users')),
                    DropdownMenuItem(value: 'Citizens', child: Text('Citizens')),
                    DropdownMenuItem(value: 'Field personnel', child: Text('Field personnel')),
                    DropdownMenuItem(value: 'Officials and administrators', child: Text('Officials and administrators')),
                  ],
                  onChanged: (value) => setState(() => _audience = value ?? _audience),
                ),
                const SizedBox(height: AppSpacing.lg),
                Align(
                  alignment: Alignment.centerLeft,
                  child: Text('Priority level', style: Theme.of(context).textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.w800)),
                ),
                const SizedBox(height: AppSpacing.xs),
                Wrap(
                  spacing: AppSpacing.xs,
                  runSpacing: AppSpacing.xs,
                  children: ['Standard', 'Important', 'Urgent']
                      .map(
                        (priority) => ChoiceChip(
                          label: Text(priority),
                          selected: _priority == priority,
                          selectedColor: _priorityColor(priority).withValues(alpha: .18),
                          onSelected: (_) => setState(() => _priority = priority),
                        ),
                      )
                      .toList(),
                ),
              ],
            ),
          ),
          const SizedBox(height: AppSpacing.xl),
          const AdminSectionTitle(title: 'Delivery settings'),
          const SizedBox(height: AppSpacing.sm),
          LunasCard(
            padding: EdgeInsets.zero,
            child: Column(
              children: [
                SwitchListTile.adaptive(
                  value: _sendPush,
                  onChanged: (value) => setState(() => _sendPush = value),
                  secondary: const Icon(Icons.notifications_active_outlined),
                  title: const Text('Push notification'),
                  subtitle: const Text('Send an immediate mobile alert to the selected audience.'),
                ),
                const Divider(height: 1),
                SwitchListTile.adaptive(
                  value: _schedulePublication,
                  onChanged: (value) => setState(() => _schedulePublication = value),
                  secondary: const Icon(Icons.schedule_outlined),
                  title: const Text('Schedule publication'),
                  subtitle: const Text('Set a time for this announcement to go live.'),
                ),
              ],
            ),
          ),
          const SizedBox(height: AppSpacing.xl),
          Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: () => showAdminMessage(context, 'Announcement saved locally as a prototype draft.'),
                  icon: const Icon(Icons.draft_outlined),
                  label: const Text('Save draft'),
                ),
              ),
              const SizedBox(width: AppSpacing.sm),
              Expanded(
                flex: 2,
                child: LunasButton(
                  label: _schedulePublication ? 'Schedule announcement' : 'Publish announcement',
                  icon: Icons.send_outlined,
                  onPressed: () {
                    showAdminMessage(context, 'Announcement delivery is represented as a static local action.');
                    Navigator.pushReplacementNamed(context, AdminRoutes.announcements);
                  },
                ),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.md),
          Text(
            'Live broadcasts require audience authorization, message audit logging, and delivery status tracking.',
            style: Theme.of(context).textTheme.bodySmall,
          ),
        ],
      ),
    );
  }

  Color _priorityColor(String priority) => switch (priority) {
        'Urgent' => AppColorsLight.critical,
        'Important' => AppColorsLight.alert,
        _ => AppColorsLight.brandBase,
      };
}
