import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:lunas_mobile/core/theme/app_colors.dart';
import 'package:lunas_mobile/core/theme/app_radius.dart';
import 'package:lunas_mobile/core/theme/app_spacing.dart';
import 'package:lunas_mobile/core/widgets/lunas_card.dart';
import 'package:lunas_mobile/features/repair/presentation/screens/repair_routes.dart';
import 'package:lunas_mobile/features/repair/presentation/screens/repair_widgets.dart';

/// Local field-update demo for an in-progress repair.
///
/// The values intentionally remain in widget state until a work-order API is
/// available. This keeps the percentage interaction usable without implying
/// that a repair update has been persisted remotely.
class UpdateRepairProgressScreen extends StatefulWidget {
  const UpdateRepairProgressScreen({super.key});

  @override
  State<UpdateRepairProgressScreen> createState() =>
      _UpdateRepairProgressScreenState();
}

class _UpdateRepairProgressScreenState
    extends State<UpdateRepairProgressScreen> {
  static const _sitePreparationStage = 'Site preparation';
  static const _resurfacingStage = 'Resurfacing base layer';
  static const _finalInspectionStage = 'Final inspection';

  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _percentageController;

  int _progressPercent = 65;
  String _selectedStage = _resurfacingStage;
  String _lastUpdatedLabel = 'Last updated 10 minutes ago';

  bool get _isReadyForCompletion =>
      _progressPercent == 100 && _selectedStage == _finalInspectionStage;

  String? get _completionConstraint {
    if (_progressPercent == 100 && _selectedStage != _finalInspectionStage) {
      return 'Select Final inspection before marking this task ready for completion.';
    }
    if (_selectedStage == _finalInspectionStage && _progressPercent < 100) {
      return '${100 - _progressPercent}% remains before this task can be marked ready for completion.';
    }
    return null;
  }

  @override
  void initState() {
    super.initState();
    _percentageController = TextEditingController(text: '$_progressPercent');
  }

  @override
  void dispose() {
    _percentageController.dispose();
    super.dispose();
  }

  void _setProgressFromSlider(double value) {
    final percentage = value.round();
    if (percentage == _progressPercent) return;

    setState(() {
      _progressPercent = percentage;
      _percentageController.value = TextEditingValue(
        text: '$percentage',
        selection: TextSelection.collapsed(offset: '$percentage'.length),
      );
    });
  }

  void _onPercentageChanged(String value) {
    final percentage = int.tryParse(value);
    if (percentage == null || percentage < 0 || percentage > 100) {
      return;
    }

    if (percentage != _progressPercent) {
      setState(() => _progressPercent = percentage);
    }
  }

  String? _validatePercentage(String? value) {
    final percentage = int.tryParse(value?.trim() ?? '');
    if (percentage == null) {
      return 'Enter a whole number from 0 to 100.';
    }
    if (percentage < 0 || percentage > 100) {
      return 'Completion must be between 0% and 100%.';
    }
    return null;
  }

  void _saveProgress() {
    if (!(_formKey.currentState?.validate() ?? false)) return;

    if (_progressPercent == 100 && _selectedStage != _finalInspectionStage) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text(
            'Select Final inspection before marking this task ready for completion.',
          ),
        ),
      );
      return;
    }

    setState(() => _lastUpdatedLabel = 'Saved just now — local demo only');
    final completionMessage = _isReadyForCompletion
        ? 'Progress saved locally. This task is ready for completion.'
        : 'Progress saved locally for this UI demo.';
    ScaffoldMessenger.of(
      context,
    ).showSnackBar(SnackBar(content: Text(completionMessage)));
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return RepairPage(
      appBar: const RepairAppBar(
        title: 'Update progress',
        showBackButton: true,
      ),
      child: Form(
        key: _formKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              'WO-2026-0142',
              style: theme.textTheme.headlineLarge?.copyWith(
                fontSize: 28,
                fontWeight: FontWeight.w800,
              ),
            ),
            const SizedBox(height: AppSpacing.xs),
            Row(
              children: [
                Icon(
                  Icons.location_on_outlined,
                  color: theme.colorScheme.onSurfaceVariant,
                  size: 18,
                ),
                const SizedBox(width: AppSpacing.xs),
                Expanded(
                  child: Text(
                    'Pantal drainage outfall, Dagupan City',
                    style: theme.textTheme.bodyMedium,
                  ),
                ),
              ],
            ),
            const SizedBox(height: AppSpacing.xl),
            _ProgressSummary(
              progressPercent: _progressPercent,
              stage: _selectedStage,
              lastUpdatedLabel: _lastUpdatedLabel,
            ),
            const SizedBox(height: AppSpacing.xl),
            Text('Completion percentage', style: theme.textTheme.titleMedium),
            const SizedBox(height: AppSpacing.xs),
            Text(
              'Set a whole-number estimate from 0% to 100%. You can type a value or use the slider.',
              style: theme.textTheme.bodySmall,
            ),
            const SizedBox(height: AppSpacing.sm),
            TextFormField(
              controller: _percentageController,
              keyboardType: TextInputType.number,
              textInputAction: TextInputAction.next,
              inputFormatters: [FilteringTextInputFormatter.digitsOnly],
              autovalidateMode: AutovalidateMode.onUserInteraction,
              validator: _validatePercentage,
              onChanged: _onPercentageChanged,
              decoration: const InputDecoration(
                labelText: 'Completion percentage',
                helperText: 'Whole number between 0 and 100',
                prefixIcon: Icon(Icons.percent_rounded),
                suffixText: '%',
              ),
            ),
            Semantics(
              label: 'Repair completion percentage',
              value: '$_progressPercent percent',
              hint: 'Use the slider to adjust the completion percentage.',
              child: Slider(
                value: _progressPercent.toDouble(),
                min: 0,
                max: 100,
                divisions: 100,
                label: '$_progressPercent%',
                semanticFormatterCallback: (value) =>
                    '${value.round()} percent complete',
                onChanged: _setProgressFromSlider,
              ),
            ),
            const Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [Text('0%'), Text('100%')],
            ),
            const SizedBox(height: AppSpacing.xl),
            Text('Repair status', style: theme.textTheme.titleMedium),
            const SizedBox(height: AppSpacing.xs),
            DropdownButtonFormField<String>(
              initialValue: _selectedStage,
              decoration: const InputDecoration(
                labelText: 'Current repair stage',
                helperText: 'Select the stage that matches this update.',
                prefixIcon: Icon(Icons.handyman),
              ),
              items: const [
                DropdownMenuItem(
                  value: _sitePreparationStage,
                  child: Text(_sitePreparationStage),
                ),
                DropdownMenuItem(
                  value: _resurfacingStage,
                  child: Text(_resurfacingStage),
                ),
                DropdownMenuItem(
                  value: _finalInspectionStage,
                  child: Text(_finalInspectionStage),
                ),
              ],
              onChanged: (stage) {
                if (stage == null) return;
                setState(() => _selectedStage = stage);
              },
            ),
            const SizedBox(height: AppSpacing.md),
            _CompletionReadinessCard(
              isReadyForCompletion: _isReadyForCompletion,
              constraint: _completionConstraint,
            ),
            const SizedBox(height: AppSpacing.xl),
            Text('Progress notes', style: theme.textTheme.titleMedium),
            const SizedBox(height: AppSpacing.xs),
            const TextField(
              maxLines: 4,
              maxLength: 500,
              decoration: InputDecoration(
                hintText: 'Enter details about the current progress…',
                prefixIcon: Padding(
                  padding: EdgeInsets.only(bottom: 64),
                  child: Icon(Icons.edit_note_rounded),
                ),
              ),
            ),
            const SizedBox(height: AppSpacing.lg),
            Text('Visual evidence', style: theme.textTheme.titleMedium),
            const SizedBox(height: AppSpacing.sm),
            _EvidenceRow(
              onUpload: () =>
                  Navigator.pushNamed(context, RepairRoutes.uploadEvidence),
            ),
            const SizedBox(height: AppSpacing.xl),
            const Divider(),
            const SizedBox(height: AppSpacing.lg),
            RepairPrimaryButton(
              label: _isReadyForCompletion
                  ? 'Save & mark ready for completion'
                  : 'Save progress',
              icon: Icons.save_outlined,
              onPressed: _saveProgress,
            ),
            const SizedBox(height: AppSpacing.sm),
            RepairSecondaryButton(
              label: 'Add or review evidence',
              icon: Icons.add_a_photo_outlined,
              onPressed: () =>
                  Navigator.pushNamed(context, RepairRoutes.uploadEvidence),
            ),
          ],
        ),
      ),
    );
  }
}

