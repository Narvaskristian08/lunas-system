import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:lunas_mobile/core/app_services.dart';
import 'package:lunas_mobile/core/network/api_exception.dart';
import 'package:lunas_mobile/core/theme/app_spacing.dart';
import 'package:lunas_mobile/core/widgets/lunas_card.dart';
import 'package:lunas_mobile/core/widgets/lunas_state_view.dart';
import 'package:lunas_mobile/features/repair/data/models/repair_models.dart';
import 'package:lunas_mobile/features/repair/presentation/screens/repair_widgets.dart';
import 'package:lunas_mobile/features/reporting/domain/models/evidence_selection.dart';
import 'package:lunas_mobile/features/reporting/presentation/widgets/evidence_preview.dart';

/// Uploads a real field image for an in-progress work order. The server owns
/// evidence access, metadata, and every workflow transition.
class UploadRepairEvidenceScreen extends StatefulWidget {
  const UploadRepairEvidenceScreen({required this.workOrderId, super.key});

  final String workOrderId;

  @override
  State<UploadRepairEvidenceScreen> createState() => _UploadRepairEvidenceScreenState();
}

class _UploadRepairEvidenceScreenState extends State<UploadRepairEvidenceScreen> {
  final _captionController = TextEditingController();
  bool _loading = true;
  bool _uploading = false;
  String? _error;
  RepairWorkOrder? _workOrder;
  EvidenceSelection? _selection;

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _captionController.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final workOrder = await repairService.getWorkOrder(widget.workOrderId);
      if (mounted) setState(() => _workOrder = workOrder);
    } on ApiException catch (error) {
      if (mounted) setState(() => _error = error.message);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _selectEvidence() async {
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
      final selection = await evidenceService.pick(source);
      if (mounted) setState(() => _selection = selection);
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

  Future<void> _upload() async {
    final workOrder = _workOrder;
    final selection = _selection;
    if (workOrder == null || selection == null) return;
    if (!workOrder.canUpdateProgress) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Evidence can only be uploaded while repair is in progress.')),
      );
      return;
    }
    setState(() => _uploading = true);
    try {
      await repairService.uploadEvidence(
        workOrder.id,
        evidence: selection,
        caption: _captionController.text,
      );
      if (!mounted) return;
      setState(() {
        _selection = null;
        _captionController.clear();
      });
      await _load();
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Field evidence uploaded.')),
      );
    } on ApiException catch (error) {
      if (!mounted) return;
      if (error.isConflict) await _load();
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            error.isConflict
                ? 'This work order changed on the server. Review its latest state before retrying.'
                : error.message,
          ),
        ),
      );
    } finally {
      if (mounted) setState(() => _uploading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Scaffold(
        body: SafeArea(
          child: LunasStateView(
            state: LunasViewState.loading,
            title: 'Loading repair evidence',
            message: 'Checking the server-confirmed work order state.',
          ),
        ),
      );
    }
    if (_error != null || _workOrder == null) {
      return Scaffold(
        appBar: const RepairAppBar(title: 'Field evidence', showBackButton: true),
        body: SafeArea(
          child: LunasStateView(
            state: LunasViewState.error,
            title: 'Could not open field evidence',
            message: _error ?? 'This work order is unavailable.',
            actionLabel: 'Try again',
            onAction: _load,
          ),
        ),
      );
    }
    final workOrder = _workOrder!;
    return RepairPage(
      appBar: RepairAppBar(
        title: 'Field evidence',
        subtitle: workOrder.orderNumber,
        showBackButton: true,
      ),
      bottomActionBar: _UploadActionBar(
        uploading: _uploading,
        enabled: _selection != null && workOrder.canUpdateProgress,
        onUpload: _upload,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text('Document field conditions', style: Theme.of(context).textTheme.headlineSmall),
          const SizedBox(height: AppSpacing.xs),
          const Text('Add a JPG or PNG up to 10 MB. The image is stored only after the API accepts it.'),
          const SizedBox(height: AppSpacing.lg),
          if (!workOrder.canUpdateProgress)
            const _EvidenceStateNotice()
          else ...[
            _SelectionCard(
              selection: _selection,
              onSelect: _uploading ? null : _selectEvidence,
              onRemove: _uploading ? null : () => setState(() => _selection = null),
            ),
            const SizedBox(height: AppSpacing.lg),
            TextField(
              controller: _captionController,
              maxLength: 2000,
              maxLines: 3,
              enabled: !_uploading,
              textCapitalization: TextCapitalization.sentences,
              decoration: const InputDecoration(
                labelText: 'Caption (optional)',
                hintText: 'What does this image show?',
                alignLabelWithHint: true,
              ),
            ),
          ],
          const SizedBox(height: AppSpacing.xxl),
          Text('Uploaded evidence', style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: AppSpacing.sm),
          if (workOrder.repairEvidence.isEmpty)
            const LunasCard(child: Text('No field evidence has been uploaded yet.'))
          else
            for (final evidence in workOrder.repairEvidence) ...[
              _UploadedEvidenceCard(evidence: evidence),
              const SizedBox(height: AppSpacing.sm),
            ],
        ],
      ),
    );
  }
}

class _EvidenceStateNotice extends StatelessWidget {
  const _EvidenceStateNotice();

  @override
  Widget build(BuildContext context) => const LunasCard(
    child: Text('This work order is not in progress, so it cannot accept additional repair evidence.'),
  );
}

class _SelectionCard extends StatelessWidget {
  const _SelectionCard({
    required this.selection,
    required this.onSelect,
    required this.onRemove,
  });

  final EvidenceSelection? selection;
  final VoidCallback? onSelect;
  final VoidCallback? onRemove;

  @override
  Widget build(BuildContext context) => LunasCard(
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text('New evidence', style: Theme.of(context).textTheme.titleLarge),
        const SizedBox(height: AppSpacing.xs),
        if (selection == null)
          OutlinedButton.icon(
            onPressed: onSelect,
            icon: const Icon(Icons.add_a_photo_outlined),
            label: const Text('Select evidence image'),
          )
        else
          Row(
            children: [
              const Icon(Icons.image_outlined),
              const SizedBox(width: AppSpacing.sm),
              Expanded(
                child: Text(
                  '${selection!.filename} · ${(selection!.byteLength / 1024).ceil()} KB',
                ),
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

class _UploadedEvidenceCard extends StatelessWidget {
  const _UploadedEvidenceCard({required this.evidence});

  final RepairEvidence evidence;

  @override
  Widget build(BuildContext context) => LunasCard(
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        if (evidence.url.isNotEmpty)
          RemoteEvidencePreview(url: evidence.url)
        else
          const Row(
            children: [
              Icon(Icons.image_not_supported_outlined),
              SizedBox(width: AppSpacing.sm),
              Expanded(child: Text('Image preview is unavailable.')),
            ],
          ),
        if (evidence.caption?.isNotEmpty == true) ...[
          const SizedBox(height: AppSpacing.sm),
          Text(evidence.caption!),
        ],
      ],
    ),
  );
}

class _UploadActionBar extends StatelessWidget {
  const _UploadActionBar({
    required this.uploading,
    required this.enabled,
    required this.onUpload,
  });

  final bool uploading;
  final bool enabled;
  final VoidCallback onUpload;

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
        onPressed: uploading || !enabled ? null : onUpload,
        icon: uploading
            ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2))
            : const Icon(Icons.cloud_upload_outlined),
        label: Text(uploading ? 'Uploading evidence…' : 'Upload field evidence'),
      ),
    ),
  );
}
