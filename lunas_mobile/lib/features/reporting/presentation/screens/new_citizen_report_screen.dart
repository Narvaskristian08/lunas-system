import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:lunas_mobile/core/theme/app_spacing.dart';
import 'package:lunas_mobile/core/widgets/lunas_app_bar.dart';
import 'package:lunas_mobile/core/widgets/lunas_button.dart';
import 'package:lunas_mobile/core/widgets/lunas_card.dart';
import 'package:lunas_mobile/features/maps/domain/models/selected_location.dart';
import 'package:lunas_mobile/features/reporting/data/models/category_option.dart';
import 'package:lunas_mobile/features/reporting/domain/models/citizen_report_draft.dart';
import 'package:lunas_mobile/features/reporting/domain/models/evidence_selection.dart';
import 'package:lunas_mobile/features/reporting/presentation/widgets/evidence_preview.dart';
import 'package:lunas_mobile/features/reporting/presentation/widgets/reporting_widgets.dart';
import 'package:lunas_mobile/features/citizen/presentation/screens/citizen_flow_widgets.dart';

class NewCitizenReportScreen extends StatefulWidget {
  const NewCitizenReportScreen({super.key});

  @override
  State<NewCitizenReportScreen> createState() => _NewCitizenReportScreenState();
}

class _NewCitizenReportScreenState extends State<NewCitizenReportScreen> {
  final _formKey = GlobalKey<FormState>();
  final _descriptionController = TextEditingController();
  final _barangayController = TextEditingController();
  CategoryOption? _category;
  EvidenceSelection? _evidence;
  SelectedLocation? _location;

  @override
  void dispose() {
    _descriptionController.dispose();
    _barangayController.dispose();
    super.dispose();
  }

  Future<void> _chooseEvidence() async {
    final evidence = await context.push<EvidenceSelection>('/reports/evidence');
    if (mounted && evidence != null) setState(() => _evidence = evidence);
  }

  Future<void> _chooseCategory() async {
    final category = await context.push<CategoryOption>(
      '/reports/categories',
      extra: _category,
    );
    if (mounted && category != null) setState(() => _category = category);
  }

  Future<void> _chooseLocation() async {
    final location = await context.push<SelectedLocation>(
      '/reports/location',
      extra: _location,
    );
    if (mounted && location != null) setState(() => _location = location);
  }

  void _review() {
    final formValid = _formKey.currentState?.validate() ?? false;
    if (!formValid) return;
    if (_evidence == null) {
      _showRequired('Add a clear evidence image before continuing.');
      return;
    }
    if (_category == null) {
      _showRequired('Select the infrastructure category.');
      return;
    }
    if (_location == null || !_location!.isValid) {
      _showRequired('Choose and confirm a valid report location.');
      return;
    }
    final draft = CitizenReportDraft(
      category: _category!,
      description: _descriptionController.text.trim(),
      location: _location!,
      barangay: _barangayController.text.trim(),
      evidence: _evidence!,
      privacyAcknowledged: false,
    );
    context.push('/reports/review', extra: draft);
  }

