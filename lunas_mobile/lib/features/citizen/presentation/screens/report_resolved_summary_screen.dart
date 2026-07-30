import 'package:flutter/material.dart';
import 'package:lunas_mobile/core/theme/app_colors.dart';
import 'package:lunas_mobile/core/theme/app_spacing.dart';
import 'package:lunas_mobile/core/widgets/lunas_button.dart';
import 'package:lunas_mobile/core/widgets/lunas_card.dart';
import 'package:lunas_mobile/features/citizen/presentation/screens/citizen_flow_widgets.dart';

/// Closure screen shown once a report has passed completion verification.
class ReportResolvedSummaryScreen extends StatefulWidget {
  const ReportResolvedSummaryScreen({super.key});

  @override
  State<ReportResolvedSummaryScreen> createState() =>
      _ReportResolvedSummaryScreenState();
}

class _ReportResolvedSummaryScreenState
    extends State<ReportResolvedSummaryScreen> {
  int _rating = 0;

  void _leaveFeedback() {
    if (_rating == 0) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Choose a rating before leaving feedback.'),
        ),
      );
      return;
    }
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('Thanks for your $_rating-star rating!')),
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final scheme = theme.colorScheme;
    return Scaffold(
      body: SafeArea(
        child: LayoutBuilder(
          builder: (context, constraints) {
            final horizontal = constraints.maxWidth < 360
                ? AppSpacing.md
                : AppSpacing.xl;
            return SingleChildScrollView(
              padding: EdgeInsets.fromLTRB(
                horizontal,
                AppSpacing.xxxl,
                horizontal,
                AppSpacing.hero,
              ),
              child: Align(
                alignment: Alignment.topCenter,
                child: ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 620),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Container(
                        width: 132,
                        height: 132,
                        alignment: Alignment.center,
                        decoration: const BoxDecoration(
                          color: Color(0xFFA0F399),
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(
                          Icons.check_circle_outline_rounded,
                          color: Color(0xFF1B6D24),
                          size: 76,
                        ),
                      ),
                      const SizedBox(height: AppSpacing.xl),
                      Text(
                        'Report Resolved',
                        textAlign: TextAlign.center,
                        style: theme.textTheme.displayMedium?.copyWith(
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                      const SizedBox(height: AppSpacing.sm),
                      Text(
                        'Incident LNS-2026-0142 has been closed successfully.',
                        textAlign: TextAlign.center,
                        style: theme.textTheme.titleMedium?.copyWith(
                          color: theme.colorScheme.onSurfaceVariant,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                      const SizedBox(height: AppSpacing.xxl),
                      LunasCard(
                        child: Column(
                          children: [
                            Icon(
                              Icons.timelapse_rounded,
                              size: 36,
                              color: scheme.onSurfaceVariant,
                            ),
                            const SizedBox(height: AppSpacing.sm),
                            Text(
                              'TOTAL DURATION',
                              style: theme.textTheme.labelSmall,
                            ),
                            const SizedBox(height: AppSpacing.xs),
                            Text(
                              '3 days',
                              style: theme.textTheme.headlineLarge?.copyWith(
                                color: scheme.primary,
                                fontWeight: FontWeight.w800,
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: AppSpacing.md),
                      LunasCard(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Expanded(
                                  child: Text(
                                    'Resolution documentation',
                                    style: theme.textTheme.titleLarge,
                                  ),
                                ),
                                Icon(
                                  Icons.photo_library_outlined,
                                  color: scheme.onSurfaceVariant,
                                ),
                              ],
                            ),
                            const SizedBox(height: AppSpacing.md),
                            const CitizenPhotoComparison(),
                            const SizedBox(height: AppSpacing.md),
                            TextButton.icon(
                              onPressed: () => Navigator.pushNamed(
                                context,
                                '/reports/evidence',
                              ),
                              icon: const Icon(Icons.visibility_outlined),
                              label: const Text('View repair evidence'),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: AppSpacing.xl),
                      Container(
                        padding: const EdgeInsets.all(AppSpacing.xl),
                        decoration: BoxDecoration(
                          color: scheme.primaryContainer.withValues(alpha: .58),
                          borderRadius: BorderRadius.circular(28),
                        ),
                        child: Column(
                          children: [
                            Text(
                              'Citizen satisfaction',
                              textAlign: TextAlign.center,
                              style: theme.textTheme.titleLarge?.copyWith(
                                fontWeight: FontWeight.w800,
                              ),
                            ),
                            const SizedBox(height: AppSpacing.sm),
                            Text(
                              'How would you rate the resolution of this incident?',
                              textAlign: TextAlign.center,
                              style: theme.textTheme.bodyLarge,
                            ),
                            const SizedBox(height: AppSpacing.md),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: List<Widget>.generate(5, (index) {
                                final selected = index < _rating;
                                return IconButton(
                                  tooltip: '${index + 1} stars',
                                  onPressed: () =>
                                      setState(() => _rating = index + 1),
                                  icon: Icon(
                                    selected
                                        ? Icons.star_rounded
                                        : Icons.star_border_rounded,
                                    color: AppColorsLight.alert,
                                    size: 36,
                                  ),
                                );
                              }),
                            ),
                            const SizedBox(height: AppSpacing.md),
                            OutlinedButton.icon(
                              onPressed: _leaveFeedback,
                              icon: const Icon(Icons.rate_review_outlined),
                              label: const Text('Leave Feedback'),
                            ),
                            const SizedBox(height: AppSpacing.sm),
                            LunasButton(
                              label: 'Return Home',
                              icon: Icons.arrow_forward_rounded,
                              onPressed: () =>
                                  Navigator.pushNamedAndRemoveUntil(
                                    context,
                                    '/home',
                                    (_) => false,
                                  ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            );
          },
        ),
      ),
    );
  }
}
