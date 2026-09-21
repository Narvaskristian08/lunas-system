import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:lunas_mobile/core/theme/app_colors.dart';
import 'package:lunas_mobile/core/theme/app_radius.dart';
import 'package:lunas_mobile/core/theme/app_spacing.dart';
import 'package:lunas_mobile/core/widgets/lunas_card.dart';
import 'package:lunas_mobile/features/operations/presentation/screens/operations_routes.dart';
import 'package:lunas_mobile/features/operations/presentation/screens/operations_widgets.dart';

class ValidateReportScreen extends StatefulWidget {
  const ValidateReportScreen({super.key});

  @override
  State<ValidateReportScreen> createState() => _ValidateReportScreenState();
}

class _ValidateReportScreenState extends State<ValidateReportScreen> {
  String _priority = 'Medium';
  String _category = 'Road infrastructure';

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    return OperationsPage(
      title: 'Validate report',
      subtitle: 'Official review required',
      bottomAction: OperationsActionBar(
        secondaryLabel: 'Cancel',
        onSecondary: () => Navigator.maybePop(context),
        primaryLabel: 'Confirm validation',
        primaryIcon: Icons.check_circle_outline_rounded,
        onPrimary: () =>
            context.push(OperationsRoutes.assignPersonnel),
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
                  icon: Icons.add_road_outlined,
                  label: 'Citizen evidence preview',
                  detail:
                      'Original media remains attached to the report record.',
                  accent: AppColorsLight.alert,
                  height: 160,
                ),
                const SizedBox(height: AppSpacing.md),
                Row(
                  children: [
                    const OperationsBadge(
                      label: 'INC-2026-0142',
                      color: AppColorsLight.brandBase,
                    ),
                    const Spacer(),
                    Text(
                      'Reported 2h ago',
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
                Text(
                  'A deep pothole is forcing vehicles toward the opposite lane near the intersection. Field review is requested.',
                  style: Theme.of(
                    context,
                  ).textTheme.bodyMedium?.copyWith(height: 1.45),
                ),
                const SizedBox(height: AppSpacing.sm),
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Icon(
                      Icons.location_on_outlined,
                      color: colors.primary,
                      size: 20,
                    ),
                    const SizedBox(width: AppSpacing.xs),
                    Expanded(
                      child: Text(
                        'Corner of A.B. Fernandez Ave. and M.H. del Pilar St., Dagupan City',
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: colors.primary,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: AppSpacing.xxl),
          const OperationsSectionHeading(title: 'Assessed priority level'),
          const SizedBox(height: AppSpacing.sm),
          LayoutBuilder(
            builder: (context, constraints) {
              final width = (constraints.maxWidth - AppSpacing.sm) / 2;
              return Wrap(
                spacing: AppSpacing.sm,
                runSpacing: AppSpacing.sm,
                children: ['Low', 'Medium', 'High', 'Critical']
                    .map(
                      (priority) => SizedBox(
                        width: width,
                        child: _PriorityButton(
                          label: priority,
                          isSelected: _priority == priority,
                          color: _priorityColor(priority),
                          onPressed: () => setState(() => _priority = priority),
                        ),
                      ),
                    )
                    .toList(),
              );
            },
          ),
          const SizedBox(height: AppSpacing.xxl),
          const OperationsSectionHeading(title: 'Confirmed category'),
          const SizedBox(height: AppSpacing.sm),
          DropdownButtonFormField<String>(
            initialValue: _category,
            isExpanded: true,
            decoration: const InputDecoration(
              labelText: 'Category type',
              prefixIcon: Icon(Icons.category_outlined),
            ),
            items: const [
              DropdownMenuItem(
                value: 'Road infrastructure',
                child: Text('Road infrastructure'),
              ),
              DropdownMenuItem(
                value: 'Drainage and flooding',
                child: Text('Drainage and flooding'),
              ),
              DropdownMenuItem(
                value: 'Streetlighting',
                child: Text('Streetlighting'),
              ),
              DropdownMenuItem(
                value: 'Public safety concern',
                child: Text('Public safety concern'),
              ),
            ],
            onChanged: (value) {
              if (value != null) setState(() => _category = value);
            },
          ),
          const SizedBox(height: AppSpacing.xl),
          const OperationsSectionHeading(title: 'Mapped barangay'),
          const SizedBox(height: AppSpacing.sm),
          LunasCard(
            padding: const EdgeInsets.all(AppSpacing.md),
            child: Row(
              children: [
                Icon(Icons.verified_outlined, color: colors.primary),
                const SizedBox(width: AppSpacing.sm),
                Expanded(
                  child: Text(
                    'Barangay Pantal',
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
                TextButton(
                  onPressed: () => _showPrototypeMessage(
                    'Map editing is not connected in this static prototype.',
                  ),
                  child: const Text('Edit map'),
                ),
              ],
            ),
          ),
          const SizedBox(height: AppSpacing.xl),
          Container(
            padding: const EdgeInsets.all(AppSpacing.md),
            decoration: BoxDecoration(
              color: colors.primaryContainer.withValues(alpha: .72),
              borderRadius: AppRadius.card,
              border: Border.all(color: colors.primary.withValues(alpha: .30)),
            ),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Icon(Icons.schedule_outlined, color: colors.primary),
                const SizedBox(width: AppSpacing.sm),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Calculated SLA deadline',
                        style: Theme.of(context).textTheme.titleMedium
                            ?.copyWith(fontWeight: FontWeight.w800),
                      ),
                      const SizedBox(height: AppSpacing.xxs),
                      Text(
                        'Based on the selected $_priority priority and $_category category.',
                        style: Theme.of(context).textTheme.bodySmall,
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: AppSpacing.sm),
                Text(
                  '28 Jul\n17:00',
                  textAlign: TextAlign.right,
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    color: colors.primary,
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: AppSpacing.xl),
          const OperationsSectionHeading(title: 'Validation notes'),
          const SizedBox(height: AppSpacing.sm),
          TextFormField(
            maxLines: 4,
            decoration: const InputDecoration(
              alignLabelWithHint: true,
              hintText:
                  'Record the observed condition, required resources, or immediate hazards...',
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
              color: AppColorsLight.success.withValues(alpha: .08),
              borderRadius: AppRadius.input,
              border: Border.all(
                color: AppColorsLight.success.withValues(alpha: .28),
              ),
            ),
            child: const OperationsInfoRow(
              icon: Icons.auto_awesome_outlined,
              label: 'AI assistance',
              value:
                  'The suggested category is advisory. Confirm or correct it before validating this report.',
            ),
          ),
        ],
      ),
    );
  }

  Color _priorityColor(String priority) {
    if (priority == 'Critical' || priority == 'High') {
      return AppColorsLight.critical;
    }
    if (priority == 'Medium') return AppColorsLight.alert;
    return AppColorsLight.success;
  }

  void _showPrototypeMessage(String message) {
    ScaffoldMessenger.of(
      context,
    ).showSnackBar(SnackBar(content: Text(message)));
  }
}

class _PriorityButton extends StatelessWidget {
  const _PriorityButton({
    required this.label,
    required this.isSelected,
    required this.color,
    required this.onPressed,
  });

  final String label;
  final bool isSelected;
  final Color color;
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      selected: isSelected,
      button: true,
      label: '$label priority',
      child: InkWell(
        onTap: onPressed,
        borderRadius: AppRadius.input,
        child: Container(
          height: 52,
          alignment: Alignment.center,
          decoration: BoxDecoration(
            color: isSelected
                ? color.withValues(alpha: .16)
                : Colors.transparent,
            borderRadius: AppRadius.input,
            border: Border.all(
              color: isSelected
                  ? color
                  : Theme.of(context).colorScheme.outlineVariant,
              width: isSelected ? 2 : 1,
            ),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              if (label == 'Critical') ...[
                Icon(
                  Icons.warning_amber_rounded,
                  size: 18,
                  color: isSelected ? color : null,
                ),
                const SizedBox(width: AppSpacing.xxs),
              ],
              Text(
                label,
                style: Theme.of(context).textTheme.labelLarge?.copyWith(
                  color: isSelected ? color : null,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