  void _showRequired(String message) => ScaffoldMessenger.of(
    context,
  ).showSnackBar(SnackBar(content: Text(message)));

  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: const LunasAppBar(
      title: 'Report Incident',
      subtitle: 'Details',
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
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const ReportProgressIndicator(current: 1, total: 3),
              const SizedBox(height: AppSpacing.xl),
              Text('Step 1 of 3: Details', style: Theme.of(context).textTheme.labelMedium),
              const SizedBox(height: AppSpacing.sm),
              _StepLabel(number: '1', label: 'Evidence'),
              const SizedBox(height: AppSpacing.sm),
              LunasCard(
                onTap: _chooseEvidence,
                padding: _evidence == null
                    ? const EdgeInsets.all(AppSpacing.lg)
                    : EdgeInsets.zero,
                child: _evidence == null
                    ? const Row(
                        children: [
                          Icon(Icons.add_a_photo_outlined),
                          SizedBox(width: AppSpacing.md),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text('Add photo evidence'),
                                SizedBox(height: AppSpacing.xxs),
                                Text('Required · camera or photo library'),
                              ],
                            ),
                          ),
                          Icon(Icons.chevron_right_rounded),
                        ],
                      )
                    : Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          LocalEvidencePreview(
                            evidence: _evidence!,
                            height: 170,
                          ),
                          Padding(
                            padding: const EdgeInsets.all(AppSpacing.md),
                            child: Row(
                              children: [
                                const Icon(Icons.image_outlined),
                                const SizedBox(width: AppSpacing.sm),
                                Expanded(child: Text(_evidence!.filename)),
                                const Icon(Icons.edit_outlined),
                              ],
                            ),
                          ),
                        ],
                      ),
              ),
              const SizedBox(height: AppSpacing.md),
              CitizenAccentCard(
                accent: Theme.of(context).colorScheme.primary,
                color: Theme.of(context).colorScheme.primaryContainer.withValues(alpha: .45),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Icon(Icons.auto_awesome_outlined, color: Theme.of(context).colorScheme.primary),
                    const SizedBox(width: AppSpacing.sm),
                    const Expanded(child: Text('AI Hazard Detection\nYour evidence may receive advisory category and severity assistance after submission.')),
                  ],
                ),
              ),
              const SizedBox(height: AppSpacing.xxl),
              _StepLabel(number: '2', label: 'Issue details'),
              const SizedBox(height: AppSpacing.sm),
              LunasCard(
                onTap: _chooseCategory,
                child: Row(
                  children: [
                    const Icon(Icons.category_outlined),
                    const SizedBox(width: AppSpacing.md),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(_category?.label ?? 'Select category'),
                          const SizedBox(height: AppSpacing.xxs),
                          Text(
                            _category == null
                                ? 'Required · choose the best matching concern'
                                : _category!.description,
                            style: Theme.of(context).textTheme.bodySmall,
                          ),
                        ],
                      ),
                    ),
                    const Icon(Icons.chevron_right_rounded),
                  ],
                ),
              ),
              const SizedBox(height: AppSpacing.md),
              TextFormField(
                controller: _descriptionController,
                minLines: 4,
                maxLines: 7,
                maxLength: 500,
                textCapitalization: TextCapitalization.sentences,
                decoration: const InputDecoration(
                  labelText: 'Describe the issue',
                  hintText:
                      'Describe what is damaged, where it is, and any immediate danger.',
                  alignLabelWithHint: true,
                ),
                validator: (value) => (value?.trim().length ?? 0) < 10
                    ? 'Add at least 10 characters of useful detail.'
                    : null,
              ),
              const SizedBox(height: AppSpacing.xxl),
              _StepLabel(number: '3', label: 'Location'),
              const SizedBox(height: AppSpacing.sm),
              LunasCard(
                onTap: _chooseLocation,
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Icon(Icons.location_on_outlined),
                    const SizedBox(width: AppSpacing.md),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            _location?.address ?? 'Choose and confirm location',
                          ),
                          if (_location != null) ...[
                            const SizedBox(height: AppSpacing.xxs),
                            Text(
                              _location!.coordinates,
                              style: Theme.of(context).textTheme.bodySmall,
                            ),
                          ] else
                            Text(
                              'Required · use GPS or tap the map',
                              style: Theme.of(context).textTheme.bodySmall,
                            ),
                        ],
                      ),
                    ),
                    const Icon(Icons.chevron_right_rounded),
                  ],
                ),
              ),
              const SizedBox(height: AppSpacing.md),
              TextFormField(
                controller: _barangayController,
                textCapitalization: TextCapitalization.words,
                decoration: const InputDecoration(
                  labelText: 'Barangay',
                  hintText: 'e.g. Barangay 5',
                  prefixIcon: Icon(Icons.account_balance_outlined),
                ),
                validator: (value) => value == null || value.trim().isEmpty
                    ? 'Enter the barangay where the issue is located.'
                    : null,
              ),
              const SizedBox(height: AppSpacing.xxl),
              LunasButton(
                label: 'Continue to Location',
                icon: Icons.fact_check_outlined,
                onPressed: _review,
              ),
            ],
          ),
        ),
      ),
    ),
  );
}

class _StepLabel extends StatelessWidget {
  const _StepLabel({required this.number, required this.label});
  final String number;
  final String label;

  @override
  Widget build(BuildContext context) => Row(
    children: [
      CircleAvatar(
        radius: 13,
        backgroundColor: Theme.of(context).colorScheme.primary,
        child: Text(number, style: const TextStyle(color: Colors.white)),
      ),
      const SizedBox(width: AppSpacing.sm),
      Text(label, style: Theme.of(context).textTheme.titleLarge),
    ],
  );
}
