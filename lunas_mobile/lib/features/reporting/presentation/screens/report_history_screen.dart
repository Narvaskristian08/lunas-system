import 'package:flutter/material.dart';
import 'package:lunas_mobile/core/theme/app_colors.dart';
import 'package:lunas_mobile/core/theme/app_spacing.dart';
import 'package:lunas_mobile/core/widgets/lunas_app_bar.dart';
import 'package:lunas_mobile/core/widgets/lunas_card.dart';
import 'package:lunas_mobile/features/reporting/presentation/widgets/reporting_widgets.dart';

class ReportHistoryScreen extends StatefulWidget {
  const ReportHistoryScreen({super.key});

  @override
  State<ReportHistoryScreen> createState() => _ReportHistoryScreenState();
}

class _ReportHistoryScreenState extends State<ReportHistoryScreen> {
  String _filter = 'All';

  static const _reports = [
    (
      'RPT-2026-0142',
      'Broken Streetlight',
      'Rizal Avenue, Barangay 5',
      'Today, 9:42 AM',
      'In Progress',
      AppColorsLight.alert,
      Icons.lightbulb_outline_rounded,
    ),
    (
      'RPT-2026-0118',
      'Road Surface Damage',
      'Mabini Street, Barangay 8',
      'July 24, 3:15 PM',
      'Verified',
      AppColorsLight.info,
      Icons.add_road_rounded,
    ),
    (
      'RPT-2026-0093',
      'Clogged Drainage',
      'Quezon Street, Barangay 6',
      'July 19, 11:08 AM',
      'Resolved',
      AppColorsLight.success,
      Icons.water_damage_outlined,
    ),
  ];

  @override
  Widget build(BuildContext context) {
    final reports = _filter == 'All'
        ? _reports
        : _reports.where((item) => item.$5 == _filter).toList();
    return Scaffold(
      appBar: LunasAppBar(
        title: 'My Reports',
        subtitle: 'Track every report you have submitted',
        showBackButton: true,
        actions: [
          IconButton(
            onPressed: () => Navigator.pushNamed(context, '/reports/new'),
            tooltip: 'New report',
            icon: const Icon(Icons.add_rounded),
          ),
        ],
      ),
      body: SafeArea(
        top: false,
        child: Column(
          children: [
            SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(
                horizontal: AppSpacing.xl,
                vertical: AppSpacing.sm,
              ),
              child: Row(
                children: [
                  for (final filter in [
                    'All',
                    'In Progress',
                    'Verified',
                    'Resolved',
                  ])
                    Padding(
                      padding: const EdgeInsets.only(right: AppSpacing.xs),
                      child: ChoiceChip(
                        label: Text(filter),
                        selected: _filter == filter,
                        onSelected: (_) => setState(() => _filter = filter),
                      ),
                    ),
                ],
              ),
            ),
            Expanded(
              child: ListView.separated(
                padding: const EdgeInsets.fromLTRB(
                  AppSpacing.xl,
                  AppSpacing.sm,
                  AppSpacing.xl,
                  AppSpacing.hero,
                ),
                itemCount: reports.length,
                separatorBuilder: (_, _) =>
                    const SizedBox(height: AppSpacing.sm),
                itemBuilder: (context, index) {
                  final report = reports[index];
                  return LunasCard(
                    onTap: () => Navigator.pushNamed(
                      context,
                      '/reports/details',
                      arguments: report.$1,
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Container(
                              width: 48,
                              height: 48,
                              decoration: BoxDecoration(
                                color: report.$6.withValues(alpha: .1),
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Icon(report.$7, color: report.$6),
                            ),
                            const SizedBox(width: AppSpacing.md),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    report.$2,
                                    style: Theme.of(context)
                                        .textTheme
                                        .titleMedium
                                        ?.copyWith(fontWeight: FontWeight.w700),
                                  ),
                                  Text(
                                    report.$1,
                                    style: Theme.of(
                                      context,
                                    ).textTheme.bodySmall,
                                  ),
                                ],
                              ),
                            ),
                            ReportStatusChip(
                              label: report.$5,
                              color: report.$6,
                            ),
                          ],
                        ),
                        const SizedBox(height: AppSpacing.md),
                        Text(
                          report.$3,
                          style: Theme.of(context).textTheme.bodySmall,
                        ),
                        Text(
                          report.$4,
                          style: Theme.of(context).textTheme.bodySmall,
                        ),
                      ],
                    ),
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}
