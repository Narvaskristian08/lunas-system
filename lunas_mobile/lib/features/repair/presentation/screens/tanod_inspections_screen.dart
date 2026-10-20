import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:lunas_mobile/app/app_services.dart';
import 'package:lunas_mobile/core/network/api_exception.dart';
import 'package:lunas_mobile/core/widgets/lunas_card.dart';
import 'package:lunas_mobile/features/repair/data/models/inspection_models.dart';
import 'package:lunas_mobile/features/repair/presentation/widgets/repair_widgets.dart';
import 'package:lunas_mobile/features/reporting/domain/models/evidence_selection.dart';
import 'package:lunas_mobile/features/reporting/presentation/widgets/evidence_preview.dart';
import 'package:lunas_mobile/features/reporting/presentation/widgets/reporting_widgets.dart';
import 'package:lunas_mobile/features/reporting/presentation/widgets/report_status_timeline.dart';
import 'package:url_launcher/url_launcher.dart';

class TanodInspectionsScreen extends StatefulWidget {
  const TanodInspectionsScreen({
    super.key,
    this.initialFilter,
    this.initialInspectionId,
  });

  final String? initialFilter;
  final String? initialInspectionId;

  @override
  State<TanodInspectionsScreen> createState() => _TanodInspectionsScreenState();
}

class _TanodInspectionsScreenState extends State<TanodInspectionsScreen> {
  bool _loading = true;
  String? _error;
  List<TanodInspection> _items = const [];
  late String _filter;
  bool _openedInitialInspection = false;

