import 'package:flutter/material.dart';
import 'package:lunas_mobile/core/theme/app_radius.dart';
import 'package:lunas_mobile/core/theme/app_spacing.dart';
import 'package:lunas_mobile/core/widgets/lunas_app_scaffold.dart';
import 'package:lunas_mobile/core/widgets/lunas_button.dart';
import 'package:lunas_mobile/core/widgets/lunas_card.dart';
import 'package:lunas_mobile/features/reporting/presentation/widgets/reporting_widgets.dart';

class CreateReportScreen extends StatefulWidget {
  const CreateReportScreen({super.key});

  @override
  State<CreateReportScreen> createState() => _CreateReportScreenState();
}

class _CreateReportScreenState extends State<CreateReportScreen> {
  final _formKey = GlobalKey<FormState>();
  final _descriptionController = TextEditingController();
  String _category = 'Roads & Sidewalks';
  String? _photoReference;
  String _location = 'Use my current location';
  bool _isSubmitting = false;

  @override
  void dispose() {
    _descriptionController.dispose();
    super.dispose();
  }

  Future<void> _selectPhoto() async {
    final result = await Navigator.pushNamed<String>(context, '/reports/photo');
    if (result != null && mounted) setState(() => _photoReference = result);
  }

  Future<void> _selectLocation() async {
    final result = await Navigator.pushNamed<String>(
      context,
      '/reports/location',
    );
    if (result != null && mounted) setState(() => _location = result);
  }

  Future<void> _selectCategory() async {
    final result = await Navigator.pushNamed<String>(
      context,
      '/reports/categories',
      arguments: _category,
    );
    if (result != null && mounted) setState(() => _category = result);
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    if (_photoReference == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Add a photo before submitting.')),
      );
      return;
    }
    setState(() => _isSubmitting = true);
    await Future<void>.delayed(const Duration(milliseconds: 450));
    if (!mounted) return;
    setState(() => _isSubmitting = false);
    Navigator.pushReplacementNamed(context, '/reports/status');
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return LunasAppScaffold(
      title: 'Create Report',
      subtitle: 'Tell us about the issue',
      selectedIndex: 3,
      actions: [
        IconButton(
          onPressed: () => Navigator.pushNamed(context, '/reports/history'),
          tooltip: 'My reports',
          icon: const Icon(Icons.history_rounded),
        ),
        const SizedBox(width: AppSpacing.sm),
      ],
      child: Form(
        key: _formKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const ReportSectionTitle('Add Photos'),
            const SizedBox(height: AppSpacing.sm),
            LunasCard(
              padding: EdgeInsets.zero,
              child: ClipRRect(
                borderRadius: AppRadius.card,
                child: AspectRatio(
                  aspectRatio: 16 / 10,
                  child: InkWell(
                    onTap: _selectPhoto,
                    child: ColoredBox(
                      color: theme.colorScheme.primaryContainer.withValues(
                        alpha: .35,
                      ),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(
                            _photoReference == null
                                ? Icons.add_a_photo_outlined
                                : Icons.check_circle_rounded,
                            size: 48,
                            color: theme.colorScheme.primary,
                          ),
                          const SizedBox(height: AppSpacing.sm),
                          Text(
                            _photoReference == null
                                ? 'Upload clear photos of the issue'
                                : 'Photo added successfully',
                            style: theme.textTheme.titleMedium,
                          ),
                          const SizedBox(height: AppSpacing.xxs),
                          Text(
                            _photoReference == null
                                ? 'Camera or photo library'
                                : 'Tap to replace the photo',
                            style: theme.textTheme.bodySmall,
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
            ),
            const SizedBox(height: AppSpacing.xxl),
            const ReportSectionTitle('Report Details'),
            const SizedBox(height: AppSpacing.md),
            Text('Category', style: theme.textTheme.labelLarge),
            const SizedBox(height: AppSpacing.sm),
            LunasCard(
              onTap: _selectCategory,
              child: Row(
                children: [
                  Icon(
                    Icons.category_outlined,
                    color: theme.colorScheme.primary,
                  ),
                  const SizedBox(width: AppSpacing.md),
                  Expanded(
                    child: Text(_category, style: theme.textTheme.titleMedium),
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
              decoration: const InputDecoration(
                labelText: 'Description',
                hintText: 'Describe what happened and why it needs attention.',
                alignLabelWithHint: true,
              ),
              validator: (value) => (value?.trim().length ?? 0) < 12
                  ? 'Add at least 12 characters of incident detail'
                  : null,
            ),
            const SizedBox(height: AppSpacing.md),
            LunasCard(
              onTap: _selectLocation,
              child: Row(
                children: [
                  Icon(
                    Icons.location_on_outlined,
                    color: theme.colorScheme.primary,
                  ),
                  const SizedBox(width: AppSpacing.md),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Report location',
                          style: theme.textTheme.labelSmall,
                        ),
                        Text(_location, style: theme.textTheme.titleMedium),
                      ],
                    ),
                  ),
                  const Icon(Icons.chevron_right_rounded),
                ],
              ),
            ),
            const SizedBox(height: AppSpacing.xl),
            LunasButton(
              label: 'Submit Report',
              icon: Icons.send_rounded,
              isLoading: _isSubmitting,
              onPressed: _submit,
            ),
            const SizedBox(height: AppSpacing.sm),
            OutlinedButton(
              onPressed: () => ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Report saved as draft.')),
              ),
              child: const Text('Save as Draft'),
            ),
          ],
        ),
      ),
    );
  }
}
