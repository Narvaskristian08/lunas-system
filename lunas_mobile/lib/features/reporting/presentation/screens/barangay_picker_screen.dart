import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:lunas_mobile/core/theme/app_spacing.dart';
import 'package:lunas_mobile/core/widgets/lunas_app_bar.dart';
import 'package:lunas_mobile/core/widgets/lunas_card.dart';

class BarangayPickerScreen extends StatefulWidget {
  const BarangayPickerScreen({required this.barangays, super.key});
  final List<String> barangays;

  @override
  State<BarangayPickerScreen> createState() => BarangayPickerScreenState();
}

class BarangayPickerScreenState extends State<BarangayPickerScreen> {
  final _search = TextEditingController();

  @override
  void dispose() {
    _search.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final query = _search.text.trim().toLowerCase();
    final matches = widget.barangays
        .where((name) => name.toLowerCase().contains(query))
        .toList();
    return Scaffold(
      appBar: const LunasAppBar(
        title: 'Select Barangay',
        subtitle: 'Choose where the issue is located.',
        showBackButton: true,
      ),
      body: SafeArea(
        top: false,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(
                AppSpacing.xl,
                AppSpacing.md,
                AppSpacing.xl,
                AppSpacing.md,
              ),
              child: TextField(
                controller: _search,
                onChanged: (_) => setState(() {}),
                decoration: InputDecoration(
                  hintText: 'Search barangays',
                  prefixIcon: const Icon(Icons.search_rounded),
                  suffixIcon: query.isEmpty
                      ? null
                      : IconButton(
                          tooltip: 'Clear search',
                          icon: const Icon(Icons.clear_rounded),
                          onPressed: () => setState(_search.clear),
                        ),
                ),
              ),
            ),
            Expanded(
              child: matches.isEmpty
                  ? const Align(
                      alignment: Alignment(0, -.18),
                      child: Padding(
                        padding: EdgeInsets.all(AppSpacing.xl),
                        child: Text(
                          'No matching barangays. Try another name.',
                          textAlign: TextAlign.center,
                        ),
                      ),
                    )
                  : ListView.separated(
                      padding: const EdgeInsets.fromLTRB(
                        AppSpacing.xl,
                        0,
                        AppSpacing.xl,
                        AppSpacing.xl,
                      ),
                      itemCount: matches.length,
                      separatorBuilder: (_, _) =>
                          const SizedBox(height: AppSpacing.sm),
                      itemBuilder: (context, index) => LunasCard(
                        padding: const EdgeInsets.all(AppSpacing.md),
                        onTap: () => context.pop(matches[index]),
                        child: SizedBox(
                          height: 32,
                          child: Row(
                            children: [
                              Icon(
                                Icons.account_balance_outlined,
                                color: Theme.of(context).colorScheme.primary,
                                size: 24,
                              ),
                              const SizedBox(width: AppSpacing.md),
                              Expanded(
                                child: Text(
                                  matches[index],
                                  style: Theme.of(
                                    context,
                                  ).textTheme.titleMedium,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
            ),
          ],
        ),
      ),
    );
  }
}
