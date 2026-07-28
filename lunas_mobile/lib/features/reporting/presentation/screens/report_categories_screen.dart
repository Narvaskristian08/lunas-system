import 'package:flutter/material.dart';
import 'package:lunas_mobile/core/theme/app_colors.dart';
import 'package:lunas_mobile/core/theme/app_spacing.dart';
import 'package:lunas_mobile/core/widgets/lunas_app_bar.dart';
import 'package:lunas_mobile/features/reporting/presentation/widgets/reporting_widgets.dart';

class ReportCategoriesScreen extends StatelessWidget {
  const ReportCategoriesScreen({super.key});

  static const _categories = [
    (
      'Roads & Sidewalks',
      'Potholes, damaged roads, and unsafe walkways',
      Icons.add_road_rounded,
      AppColorsLight.alert,
    ),
    (
      'Streetlights',
      'Broken or damaged public lighting',
      Icons.lightbulb_outline_rounded,
      Color(0xFF7C3AED),
    ),
    (
      'Drainage & Flooding',
      'Blocked drains, leaks, and flooded areas',
      Icons.water_damage_outlined,
      AppColorsLight.info,
    ),
    (
      'Waste & Sanitation',
      'Uncollected waste and sanitation concerns',
      Icons.delete_outline_rounded,
      AppColorsLight.success,
    ),
    (
      'Public Safety',
      'Hazards requiring urgent community attention',
      Icons.health_and_safety_outlined,
      AppColorsLight.critical,
    ),
    (
      'Other Concern',
      'Issues not covered by another category',
      Icons.more_horiz_rounded,
      AppColorsLight.textSecondary,
    ),
  ];

  @override
  Widget build(BuildContext context) {
    final selected = ModalRoute.of(context)?.settings.arguments as String?;
    return Scaffold(
      appBar: const LunasAppBar(
        title: 'Select Category',
        subtitle: 'What type of issue are you reporting?',
        showBackButton: true,
      ),
      body: SafeArea(
        top: false,
        child: ListView.separated(
          padding: const EdgeInsets.fromLTRB(
            AppSpacing.xl,
            AppSpacing.md,
            AppSpacing.xl,
            AppSpacing.hero,
          ),
          itemCount: _categories.length,
          separatorBuilder: (_, _) => const SizedBox(height: AppSpacing.sm),
          itemBuilder: (context, index) {
            final item = _categories[index];
            return ReportCategoryTile(
              label: item.$1,
              description: item.$2,
              icon: item.$3,
              color: item.$4,
              selected: selected == item.$1,
              onTap: () => Navigator.pop(context, item.$1),
            );
          },
        ),
      ),
    );
  }
}
