import 'package:flutter/material.dart';
import 'package:lunas_mobile/core/theme/app_colors.dart';
import 'package:lunas_mobile/core/theme/app_spacing.dart';
import 'package:lunas_mobile/core/widgets/lunas_button.dart';
import 'package:lunas_mobile/core/widgets/lunas_card.dart';
import 'package:lunas_mobile/features/utility/presentation/screens/utility_routes.dart';
import 'package:lunas_mobile/features/utility/presentation/screens/utility_widgets.dart';

/// Native static acceptance form used before a utility team is dispatched.
class AcceptAssignmentScreen extends StatefulWidget {
  const AcceptAssignmentScreen({super.key});

  @override
  State<AcceptAssignmentScreen> createState() => _AcceptAssignmentScreenState();
}

class _AcceptAssignmentScreenState extends State<AcceptAssignmentScreen> {
  String? _selectedTeam;
  bool _responsibilityConfirmed = false;

  @override
  Widget build(BuildContext context) {
    return UtilityPage(
      title: 'Accept assignment',
      subtitle: 'Confirm your team’s deployment',
      showBackButton: true,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(
            'Review the incident details and confirm your team’s deployment.',
            style: Theme.of(context).textTheme.bodyMedium,
          ),
          const SizedBox(height: AppSpacing.lg),
          LunasCard(
            padding: const EdgeInsets.all(AppSpacing.md),
            child: Container(
              decoration: const BoxDecoration(
                border: Border(left: BorderSide(color: AppColorsLight.critical, width: 4)),
              ),
              padding: const EdgeInsets.only(left: AppSpacing.sm),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: const [
                      Expanded(child: Text('#INC-DE-001', style: TextStyle(fontWeight: FontWeight.w800))),
                      UtilityStatusPill(label: 'Critical priority', color: AppColorsLight.critical),
                    ],
                  ),
                  const SizedBox(height: AppSpacing.xs),
                  Text('Sparking transformer', style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w800)),
                  const SizedBox(height: AppSpacing.md),
                  const UtilityDetailRow(label: 'Location', value: 'Near Tapuac Public Market, Dagupan City', icon: Icons.location_on_outlined),
                  const SizedBox(height: AppSpacing.md),
                  const UtilityDetailRow(label: 'Reported', value: 'Today, 08:14 AM', icon: Icons.schedule_outlined),
                ],
              ),
            ),
          ),
          const SizedBox(height: AppSpacing.xl),
          const UtilitySectionTitle(title: 'Deployment details'),
          const SizedBox(height: AppSpacing.sm),
          LunasCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                DropdownButtonFormField<String>(
                  value: _selectedTeam,
                  decoration: const InputDecoration(
                    labelText: 'Select internal repair team',
                    prefixIcon: Icon(Icons.groups_outlined),
                  ),
                  hint: const Text('Select a team...'),
                  items: const [
                    DropdownMenuItem(value: 'Team Alpha', child: Text('Team Alpha — heavy repair')),
                    DropdownMenuItem(value: 'Team Beta', child: Text('Team Beta — rapid response')),
                    DropdownMenuItem(value: 'Team Gamma', child: Text('Team Gamma — diagnostics')),
                  ],
                  onChanged: (value) => setState(() => _selectedTeam = value),
                ),
                const SizedBox(height: AppSpacing.lg),
                TextFormField(
                  decoration: const InputDecoration(
                    labelText: 'Estimated arrival time',
                    hintText: 'e.g. 09:00 AM',
                    prefixIcon: Icon(Icons.schedule_outlined),
                  ),
                ),
                const SizedBox(height: AppSpacing.lg),
                TextFormField(
                  minLines: 3,
                  maxLines: 5,
                  decoration: const InputDecoration(
                    labelText: 'Acknowledgment notes (optional)',
                    hintText: 'Add initial equipment needs or safety conditions...',
                    alignLabelWithHint: true,
                    prefixIcon: Padding(
                      padding: EdgeInsets.only(bottom: 52),
                      child: Icon(Icons.edit_note_outlined),
                    ),
                  ),
                ),
                const SizedBox(height: AppSpacing.md),
                CheckboxListTile(
                  contentPadding: EdgeInsets.zero,
                  value: _responsibilityConfirmed,
                  onChanged: (value) => setState(() => _responsibilityConfirmed = value ?? false),
                  title: const Text('I confirm this utility incident falls under our organization’s responsibility.'),
                  controlAffinity: ListTileControlAffinity.leading,
                ),
              ],
            ),
          ),
          const SizedBox(height: AppSpacing.xl),
          Row(
            children: [
              Expanded(
                child: OutlinedButton(
                  onPressed: () => Navigator.of(context).maybePop(),
                  child: const Text('Cancel'),
                ),
              ),
              const SizedBox(width: AppSpacing.sm),
              Expanded(
                flex: 2,
                child: LunasButton(
                  label: 'Accept assignment',
                  icon: Icons.assignment_turned_in_outlined,
                  onPressed: _acceptAssignment,
                ),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.md),
          Text(
            'This is a static prototype. Live acceptance would notify City Engineering, record the selected team, and start the dispatch SLA timer.',
            style: Theme.of(context).textTheme.bodySmall,
          ),
        ],
      ),
    );
  }

  void _acceptAssignment() {
    if (_selectedTeam == null || !_responsibilityConfirmed) {
      showUtilityMessage(context, 'Select a repair team and confirm responsibility before accepting.');
      return;
    }
    showDialog<void>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        icon: const Icon(Icons.assignment_turned_in_outlined, color: AppColorsLight.brandBase),
        title: const Text('Confirm acceptance?'),
        content: Text('This will notify City Engineering that $_selectedTeam is responding to #INC-DE-001.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(dialogContext).pop(),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.of(dialogContext).pop();
              showUtilityMessage(context, 'Assignment accepted locally for this static prototype.');
              Navigator.pushReplacementNamed(context, UtilityRoutes.incidents);
            },
            child: const Text('Confirm'),
          ),
        ],
      ),
    );
  }
}
