import 'package:flutter/material.dart';
import 'package:lunas_mobile/core/theme/app_colors.dart';
import 'package:lunas_mobile/core/theme/app_radius.dart';
import 'package:lunas_mobile/core/theme/app_spacing.dart';
import 'package:lunas_mobile/core/widgets/lunas_card.dart';
import 'package:lunas_mobile/features/operations/presentation/screens/operations_widgets.dart';

class AssignPersonnelScreen extends StatefulWidget {
  const AssignPersonnelScreen({super.key});

  @override
  State<AssignPersonnelScreen> createState() => _AssignPersonnelScreenState();
}

class _AssignPersonnelScreenState extends State<AssignPersonnelScreen> {
  String _selectedTechnician = 'Leah Ramos';
  String _priority = 'Medium';

  static const _technicians = [
    _Technician(
      name: 'Leah Ramos',
      initials: 'LR',
      specialty: 'Road maintenance',
      workload: '2/5 tasks',
      availability: 'Available',
      isAvailable: true,
    ),
    _Technician(
      name: 'Noel Santos',
      initials: 'NS',
      specialty: 'Electrical systems',
      workload: '4/5 tasks',
      availability: 'Busy — ending soon',
      isAvailable: false,
    ),
    _Technician(
      name: 'Mara de Guzman',
      initials: 'MG',
      specialty: 'Road maintenance',
      workload: '1/5 tasks',
      availability: 'Available',
      isAvailable: true,
    ),
  ];

  @override
  Widget build(BuildContext context) {
    return OperationsPage(
      title: 'Assign personnel',
      subtitle: 'Route a validated work order',
      bottomAction: OperationsActionBar(
        secondaryLabel: 'Cancel',
        onSecondary: () => Navigator.maybePop(context),
        primaryLabel: 'Assign',
        primaryIcon: Icons.send_outlined,
        onPrimary: _assign,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          LunasCard(
            padding: const EdgeInsets.all(AppSpacing.md),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const OperationsVisualPlaceholder(
                  icon: Icons.location_on_outlined,
                  label: 'Mapped incident location',
                  detail: 'Barangay Pantal, Dagupan City',
                  accent: AppColorsLight.brandBase,
                  height: 152,
                ),
                const SizedBox(height: AppSpacing.md),
                Row(
                  children: [
                    const OperationsBadge(
                      label: 'INC-2026-0142',
                      color: AppColorsLight.brandBase,
                    ),
                    const Spacer(),
                    Icon(
                      Icons.schedule_outlined,
                      size: 18,
                      color: Theme.of(context).colorScheme.onSurfaceVariant,
                    ),
                    const SizedBox(width: AppSpacing.xxs),
                    Text(
                      '12m ago',
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                  ],
                ),
                const SizedBox(height: AppSpacing.sm),
                Text(
                  'Large pothole on A.B. Fernandez Ave.',
                  style: Theme.of(
                    context,
                  ).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w800),
                ),
                const SizedBox(height: AppSpacing.xs),
                const OperationsInfoRow(
                  icon: Icons.location_on_outlined,
                  label: 'Location',
                  value: 'Barangay Pantal, Dagupan City',
                ),
                const SizedBox(height: AppSpacing.sm),
                Text(
                  'Repair requires asphalt patching and traffic-safe work area setup. Priority was confirmed by an official reviewer.',
                  style: Theme.of(
                    context,
                  ).textTheme.bodyMedium?.copyWith(height: 1.45),
                ),
              ],
            ),
          ),
          const SizedBox(height: AppSpacing.xxl),
          OperationsSectionHeading(
            title: 'Available technicians',
            trailing: Text(
              '3 nearby',
              style: Theme.of(context).textTheme.bodySmall,
            ),
          ),
          const SizedBox(height: AppSpacing.sm),
          for (final technician in _technicians) ...[
            _TechnicianCard(
              technician: technician,
              isSelected: technician.name == _selectedTechnician,
              onTap: () =>
                  setState(() => _selectedTechnician = technician.name),
            ),
            const SizedBox(height: AppSpacing.sm),
          ],
          const SizedBox(height: AppSpacing.xl),
          const OperationsSectionHeading(title: 'Assignment priority'),
          const SizedBox(height: AppSpacing.sm),
          Container(
            padding: const EdgeInsets.all(AppSpacing.xxs),
            decoration: BoxDecoration(
              color: Theme.of(
                context,
              ).colorScheme.primaryContainer.withValues(alpha: .55),
              borderRadius: AppRadius.input,
            ),
            child: Row(
              children: ['Low', 'Medium', 'High']
                  .map(
                    (priority) => Expanded(
                      child: _SegmentButton(
                        label: priority,
                        isSelected: _priority == priority,
                        onTap: () => setState(() => _priority = priority),
                      ),
                    ),
                  )
                  .toList(),
            ),
          ),
          const SizedBox(height: AppSpacing.xl),
          const OperationsSectionHeading(title: 'Special instructions'),
          const SizedBox(height: AppSpacing.sm),
          TextFormField(
            maxLines: 4,
            decoration: const InputDecoration(
              alignLabelWithHint: true,
              hintText:
                  'Add access notes, traffic controls, or safety requirements for the technician...',
              prefixIcon: Padding(
                padding: EdgeInsets.only(bottom: 72),
                child: Icon(Icons.edit_note_outlined),
              ),
            ),
          ),
          const SizedBox(height: AppSpacing.xl),
          Container(
            padding: const EdgeInsets.all(AppSpacing.md),
            decoration: BoxDecoration(
              color: AppColorsLight.alert.withValues(alpha: .09),
              borderRadius: AppRadius.input,
              border: Border.all(
                color: AppColorsLight.alert.withValues(alpha: .30),
              ),
            ),
            child: const OperationsInfoRow(
              icon: Icons.assignment_ind_outlined,
              label: 'Assignment check',
              value:
                  'Confirm workload and field suitability before dispatching the work order.',
            ),
          ),
        ],
      ),
    );
  }

  void _assign() {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          'Work order assigned to $_selectedTechnician at $_priority priority.',
        ),
      ),
    );
    Navigator.pushNamed(context, '/repair/work-order');
  }
}

