import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:lunas_mobile/core/app_services.dart';
import 'package:lunas_mobile/core/network/api_exception.dart';
import 'package:lunas_mobile/core/theme/app_colors.dart';
import 'package:lunas_mobile/core/theme/app_spacing.dart';
import 'package:lunas_mobile/core/widgets/lunas_card.dart';
import 'package:lunas_mobile/core/widgets/lunas_state_view.dart';
import 'package:lunas_mobile/core/widgets/official_scaffold.dart';
import 'package:lunas_mobile/features/reporting/data/models/category_option.dart';
import 'package:lunas_mobile/features/reporting/presentation/widgets/report_status_timeline.dart';
import 'package:lunas_mobile/features/validation/data/models/validation_incident.dart';

class ValidationQueueScreen extends StatefulWidget {
  const ValidationQueueScreen({super.key});

  @override
  State<ValidationQueueScreen> createState() => _ValidationQueueScreenState();
}

class _ValidationQueueScreenState extends State<ValidationQueueScreen> {
  static const _pageSize = 20;
  final _searchController = TextEditingController();
  bool _loading = true;
  String? _error;
  ValidationQueuePage? _queue;
  String? _category;
  String? _barangay;
  bool? _hasDuplicateCandidate;
  DateTime? _from;
  DateTime? _to;
  String _sortBy = '-createdAt';

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _load({int page = 1}) async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final queue = await validationService.getPendingValidation(
        page: page,
        limit: _pageSize,
        search: _clean(_searchController.text),
        category: _category,
        barangay: _barangay,
        hasDuplicateCandidate: _hasDuplicateCandidate,
        sortBy: _sortBy,
        from: _from == null ? null : _dateParameter(_from!),
        to: _to == null ? null : _dateParameter(_to!),
      );
      if (mounted) setState(() => _queue = queue);
    } on ApiException catch (error) {
      if (mounted) setState(() => _error = error.message);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _openFilters() async {
    final result = await showModalBottomSheet<_QueueFilters>(
      context: context,
      isScrollControlled: true,
      showDragHandle: true,
      builder: (_) => _QueueFilterSheet(
        initial: _QueueFilters(
          category: _category,
          barangay: _barangay,
          hasDuplicateCandidate: _hasDuplicateCandidate,
          from: _from,
          to: _to,
        ),
      ),
    );
    if (result == null || !mounted) return;
    setState(() {
      _category = result.category;
      _barangay = result.barangay;
      _hasDuplicateCandidate = result.hasDuplicateCandidate;
      _from = result.from;
      _to = result.to;
    });
    await _load();
  }

  void _clearFilters() {
    _searchController.clear();
    setState(() {
      _category = null;
      _barangay = null;
      _hasDuplicateCandidate = null;
      _from = null;
      _to = null;
      _sortBy = '-createdAt';
    });
    _load();
  }

  bool get _hasFilters =>
      _clean(_searchController.text) != null ||
      _category != null ||
      _barangay != null ||
      _hasDuplicateCandidate != null ||
      _from != null ||
      _to != null ||
      _sortBy != '-createdAt';

  @override
  Widget build(BuildContext context) => OfficialScaffold(
    title: 'Pending validation',
    subtitle: 'Submitted reports in your permitted scope',
    selectedIndex: 1,
    actions: [
      IconButton(
        onPressed: _loading ? null : _openFilters,
        tooltip: 'Filter reports',
        icon: Badge(
          isLabelVisible: _hasFilters,
          child: const Icon(Icons.tune_rounded),
        ),
      ),
      PopupMenuButton<String>(
        tooltip: 'Sort reports',
        onSelected: (value) {
          setState(() => _sortBy = value);
          _load();
        },
        itemBuilder: (_) => const [
          PopupMenuItem(value: '-createdAt', child: Text('Newest submitted')),
          PopupMenuItem(value: 'createdAt', child: Text('Oldest submitted')),
          PopupMenuItem(value: '-priority', child: Text('Highest priority')),
          PopupMenuItem(value: 'priority', child: Text('Lowest priority')),
        ],
        icon: const Icon(Icons.sort_rounded),
      ),
      IconButton(
        onPressed: _loading ? null : _load,
        tooltip: 'Refresh queue',
        icon: const Icon(Icons.refresh_rounded),
      ),
      const SizedBox(width: AppSpacing.sm),
    ],
    body: Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        TextField(
          controller: _searchController,
          textInputAction: TextInputAction.search,
          onChanged: (_) => setState(() {}),
          onSubmitted: (_) => _load(),
          decoration: InputDecoration(
            labelText: 'Search report number or description',
            prefixIcon: const Icon(Icons.search_rounded),
            suffixIcon: _clean(_searchController.text) == null
                ? null
                : IconButton(
                    icon: const Icon(Icons.clear_rounded),
                    tooltip: 'Clear search',
                    onPressed: () {
                      _searchController.clear();
                      _load();
                    },
                  ),
          ),
        ),
        if (_hasFilters) ...[
          const SizedBox(height: AppSpacing.sm),
          Wrap(
            spacing: AppSpacing.xs,
            runSpacing: AppSpacing.xs,
            children: [
              if (_category != null)
                InputChip(
                  label: Text(_categoryLabel(_category!)),
                  onDeleted: () {
                    setState(() => _category = null);
                    _load();
                  },
                ),
              if (_barangay != null)
                InputChip(
                  label: Text(_barangay!),
                  onDeleted: () {
                    setState(() => _barangay = null);
                    _load();
                  },
                ),
              if (_hasDuplicateCandidate != null)
                InputChip(
                  label: Text(
                    _hasDuplicateCandidate == true
                        ? 'Possible duplicate'
                        : 'No duplicate candidate',
                  ),
                  onDeleted: () {
                    setState(() => _hasDuplicateCandidate = null);
                    _load();
                  },
                ),
              if (_from != null || _to != null)
                InputChip(
                  label: Text(_dateRangeLabel(_from, _to)),
                  onDeleted: () {
                    setState(() {
                      _from = null;
                      _to = null;
                    });
                    _load();
                  },
                ),
              TextButton.icon(
                onPressed: _loading ? null : _clearFilters,
                icon: const Icon(Icons.filter_alt_off_outlined, size: 18),
                label: const Text('Clear all'),
              ),
            ],
          ),
        ],
        const SizedBox(height: AppSpacing.lg),
        _queueBody(context),
      ],
    ),
  );

  Widget _queueBody(BuildContext context) {
    if (_loading) {
      return const LunasStateView(
        state: LunasViewState.loading,
        title: 'Loading validation queue',
        message: 'Retrieving submitted reports from the server.',
      );
    }
    if (_error != null) {
      return LunasStateView(
        state: LunasViewState.error,
        title: 'Could not load the queue',
        message: _error!,
        actionLabel: 'Try again',
        onAction: _load,
      );
    }
    final queue = _queue;
    if (queue == null || queue.incidents.isEmpty) {
      return LunasStateView(
        state: LunasViewState.empty,
        title: 'No reports awaiting validation',
        message: _hasFilters
            ? 'No submitted reports match the filters you selected.'
            : 'There are no submitted reports available to your role and jurisdiction.',
        actionLabel: _hasFilters ? 'Clear filters' : null,
        onAction: _hasFilters ? _clearFilters : null,
      );
    }
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text(
          '${queue.total} report${queue.total == 1 ? '' : 's'} awaiting validation',
          style: Theme.of(context).textTheme.bodySmall,
        ),
        const SizedBox(height: AppSpacing.sm),
        for (final incident in queue.incidents) ...[
          _ValidationQueueCard(
            incident: incident,
            onTap: () => context.push('/official/validation/${incident.id}'),
          ),
          const SizedBox(height: AppSpacing.sm),
        ],
        const SizedBox(height: AppSpacing.md),
        _Pagination(
          page: queue.page,
          pages: queue.pages,
          onPrevious: queue.hasPreviousPage && !_loading
              ? () => _load(page: queue.page - 1)
              : null,
          onNext: queue.hasNextPage && !_loading
              ? () => _load(page: queue.page + 1)
              : null,
        ),
      ],
    );
  }
}

