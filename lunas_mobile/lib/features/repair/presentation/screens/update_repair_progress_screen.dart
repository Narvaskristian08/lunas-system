import 'package:lunas_mobile/features/reporting/presentation/widgets/reporting_widgets.dart';
import 'package:flutter/material.dart';
import 'package:lunas_mobile/features/reporting/presentation/widgets/evidence_preview.dart';
import 'package:lunas_mobile/features/reporting/data/models/category_option.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import 'package:lunas_mobile/app/app_services.dart';
import 'package:lunas_mobile/core/network/api_exception.dart';
import 'package:lunas_mobile/core/theme/app_spacing.dart';
import 'package:lunas_mobile/core/widgets/lunas_card.dart';
import 'package:lunas_mobile/core/widgets/lunas_state_view.dart';
import 'package:lunas_mobile/features/maps/data/services/location_service.dart';
import 'package:lunas_mobile/features/repair/data/models/repair_models.dart';
import 'package:lunas_mobile/features/repair/routes/repair_routes.dart';
import 'package:lunas_mobile/features/repair/presentation/widgets/repair_widgets.dart';
import 'package:lunas_mobile/features/reporting/domain/models/evidence_selection.dart';

/// Records field notes or submits completed repair evidence for review.
class UpdateRepairProgressScreen extends StatefulWidget {
  const UpdateRepairProgressScreen({required this.workOrderId, super.key});

  final String workOrderId;

  @override
  State<UpdateRepairProgressScreen> createState() =>
      _UpdateRepairProgressScreenState();
}

