import 'package:flutter/material.dart';
import 'package:lunas_mobile/core/theme/app_colors.dart';
import 'package:lunas_mobile/core/theme/app_spacing.dart';
import 'package:lunas_mobile/core/widgets/lunas_card.dart';
import 'package:lunas_mobile/features/utility/presentation/screens/utility_routes.dart';
import 'package:lunas_mobile/features/utility/presentation/screens/utility_widgets.dart';

/// Dispatch detail screen for a newly assigned utility incident.
class UtilityIncidentDetailsScreen extends StatelessWidget {
  const UtilityIncidentDetailsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return UtilityPage(
      title: '#INC-DE-001',
      subtitle: 'Utility incident details',
      showBackButton: true,
      bottomAction: _IncidentActionBar(
        onRequestReassignment: () => showUtilityMessage(
          context,
          'Reassignment request is recorded as local prototype feedback.',
        ),
        onAccept: () =>
            Navigator.pushNamed(context, UtilityRoutes.acceptAssignment),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          LayoutBuilder(
            builder: (context, constraints) {
              final wide = constraints.maxWidth >= 560;
              final info = _IncidentOverviewCard();
              final timer = const _SlaTimerCard();
              return wide
                  ? Row(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        Expanded(flex: 3, child: info),
                        const SizedBox(width: AppSpacing.sm),
                        Expanded(flex: 2, child: timer),
                      ],
                    )
                  : Column(
                      children: [
                        info,
                        const SizedBox(height: AppSpacing.sm),
                        timer,
                      ],
                    );
            },
          ),
          const SizedBox(height: AppSpacing.lg),
          LunasCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _CardHeading(
                  icon: Icons.description_outlined,
                  title: 'Description',
                ),
                const SizedBox(height: AppSpacing.sm),
                Text(
                  'A citizen reported visible sparks after heavy rain near a transformer by the Tapuac public market. Keep pedestrians clear until the electrical hazard is assessed.',
                  style: Theme.of(
                    context,
                  ).textTheme.bodyMedium?.copyWith(height: 1.5),
                ),
              ],
            ),
          ),
          const SizedBox(height: AppSpacing.lg),
          LayoutBuilder(
            builder: (context, constraints) {
              final wide = constraints.maxWidth >= 560;
              final ai = const _AiAnalysisCard();
              final evidence = const _EvidenceCard();
              return wide
                  ? Row(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        Expanded(child: ai),
                        const SizedBox(width: AppSpacing.sm),
                        Expanded(child: evidence),
                      ],
                    )
                  : Column(
                      children: [
                        ai,
                        const SizedBox(height: AppSpacing.sm),
                        evidence,
                      ],
                    );
            },
          ),
          const SizedBox(height: AppSpacing.lg),
          LunasCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Row(
                  children: [
                    const Expanded(
                      child: _CardHeading(
                        icon: Icons.location_on_outlined,
                        title: 'Location details',
                      ),
                    ),
                    const UtilityStatusPill(
                      label: '1.2 km away',
                      color: AppColorsLight.info,
                      icon: Icons.route_outlined,
                    ),
                  ],
                ),
                const SizedBox(height: AppSpacing.md),
                LayoutBuilder(
                  builder: (context, constraints) {
                    final wide = constraints.maxWidth >= 560;
                    final details = Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Brgy. Tapuac',
                          style: Theme.of(context).textTheme.titleMedium
                              ?.copyWith(fontWeight: FontWeight.w800),
                        ),
                        const SizedBox(height: AppSpacing.xxs),
                        Text(
                          'Near public market, Tapuac District, Dagupan City',
                          style: Theme.of(context).textTheme.bodySmall,
                        ),
                        const SizedBox(height: AppSpacing.md),
                        OutlinedButton.icon(
                          onPressed: () =>
                              Navigator.pushNamed(context, UtilityRoutes.map),
                          icon: const Icon(Icons.navigation_outlined),
                          label: const Text('Open navigation'),
                        ),
                      ],
                    );
                    const map = UtilityVisualPlaceholder(
                      icon: Icons.map_outlined,
                      label: 'Tapuac incident map',
                      detail: 'Map preview is not connected in this prototype.',
                      color: AppColorsLight.brandBase,
                      height: 148,
                    );
                    return wide
                        ? Row(
                            crossAxisAlignment: CrossAxisAlignment.center,
                            children: [
                              Expanded(child: details),
                              const SizedBox(width: AppSpacing.md),
                              Expanded(flex: 2, child: map),
                            ],
                          )
                        : Column(
                            crossAxisAlignment: CrossAxisAlignment.stretch,
                            children: [
                              details,
                              const SizedBox(height: AppSpacing.md),
                              map,
                            ],
                          );
                  },
                ),
              ],
            ),
          ),
          const SizedBox(height: AppSpacing.lg),
          LayoutBuilder(
            builder: (context, constraints) {
              final wide = constraints.maxWidth >= 560;
              final assignment = const _AssignmentCard();
              final timeline = const _TimelineCard();
              return wide
                  ? Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Expanded(child: assignment),
                        const SizedBox(width: AppSpacing.sm),
                        Expanded(child: timeline),
                      ],
                    )
                  : Column(
                      children: [
                        assignment,
                        const SizedBox(height: AppSpacing.sm),
                        timeline,
                      ],
                    );
            },
          ),
        ],
      ),
    );
  }
}