class _ValidationQueueCard extends StatelessWidget {
  const _ValidationQueueCard({required this.incident, required this.onTap});
  final ValidationIncident incident;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final evidenceUrl = incident.images.isEmpty
        ? ''
        : incident.images.first.url;
    return LunasCard(
      onTap: onTap,
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _EvidenceThumbnail(url: evidenceUrl),
          const SizedBox(width: AppSpacing.md),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        incident.categoryLabel,
                        style: Theme.of(context).textTheme.titleMedium,
                      ),
                    ),
                    _StatusPill(label: humanStatus(incident.status)),
                  ],
                ),
                const SizedBox(height: AppSpacing.xxs),
                Text(
                  incident.reportNumber,
                  style: Theme.of(context).textTheme.bodySmall,
                ),
                const SizedBox(height: AppSpacing.xs),
                Text(
                  incident.description.isEmpty
                      ? 'No description returned.'
                      : incident.description,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: AppSpacing.sm),
                Wrap(
                  spacing: AppSpacing.sm,
                  runSpacing: AppSpacing.xxs,
                  children: [
                    _TinyInfo(
                      icon: Icons.location_on_outlined,
                      label: incident.location.displayAddress,
                    ),
                    _TinyInfo(
                      icon: Icons.schedule_outlined,
                      label: formatReportDateTime(incident.createdAt),
                    ),
                    if (incident.possibleDuplicateCandidateCount > 0)
                      _TinyInfo(
                        icon: Icons.content_copy_outlined,
                        label:
                            '${incident.possibleDuplicateCandidateCount} possible duplicate${incident.possibleDuplicateCandidateCount == 1 ? '' : 's'}',
                        color: AppColorsLight.alert,
                      ),
                    if (incident.aiSuggestedCategory != null)
                      _TinyInfo(
                        icon: Icons.auto_awesome_outlined,
                        label:
                            'Suggestion: ${_categoryLabel(incident.aiSuggestedCategory!)}',
                      ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(width: AppSpacing.xs),
          const Icon(Icons.chevron_right_rounded),
        ],
      ),
    );
  }
}

