import 'package:flutter/material.dart';
import 'package:lunas_mobile/core/theme/app_spacing.dart';
import 'package:lunas_mobile/core/widgets/lunas_app_bar.dart';
import 'package:lunas_mobile/core/widgets/lunas_button.dart';
import 'package:lunas_mobile/core/widgets/lunas_card.dart';
import 'package:lunas_mobile/features/reporting/presentation/widgets/reporting_widgets.dart';

class EditReportScreen extends StatefulWidget {
  const EditReportScreen({super.key});

  @override
  State<EditReportScreen> createState() => _EditReportScreenState();
}

class _EditReportScreenState extends State<EditReportScreen> {
  final _formKey = GlobalKey<FormState>();
  final _descriptionController = TextEditingController(
    text:
        'The streetlight has been out for several nights and the area is very dark.',
  );
  String _category = 'Streetlights';
  bool _saving = false;

  @override
  void dispose() {
    _descriptionController.dispose();
    super.dispose();
  }

  Future<void> _selectCategory() async {
    final category = await Navigator.pushNamed<String>(
      context,
      '/reports/categories',
      arguments: _category,
    );
    if (category != null && mounted) setState(() => _category = category);
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _saving = true);
    await Future<void>.delayed(const Duration(milliseconds: 350));
    if (!mounted) return;
    setState(() => _saving = false);
    ScaffoldMessenger.of(
      context,
    ).showSnackBar(const SnackBar(content: Text('Report updated.')));
    Navigator.pop(context);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: const LunasAppBar(
        title: 'Edit Report',
        subtitle: 'Update your report information',
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
                const ReportSectionTitle('Report Details'),
                const SizedBox(height: AppSpacing.md),
                LunasCard(
                  onTap: _selectCategory,
                  child: Row(
                    children: [
                      const Icon(Icons.category_outlined),
                      const SizedBox(width: AppSpacing.md),
                      Expanded(child: Text(_category)),
                      const Icon(Icons.chevron_right_rounded),
                    ],
                  ),
                ),
                const SizedBox(height: AppSpacing.md),
                TextFormField(
                  controller: _descriptionController,
                  minLines: 5,
                  maxLines: 8,
                  maxLength: 500,
                  decoration: const InputDecoration(
                    labelText: 'Description',
                    alignLabelWithHint: true,
                  ),
                  validator: (value) => (value?.trim().length ?? 0) < 12
                      ? 'Add at least 12 characters'
                      : null,
                ),
                const SizedBox(height: AppSpacing.md),
                LunasCard(
                  onTap: () => Navigator.pushNamed(context, '/reports/photo'),
                  child: const Row(
                    children: [
                      Icon(Icons.photo_library_outlined),
                      SizedBox(width: AppSpacing.md),
                      Expanded(child: Text('Manage uploaded photos')),
                      Icon(Icons.chevron_right_rounded),
                    ],
                  ),
                ),
                const SizedBox(height: AppSpacing.xl),
                LunasButton(
                  label: 'Save Changes',
                  isLoading: _saving,
                  onPressed: _save,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
