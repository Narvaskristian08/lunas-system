import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import 'package:lunas_mobile/core/app_services.dart';
import 'package:lunas_mobile/core/theme/app_spacing.dart';
import 'package:lunas_mobile/core/theme/app_radius.dart';
import 'package:lunas_mobile/core/widgets/lunas_app_bar.dart';
import 'package:lunas_mobile/core/widgets/lunas_button.dart';
import 'package:lunas_mobile/core/widgets/lunas_card.dart';
import 'package:lunas_mobile/features/reporting/domain/models/evidence_selection.dart';
import 'package:lunas_mobile/features/reporting/presentation/widgets/evidence_preview.dart';

class EvidencePickerScreen extends StatefulWidget {
  const EvidencePickerScreen({super.key});

  @override
  State<EvidencePickerScreen> createState() => _EvidencePickerScreenState();
}

class _EvidencePickerScreenState extends State<EvidencePickerScreen> {
  EvidenceSelection? _evidence;
  bool _selecting = false;
  String? _error;

  Future<void> _pick(ImageSource source) async {
    setState(() {
      _selecting = true;
      _error = null;
    });
    try {
      final evidence = await evidenceService.pick(source);
      if (mounted && evidence != null) setState(() => _evidence = evidence);
    } on EvidenceException catch (error) {
      if (mounted) setState(() => _error = error.message);
    } catch (_) {
      if (mounted) {
        setState(
          () => _error =
              'We could not access that image. Check the permission and try again.',
        );
      }
    } finally {
      if (mounted) setState(() => _selecting = false);
    }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: const LunasAppBar(
      title: 'Add evidence',
      subtitle: 'Add a clear photo of the issue.',
      showBackButton: true,
    ),
    body: SafeArea(
      top: false,
      child: LayoutBuilder(
        builder: (context, constraints) => SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(
            AppSpacing.xl,
            AppSpacing.md,
            AppSpacing.xl,
            AppSpacing.md,
          ),
          child: ConstrainedBox(
            constraints: BoxConstraints(
              minHeight: (constraints.maxHeight - AppSpacing.md * 2).clamp(
                0.0,
                double.infinity,
              ),
            ),
            child: Column(
              mainAxisAlignment: _evidence == null
                  ? MainAxisAlignment.center
                  : MainAxisAlignment.start,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                if (_evidence == null)
                  _EmptyEvidenceState(selecting: _selecting, onPick: _pick)
                else ...[
                  LocalEvidencePreview(evidence: _evidence!),
                  const SizedBox(height: AppSpacing.md),
                  LunasCard(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Row(
                          children: [
                            Icon(Icons.check_circle_outline_rounded),
                            SizedBox(width: AppSpacing.sm),
                            Expanded(
                              child: Text(
                                'Basic file type and size checks passed. Automated image-quality scoring is not available in this build.',
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: AppSpacing.md),
                  Container(
                    padding: const EdgeInsets.all(AppSpacing.md),
                    decoration: BoxDecoration(
                      color: Theme.of(context).colorScheme.secondaryContainer,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.center,
                      children: [
                        Icon(
                          Icons.verified_user_outlined,
                          color: Theme.of(
                            context,
                          ).colorScheme.onSecondaryContainer,
                        ),
                        const SizedBox(width: AppSpacing.sm),
                        Expanded(
                          child: Text(
                            'Images are checked for faces and license plates on the server and blurred before storage. If privacy processing is unavailable, the report will not be submitted.',
                            style: TextStyle(
                              color: Theme.of(
                                context,
                              ).colorScheme.onSecondaryContainer,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: AppSpacing.md),
                  OutlinedButton.icon(
                    onPressed: _selecting
                        ? null
                        : () => _pick(ImageSource.gallery),
                    icon: const Icon(Icons.photo_library_outlined),
                    label: const Text('Choose a different image'),
                  ),
                  const SizedBox(height: AppSpacing.md),
                  LunasButton(
                    label: 'Use this evidence',
                    isLoading: _selecting,
                    onPressed: _selecting ? null : () => context.pop(_evidence),
                  ),
                ],
                if (_error != null) ...[
                  const SizedBox(height: AppSpacing.md),
                  Text(
                    _error!,
                    style: TextStyle(
                      color: Theme.of(context).colorScheme.error,
                    ),
                  ),
                ],
                if (_selecting) ...[
                  const SizedBox(height: AppSpacing.md),
                  const Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      SizedBox.square(
                        dimension: 18,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      ),
                      SizedBox(width: AppSpacing.sm),
                      Text('Checking the selected image…'),
                    ],
                  ),
                ],
                if (_evidence == null) const SizedBox(height: 64),
              ],
            ),
          ),
        ),
      ),
    ),
  );
}

class _EmptyEvidenceState extends StatelessWidget {
  const _EmptyEvidenceState({required this.selecting, required this.onPick});
  final bool selecting;
  final ValueChanged<ImageSource> onPick;

  @override
  Widget build(BuildContext context) => Column(
    children: [
      Icon(
        Icons.add_photo_alternate_outlined,
        size: 80,
        color: Theme.of(context).colorScheme.primary,
      ),
      const SizedBox(height: AppSpacing.lg),
      Text(
        'Add one clear image',
        style: Theme.of(context).textTheme.headlineSmall,
      ),
      const SizedBox(height: AppSpacing.sm),
      const Text(
        'Show the issue and its surroundings. JPG, PNG, and WebP images up to 10 MB are supported.',
        textAlign: TextAlign.center,
      ),
      const SizedBox(height: AppSpacing.xxl),
      Row(
        children: [
          Expanded(
            child: SizedBox(
              height: 52,
              child: OutlinedButton.icon(
                style: OutlinedButton.styleFrom(
                  shape: RoundedRectangleBorder(borderRadius: AppRadius.button),
                ),
                label: const Text('Photo library'),
                icon: const Icon(Icons.photo_library_outlined, size: 18),
                onPressed: selecting ? null : () => onPick(ImageSource.gallery),
              ),
            ),
          ),
          const SizedBox(width: AppSpacing.md),
          Expanded(
            child: SizedBox(
              height: 52,
              child: LunasButton(
                label: 'Camera',
                icon: Icons.photo_camera_outlined,
                isLoading: selecting,
                onPressed: selecting ? null : () => onPick(ImageSource.camera),
              ),
            ),
          ),
        ],
      ),
    ],
  );
}
