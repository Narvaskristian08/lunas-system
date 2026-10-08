import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:lunas_mobile/core/app_services.dart';
import 'package:lunas_mobile/core/theme/app_spacing.dart';
import 'package:lunas_mobile/core/widgets/lunas_app_bar.dart';
import 'package:lunas_mobile/core/widgets/lunas_button.dart';
import 'package:lunas_mobile/core/widgets/lunas_card.dart';
import 'package:lunas_mobile/features/maps/domain/models/selected_location.dart';
import 'package:lunas_mobile/features/reporting/data/models/category_option.dart';
import 'package:lunas_mobile/features/reporting/domain/models/citizen_report_draft.dart';
import 'package:lunas_mobile/features/reporting/domain/models/barangay_suggestion.dart';
import 'package:lunas_mobile/features/reporting/domain/models/evidence_selection.dart';
import 'package:lunas_mobile/features/reporting/presentation/widgets/evidence_preview.dart';

typedef BarangayLoader = Future<List<String>> Function();

class NewCitizenReportScreen extends StatefulWidget {
  const NewCitizenReportScreen({this.barangayLoader, super.key});

  final BarangayLoader? barangayLoader;

  @override
  State<NewCitizenReportScreen> createState() => _NewCitizenReportScreenState();
}

class _NewCitizenReportScreenState extends State<NewCitizenReportScreen> {
  final _formKey = GlobalKey<FormState>();
  final _descriptionController = TextEditingController();
  CategoryOption? _category;
  EvidenceSelection? _evidence;
  SelectedLocation? _location;
  String? _barangay;
  List<String> _barangays = const [];
  BarangaySuggestion? _barangaySuggestion;
  bool _loadingBarangays = true;
  String? _barangayError;

  @override
  void initState() {
    super.initState();
    _loadBarangays();
  }

  @override
  void dispose() {
    _descriptionController.dispose();
    super.dispose();
  }