class _EvidenceThumbnail extends StatelessWidget {
  const _EvidenceThumbnail({required this.url});
  final String url;

  @override
  Widget build(BuildContext context) => ClipRRect(
    borderRadius: BorderRadius.circular(12),
    child: SizedBox(
      width: 76,
      height: 76,
      child: url.startsWith('http')
          ? Image.network(
              url,
              fit: BoxFit.cover,
              errorBuilder: (_, _, _) => const _EvidencePlaceholder(),
            )
          : const _EvidencePlaceholder(),
    ),
  );
}

class _EvidencePlaceholder extends StatelessWidget {
  const _EvidencePlaceholder();

  @override
  Widget build(BuildContext context) => ColoredBox(
    color: Theme.of(context).colorScheme.surfaceContainerHighest,
    child: const Center(child: Icon(Icons.image_not_supported_outlined)),
  );
}

class _TinyInfo extends StatelessWidget {
  const _TinyInfo({required this.icon, required this.label, this.color});
  final IconData icon;
  final String label;
  final Color? color;

  @override
  Widget build(BuildContext context) => ConstrainedBox(
    constraints: const BoxConstraints(maxWidth: 290),
    child: Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 16, color: color),
        const SizedBox(width: AppSpacing.xxs),
        Flexible(
          child: Text(
            label,
            overflow: TextOverflow.ellipsis,
            style: Theme.of(context).textTheme.bodySmall,
          ),
        ),
      ],
    ),
  );
}

