import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import 'package:lunas_mobile/core/app_services.dart';
import 'package:lunas_mobile/core/network/api_exception.dart';
import 'package:lunas_mobile/core/theme/app_colors.dart';
import 'package:lunas_mobile/core/theme/app_spacing.dart';
import 'package:lunas_mobile/core/widgets/lunas_card.dart';
import 'package:lunas_mobile/core/widgets/lunas_state_view.dart';
import 'package:lunas_mobile/features/maps/data/services/location_service.dart';
import 'package:lunas_mobile/features/repair/data/models/repair_models.dart';
import 'package:lunas_mobile/features/repair/presentation/screens/repair_routes.dart';
import 'package:lunas_mobile/features/repair/presentation/screens/repair_widgets.dart';
import 'package:lunas_mobile/features/reporting/domain/models/evidence_selection.dart';

/// Submits an append-only field progress update. Percentages and stages are
/// deliberately constrained to the approved repair sequence, which is
/// separate from project-development percentages.
class UpdateRepairProgressScreen extends StatefulWidget {
  const UpdateRepairProgressScreen({required this.workOrderId, super.key});

  final String workOrderId;

  @override
  State<UpdateRepairProgressScreen> createState() => _UpdateRepairProgressScreenState();
}

class _UpdateRepairProgressScreenState extends State<UpdateRepairProgressScreen> {
  final _formKey = GlobalKey<FormState>();
  final _notesController = TextEditingController();
  final LocationService _locationService = const LocationService();
  bool _loading = true;
  bool _saving = false;
  bool _locating = false;
  String? _error;
  String? _locationNotice;
  RepairWorkOrder? _workOrder;
  EvidenceSelection? _evidence;
  int _selectedProgress = 0;
  double? _latitude;
  double? _longitude;