  Future<void> _loadBarangays() async {
    setState(() {
      _loadingBarangays = true;
      _barangayError = null;
    });
    try {
      final values =
          await (widget.barangayLoader ?? reportService.getBarangays)();
      if (!mounted) return;
      setState(() {
        _barangays = values;
        _loadingBarangays = false;
        _updateBarangaySuggestion();
      });
    } catch (error) {
      if (!mounted) return;
      setState(() {
        _loadingBarangays = false;
        _barangayError = error.toString();
      });
    }
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
      '/reports/location?mode=picker',
      extra: _location,
    );
    if (mounted && location != null) {
      setState(() {
        _location = location;
        _barangay = null;
        _updateBarangaySuggestion();
      });
    }
  }

  void _updateBarangaySuggestion() {
    final location = _location;
    if (location == null || _barangays.isEmpty) {
      _barangaySuggestion = null;
      return;
    }
    _barangaySuggestion = resolveBarangaySuggestion(location, _barangays);
  }

  Future<void> _chooseBarangay() async {
    if (_loadingBarangays || _barangayError != null) return;
    final selected = await Navigator.of(context).push<String>(
      MaterialPageRoute(
        builder: (_) => _BarangayPickerScreen(barangays: _barangays),
      ),
    );
    if (mounted && selected != null && selected.trim().isNotEmpty) {
      setState(() => _barangay = selected);
    }
  }

  void _useBarangaySuggestion() {
    final suggested = _barangaySuggestion?.barangay;
    if (suggested != null) setState(() => _barangay = suggested);
  }

  bool _showValidation = false;

  void _review() {
    setState(() => _showValidation = true);
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
    if (_barangay == null) {
      _showRequired('Choose and confirm the barangay for this location.');
      return;
    }
    final draft = CitizenReportDraft(
      category: _category!,
      description: _descriptionController.text.trim(),
      location: _location!,
      barangay: _barangay!,
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
      title: 'Report an Issue',
      subtitle: 'Tell us what needs attention.',
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
              _StepLabel(number: '1', label: 'Photo Evidence'),
              const SizedBox(height: AppSpacing.sm),
              LunasCard(
                onTap: _chooseEvidence,
                borderColor: _showValidation && _evidence == null
                    ? Theme.of(context).colorScheme.error
                    : null,
                padding: _evidence == null
                    ? const EdgeInsets.all(AppSpacing.md)
                    : EdgeInsets.zero,
                child: _evidence == null
                    ? _ReportSelectionContent(
                        icon: Icons.add_a_photo_outlined,
                        title: 'Add Photo Evidence',
                        isError: _showValidation && _evidence == null,
                        subtitle: 'Required · Take or Upload a Photo',
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
                                const Expanded(child: Text('Change Image')),
                                const Icon(Icons.edit_outlined),
                              ],
                            ),
                          ),
                        ],
                      ),
              ),
              const SizedBox(height: AppSpacing.xxl),
              _StepLabel(number: '2', label: 'Issue Details'),
              const SizedBox(height: AppSpacing.sm),
              _ReportSelectionTile(
                onTap: _chooseCategory,
                isError: _showValidation && _category == null,
                icon: Icons.category_outlined,
                title: _category?.label ?? 'Select Category',
                subtitle: _category == null
                    ? 'Required · Choose the Issue Type'
                    : _category!.description,
              ),
              const SizedBox(height: AppSpacing.md),
              TextFormField(
                controller: _descriptionController,
                minLines: 4,
                maxLines: 7,
                maxLength: 500,
                textCapitalization: TextCapitalization.sentences,
                decoration: const InputDecoration(
                  labelText: 'Issue Description',
                  hintText: 'What is damaged or unsafe?',
                  alignLabelWithHint: true,
                  contentPadding: EdgeInsets.all(AppSpacing.md),
                ),
                validator: (value) => (value?.trim().length ?? 0) < 10
                    ? 'Describe the issue in at least 10 characters.'
                    : null,
              ),
              const SizedBox(height: AppSpacing.xxl),
              _StepLabel(number: '3', label: 'Issue Location'),
              const SizedBox(height: AppSpacing.sm),
              _ReportSelectionTile(
                onTap: _chooseLocation,
                isError:
                    _showValidation &&
                    (_location == null || !_location!.isValid),
                icon: Icons.location_on_outlined,
                title: _location?.address ?? 'Confirm Location',
                subtitle: _location == null
                    ? 'Required · Confirm the Map Pin'
                    : '',
              ),
              const SizedBox(height: AppSpacing.md),
              _barangaySelector(context),
              const SizedBox(height: AppSpacing.xxl),
              LunasButton(
                label: 'Review Report',
                icon: Icons.fact_check_outlined,
                onPressed: _review,
              ),
            ],
          ),
        ),
      ),
    ),
  );

  Widget _barangaySelector(BuildContext context) {
    if (_loadingBarangays) {
      return const LunasCard(
        child: Row(
          children: [
            SizedBox.square(
              dimension: 20,
              child: CircularProgressIndicator(strokeWidth: 2),
            ),
            SizedBox(width: AppSpacing.md),
            Expanded(child: Text('Loading recognized barangays…')),
          ],
        ),
      );
    }
    if (_barangayError != null) {
      return LunasCard(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Text('Barangay list unavailable'),
            const SizedBox(height: AppSpacing.xs),
            Text(
              'Check your connection and try again. A recognized barangay is required.',
              style: Theme.of(context).textTheme.bodySmall,
            ),
            Align(
              alignment: Alignment.centerLeft,
              child: TextButton.icon(
                onPressed: _loadBarangays,
                icon: const Icon(Icons.refresh_rounded),
                label: const Text('Try again'),
              ),
            ),
          ],
        ),
      );
    }

    final suggestion = _barangaySuggestion;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        _ReportSelectionTile(
          onTap: _chooseBarangay,
          isError: _showValidation && _barangay == null,
          icon: Icons.account_balance_outlined,
          title: _barangay ?? 'Select Barangay',
          subtitle: _barangay == null
              ? 'Required · Choose the Issue’s Barangay'
              : 'Confirmed for This Report Location',
        ),
        if (_barangay == null && suggestion != null) ...[
          const SizedBox(height: AppSpacing.xs),
          if (suggestion.status == BarangaySuggestionStatus.matched)
            Row(
              children: [
                Expanded(
                  child: Text(
                    'Address lookup suggests ${suggestion.barangay}. Confirm before continuing.',
                    style: Theme.of(context).textTheme.bodySmall,
                  ),
                ),
                TextButton(
                  onPressed: _useBarangaySuggestion,
                  child: const Text('Use suggestion'),
                ),
              ],
            )
          else
            Text(switch (suggestion.status) {
              BarangaySuggestionStatus.ambiguous =>
                'Address lookup returned more than one possible barangay. Choose the correct one.',
              BarangaySuggestionStatus.unavailable =>
                'Address lookup is unavailable. Choose the barangay from the recognized list.',
              BarangaySuggestionStatus.noMatch =>
                'Address lookup could not identify a recognized barangay. Choose it manually.',
              BarangaySuggestionStatus.matched => '',
            }, style: Theme.of(context).textTheme.bodySmall),
        ],
      ],
    );
  }
}

