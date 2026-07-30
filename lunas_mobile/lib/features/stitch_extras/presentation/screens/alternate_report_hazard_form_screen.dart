import 'package:flutter/material.dart';
import 'package:lunas_mobile/core/theme/app_colors.dart';
import 'package:lunas_mobile/core/theme/app_spacing.dart';
import 'package:lunas_mobile/core/widgets/lunas_app_scaffold.dart';
import 'package:lunas_mobile/core/widgets/lunas_button.dart';
import 'package:lunas_mobile/core/widgets/lunas_card.dart';

class AlternateReportHazardFormScreen extends StatefulWidget {
  const AlternateReportHazardFormScreen({super.key});

  @override
  State<AlternateReportHazardFormScreen> createState() =>
      _AlternateReportHazardFormScreenState();
}

class _AlternateReportHazardFormScreenState
    extends State<AlternateReportHazardFormScreen> {
  String _severity = 'Medium';
  String? _category;

  @override
  Widget build(BuildContext context) {
    return LunasAppScaffold(
      title: 'Report incident',
      subtitle: 'Step 1 of 3 • Details',
      showBackButton: true,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          LunasCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Photo evidence',
                  style: Theme.of(context).textTheme.titleMedium,
                ),
                const SizedBox(height: AppSpacing.sm),
                Container(
                  height: 152,
                  width: double.infinity,
                  decoration: BoxDecoration(
                    color: Theme.of(context).colorScheme.primaryContainer,
                    borderRadius: BorderRadius.circular(AppSpacing.sm),
                    border: Border.all(
                      color: Theme.of(
                        context,
                      ).colorScheme.primary.withValues(alpha: .3),
                    ),
                  ),
                  child: const Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.add_a_photo_outlined, size: 42),
                      SizedBox(height: AppSpacing.xs),
                      Text('Tap to take or upload a photo'),
                    ],
                  ),
                ),
                const SizedBox(height: AppSpacing.sm),
                const Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Icon(
                      Icons.auto_awesome_outlined,
                      color: AppColorsLight.brandBase,
                    ),
                    SizedBox(width: AppSpacing.xs),
                    Expanded(
                      child: Text(
                        'AI can suggest a category and severity after you upload a photo. You review the suggestion before submitting.',
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: AppSpacing.lg),
          DropdownButtonFormField<String>(
            initialValue: _category,
            decoration: const InputDecoration(
              labelText: 'Hazard category',
              prefixIcon: Icon(Icons.category_outlined),
            ),
            items: const [
              DropdownMenuItem(value: 'Road', child: Text('Road')),
              DropdownMenuItem(value: 'Drainage', child: Text('Drainage')),
              DropdownMenuItem(value: 'Water', child: Text('Water')),
              DropdownMenuItem(
                value: 'Electricity',
                child: Text('Electricity'),
              ),
            ],
            onChanged: (value) => setState(() => _category = value),
          ),
          const SizedBox(height: AppSpacing.lg),
          Text(
            'Severity level',
            style: Theme.of(context).textTheme.titleMedium,
          ),
          const SizedBox(height: AppSpacing.sm),
          SegmentedButton<String>(
            segments: const [
              ButtonSegment(value: 'Low', label: Text('Low')),
              ButtonSegment(value: 'Medium', label: Text('Medium')),
              ButtonSegment(value: 'High', label: Text('High')),
            ],
            selected: {_severity},
            onSelectionChanged: (selection) =>
                setState(() => _severity = selection.first),
          ),
          const SizedBox(height: AppSpacing.lg),
          TextFormField(
            minLines: 4,
            maxLines: 6,
            decoration: const InputDecoration(
              labelText: 'Description',
              hintText: 'Provide additional details about the incident.',
              alignLabelWithHint: true,
              prefixIcon: Icon(Icons.description_outlined),
            ),
          ),
          const SizedBox(height: AppSpacing.xl),
          LunasButton(
            label: 'Continue to Location',
            icon: Icons.arrow_forward_rounded,
            onPressed: () => Navigator.pushNamed(context, '/reports/location'),
          ),
        ],
      ),
    );
  }
}
