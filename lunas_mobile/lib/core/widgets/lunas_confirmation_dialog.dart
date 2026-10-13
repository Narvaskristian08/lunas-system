import 'package:flutter/material.dart';

/// Shared surface and button sizing for confirmations and result dialogs.
class LunasDialogSurface extends StatelessWidget {
  const LunasDialogSurface({
    required this.child,
    this.destructive = false,
    super.key,
  });
  final Widget child;
  final bool destructive;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final shape = RoundedRectangleBorder(
      borderRadius: BorderRadius.circular(12),
    );
    final buttonStyle = ButtonStyle(
      minimumSize: const WidgetStatePropertyAll(Size(0, 48)),
      padding: const WidgetStatePropertyAll(
        EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      ),
      shape: WidgetStatePropertyAll(shape),
      textStyle: WidgetStatePropertyAll(
        theme.textTheme.labelLarge?.copyWith(fontWeight: FontWeight.w600),
      ),
    );
    return Theme(
      data: theme.copyWith(
        textButtonTheme: TextButtonThemeData(
          style: theme.textButtonTheme.style?.merge(buttonStyle) ?? buttonStyle,
        ),
        outlinedButtonTheme: OutlinedButtonThemeData(
          style:
              theme.outlinedButtonTheme.style?.merge(buttonStyle) ??
              buttonStyle,
        ),
        elevatedButtonTheme: ElevatedButtonThemeData(
          style:
              theme.elevatedButtonTheme.style?.merge(buttonStyle) ??
              buttonStyle,
        ),
        filledButtonTheme: FilledButtonThemeData(
          style:
              (theme.filledButtonTheme.style?.merge(buttonStyle) ?? buttonStyle)
                  .copyWith(
                    backgroundColor: destructive
                        ? WidgetStateProperty.resolveWith(
                            (states) => states.contains(WidgetState.disabled)
                                ? null
                                : theme.colorScheme.error,
                          )
                        : null,
                    foregroundColor: destructive
                        ? WidgetStateProperty.resolveWith(
                            (states) => states.contains(WidgetState.disabled)
                                ? null
                                : theme.colorScheme.onError,
                          )
                        : null,
                  ),
        ),
      ),
      child: Dialog(
        backgroundColor: theme.colorScheme.surface,
        surfaceTintColor: Colors.transparent,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        insetPadding: const EdgeInsets.all(24),
        constraints: const BoxConstraints(maxWidth: 448),
        child: DefaultTextStyle(
          style: theme.textTheme.bodyMedium!.copyWith(
            color: theme.colorScheme.onSurfaceVariant,
            height: 1.5,
          ),
          child: child,
        ),
      ),
    );
  }
}

/// Pass cancel, then confirm. Stacked actions show the primary action first.
class LunasDialogActions extends StatelessWidget {
  const LunasDialogActions({required this.actions, super.key});
  final List<Widget> actions;

  @override
  Widget build(BuildContext context) => Column(
    crossAxisAlignment: CrossAxisAlignment.stretch,
    mainAxisSize: MainAxisSize.min,
    children: [
      for (var index = actions.length - 1; index >= 0; index--) ...[
        if (index < actions.length - 1) const SizedBox(height: 12),
        actions[index],
      ],
    ],
  );
}

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
    return LunasDialogSurface(
      destructive: destructive,
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            DefaultTextStyle(
              style: theme.textTheme.titleLarge!.copyWith(
                fontWeight: FontWeight.w700,
              ),
              child: title,
            ),
            const SizedBox(height: 12),
            DefaultTextStyle(
              style: theme.textTheme.bodyMedium!.copyWith(
                color: theme.colorScheme.onSurfaceVariant,
                height: 1.5,
              ),
              child: content,
            ),
            if (actions.isNotEmpty) ...[
              const SizedBox(height: 24),
              LunasDialogActions(actions: actions),
            ],
          ],
        ),
      ),
    );
  }
}