class _StatusPill extends StatelessWidget {
  const _StatusPill({required this.label});
  final String label;

  @override
  Widget build(BuildContext context) =>
      Chip(visualDensity: VisualDensity.compact, label: Text(label));
}

class _Pagination extends StatelessWidget {
  const _Pagination({
    required this.page,
    required this.pages,
    required this.onPrevious,
    required this.onNext,
  });

  final int page;
  final int pages;
  final VoidCallback? onPrevious;
  final VoidCallback? onNext;

  @override
  Widget build(BuildContext context) => Row(
    children: [
      OutlinedButton.icon(
        onPressed: onPrevious,
        icon: const Icon(Icons.chevron_left_rounded),
        label: const Text('Previous'),
      ),
      Expanded(
        child: Text(
          'Page $page of $pages',
          textAlign: TextAlign.center,
          style: Theme.of(context).textTheme.bodySmall,
        ),
      ),
      OutlinedButton.icon(
        onPressed: onNext,
        icon: const Icon(Icons.chevron_right_rounded),
        label: const Text('Next'),
      ),
    ],
  );
}

class _QueueFilters {
  const _QueueFilters({
    this.category,
    this.barangay,
    required this.hasDuplicateCandidate,
    this.from,
    this.to,
  });

  final String? category;
  final String? barangay;
  final bool? hasDuplicateCandidate;
  final DateTime? from;
  final DateTime? to;
}

class _QueueFilterSheet extends StatefulWidget {
  const _QueueFilterSheet({required this.initial});
  final _QueueFilters initial;

  @override
  State<_QueueFilterSheet> createState() => _QueueFilterSheetState();
}

class _QueueFilterSheetState extends State<_QueueFilterSheet> {
  static const _categories = <String>[
    'road',
    'drainage',
    'electrical',
    'water',
    'gas',
    'streetlight',
    'other',
  ];
  late final TextEditingController _barangayController;
  String? _category;
  bool? _hasDuplicateCandidate;
  DateTime? _from;
  DateTime? _to;

  @override
  void initState() {
    super.initState();
    _category = widget.initial.category;
    _barangayController = TextEditingController(
      text: widget.initial.barangay ?? '',
    );
    _hasDuplicateCandidate = widget.initial.hasDuplicateCandidate;
    _from = widget.initial.from;
    _to = widget.initial.to;
  }

  @override
  void dispose() {
    _barangayController.dispose();
    super.dispose();
  }

  Future<void> _pickDate({required bool isFrom}) async {
    final initial = isFrom ? _from : _to;
    final date = await showDatePicker(
      context: context,
      firstDate: DateTime(2020),
      lastDate: DateTime.now().add(const Duration(days: 1)),
      initialDate: initial ?? DateTime.now(),
      helpText: isFrom ? 'Submitted on or after' : 'Submitted on or before',
    );
    if (date == null || !mounted) return;
    setState(() {
      if (isFrom) {
        _from = date;
        if (_to != null && _to!.isBefore(date)) _to = date;
      } else {
        _to = date;
        if (_from != null && _from!.isAfter(date)) _from = date;
      }
    });
  }