class _IncidentOverviewCard extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return LunasCard(
      padding: const EdgeInsets.all(AppSpacing.md),
      child: Container(
        decoration: const BoxDecoration(
          border: Border(
            left: BorderSide(color: AppColorsLight.critical, width: 4),
          ),
        ),
        padding: const EdgeInsets.only(left: AppSpacing.sm),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Wrap(
              spacing: AppSpacing.xs,
              runSpacing: AppSpacing.xs,
              children: const [
                UtilityStatusPill(
                  label: 'Critical priority',
                  color: AppColorsLight.critical,
                  icon: Icons.warning_amber_rounded,
                ),
                UtilityStatusPill(
                  label: 'Newly assigned',
                  color: AppColorsLight.brandBase,
                ),
              ],
            ),
            const SizedBox(height: AppSpacing.lg),
            Text(
              'Sparking transformer',
              style: Theme.of(
                context,
              ).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w800),
            ),
            const SizedBox(height: AppSpacing.xxs),
            Row(
              children: [
                const Icon(
                  Icons.electric_bolt_rounded,
                  color: AppColorsLight.critical,
                  size: 19,
                ),
                const SizedBox(width: AppSpacing.xxs),
                Text(
                  'Electrical hazard',
                  style: Theme.of(context).textTheme.bodySmall,
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _SlaTimerCard extends StatelessWidget {
  const _SlaTimerCard();

  @override
  Widget build(BuildContext context) {
    return LunasCard(
      color: AppColorsLight.critical.withValues(alpha: .09),
      padding: const EdgeInsets.all(AppSpacing.md),
      child: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(
              Icons.timer_outlined,
              color: AppColorsLight.critical,
              size: 31,
            ),
            const SizedBox(height: AppSpacing.xs),
            Text(
              '45m 00s',
              style: Theme.of(context).textTheme.headlineLarge?.copyWith(
                color: AppColorsLight.critical,
                fontWeight: FontWeight.w800,
              ),
            ),
            const SizedBox(height: AppSpacing.xxs),
            Text(
              'SLA time remaining',
              style: Theme.of(context).textTheme.bodySmall,
            ),
          ],
        ),
      ),
    );
  }
}

class _CardHeading extends StatelessWidget {
  const _CardHeading({required this.icon, required this.title});

  final IconData icon;
  final String title;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, color: Theme.of(context).colorScheme.primary, size: 21),
        const SizedBox(width: AppSpacing.xs),
        Text(
          title,
          style: Theme.of(
            context,
          ).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w800),
        ),
      ],
    );
  }
}

class _AiAnalysisCard extends StatelessWidget {
  const _AiAnalysisCard();

  @override
  Widget build(BuildContext context) {
    return LunasCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const _CardHeading(
            icon: Icons.smart_toy_outlined,
            title: 'AI analysis',
          ),
          const SizedBox(height: AppSpacing.md),
          Center(
            child: Stack(
              alignment: Alignment.center,
              children: [
                SizedBox(
                  width: 86,
                  height: 86,
                  child: CircularProgressIndicator(
                    value: .95,
                    strokeWidth: 8,
                    backgroundColor: AppColorsLight.brandBase.withValues(
                      alpha: .12,
                    ),
                    color: AppColorsLight.brandBase,
                  ),
                ),
                Text(
                  '95%',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    color: AppColorsLight.brandBase,
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: AppSpacing.sm),
          Center(
            child: Text(
              'Confidence level',
              style: Theme.of(
                context,
              ).textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.w800),
            ),
          ),
          const SizedBox(height: AppSpacing.xxs),
          Center(
            child: Text(
              'Detected: arcing transformer',
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.bodySmall,
            ),
          ),
        ],
      ),
    );
  }
}

class _EvidenceCard extends StatelessWidget {
  const _EvidenceCard();

