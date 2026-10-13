import 'package:flutter/material.dart';

/// Shared layout for account and workflow confirmation dialogs.
class LunasConfirmationDialog extends StatelessWidget {
  const LunasConfirmationDialog({
    required this.title,
    required this.content,
    required this.actions,
    this.destructive = false,
    super.key,
  });
  final Widget title;
  final Widget content;
  final List<Widget> actions;
  final bool destructive;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final shape = RoundedRectangleBorder(
      borderRadius: BorderRadius.circular(12),
    );
    return Theme(
      data: theme.copyWith(
        textButtonTheme: TextButtonThemeData(
          style: TextButton.styleFrom(
            minimumSize: const Size(88, 48),
            padding: const EdgeInsets.symmetric(horizontal: 16),
            shape: shape,
          ),
        ),
        filledButtonTheme: FilledButtonThemeData(
          style: FilledButton.styleFrom(
            minimumSize: const Size(88, 48),
            padding: const EdgeInsets.symmetric(horizontal: 16),
            shape: shape,
            backgroundColor: destructive
                ? theme.colorScheme.error
                : theme.colorScheme.primary,
            foregroundColor: destructive
                ? theme.colorScheme.onError
                : theme.colorScheme.onPrimary,
          ),
        ),
      ),
      child: AlertDialog(
        scrollable: true,
        backgroundColor: theme.colorScheme.surface,
        surfaceTintColor: Colors.transparent,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        insetPadding: const EdgeInsets.symmetric(horizontal: 24, vertical: 24),
        titlePadding: const EdgeInsets.fromLTRB(24, 24, 24, 0),
        contentPadding: const EdgeInsets.fromLTRB(24, 12, 24, 0),
        actionsPadding: const EdgeInsets.all(24),
        actionsOverflowButtonSpacing: 12,
        titleTextStyle: theme.textTheme.titleLarge?.copyWith(
          fontWeight: FontWeight.w700,
        ),
        contentTextStyle: theme.textTheme.bodyMedium?.copyWith(
          color: theme.colorScheme.onSurfaceVariant,
          height: 1.5,
        ),
        title: title,
        content: content,
        actions: actions,
      ),
    );
  }
}