  @override
  Widget build(BuildContext context) => SafeArea(
    child: Padding(
      padding: EdgeInsets.fromLTRB(
        AppSpacing.xl,
        AppSpacing.sm,
        AppSpacing.xl,
        MediaQuery.viewInsetsOf(context).bottom + AppSpacing.xl,
      ),
      child: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              'Filter validation queue',
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: AppSpacing.lg),
            DropdownButtonFormField<String>(
              initialValue: _category,
              isExpanded: true,
              decoration: const InputDecoration(labelText: 'Category'),
              items: [
                const DropdownMenuItem<String>(
                  value: null,
                  child: Text('All categories'),
                ),
                ..._categories.map(
                  (value) => DropdownMenuItem(
                    value: value,
                    child: Text(_categoryLabel(value)),
                  ),
                ),
              ],
              onChanged: (value) => setState(() => _category = value),
            ),
            const SizedBox(height: AppSpacing.md),
            TextFormField(
              controller: _barangayController,
              textCapitalization: TextCapitalization.words,
              decoration: const InputDecoration(
                labelText: 'Barangay',
                hintText: 'Optional server-side filter',
              ),
            ),
            const SizedBox(height: AppSpacing.sm),
            DropdownButtonFormField<String>(
              initialValue: _hasDuplicateCandidate == true
                  ? 'with-candidates'
                  : _hasDuplicateCandidate == false
                  ? 'without-candidates'
                  : 'any',
              decoration: const InputDecoration(
                labelText: 'Duplicate candidate filter',
              ),
              items: const [
                DropdownMenuItem(value: 'any', child: Text('Any report')),
                DropdownMenuItem(
                  value: 'with-candidates',
                  child: Text('Has possible duplicate candidates'),
                ),
                DropdownMenuItem(
                  value: 'without-candidates',
                  child: Text('No duplicate candidates'),
                ),
              ],
              onChanged: (value) => setState(() {
                _hasDuplicateCandidate = switch (value) {
                  'with-candidates' => true,
                  'without-candidates' => false,
                  _ => null,
                };
              }),
            ),
            const SizedBox(height: AppSpacing.xs),
            const Text(
              'Candidate matches remain advisory.',
              style: TextStyle(fontSize: 12),
            ),
            const SizedBox(height: AppSpacing.sm),
            Text(
              'Submission date',
              style: Theme.of(context).textTheme.titleSmall,
            ),
            const SizedBox(height: AppSpacing.xs),
            Wrap(
              spacing: AppSpacing.sm,
              runSpacing: AppSpacing.xs,
              children: [
                OutlinedButton.icon(
                  onPressed: () => _pickDate(isFrom: true),
                  icon: const Icon(Icons.event_outlined),
                  label: Text(_from == null ? 'From date' : _shortDate(_from!)),
                ),
                OutlinedButton.icon(
                  onPressed: () => _pickDate(isFrom: false),
                  icon: const Icon(Icons.event_outlined),
                  label: Text(_to == null ? 'To date' : _shortDate(_to!)),
                ),
                if (_from != null || _to != null)
                  TextButton(
                    onPressed: () => setState(() {
                      _from = null;
                      _to = null;
                    }),
                    child: const Text('Clear dates'),
                  ),
              ],
            ),
            const SizedBox(height: AppSpacing.xl),
            FilledButton.icon(
              onPressed: () => Navigator.pop(
                context,
                _QueueFilters(
                  category: _category,
                  barangay: _clean(_barangayController.text),
                  hasDuplicateCandidate: _hasDuplicateCandidate,
                  from: _from,
                  to: _to,
                ),
              ),
              icon: const Icon(Icons.check_rounded),
              label: const Text('Apply filters'),
            ),
          ],
        ),
      ),
    ),
  );
}

String? _clean(String value) {
  final result = value.trim();
  return result.isEmpty ? null : result;
}

String _dateParameter(DateTime value) =>
    '${value.year.toString().padLeft(4, '0')}-${value.month.toString().padLeft(2, '0')}-${value.day.toString().padLeft(2, '0')}';

String _shortDate(DateTime value) =>
    '${value.month}/${value.day}/${value.year}';

String _dateRangeLabel(DateTime? from, DateTime? to) {
  if (from != null && to != null) {
    return '${_shortDate(from)} – ${_shortDate(to)}';
  }
  if (from != null) return 'From ${_shortDate(from)}';
  return 'Until ${_shortDate(to!)}';
}

String _categoryLabel(String code) => categoryFromCode(code).label;