  @override
  Widget build(BuildContext context) {
    return LunasCard(
      child: const Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _CardHeading(icon: Icons.image_outlined, title: 'Field evidence'),
          SizedBox(height: AppSpacing.md),
          UtilityVisualPlaceholder(
            icon: Icons.electric_bolt_rounded,
            label: 'Citizen evidence preview',
            detail: 'Original media is not bundled in this static prototype.',
            color: AppColorsLight.critical,
            height: 156,
          ),
        ],
      ),
    );
  }
}

class _AssignmentCard extends StatelessWidget {
  const _AssignmentCard();

  @override
  Widget build(BuildContext context) {
    return LunasCard(
      child: const Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _CardHeading(
            icon: Icons.assignment_ind_outlined,
            title: 'Assignment',
          ),
          SizedBox(height: AppSpacing.md),
          Row(
            children: [
              CircleAvatar(
                backgroundColor: Color(0xFFDCE6FF),
                foregroundColor: AppColorsLight.brandBase,
                child: Text(
                  'DE',
                  style: TextStyle(fontWeight: FontWeight.w800),
                ),
              ),
              SizedBox(width: AppSpacing.sm),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'DECORP',
                      style: TextStyle(fontWeight: FontWeight.w800),
                    ),
                    Text('Team Alpha', style: TextStyle(fontSize: 12)),
                  ],
                ),
              ),
            ],
          ),
          SizedBox(height: AppSpacing.md),
          Divider(height: 1),
          SizedBox(height: AppSpacing.md),
          UtilityDetailRow(label: 'Assigned by', value: 'Engr. Santos'),
        ],
      ),
    );
  }
}

class _TimelineCard extends StatelessWidget {
  const _TimelineCard();

  @override
  Widget build(BuildContext context) {
    return LunasCard(
      child: const Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _CardHeading(icon: Icons.history_rounded, title: 'Activity timeline'),
          SizedBox(height: AppSpacing.md),
          _TimelineStep(
            title: 'Report submitted',
            detail: 'Citizen via LUNAS app',
            color: AppColorsLight.textSecondary,
          ),
          SizedBox(height: AppSpacing.md),
          _TimelineStep(
            title: 'Validated by AI',
            detail: 'High-confidence match',
            color: AppColorsLight.brandBase,
          ),
          SizedBox(height: AppSpacing.md),
          _TimelineStep(
            title: 'Routed to DECORP',
            detail: 'Pending acceptance',
            color: AppColorsLight.success,
            active: true,
          ),
        ],
      ),
    );
  }
}

class _TimelineStep extends StatelessWidget {
  const _TimelineStep({
    required this.title,
    required this.detail,
    required this.color,
    this.active = false,
  });

  final String title;
  final String detail;
  final Color color;
  final bool active;

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          width: 14,
          height: 14,
          margin: const EdgeInsets.only(top: 3),
          decoration: BoxDecoration(
            color: active ? Colors.white : color,
            border: Border.all(color: color, width: active ? 3 : 0),
            shape: BoxShape.circle,
          ),
        ),
        const SizedBox(width: AppSpacing.sm),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: active ? color : null,
                  fontWeight: FontWeight.w800,
                ),
              ),
              const SizedBox(height: AppSpacing.xxs),
              Text(detail, style: Theme.of(context).textTheme.bodySmall),
            ],
          ),
        ),
      ],
    );
  }
}

class _IncidentActionBar extends StatelessWidget {
  const _IncidentActionBar({
    required this.onRequestReassignment,
    required this.onAccept,
  });

  final VoidCallback onRequestReassignment;
  final VoidCallback onAccept;

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      top: false,
      child: Container(
        padding: const EdgeInsets.fromLTRB(
          AppSpacing.xl,
          AppSpacing.sm,
          AppSpacing.xl,
          AppSpacing.md,
        ),
        decoration: BoxDecoration(
          color: Theme.of(context).colorScheme.surface,
          border: Border(
            top: BorderSide(
              color: Theme.of(context).colorScheme.outlineVariant,
            ),
          ),
        ),
        child: Row(
          children: [
            Expanded(
              child: OutlinedButton.icon(
                onPressed: onRequestReassignment,
                style: OutlinedButton.styleFrom(
                  foregroundColor: AppColorsLight.critical,
                ),
                icon: const Icon(Icons.sync_problem_rounded),
                label: const Text('Reassign'),
              ),
            ),
            const SizedBox(width: AppSpacing.sm),
            Expanded(
              flex: 2,
              child: ElevatedButton.icon(
                onPressed: onAccept,
                icon: const Icon(Icons.check_circle_outline_rounded),
                label: const Text('Accept assignment'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
