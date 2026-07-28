import 'package:flutter/material.dart';
import 'package:lunas_mobile/core/theme/app_colors.dart';
import 'package:lunas_mobile/core/theme/app_radius.dart';
import 'package:lunas_mobile/core/theme/app_spacing.dart';
import 'package:lunas_mobile/core/widgets/lunas_app_bar.dart';
import 'package:lunas_mobile/core/widgets/lunas_card.dart';

/// Feature-local layout primitives for the Stitch registration prototypes.
///
/// They intentionally render local illustrative surfaces rather than importing
/// the generated HTML or its remote image URLs.
class StitchAuthPage extends StatelessWidget {
  const StitchAuthPage({
    required this.child,
    this.title = 'LUNAS',
    this.subtitle,
    this.showBackButton = true,
    this.actions,
    super.key,
  });

  final Widget child;
  final String title;
  final String? subtitle;
  final bool showBackButton;
  final List<Widget>? actions;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: LunasAppBar(
        title: title,
        subtitle: subtitle,
        showBackButton: showBackButton,
        actions: actions,
      ),
      body: SafeArea(
        top: false,
        child: LayoutBuilder(
          builder: (context, constraints) {
            final horizontal = constraints.maxWidth < 360
                ? AppSpacing.md
                : AppSpacing.xl;
            return SingleChildScrollView(
              padding: EdgeInsets.fromLTRB(
                horizontal,
                AppSpacing.lg,
                horizontal,
                AppSpacing.hero,
              ),
              child: Align(
                alignment: Alignment.topCenter,
                child: ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 640),
                  child: child,
                ),
              ),
            );
          },
        ),
      ),
    );
  }
}

class StitchBrandMark extends StatelessWidget {
  const StitchBrandMark({this.large = false, super.key});

  final bool large;

  @override
  Widget build(BuildContext context) {
    final size = large ? 80.0 : 48.0;
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.primaryContainer,
        borderRadius: BorderRadius.circular(large ? 26 : AppRadius.md),
        boxShadow: const [
          BoxShadow(
            color: Color(0x16004D99),
            blurRadius: 18,
            offset: Offset(0, 8),
          ),
        ],
      ),
      child: Icon(
        Icons.location_city_rounded,
        color: Theme.of(context).colorScheme.primary,
        size: large ? 42 : 26,
      ),
    );
  }
}

class RegistrationProgress extends StatelessWidget {
  const RegistrationProgress({
    required this.step,
    required this.totalSteps,
    required this.title,
    this.detail,
    super.key,
  });

  final int step;
  final int totalSteps;
  final String title;
  final String? detail;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final value = step / totalSteps;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Expanded(
              child: Text(
                'STEP $step OF $totalSteps',
                style: theme.textTheme.labelLarge?.copyWith(
                  color: theme.colorScheme.primary,
                  fontWeight: FontWeight.w800,
                  letterSpacing: .7,
                ),
              ),
            ),
            Text(
              '${(value * 100).round()}% complete',
              style: theme.textTheme.bodySmall,
            ),
          ],
        ),
        const SizedBox(height: AppSpacing.sm),
        ClipRRect(
          borderRadius: BorderRadius.circular(AppRadius.pill),
          child: LinearProgressIndicator(
            value: value,
            minHeight: 8,
            color: theme.colorScheme.primary,
            backgroundColor: theme.colorScheme.primaryContainer,
          ),
        ),
        const SizedBox(height: AppSpacing.lg),
        Text(
          title,
          style: theme.textTheme.headlineLarge?.copyWith(
            fontWeight: FontWeight.w800,
          ),
        ),
        if (detail != null) ...[
          const SizedBox(height: AppSpacing.xs),
          Text(detail!, style: theme.textTheme.bodyMedium),
        ],
      ],
    );
  }
}

class StitchInfoNotice extends StatelessWidget {
  const StitchInfoNotice({
    required this.icon,
    required this.title,
    required this.message,
    this.color = AppColorsLight.brandBase,
    super.key,
  });