  @override
  void initState() {
    super.initState();
    _filter = widget.initialFilter ?? 'initial';
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final items = await repairService.getMyInspections();
      if (mounted) {
        setState(() {
          _items = items;
          _loading = false;
        });
      }
      if (widget.initialInspectionId != null && !_openedInitialInspection) {
        final match = items
            .where((item) => item.id == widget.initialInspectionId)
            .firstOrNull;
        if (match != null) {
          _openedInitialInspection = true;
          WidgetsBinding.instance.addPostFrameCallback(
            (_) => _openInspection(match),
          );
        }
      }
    } on ApiException catch (error) {
      if (mounted) {
        setState(() {
          _error = error.message;
          _loading = false;
        });
      }
    } catch (_) {
      if (mounted) {
        setState(() {
          _error =
              'LUNAS could not load your assigned verifications. Check your connection and try again.';
          _loading = false;
        });
      }
    }
  }

  Future<void> _openInspection(TanodInspection inspection) async {
    if (!['assigned', 'in_progress'].contains(inspection.status) ||
        (inspection.incidentId ?? '').isEmpty) {
      return;
    }
    if (!mounted) return;
    var taskVersion = inspection.version;
    var acknowledged = inspection.acknowledgedAt != null;
    var started = inspection.status == 'in_progress';
    String? outcome;
    final findings = TextEditingController();
    EvidenceSelection? selectedEvidence;
    var submitting = false;
    String? formError;
    final evidence = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      builder: (context) => StatefulBuilder(
        builder: (context, setSheetState) => Padding(
          padding: EdgeInsets.only(
            left: 20,
            right: 20,
            top: 20,
            bottom: MediaQuery.of(context).viewInsets.bottom + 20,
          ),
          child: SingleChildScrollView(
            keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.onDrag,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text(
                  'Work Verification',
                  style: Theme.of(context).textTheme.titleLarge,
                ),
                const SizedBox(height: 12),
                Text(
                  inspection.reportNumber ?? 'Citizen report',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  inspection.type == 'completion'
                      ? 'Check the completed work, write what you found, and attach a photo.'
                      : 'Visit the reported location, write what you found, and attach a photo.',
                ),
                const SizedBox(height: 12),
                if (inspection.latitude != null &&
                    inspection.longitude != null) ...[
                  Text(
                    inspection.address?.isNotEmpty == true
                        ? inspection.address!
                        : 'Reported location',
                    style: Theme.of(context).textTheme.bodySmall,
                  ),
                  const SizedBox(height: 8),
                  OutlinedButton.icon(
                    onPressed: () async {
                      final mapsUri = Uri.parse(
                        'https://www.google.com/maps/search/?api=1&query=${inspection.latitude},${inspection.longitude}',
                      );
                      final opened = await launchUrl(
                        mapsUri,
                        mode: LaunchMode.externalApplication,
                      );
                      if (!opened && context.mounted) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(
                            content: Text('Google Maps could not be opened.'),
                          ),
                        );
                      }
                    },
                    icon: const Icon(Icons.map_outlined),
                    label: const Text('Open in Google Maps'),
                  ),
                ] else
                  const Text(
                    'Reported map location is unavailable for this report.',
                  ),
                const SizedBox(height: 12),
                if (inspection.incidentImageUrls.isNotEmpty) ...[
                  Text(
                    'Citizen report photo',
                    style: Theme.of(context).textTheme.titleSmall,
                  ),
                  const SizedBox(height: 8),
                  ...inspection.incidentImageUrls.map(
                    (url) => Padding(
                      padding: const EdgeInsets.only(bottom: 8),
                      child: RemoteEvidencePreview(url: url, height: 220),
                    ),
                  ),
                  const SizedBox(height: 4),
                ],
                Text('Category: ${inspection.category ?? "Not recorded"}'),
                Text(inspection.description ?? ''),
                if (inspection.instructions?.isNotEmpty == true)
                  Text('Instructions: ${inspection.instructions}'),
                Text(
                  'Physical verification is a manual activity. Photo processing remains subject to the approved privacy service.',
                ),
                if (!started)
                  OutlinedButton(
                    onPressed: submitting
                        ? null
                        : () async {
                            setSheetState(() {
                              submitting = true;
                              formError = null;
                            });
                            try {
                              taskVersion = await repairService
                                  .inspectionAction(
                                    inspection.incidentId!,
                                    inspection.id,
                                    acknowledged ? 'start' : 'acknowledge',
                                    taskVersion,
                                  );
                              setSheetState(() {
                                if (acknowledged) {
                                  started = true;
                                } else {
                                  acknowledged = true;
                                }
                              });
                            } on ApiException catch (error) {
                              setSheetState(() => formError = error.message);
                            } catch (_) {
                              setSheetState(
                                () => formError =
                                    'The task changed or is unavailable. Refresh before trying again.',
                              );
                            } finally {
                              setSheetState(() => submitting = false);
                            }
                          },
                    child: Text(
                      acknowledged
                          ? 'Start field verification'
                          : 'Acknowledge assignment',
                    ),
                  ),
                DropdownButtonFormField<String>(
                  initialValue: outcome,
                  decoration: const InputDecoration(
                    labelText: 'Verification outcome',
                  ),
                  items: const [
                    DropdownMenuItem(
                      value: 'verified',
                      child: Text('Verified'),
                    ),
                    DropdownMenuItem(
                      value: 'not_verified',
                      child: Text('Not Verified'),
                    ),
                    DropdownMenuItem(
                      value: 'unable_to_verify',
                      child: Text('Unable to Verify'),
                    ),
                  ],
                  onChanged: submitting
                      ? null
                      : (value) => setSheetState(() => outcome = value),
                ),
                TextField(
                  controller: findings,
                  maxLines: 4,
                  maxLength: 1000,
                  decoration: const InputDecoration(
                    labelText: 'What did you find?',
                    hintText: 'Describe the issue or the completed work.',
                    alignLabelWithHint: true,
                  ),
                ),
                const SizedBox(height: 8),
                if (selectedEvidence != null) ...[
                  LocalEvidencePreview(
                    evidence: selectedEvidence!,
                    height: 180,
                  ),
                  const SizedBox(height: 8),
                ],
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: () async {
                          final picked = await evidenceService.pick(
                            ImageSource.camera,
                          );
                          if (picked != null) {
                            setSheetState(() => selectedEvidence = picked);
                          }
                        },
                        icon: const Icon(Icons.camera_alt_outlined),
                        label: Text(
                          selectedEvidence == null
                              ? 'Take photo'
                              : 'Retake photo',
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: () async {
                          final picked = await evidenceService.pick(
                            ImageSource.gallery,
                          );
                          if (picked != null) {
                            setSheetState(() => selectedEvidence = picked);
                          }
                        },
                        icon: const Icon(Icons.photo_library_outlined),
                        label: const Text('Attach photo'),
                      ),
                    ),
                  ],
                ),
                if (selectedEvidence == null)
                  const Padding(
                    padding: EdgeInsets.only(top: 8),
                    child: Text(
                      'One verification photo is required before submitting.',
                    ),
                  ),
                if (formError != null)
                  Padding(
                    padding: const EdgeInsets.only(top: 4),
                    child: Text(
                      formError!,
                      style: TextStyle(
                        color: Theme.of(context).colorScheme.error,
                      ),
                    ),
                  ),
                const SizedBox(height: 16),
                FilledButton(
                  onPressed: submitting
                      ? null
                      : () async {
                          if (!started || outcome == null) {
                            setSheetState(
                              () => formError =
                                  'Acknowledge and start the task, then select an outcome.',
                            );
                            return;
                          }
                          if (findings.text.trim().length < 2) {
                            setSheetState(
                              () => formError = 'Please enter your findings.',
                            );
                            return;
                          }
                          if (selectedEvidence == null) {
                            setSheetState(
                              () => formError =
                                  'Please attach a verification photo.',
                            );
                            return;
                          }
                          final shouldSubmit = await showDialog<bool>(
                            context: context,
                            builder: (dialogContext) => AlertDialog(
                              title: const Text('Submit Work Verification?'),
                              content: const Text(
                                'Are you sure these findings and the attached photo are accurate? This will send the verification to the Barangay Secretary for review.',
                              ),
                              actions: [
                                TextButton(
                                  onPressed: () =>
                                      Navigator.pop(dialogContext, false),
                                  child: const Text('Cancel'),
                                ),
                                FilledButton(
                                  onPressed: () =>
                                      Navigator.pop(dialogContext, true),
                                  child: const Text('Confirm Submission'),
                                ),
                              ],
                            ),
                          );
                          if (shouldSubmit != true || !context.mounted) return;
                          setSheetState(() {
                            submitting = true;
                            formError = null;
                          });
                          showDialog<void>(
                            context: context,
                            barrierDismissible: false,
                            builder: (_) => const AlertDialog(
                              content: Row(
                                children: [
                                  SizedBox(
                                    height: 24,
                                    width: 24,
                                    child: CircularProgressIndicator(
                                      strokeWidth: 2,
                                    ),
                                  ),
                                  SizedBox(width: 16),
                                  Expanded(
                                    child: Text('Submitting verification…'),
                                  ),
                                ],
                              ),
                            ),
                          );
                          try {
                            await repairService.submitInspection(
                              incidentId: inspection.incidentId ?? '',
                              inspectionId: inspection.id,
                              findings: findings.text,
                              result: outcome!,
                              expectedVersion: taskVersion,
                              evidence: selectedEvidence,
                            );
                            if (context.mounted) {
                              Navigator.of(context, rootNavigator: true).pop();
                              Navigator.pop(context, true);
                            }
                          } on ApiException catch (error) {
                            if (context.mounted) {
                              Navigator.of(context, rootNavigator: true).pop();
                              setSheetState(() {
                                submitting = false;
                                formError = error.message;
                              });
                            }
                          } catch (_) {
                            if (context.mounted) {
                              Navigator.of(context, rootNavigator: true).pop();
                              setSheetState(() {
                                submitting = false;
                                formError =
                                    'Verification could not be submitted. Please try again.';
                              });
                            }
                          }
                        },
                  child: submitting
                      ? const SizedBox(
                          height: 20,
                          width: 20,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : const Text('Submit Work Verification'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
    findings.dispose();
    if (mounted && (evidence == true || acknowledged || started)) _load();
  }

  @override
  Widget build(BuildContext context) => RepairPage(
    appBar: const RepairAppBar(
      title: 'Barangay Tanod',
      subtitle: 'Assigned field inspections',
    ),
    selectedNavigationIndex: 1,
    child: _loading
        ? const Center(child: CircularProgressIndicator())
        : _error != null
        ? Center(child: Text(_error!))
        : _items.isEmpty
        ? Center(child: Text(_emptyMessage))
        : Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              SegmentedButton<String>(
                segments: const [
                  ButtonSegment(value: 'initial', label: Text('Initial')),
                  ButtonSegment(value: 'completion', label: Text('Final')),
                  ButtonSegment(
                    value: 'submitted',
                    label: Text('Sent to Secretary'),
                  ),
                ],
                selected: {_filter},
                onSelectionChanged: (selection) =>
                    setState(() => _filter = selection.first),
              ),
              const SizedBox(height: 16),
              if (_filteredItems.isEmpty)
                Padding(
                  padding: const EdgeInsets.symmetric(vertical: 48),
                  child: Column(
                    children: [
                      Icon(
                        Icons.check_circle_outline,
                        size: 48,
                        color: Theme.of(context).colorScheme.primary,
                      ),
                      const SizedBox(height: 12),
                      Text(
                        _emptyMessage,
                        textAlign: TextAlign.center,
                        style: Theme.of(context).textTheme.titleMedium,
                      ),
                    ],
                  ),
                )
              else
                ..._filteredItems
                    .map(
                      (item) => Padding(
                        padding: const EdgeInsets.only(bottom: 12),
                        child: LunasCard(
                          onTap:
                              ['assigned', 'in_progress'].contains(item.status)
                              ? () => _openInspection(item)
                              : null,
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.stretch,
                            children: [
                              if (item.findings?.isNotEmpty == true)
                                Text(item.findings!),
                              if (item.result != null)
                                Text(
                                  'Outcome: ${item.result!.replaceAll('_', ' ')}',
                                ),
                              if (item.inspectionEvidenceUrls.isNotEmpty)
                                RemoteEvidencePreview(
                                  url: item.inspectionEvidenceUrls.first,
                                  height: 180,
                                ),
                              ReportStatusHeader(
                                title: item.category ?? 'Citizen report',
                                status: item.status == 'submitted'
                                    ? 'Sent to Secretary'
                                    : 'Needs verification',
                                leading: Icon(
                                  categoryIcon(item.category ?? ''),
                                  color: Theme.of(context).colorScheme.primary,
                                ),
                              ),
                              const SizedBox(height: 8),
                              Text(
                                item.reportNumber ?? 'Report',
                                style: Theme.of(context).textTheme.labelLarge,
                              ),
                              const SizedBox(height: 4),
                              Text(
                                '${item.type == 'completion' ? 'Final work verification' : 'Initial work verification'} · ${item.barangay ?? 'Barangay'}',
                                style: Theme.of(context).textTheme.bodySmall,
                              ),
                              if (item.description?.isNotEmpty == true) ...[
                                const SizedBox(height: 8),
                                Text(
                                  item.description!,
                                  maxLines: 2,
                                  overflow: TextOverflow.ellipsis,
                                  style: Theme.of(context).textTheme.bodyMedium,
                                ),
                              ],
                              if (item.status != 'submitted') ...[
                                const SizedBox(height: 12),
                                FilledButton.icon(
                                  onPressed: () => _openInspection(item),
                                  icon: const Icon(Icons.camera_alt_outlined),
                                  label: const Text('Open Work Verification'),
                                ),
                              ],
                            ],
                          ),
                        ),
                      ),
                    )
                    ,
              if (_filteredItems.length > 3)
                Padding(
                  padding: const EdgeInsets.only(top: 4),
                  child: Text(
                    'Showing all ${_filteredItems.length} verifications',
                    textAlign: TextAlign.center,
                  ),
                ),
            ],
          ),
  );

  List<TanodInspection> get _filteredItems => _items.where((item) {
    if (_filter == 'completion') {
      return item.type == 'completion' && _needsAction(item);
    }
    if (_filter == 'submitted') return item.status == 'submitted';
    return item.type != 'completion' && _needsAction(item);
  }).toList();

  bool _needsAction(TanodInspection item) =>
      item.status == 'assigned' || item.status == 'in_progress';

  String get _emptyMessage {
    if (_filter == 'completion') {
      return 'No current final reports need verification.';
    }
    if (_filter == 'submitted') {
      return 'No work verifications have been sent to the Secretary.';
    }
    return 'No current initial reports need verification.';
  }
}