class _ProgressSummary extends StatelessWidget {
  const _ProgressSummary({
    required this.progressPercent,
    required this.stage,
    required this.lastUpdatedLabel,
  });

  final int progressPercent;
  final String stage;
  final String lastUpdatedLabel;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return LunasCard(
      child: LayoutBuilder(
        builder: (context, constraints) {
          final stacked = constraints.maxWidth < 390;
          final ring = _ProgressRing(
            value: progressPercent / 100,
            label: '$progressPercent%',
          );
          final details = Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Current completion',
                style: theme.textTheme.titleLarge?.copyWith(
                  fontWeight: FontWeight.w800,
                ),
              ),
              const SizedBox(height: AppSpacing.xs),
              Semantics(
                liveRegion: true,
                child: Text(
                  '$progressPercent% complete',
                  style: theme.textTheme.titleMedium?.copyWith(
                    color: theme.colorScheme.primary,
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ),
              const SizedBox(height: AppSpacing.xxs),
              Text(lastUpdatedLabel, style: theme.textTheme.bodyMedium),
              const SizedBox(height: AppSpacing.sm),
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: AppSpacing.sm,
                  vertical: AppSpacing.xs,
                ),
                decoration: BoxDecoration(
                  color: theme.colorScheme.primaryContainer.withValues(
                    alpha: .5,
                  ),
                  borderRadius: BorderRadius.circular(AppRadius.pill),
                ),
                child: Text(
                  'Stage: $stage',
                  style: theme.textTheme.labelMedium?.copyWith(
                    color: theme.colorScheme.onPrimaryContainer,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
            ],
          );
          return Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              if (stacked) ...[
                Center(child: ring),
                const SizedBox(height: AppSpacing.md),
                details,
              ] else
                Row(
                  children: [
                    ring,
                    const SizedBox(width: AppSpacing.lg),
                    Expanded(child: details),
                  ],
                ),
              const SizedBox(height: AppSpacing.lg),
              Container(
                padding: const EdgeInsets.all(AppSpacing.md),
                decoration: BoxDecoration(
                  color: theme.colorScheme.primaryContainer.withValues(
                    alpha: .62,
                  ),
                  borderRadius: BorderRadius.circular(AppRadius.sm),
                ),
                child: Row(
                  children: [
                    CircleAvatar(
                      backgroundColor: theme.colorScheme.primary,
                      foregroundColor: theme.colorScheme.onPrimary,
                      child: const Icon(Icons.timer_outlined),
                    ),
                    const SizedBox(width: AppSpacing.sm),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Estimated remaining time',
                          style: theme.textTheme.bodySmall,
                        ),
                        Text(
                          '45 minutes',
                          style: theme.textTheme.titleMedium?.copyWith(
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}

class _CompletionReadinessCard extends StatelessWidget {
  const _CompletionReadinessCard({
    required this.isReadyForCompletion,
    required this.constraint,
  });

  final bool isReadyForCompletion;
  final String? constraint;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final color = isReadyForCompletion
        ? AppColorsLight.success
        : AppColorsLight.alert;
    final title = isReadyForCompletion
        ? 'Ready for completion'
        : 'Not ready for completion';
    final description = isReadyForCompletion
        ? 'Final inspection is selected and progress is 100%. Evidence and attestation are still confirmed on the completion screen.'
        : constraint ??
              'Set progress to 100% during Final inspection before submitting the repair for completion.';

    return Semantics(
      liveRegion: true,
      child: LunasCard(
        color: color.withValues(alpha: .10),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            CircleAvatar(
              backgroundColor: color.withValues(alpha: .16),
              foregroundColor: color,
              child: Icon(
                isReadyForCompletion
                    ? Icons.check_circle_outline_rounded
                    : Icons.pending_actions_outlined,
              ),
            ),
            const SizedBox(width: AppSpacing.sm),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: theme.textTheme.titleMedium?.copyWith(
                      color: color,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  const SizedBox(height: AppSpacing.xxs),
                  Text(description, style: theme.textTheme.bodySmall),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ProgressRing extends StatelessWidget {
  const _ProgressRing({required this.value, required this.label});

  final double value;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      label: 'Current repair completion',
      value: label,
      child: ExcludeSemantics(
        child: SizedBox(
          width: 112,
          height: 112,
          child: Stack(
            alignment: Alignment.center,
            children: [
              CircularProgressIndicator(
                value: value,
                strokeWidth: 10,
                backgroundColor: Theme.of(
                  context,
                ).colorScheme.primary.withValues(alpha: .16),
              ),
              Text(
                label,
                style: Theme.of(context).textTheme.titleLarge?.copyWith(
                  color: Theme.of(context).colorScheme.primary,
                  fontWeight: FontWeight.w800,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _EvidenceRow extends StatelessWidget {
  const _EvidenceRow({required this.onUpload});

  final VoidCallback onUpload;

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final isNarrow = constraints.maxWidth < 460;
        final preview = const RepairPlaceholderImage(
          label: 'Latest field photo',
          detail: 'Photo attached',
          icon: Icons.construction_rounded,
          height: 132,
          accentColor: AppColorsLight.success,
        );
        final upload = InkWell(
          onTap: onUpload,
          borderRadius: BorderRadius.circular(AppRadius.sm),
          child: Container(
            height: 132,
            decoration: BoxDecoration(
              border: Border.all(
                color: Theme.of(context).colorScheme.outline,
                style: BorderStyle.solid,
              ),
              borderRadius: BorderRadius.circular(AppRadius.sm),
            ),
            child: Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(
                    Icons.add_a_photo_outlined,
                    color: Theme.of(context).colorScheme.primary,
                    size: 30,
                  ),
                  const SizedBox(height: AppSpacing.xs),
                  Text(
                    'Upload photo',
                    style: Theme.of(context).textTheme.labelLarge?.copyWith(
                      color: Theme.of(context).colorScheme.primary,
                    ),
                  ),
                ],
              ),
            ),
          ),
        );
        if (isNarrow) {
          return Column(
            children: [
              preview,
              const SizedBox(height: AppSpacing.sm),
              SizedBox(width: double.infinity, child: upload),
            ],
          );
        }
        return Row(
          children: [
            const Expanded(
              child: RepairPlaceholderImage(
                label: 'Latest field photo',
                detail: 'Photo attached',
                icon: Icons.construction_rounded,
                height: 132,
                accentColor: AppColorsLight.success,
              ),
            ),
            const SizedBox(width: AppSpacing.sm),
            Expanded(child: upload),
          ],
        );
      },
    );
  }
}
