import 'package:flutter/material.dart';
import 'package:lunas_mobile/core/theme/app_radius.dart';
import 'package:lunas_mobile/core/theme/app_spacing.dart';
import 'package:lunas_mobile/core/widgets/lunas_app_bar.dart';
import 'package:lunas_mobile/core/widgets/lunas_button.dart';
import 'package:lunas_mobile/core/widgets/lunas_card.dart';

class PhotoUploadScreen extends StatefulWidget {
  const PhotoUploadScreen({super.key});

  @override
  State<PhotoUploadScreen> createState() => _PhotoUploadScreenState();
}

class _PhotoUploadScreenState extends State<PhotoUploadScreen> {
  bool _captured = false;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      appBar: const LunasAppBar(
        title: 'Upload Images',
        subtitle: 'Add clear photos of the issue',
        showBackButton: true,
      ),
      body: SafeArea(
        top: false,
        child: Padding(
          padding: const EdgeInsets.all(AppSpacing.xl),
          child: Column(
            children: [
              Expanded(
                child: LunasCard(
                  padding: EdgeInsets.zero,
                  child: ClipRRect(
                    borderRadius: AppRadius.card,
                    child: ColoredBox(
                      color: theme.colorScheme.surfaceContainer,
                      child: Stack(
                        fit: StackFit.expand,
                        children: [
                          Icon(
                            _captured
                                ? Icons.foundation_outlined
                                : Icons.camera_alt_outlined,
                            size: 100,
                            color: theme.colorScheme.primary,
                          ),
                          if (_captured)
                            Positioned(
                              left: AppSpacing.md,
                              right: AppSpacing.md,
                              bottom: AppSpacing.md,
                              child: Text(
                                'Photo ready to attach to your report.',
                                textAlign: TextAlign.center,
                                style: theme.textTheme.bodySmall,
                              ),
                            ),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
              const SizedBox(height: AppSpacing.xl),
              if (!_captured)
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: () => setState(() => _captured = true),
                        icon: const Icon(Icons.photo_library_outlined),
                        label: const Text('Gallery'),
                      ),
                    ),
                    const SizedBox(width: AppSpacing.md),
                    Expanded(
                      child: LunasButton(
                        label: 'Capture',
                        icon: Icons.photo_camera_rounded,
                        onPressed: () => setState(() => _captured = true),
                      ),
                    ),
                  ],
                )
              else
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton(
                        onPressed: () => setState(() => _captured = false),
                        child: const Text('Retake'),
                      ),
                    ),
                    const SizedBox(width: AppSpacing.md),
                    Expanded(
                      child: LunasButton(
                        label: 'Use Photo',
                        onPressed: () =>
                            Navigator.pop(context, 'local://hazard-evidence'),
                      ),
                    ),
                  ],
                ),
            ],
          ),
        ),
      ),
    );
  }
}