  @override
  void initState() {
    super.initState();
    _load();
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
        _selectedProgress = workOrder.progressPercent;
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
              title: const Text('Take photo'),
              onTap: () => Navigator.pop(context, ImageSource.camera),
            ),
            ListTile(
              leading: const Icon(Icons.photo_library_outlined),
              title: const Text('Choose from photo library'),
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
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(error.message)));
      }
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Could not prepare that image for upload.')),
        );
      }
    }
  }

  Future<void> _attachCurrentLocation() async {
    setState(() {
      _locating = true;
      _locationNotice = null;
    });
    try {
      final position = await _locationService.determinePosition();
      if (!mounted) return;
      setState(() {
        _latitude = position.latitude;
        _longitude = position.longitude;
        _locationNotice = 'Current coordinates will be attached to this update.';
      });
    } on LocationServiceException catch (_) {
      if (mounted) {
        setState(
          () => _locationNotice =
              'Location was not attached. You can submit this update without it.',
        );
      }
    } catch (_) {
      if (mounted) {
        setState(
          () => _locationNotice =
              'We could not get your location. You can submit this update without it.',
        );
      }
    } finally {
      if (mounted) setState(() => _locating = false);
    }
  }

  String? _validateNotes(String? value) {
    final notes = value?.trim() ?? '';
    if (notes.length > 2000) return 'Notes must be 2,000 characters or fewer.';
    if (_selectedProgress == 100 && notes.length < 10) {
      return 'Add a meaningful completion note before marking work ready.';
    }
    return null;
  }

  Future<void> _save() async {
    final workOrder = _workOrder;
    if (workOrder == null || !_formKey.currentState!.validate()) return;
    final correctionResubmission = workOrder.isCorrectionResubmission;
    if (_selectedProgress <= workOrder.progressPercent && !correctionResubmission) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Select a repair milestone higher than the current progress.')),
      );
      return;
    }
    if (_selectedProgress == 100 && _evidence == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Add final post-maintenance evidence before completing the repair.'),
        ),
      );
      return;
    }
    setState(() => _saving = true);
    try {
      final updated = await repairService.submitProgress(
        workOrder.id,
        progressPercent: _selectedProgress,
        stage: repairStageForProgress(_selectedProgress),
        notes: _notesController.text,
        finalEvidence: _selectedProgress == 100 ? _evidence : null,
        latitude: _latitude,
        longitude: _longitude,
        version: workOrder.version,
      );
      if (_evidence != null && _selectedProgress != 100) {
        try {
          final progressUpdateId = updated.progressUpdates.isEmpty
              ? null
              : updated.progressUpdates.last.id;
          await repairService.uploadEvidence(
            updated.id,
            evidence: _evidence!,
            caption: _notesController.text,
            progressUpdateId: progressUpdateId,
          );
        } on ApiException catch (error) {
          if (!mounted) return;
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(
                'Progress was saved, but evidence was not uploaded: ${error.message}',
              ),
            ),
          );
          context.go(RepairRoutes.workOrder(updated.id));
          return;
        }
      }
      if (!mounted) return;
      final message = _selectedProgress == 100
          ? 'Repair completed and sent to the Utility Provider for review.'
          : 'Repair progress saved.';
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(message)));
      context.go(RepairRoutes.workOrder(updated.id));
    } on ApiException catch (error) {
      if (!mounted) return;
      if (error.isConflict) {
        await _load();
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('This work order changed on the server. Review the latest progress before retrying.')),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(error.message)));
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
        appBar: const RepairAppBar(title: 'Update progress', showBackButton: true),
        body: SafeArea(
          child: LunasStateView(
            state: LunasViewState.error,
            title: 'Could not update progress',
            message: _error ?? 'This work order is unavailable.',
            actionLabel: 'Try again',
            onAction: _load,
          ),
        ),
      );
    }
    final workOrder = _workOrder!;
    if (!workOrder.canUpdateProgress) {
      return Scaffold(
        appBar: const RepairAppBar(title: 'Update progress', showBackButton: true),
        body: SafeArea(
          child: LunasStateView(
            state: LunasViewState.empty,
            title: 'Progress updates are unavailable',
            message: 'Only an in-progress work order can receive a repair update.',
            actionLabel: 'View work order',
            onAction: () => Navigator.of(context).pop(),
          ),
        ),
      );
    }
    final stage = repairStageForProgress(_selectedProgress);
    return RepairPage(
      appBar: const RepairAppBar(title: 'Update progress', showBackButton: true),
      bottomActionBar: _SaveProgressActionBar(saving: _saving, onSave: _save),
      child: Form(
        key: _formKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              workOrder.orderNumber,
              style: Theme.of(context).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w700),
            ),
            const SizedBox(height: AppSpacing.xs),
            Text(workOrder.location.displayAddress),
            const SizedBox(height: AppSpacing.lg),
            _CurrentProgressCard(workOrder: workOrder),
            const SizedBox(height: AppSpacing.xl),
            Text('Repair progress', style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: AppSpacing.xs),
            Text(workOrder.isCorrectionResubmission
                ? 'The provider requested corrective work. Submit a new completion note and final evidence at 100%.'
                : 'Select the approved repair milestone. Progress cannot be reduced.'),
            const SizedBox(height: AppSpacing.sm),
            Wrap(
              spacing: AppSpacing.xs,
              runSpacing: AppSpacing.xs,
              children: [
                for (final value in [0, 25, 50, 75, 100])
                  ChoiceChip(
                    label: Text(value == 100 && workOrder.isCorrectionResubmission ? '100% · Resubmit completion' : '$value%'),
                    selected: _selectedProgress == value,
                    onSelected: value <= workOrder.progressPercent && !(value == 100 && workOrder.isCorrectionResubmission)
                        ? null
                        : (_) => setState(() {
                            _selectedProgress = value;
                          }),
                  ),
              ],
            ),
            const SizedBox(height: AppSpacing.md),
            LunasCard(
              color: Theme.of(context).colorScheme.primaryContainer.withValues(alpha: .42),
              child: RepairInfoRow(label: 'Repair stage', value: stage.label),
            ),
            const SizedBox(height: AppSpacing.xl),
            Text('Progress notes', style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: AppSpacing.xs),
            TextFormField(
              controller: _notesController,
              maxLines: 4,
              maxLength: 2000,
              textCapitalization: TextCapitalization.sentences,
              validator: _validateNotes,
              decoration: const InputDecoration(
                hintText: 'Describe work performed, materials, delays, or field conditions.',
                alignLabelWithHint: true,
              ),
            ),
            const SizedBox(height: AppSpacing.lg),
            _EvidencePicker(
              evidence: _evidence,
              requiredForCompletion: _selectedProgress == 100,
              onPick: _saving ? null : _pickEvidence,
              onRemove: _saving ? null : () => setState(() => _evidence = null),
            ),
            const SizedBox(height: AppSpacing.lg),
            _LocationPicker(
              locating: _locating,
              locationNotice: _locationNotice,
              hasLocation: _latitude != null && _longitude != null,
              onAttach: _saving || _locating ? null : _attachCurrentLocation,
            ),
            if (_selectedProgress == 100) ...[
              const SizedBox(height: AppSpacing.lg),
              const _ReadyForCompletionNotice(),
            ],
          ],
        ),
      ),
    );
  }
}