class _BarangayPickerScreen extends StatefulWidget {
  const _BarangayPickerScreen({required this.barangays});
  final List<String> barangays;

  @override
  State<_BarangayPickerScreen> createState() => _BarangayPickerScreenState();
}

class _BarangayPickerScreenState extends State<_BarangayPickerScreen> {
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
                          tooltip: 'Clear Search',
                          icon: const Icon(Icons.clear_rounded),
                          onPressed: () => setState(_search.clear),
                        ),
                ),
              ),
            ),
            Expanded(
              child: matches.isEmpty
                  ? const Center(
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
                        onTap: () => Navigator.of(context).pop(matches[index]),
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

class _ReportSelectionTile extends StatelessWidget {
  const _ReportSelectionTile({
    required this.onTap,
    required this.icon,
    required this.title,
    required this.subtitle,
    this.isError = false,
  });
  final VoidCallback onTap;
  final IconData icon;
  final String title;
  final String subtitle;
  final bool isError;

  @override
  Widget build(BuildContext context) => LunasCard(
    onTap: onTap,
    borderColor: isError ? Theme.of(context).colorScheme.error : null,
    padding: const EdgeInsets.all(AppSpacing.md),
    child: _ReportSelectionContent(
      icon: icon,
      title: title,
      subtitle: subtitle,
      isError: isError,
    ),
  );
}

class _ReportSelectionContent extends StatelessWidget {
  const _ReportSelectionContent({
    required this.icon,
    required this.title,
    required this.subtitle,
    this.isError = false,
  });
  final IconData icon;
  final String title;
  final String subtitle;
  final bool isError;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return ConstrainedBox(
      constraints: const BoxConstraints(minHeight: 60),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Icon(icon, size: 24, color: theme.colorScheme.primary),
          const SizedBox(width: AppSpacing.md),
          Expanded(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: theme.textTheme.titleSmall?.copyWith(
                    fontSize: 15,
                    fontWeight: FontWeight.w600,
                  ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
                if (subtitle.isNotEmpty) ...[
                  const SizedBox(height: AppSpacing.xxs),
                  Text(
                    subtitle,
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: isError ? theme.colorScheme.error : null,
                      fontSize: 12,
                      height: 1.4,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ],
            ),
          ),
          const SizedBox(width: AppSpacing.sm),
          Icon(
            Icons.chevron_right_rounded,
            size: 22,
            color: theme.colorScheme.onSurfaceVariant,
          ),
        ],
      ),
    );
  }
}
