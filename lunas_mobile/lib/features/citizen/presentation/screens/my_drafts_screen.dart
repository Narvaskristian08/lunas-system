import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:lunas_mobile/core/theme/app_colors.dart';
import 'package:lunas_mobile/core/theme/app_radius.dart';
import 'package:lunas_mobile/core/theme/app_spacing.dart';
import 'package:lunas_mobile/core/widgets/lunas_app_scaffold.dart';
import 'package:lunas_mobile/core/widgets/lunas_button.dart';
import 'package:lunas_mobile/core/widgets/lunas_card.dart';
import 'package:lunas_mobile/features/citizen/presentation/screens/citizen_flow_widgets.dart';

class MyDraftsScreen extends StatefulWidget {
  const MyDraftsScreen({super.key});

  @override
  State<MyDraftsScreen> createState() => _MyDraftsScreenState();
}

class _MyDraftsScreenState extends State<MyDraftsScreen> {
  // Draft persistence is not part of the current integration-test contract.
  // Keep the honest empty state instead of presenting fabricated reports.
  final List<_CitizenDraft> _drafts = [];

  void _removeDraft(_CitizenDraft draft) {
    setState(() => _drafts.remove(draft));
    ScaffoldMessenger.of(
      context,
    ).showSnackBar(SnackBar(content: Text('${draft.title} draft deleted.')));
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return LunasAppScaffold(
      title: 'My Draft Reports',
      subtitle: 'Continue your saved reports.',
      selectedIndex: 3,
      showBackButton: true,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          if (_drafts.isNotEmpty) ...[
            for (final draft in _drafts) ...[
              _DraftCard(
                draft: draft,
                onDelete: () => _removeDraft(draft),
                onContinue: () => context.push('/reports/new'),
              ),
              const SizedBox(height: AppSpacing.md),
            ],
            const SizedBox(height: AppSpacing.lg),
            Divider(color: theme.colorScheme.outlineVariant),
            const SizedBox(height: AppSpacing.lg),
            Text(
              'Empty state preview',
              textAlign: TextAlign.center,
              style: theme.textTheme.labelLarge?.copyWith(
                color: theme.colorScheme.onSurfaceVariant,
              ),
            ),
            const SizedBox(height: AppSpacing.md),
          ],
          _EmptyDraftState(
            isPrimary: _drafts.isEmpty,
            onCreate: () => context.push('/reports/new'),
          ),
        ],
      ),
    );
  }
}

class _DraftCard extends StatelessWidget {
  const _DraftCard({
    required this.draft,
    required this.onDelete,
    required this.onContinue,
  });

  final _CitizenDraft draft;
  final VoidCallback onDelete;
  final VoidCallback onContinue;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Container(
      decoration: BoxDecoration(
        color: theme.colorScheme.primaryContainer.withValues(alpha: .45),
        border: Border.all(color: theme.colorScheme.outlineVariant),
        borderRadius: AppRadius.card,
      ),
      child: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(AppSpacing.lg),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    CitizenStatusPill(
                      label: 'Draft',
                      color: theme.colorScheme.primary,
                      icon: Icons.edit_note_outlined,
                    ),
                    const Spacer(),
                    Flexible(
                      child: Text(
                        draft.edited,
                        textAlign: TextAlign.end,
                        style: theme.textTheme.bodySmall,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: AppSpacing.md),
                Text(draft.title, style: theme.textTheme.titleLarge),
                const SizedBox(height: AppSpacing.xs),
                Text(
                  draft.description,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: theme.textTheme.bodyLarge,
                ),
                const SizedBox(height: AppSpacing.md),
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Icon(
                      Icons.location_on_outlined,
                      size: 19,
                      color: theme.colorScheme.onSurfaceVariant,
                    ),
                    const SizedBox(width: AppSpacing.xs),
                    Expanded(
                      child: Text(
                        draft.location,
                        style: theme.textTheme.bodyMedium,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          Divider(height: 1, color: theme.colorScheme.outlineVariant),
          Padding(
            padding: const EdgeInsets.all(AppSpacing.sm),
            child: Row(
              children: [
                TextButton.icon(
                  onPressed: onDelete,
                  icon: const Icon(Icons.delete_outline_rounded),
                  label: const Text('Delete'),
                  style: TextButton.styleFrom(
                    foregroundColor: AppColorsLight.critical,
                  ),
                ),
                const Spacer(),
                FilledButton(
                  onPressed: onContinue,
                  child: const Text('Continue Editing'),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _EmptyDraftState extends StatelessWidget {
  const _EmptyDraftState({required this.isPrimary, required this.onCreate});

  final bool isPrimary;
  final VoidCallback onCreate;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return LunasCard(
      color: isPrimary ? theme.colorScheme.surface : null,
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: AppSpacing.lg),
        child: Column(
          children: [
            Container(
              width: 84,
              height: 84,
              decoration: BoxDecoration(
                color: theme.colorScheme.primaryContainer,
                shape: BoxShape.circle,
              ),
              child: Icon(
                Icons.assignment_turned_in_outlined,
                size: 44,
                color: theme.colorScheme.primary,
              ),
            ),
            const SizedBox(height: AppSpacing.lg),
            Text(
              'No Draft Reports',
              style: theme.textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.w700,
              ),
            ),
            const SizedBox(height: AppSpacing.sm),
            Text(
              'You do not have unfinished reports at the moment. All caught up!',
              textAlign: TextAlign.center,
              style: theme.textTheme.bodyMedium,
            ),
            const SizedBox(height: AppSpacing.lg),
            LunasButton(
              label: 'Create New Report',
              expand: false,
              icon: Icons.add_rounded,
              onPressed: onCreate,
            ),
          ],
        ),
      ),
    );
  }
}

class _CitizenDraft {
  const _CitizenDraft({
    required this.title,
    required this.description,
    required this.location,
    required this.edited,
  });

  final String title;
  final String description;
  final String location;
  final String edited;
}
