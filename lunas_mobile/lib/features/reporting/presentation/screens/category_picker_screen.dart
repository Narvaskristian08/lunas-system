import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:lunas_mobile/core/app_services.dart';
import 'package:lunas_mobile/core/network/api_exception.dart';
import 'package:lunas_mobile/core/theme/app_spacing.dart';
import 'package:lunas_mobile/core/widgets/lunas_app_bar.dart';
import 'package:lunas_mobile/core/widgets/lunas_state_view.dart';
import 'package:lunas_mobile/features/reporting/data/models/category_option.dart';
import 'package:lunas_mobile/features/reporting/data/services/category_service.dart';
import 'package:lunas_mobile/features/reporting/presentation/widgets/reporting_widgets.dart';

class CategoryPickerScreen extends StatefulWidget {
  const CategoryPickerScreen({this.selected, super.key});
  final CategoryOption? selected;

  @override
  State<CategoryPickerScreen> createState() => _CategoryPickerScreenState();
}

class _CategoryPickerScreenState extends State<CategoryPickerScreen> {
  CategoryLoadResult? _result;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _result = null;
      _error = null;
    });
    try {
      final result = await categoryService.getCategories();
      if (mounted) setState(() => _result = result);
    } on ApiException catch (error) {
      if (mounted) setState(() => _error = error.message);
    }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: const LunasAppBar(
      title: 'Select category',
      subtitle: 'Choose the category that fits the issue.',
      showBackButton: true,
    ),
    body: SafeArea(
      top: false,
      child: _result == null && _error == null
          ? const LunasStateView(
              state: LunasViewState.loading,
              title: 'Loading categories',
              message: 'Getting the supported report categories.',
            )
          : _error != null
          ? LunasStateView(
              state: LunasViewState.error,
              title: 'Could not load categories',
              message: _error!,
              actionLabel: 'Try again',
              onAction: _load,
            )
          : ListView.separated(
              padding: const EdgeInsets.fromLTRB(
                AppSpacing.xl,
                AppSpacing.md,
                AppSpacing.xl,
                AppSpacing.hero,
              ),
              itemCount: _result!.categories.length +
                  (_result!.usingConfiguredFallback ? 1 : 0),
              separatorBuilder: (_, _) => const SizedBox(height: AppSpacing.sm),
              itemBuilder: (context, index) {
                if (_result!.usingConfiguredFallback && index == 0) {
                  return Container(
                    padding: const EdgeInsets.all(AppSpacing.md),
                    decoration: BoxDecoration(
                      color: Theme.of(context).colorScheme.tertiaryContainer,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Text(
                      'The category service is unavailable. You can still use the supported manual categories below.',
                    ),
                  );
                }
                final category = _result!.categories[
                    index - (_result!.usingConfiguredFallback ? 1 : 0)];
                return ReportCategoryTile(
                  label: category.label,
                  description: category.description,
                  icon: _categoryIcon(category.code),
                  color: Theme.of(context).colorScheme.primary,
                  selected: widget.selected?.code == category.code,
                  onTap: () => context.pop(category),
                );
              },
            ),
    ),
  );
}

IconData _categoryIcon(String code) => switch (code) {
  'road' => Icons.add_road_rounded,
  'drainage' => Icons.water_damage_outlined,
  'electrical' => Icons.electric_bolt_outlined,
  'water' => Icons.water_drop_outlined,
  'gas' => Icons.local_fire_department_outlined,
  'streetlight' => Icons.lightbulb_outline_rounded,
  _ => Icons.report_problem_outlined,
};