class _TechnicianCard extends StatelessWidget {
  const _TechnicianCard({
    required this.technician,
    required this.isSelected,
    required this.onTap,
  });

  final _Technician technician;
  final bool isSelected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    final availabilityColor = technician.isAvailable
        ? AppColorsLight.success
        : AppColorsLight.alert;
    return LunasCard(
      onTap: onTap,
      color: isSelected ? colors.primaryContainer.withValues(alpha: .52) : null,
      padding: const EdgeInsets.all(AppSpacing.md),
      child: Row(
        children: [
          CircleAvatar(
            radius: 24,
            backgroundColor: availabilityColor.withValues(alpha: .18),
            foregroundColor: availabilityColor,
            child: Text(
              technician.initials,
              style: Theme.of(context).textTheme.labelLarge?.copyWith(
                color: availabilityColor,
                fontWeight: FontWeight.w800,
              ),
            ),
          ),
          const SizedBox(width: AppSpacing.md),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  technician.name,
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w800,
                  ),
                ),
                const SizedBox(height: AppSpacing.xxs),
                Text(
                  technician.specialty,
                  style: Theme.of(context).textTheme.bodySmall,
                ),
                const SizedBox(height: AppSpacing.xs),
                Wrap(
                  spacing: AppSpacing.xs,
                  runSpacing: AppSpacing.xxs,
                  children: [
                    OperationsBadge(
                      label: technician.availability,
                      color: availabilityColor,
                    ),
                    OperationsBadge(
                      label: technician.workload,
                      color: colors.onSurfaceVariant,
                      icon: Icons.work_outline_rounded,
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(width: AppSpacing.sm),
          Icon(
            isSelected
                ? Icons.check_circle_rounded
                : Icons.radio_button_unchecked_rounded,
            color: isSelected ? colors.primary : colors.outline,
          ),
        ],
      ),
    );
  }
}

class _SegmentButton extends StatelessWidget {
  const _SegmentButton({
    required this.label,
    required this.isSelected,
    required this.onTap,
  });

  final String label;
  final bool isSelected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    return InkWell(
      onTap: onTap,
      borderRadius: AppRadius.input,
      child: Container(
        height: 44,
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: isSelected ? colors.surface : Colors.transparent,
          borderRadius: AppRadius.input,
          border: isSelected ? Border.all(color: colors.outlineVariant) : null,
        ),
        child: Text(
          label,
          style: Theme.of(context).textTheme.labelLarge?.copyWith(
            color: isSelected ? colors.primary : colors.onSurfaceVariant,
          ),
        ),
      ),
    );
  }
}

class _Technician {
  const _Technician({
    required this.name,
    required this.initials,
    required this.specialty,
    required this.workload,
    required this.availability,
    required this.isAvailable,
  });

  final String name;
  final String initials;
  final String specialty;
  final String workload;
  final String availability;
  final bool isAvailable;
}