  final IconData icon;
  final String title;
  final String message;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        color: color.withValues(alpha: .09),
        borderRadius: AppRadius.card,
        border: Border.all(color: color.withValues(alpha: .24)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: color),
          const SizedBox(width: AppSpacing.sm),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    color: color,
                    fontWeight: FontWeight.w800,
                  ),
                ),
                const SizedBox(height: AppSpacing.xxs),
                Text(message, style: Theme.of(context).textTheme.bodySmall),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class StitchSelectionCard extends StatelessWidget {
  const StitchSelectionCard({
    required this.icon,
    required this.title,
    required this.description,
    required this.color,
    required this.selected,
    required this.onTap,
    this.badge,
    super.key,
  });

  final IconData icon;
  final String title;
  final String description;
  final Color color;
  final bool selected;
  final VoidCallback onTap;
  final String? badge;

  @override
  Widget build(BuildContext context) {
    return LunasCard(
      onTap: onTap,
      color: selected ? color.withValues(alpha: .10) : null,
      padding: const EdgeInsets.all(AppSpacing.lg),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              color: color.withValues(alpha: .15),
              borderRadius: AppRadius.input,
            ),
            child: Icon(icon, color: color),
          ),
          const SizedBox(width: AppSpacing.md),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        title,
                        style: Theme.of(context).textTheme.titleLarge?.copyWith(
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                    ),
                    if (badge != null)
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: AppSpacing.xs,
                          vertical: AppSpacing.xxs,
                        ),
                        decoration: BoxDecoration(
                          color: AppColorsLight.alert.withValues(alpha: .14),
                          borderRadius: BorderRadius.circular(AppRadius.pill),
                        ),
                        child: Text(
                          badge!,
                          style: Theme.of(context).textTheme.labelSmall?.copyWith(
                            color: AppColorsLight.alert,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                  ],
                ),
                const SizedBox(height: AppSpacing.xxs),
                Text(description, style: Theme.of(context).textTheme.bodyMedium),
              ],
            ),
          ),
          const SizedBox(width: AppSpacing.sm),
          Icon(
            selected
                ? Icons.check_circle_rounded
                : Icons.radio_button_unchecked_rounded,
            color: selected ? color : Theme.of(context).colorScheme.outline,
          ),
        ],
      ),
    );
  }
}

class StitchDocumentCard extends StatelessWidget {
  const StitchDocumentCard({
    required this.title,
    required this.description,
    required this.icon,
    required this.isReady,
    required this.onCapture,
    required this.onUpload,
    this.note,
    super.key,
  });

  final String title;
  final String description;
  final IconData icon;
  final bool isReady;
  final VoidCallback onCapture;
  final VoidCallback onUpload;
  final String? note;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final accent = isReady ? AppColorsLight.success : theme.colorScheme.primary;
    return LunasCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              Container(
                width: 42,
                height: 42,
                decoration: BoxDecoration(
                  color: accent.withValues(alpha: .13),
                  borderRadius: AppRadius.input,
                ),
                child: Icon(icon, color: accent),
              ),
              const SizedBox(width: AppSpacing.sm),
              Expanded(child: Text(title, style: theme.textTheme.titleMedium)),
              Icon(
                isReady
                    ? Icons.check_circle_outline_rounded
                    : Icons.cloud_upload_outlined,
                color: accent,
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.md),
          Container(
            height: 116,
            decoration: BoxDecoration(
              color: accent.withValues(alpha: .07),
              borderRadius: AppRadius.input,
              border: Border.all(
                color: accent.withValues(alpha: .30),
                style: BorderStyle.solid,
              ),
            ),
            child: Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(
                    isReady ? Icons.task_alt_rounded : Icons.upload_file_outlined,
                    size: 30,
                    color: accent,
                  ),
                  const SizedBox(height: AppSpacing.xs),
                  Text(
                    isReady ? 'Placeholder attached' : description,
                    textAlign: TextAlign.center,
                    style: theme.textTheme.bodySmall,
                  ),
                ],
              ),
            ),
          ),
          if (note != null) ...[
            const SizedBox(height: AppSpacing.sm),
            Text(
              note!,
              style: theme.textTheme.bodySmall?.copyWith(
                color: AppColorsLight.alert,
              ),
            ),
          ],
          const SizedBox(height: AppSpacing.md),
          Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: onCapture,
                  icon: const Icon(Icons.photo_camera_outlined),
                  label: const Text('Take photo'),
                ),
              ),
              const SizedBox(width: AppSpacing.sm),
              Expanded(
                child: FilledButton.icon(
                  onPressed: onUpload,
                  icon: const Icon(Icons.upload_file_outlined),
                  label: const Text('Upload'),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