class _UpdateRepairProgressScreenState
    extends State<UpdateRepairProgressScreen> {
  final _formKey = GlobalKey<FormState>();
  final _notesController = TextEditingController();
  final LocationService _locationService = const LocationService();
  bool _loading = true;
  bool _saving = false;
  Future<bool>? _initialLocation;
  String? _error;
  RepairWorkOrder? _workOrder;
  EvidenceSelection? _evidence;
  bool _submitCompletion = false;
  double? _latitude;
  double? _longitude;

  @override
  void initState() {
    super.initState();
    _load();
    _initialLocation = _attachCurrentLocation();
  }

  @override
  void dispose() {
    _notesController.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final workOrder = await repairService.getWorkOrder(widget.workOrderId);
      if (!mounted) return;
      setState(() {
        _workOrder = workOrder;
      });
    } on ApiException catch (error) {
      if (mounted) setState(() => _error = error.message);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _pickEvidence() async {
    final source = await showModalBottomSheet<ImageSource>(
      context: context,
      showDragHandle: true,
      builder: (context) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: const Icon(Icons.photo_camera_outlined),
              title: const Text('Take Photo'),
              onTap: () => Navigator.pop(context, ImageSource.camera),
            ),
            ListTile(
              leading: const Icon(Icons.photo_library_outlined),
              title: const Text('Choose from Photo Library'),
              onTap: () => Navigator.pop(context, ImageSource.gallery),
            ),
          ],
        ),
      ),
    );
    if (source == null || !mounted) return;
    try {
      final evidence = await evidenceService.pick(source);
      if (mounted) setState(() => _evidence = evidence);
    } on EvidenceException catch (error) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text(error.message)));
      }
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Could not prepare that image for upload.'),
          ),
        );
      }
    }
  }

  Future<bool> _attachCurrentLocation() async {
    _latitude = null;
    _longitude = null;
    try {
      final position = await _locationService.determinePosition();
      if (!mounted) return false;
      _latitude = position.latitude;
      _longitude = position.longitude;
      return true;
    } catch (_) {
      return false;
    }
  }

  String? _validateNotes(String? value) {
    final notes = value?.trim() ?? '';
    if (!_submitCompletion && notes.isEmpty) {
      return 'Describe the work performed before saving.';
    }
    if (notes.length > 2000) return 'Notes must be 2,000 characters or fewer.';
    return null;
  }

  Future<void> _save() async {
    final workOrder = _workOrder;
    if (_saving || workOrder == null || !_formKey.currentState!.validate()) {
      return;
    }
    if (_submitCompletion && _evidence == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text(
            'Add final post-maintenance evidence before completing the repair.',
          ),
        ),
      );
      return;
    }
    setState(() => _saving = true);
    try {
      await _initialLocation;
      if (!mounted) return;
      final located = await _attachCurrentLocation();
      if (!mounted) return;
      if (!located) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text(
              'Enable location services and allow location access, then try saving again. A current location is required for this update.',
            ),
          ),
        );
        return;
      }
      final updated = await repairService.submitProgress(
        workOrder.id,
        progressPercent: _submitCompletion ? 100 : workOrder.progressPercent,
        stage: _submitCompletion
            ? RepairProgressStage.readyForCompletion
            : workOrder.progressStage,
        updateType: _submitCompletion ? 'completion' : 'note',
        notes: _submitCompletion ? '' : _notesController.text,
        finalEvidence: _submitCompletion ? _evidence : null,
        latitude: _latitude,
        longitude: _longitude,
        version: workOrder.version,
      );
      if (!mounted) return;
      final message = _submitCompletion
          ? 'Repair completed and sent to the Utility Provider for review.'
          : 'Repair progress saved.';
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text(message)));
      context.go(RepairRoutes.workOrder(updated.id));
    } on ApiException catch (error) {
      if (!mounted) return;
      if (error.isConflict) {
        await _load();
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text(
              'This work order changed on the server. Review the latest progress before retrying.',
            ),
          ),
        );
      } else {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text(error.message)));
      }
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Scaffold(
        body: SafeArea(
          child: LunasStateView(
            state: LunasViewState.loading,
            title: 'Loading repair progress',
            message: 'Getting the current server-confirmed repair state.',
          ),
        ),
      );
    }
    if (_error != null || _workOrder == null) {
      return Scaffold(
        appBar: const RepairAppBar(
          title: 'Update Progress',
          showBackButton: true,
        ),
        body: SafeArea(
          child: LunasStateView(
            state: LunasViewState.error,
            title: 'Could not update progress',
            message: _error ?? 'This work order is unavailable.',
            actionLabel: 'Try Again',
            onAction: _load,
          ),
        ),
      );
    }
    final workOrder = _workOrder!;
    if (!workOrder.canUpdateProgress) {
      return Scaffold(
        appBar: const RepairAppBar(
          title: 'Update Progress',
          showBackButton: true,
        ),
        body: SafeArea(
          child: LunasStateView(
            state: LunasViewState.empty,
            title: 'Progress updates are unavailable',
            message:
                'Only an in-progress work order can receive a repair update.',
            actionLabel: 'View Work Order',
            onAction: () => context.canPop()
                ? context.pop()
                : context.go(RepairRoutes.workOrders),
          ),
        ),
      );
    }
    return RepairPage(
      appBar: RepairAppBar(
        title: 'Update Progress',
        subtitle: workOrder.orderNumber,
        showBackButton: true,
      ),
      bottomActionBar: _SaveProgressActionBar(
        saving: _saving,
        submitCompletion: _submitCompletion,
        onSave: _save,
      ),
      child: Form(
        key: _formKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            LunasCard(
              child: Row(
                children: [
                  Icon(
                    reportCategoryIcon(workOrder.category),
                    size: 24,
                    color: Theme.of(context).colorScheme.primary,
                  ),
                  const SizedBox(width: AppSpacing.md),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          categoryFromCode(workOrder.category).label,
                          style: Theme.of(context).textTheme.titleMedium
                              ?.copyWith(fontWeight: FontWeight.w700),
                        ),
                        const SizedBox(height: AppSpacing.xxs),
                        Text(
                          workOrder.location.barangay ??
                              workOrder.location.displayAddress,
                          style: Theme.of(context).textTheme.bodySmall,
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: AppSpacing.lg),
            Text('Update Type', style: Theme.of(context).textTheme.titleSmall),
            const SizedBox(height: AppSpacing.sm),
            _UpdateChoice(
              title: 'Progress Update',
              subtitle: 'Record work done or explain a delay.',
              selected: !_submitCompletion,
              onTap: _saving
                  ? null
                  : () => setState(() => _submitCompletion = false),
            ),
            const SizedBox(height: AppSpacing.sm),
            _UpdateChoice(
              title: workOrder.isCorrectionResubmission
                  ? 'Resubmit Repair'
                  : 'Complete Repair',
              subtitle: 'Send a completed repair photo for review.',
              selected: _submitCompletion,
              onTap: _saving
                  ? null
                  : () => setState(() => _submitCompletion = true),
            ),
            const SizedBox(height: AppSpacing.lg),
            if (!_submitCompletion) ...[
              Text(
                'Progress Notes',
                style: Theme.of(context).textTheme.titleSmall,
              ),
              const SizedBox(height: AppSpacing.xs),
              TextFormField(
                controller: _notesController,
                maxLines: 4,
                maxLength: 2000,
                textCapitalization: TextCapitalization.sentences,
                validator: _validateNotes,
                decoration: const InputDecoration(
                  hintText:
                      'Describe work performed, materials, delays, or field conditions.',
                  alignLabelWithHint: true,
                ),
              ),
            ],
            if (_submitCompletion) ...[
              _EvidencePicker(
                evidence: _evidence,
                onPick: _saving ? null : _pickEvidence,
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _EvidencePicker extends StatelessWidget {
  const _EvidencePicker({required this.evidence, required this.onPick});

  final EvidenceSelection? evidence;
  final VoidCallback? onPick;

  @override
  Widget build(BuildContext context) => LunasCard(
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text(
          'Completed Repair Photo',
          style: Theme.of(context).textTheme.titleSmall,
        ),
        const SizedBox(height: AppSpacing.xs),
        Text(
          'Show the completed work clearly. An official will review the photo.',
          style: Theme.of(context).textTheme.bodyMedium?.copyWith(height: 1.5),
        ),
        const SizedBox(height: AppSpacing.xs),
        Text(
          'JPG or PNG · Up to 10 MB',
          style: Theme.of(context).textTheme.bodySmall,
        ),
        const SizedBox(height: AppSpacing.md),
        if (evidence != null) ...[
          LocalEvidencePreview(
            key: ObjectKey(evidence),
            evidence: evidence!,
            height: 220,
          ),
          const SizedBox(height: AppSpacing.sm),
        ],
        if (evidence == null)
          OutlinedButton.icon(
            onPressed: onPick,
            icon: const Icon(Icons.add_a_photo_outlined),
            label: const Text('Add Photo'),
          )
        else
          OutlinedButton.icon(
            onPressed: onPick,
            icon: const Icon(Icons.photo_library_outlined),
            label: const Text('Choose Another Photo'),
          ),
      ],
    ),
  );
}

class _SaveProgressActionBar extends StatelessWidget {
  const _SaveProgressActionBar({
    required this.saving,
    required this.submitCompletion,
    required this.onSave,
  });

  final bool saving;
  final bool submitCompletion;
  final VoidCallback onSave;

  @override
  Widget build(BuildContext context) => SafeArea(
    top: false,
    child: Container(
      padding: const EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface,
        border: Border(
          top: BorderSide(color: Theme.of(context).colorScheme.outlineVariant),
        ),
      ),
      child: FilledButton.icon(
        onPressed: saving ? null : onSave,
        icon: saving
            ? const SizedBox(
                width: 18,
                height: 18,
                child: CircularProgressIndicator(strokeWidth: 2),
              )
            : Icon(submitCompletion ? Icons.send_rounded : Icons.save_outlined),
        label: Text(
          saving
              ? (_submitLabel(submitCompletion, true))
              : _submitLabel(submitCompletion, false),
        ),
      ),
    ),
  );
}

String _submitLabel(bool completion, bool saving) => saving
    ? (completion ? 'Submitting…' : 'Saving…')
    : (completion ? 'Submit for Review' : 'Save Update');

class _UpdateChoice extends StatelessWidget {
  const _UpdateChoice({
    required this.title,
    required this.subtitle,
    required this.selected,
    required this.onTap,
  });
  final String title;
  final String subtitle;
  final bool selected;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Material(
      color: selected
          ? theme.colorScheme.primary.withValues(alpha: .04)
          : theme.colorScheme.surface,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: BorderSide(
          color: selected
              ? theme.colorScheme.primary
              : theme.colorScheme.outlineVariant,
          width: selected ? 1.5 : 1,
        ),
      ),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: onTap,
        child: Semantics(
          selected: selected,
          button: true,
          child: Padding(
            padding: const EdgeInsets.all(AppSpacing.md),
            child: Row(
              children: [
                Icon(
                  selected
                      ? Icons.radio_button_checked
                      : Icons.radio_button_unchecked,
                  size: 22,
                  color: selected
                      ? theme.colorScheme.primary
                      : theme.colorScheme.onSurfaceVariant,
                ),
                const SizedBox(width: AppSpacing.md),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(title, style: theme.textTheme.titleSmall),
                      const SizedBox(height: AppSpacing.xxs),
                      Text(
                        subtitle,
                        style: theme.textTheme.bodySmall?.copyWith(height: 1.5),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