class _CurrentProgressCard extends StatelessWidget {
  const _CurrentProgressCard({required this.workOrder});

  final RepairWorkOrder workOrder;

  @override
  Widget build(BuildContext context) => LunasCard(
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text('Current server-confirmed progress', style: Theme.of(context).textTheme.titleMedium),
        const SizedBox(height: AppSpacing.md),
        Text(
          '${workOrder.progressPercent}%',
          style: Theme.of(context).textTheme.displaySmall?.copyWith(fontWeight: FontWeight.w700),
        ),
        const SizedBox(height: AppSpacing.xs),
        LinearProgressIndicator(value: workOrder.progressPercent / 100),
        const SizedBox(height: AppSpacing.sm),
        Text(workOrder.progressStage.label),
      ],
    ),
  );
}

class _EvidencePicker extends StatelessWidget {
  const _EvidencePicker({
    required this.evidence,
    required this.requiredForCompletion,
    required this.onPick,
    required this.onRemove,
  });

  final EvidenceSelection? evidence;
  final bool requiredForCompletion;
  final VoidCallback? onPick;
  final VoidCallback? onRemove;

  @override
  Widget build(BuildContext context) => LunasCard(
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text(requiredForCompletion ? 'Final post-maintenance evidence' : 'Field evidence', style: Theme.of(context).textTheme.titleLarge),
        const SizedBox(height: AppSpacing.xs),
        Text(requiredForCompletion
            ? 'Required to complete the repair. This image is submitted with the 100% completion update.'
            : 'Optional JPG or PNG evidence up to 10 MB. It uploads after the progress update is confirmed.'),
        const SizedBox(height: AppSpacing.md),
        if (evidence == null)
          OutlinedButton.icon(
            onPressed: onPick,
            icon: const Icon(Icons.add_a_photo_outlined),
            label: Text(requiredForCompletion ? 'Add final evidence' : 'Select evidence'),
          )
        else
          Row(
            children: [
              const Icon(Icons.image_outlined, color: AppColorsLight.success),
              const SizedBox(width: AppSpacing.sm),
              Expanded(
                child: Text('${evidence!.filename} · ${(evidence!.byteLength / 1024).ceil()} KB'),
              ),
              IconButton(
                tooltip: 'Remove selected evidence',
                onPressed: onRemove,
                icon: const Icon(Icons.close_rounded),
              ),
            ],
          ),
      ],
    ),
  );
}

class _LocationPicker extends StatelessWidget {
  const _LocationPicker({
    required this.locating,
    required this.locationNotice,
    required this.hasLocation,
    required this.onAttach,
  });

  final bool locating;
  final String? locationNotice;
  final bool hasLocation;
  final VoidCallback? onAttach;

  @override
  Widget build(BuildContext context) => LunasCard(
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text('Optional field location', style: Theme.of(context).textTheme.titleLarge),
        const SizedBox(height: AppSpacing.xs),
        const Text('LUNAS only requests current location for this explicit progress update.'),
        const SizedBox(height: AppSpacing.md),
        OutlinedButton.icon(
          onPressed: onAttach,
          icon: locating
              ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2))
              : Icon(hasLocation ? Icons.location_on_outlined : Icons.my_location_rounded),
          label: Text(hasLocation ? 'Location attached' : 'Attach current location'),
        ),
        if (locationNotice != null) ...[
          const SizedBox(height: AppSpacing.sm),
          Text(locationNotice!, style: Theme.of(context).textTheme.bodySmall),
        ],
      ],
    ),
  );
}

class _ReadyForCompletionNotice extends StatelessWidget {
  const _ReadyForCompletionNotice();

  @override
  Widget build(BuildContext context) => LunasCard(
    color: AppColorsLight.success.withValues(alpha: .10),
    child: const Text(
      'At 100%, the repair is marked completed and sent to the Utility Provider for review. City Engineering performs the final verification and closure.',
    ),
  );
}

class _SaveProgressActionBar extends StatelessWidget {
  const _SaveProgressActionBar({required this.saving, required this.onSave});

  final bool saving;
  final VoidCallback onSave;

  @override
  Widget build(BuildContext context) => SafeArea(
    top: false,
    child: Container(
      padding: const EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface,
        border: Border(top: BorderSide(color: Theme.of(context).colorScheme.outlineVariant)),
      ),
      child: FilledButton.icon(
        onPressed: saving ? null : onSave,
        icon: saving
            ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2))
            : const Icon(Icons.save_outlined),
        label: Text(saving ? 'Saving progress…' : 'Save progress update'),
      ),
    ),
  );
}
