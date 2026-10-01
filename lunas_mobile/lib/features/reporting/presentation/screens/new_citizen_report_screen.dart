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
import 'package:lunas_mobile/features/reporting/presentation/widgets/reporting_widgets.dart';

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
    final selected = await showSearch<String>(
      context: context,
      delegate: _BarangaySearchDelegate(_barangays),
    );
    if (mounted && selected != null && selected.trim().isNotEmpty) {
      setState(() => _barangay = selected);
    }
  }

  void _useBarangaySuggestion() {
    final suggested = _barangaySuggestion?.barangay;
    if (suggested != null) setState(() => _barangay = suggested);
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
              Text(
                'Step 1 of 3: Details',
                style: Theme.of(context).textTheme.labelMedium,
              ),
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
              _barangaySelector(context),
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
        LunasCard(
          onTap: _chooseBarangay,
          child: Row(
            children: [
              const Icon(Icons.account_balance_outlined),
              const SizedBox(width: AppSpacing.md),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(_barangay ?? 'Select barangay'),
                    const SizedBox(height: AppSpacing.xxs),
                    Text(
                      _barangay == null
                          ? 'Required · search the recognized Dagupan list'
                          : 'Confirmed for this report location',
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                  ],
                ),
              ),
              const Icon(Icons.search_rounded),
            ],
          ),
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

class _BarangaySearchDelegate extends SearchDelegate<String> {
  _BarangaySearchDelegate(this.barangays);

  final List<String> barangays;

  List<String> get _matches {
    final needle = query.trim().toLowerCase();
    if (needle.isEmpty) return barangays;
    return barangays
        .where((barangay) => barangay.toLowerCase().contains(needle))
        .toList(growable: false);
  }

  @override
  String get searchFieldLabel => 'Search barangays';

  @override
  List<Widget>? buildActions(BuildContext context) => [
    if (query.isNotEmpty)
      IconButton(
        tooltip: 'Clear search',
        onPressed: () => query = '',
        icon: const Icon(Icons.clear_rounded),
      ),
  ];

  @override
  Widget? buildLeading(BuildContext context) => IconButton(
    tooltip: 'Back',
    onPressed: () => close(context, ''),
    icon: const Icon(Icons.arrow_back_rounded),
  );

  @override
  Widget buildResults(BuildContext context) => _results(context);

  @override
  Widget buildSuggestions(BuildContext context) => _results(context);

  Widget _results(BuildContext context) {
    final matches = _matches;
    if (matches.isEmpty) {
      return const Center(
        child: Padding(
          padding: EdgeInsets.all(AppSpacing.xl),
          child: Text(
            'No recognized barangay matches that search. Check the spelling or clear the search.',
            textAlign: TextAlign.center,
          ),
        ),
      );
    }
    return ListView.separated(
      itemCount: matches.length,
      separatorBuilder: (_, _) => const Divider(height: 1),
      itemBuilder: (context, index) {
        final barangay = matches[index];
        return ListTile(
          leading: const Icon(Icons.account_balance_outlined),
          title: Text(barangay),
          onTap: () => close(context, barangay),
        );
      },
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
