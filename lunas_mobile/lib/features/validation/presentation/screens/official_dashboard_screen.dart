import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:lunas_mobile/core/app_services.dart';
import 'package:lunas_mobile/core/network/api_exception.dart';
import 'package:lunas_mobile/core/theme/app_colors.dart';
import 'package:lunas_mobile/core/theme/app_spacing.dart';
import 'package:lunas_mobile/core/widgets/lunas_card.dart';
import 'package:lunas_mobile/core/widgets/lunas_state_view.dart';
import 'package:lunas_mobile/core/widgets/official_scaffold.dart';
import 'package:lunas_mobile/features/auth/domain/auth_role_policy.dart';
import 'package:lunas_mobile/features/auth/presentation/widgets/auth_scope.dart';
import 'package:lunas_mobile/features/validation/data/models/validation_summary.dart';

/// Live, role-scoped validation overview. The counts come from the backend;
/// no client-side incident aggregation or mock operational data is used.
class OfficialDashboardScreen extends StatefulWidget {
  const OfficialDashboardScreen({super.key});

  @override
  State<OfficialDashboardScreen> createState() =>
      _OfficialDashboardScreenState();
}

class _OfficialDashboardScreenState extends State<OfficialDashboardScreen> {
  bool _loading = true;
  String? _error;
  ValidationSummary? _summary;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final summary = await validationService.getSummary();
      if (mounted) setState(() => _summary = summary);
    } on ApiException catch (error) {
      if (mounted) setState(() => _error = error.message);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = AuthScope.of(context).user;
    final role = user == null ? 'Official' : roleLabel(user.role);
    return OfficialScaffold(
      title: 'Validation workspace',
      subtitle: '$role · only incidents in your permitted scope',
      selectedIndex: 0,
      actions: [
        IconButton(
          onPressed: _loading ? null : _load,
          tooltip: 'Refresh validation metrics',
          icon: const Icon(Icons.refresh_rounded),
        ),
        const SizedBox(width: AppSpacing.sm),
      ],
      body: _body(context, user?.firstName),
    );
  }

  Widget _body(BuildContext context, String? firstName) {
    if (_loading) {
      return const LunasStateView(
        state: LunasViewState.loading,
        title: 'Loading validation overview',
        message: 'Getting the reports available to your role and jurisdiction.',
      );
    }
    if (_error != null) {
      return LunasStateView(
        state: LunasViewState.error,
        title: 'Could not load validation overview',
        message: _error!,
        actionLabel: 'Try again',
        onAction: _load,
      );
    }
    final summary =
        _summary ??
        const ValidationSummary(
          pending: 0,
          validated: 0,
          rejected: 0,
          duplicate: 0,
        );
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text(
          'Hello${firstName == null || firstName.isEmpty ? '' : ', $firstName'}',
          style: Theme.of(
            context,
          ).textTheme.headlineLarge?.copyWith(fontWeight: FontWeight.w800),
        ),
        const SizedBox(height: AppSpacing.xs),
        const Text(
          'Review submitted reports, make one documented decision, and set the next responsible organization.',
        ),
        const SizedBox(height: AppSpacing.xl),
        _QueueCallout(onOpenQueue: () => context.go('/official/validation')),
        const SizedBox(height: AppSpacing.md),
        _WorkOrderCallout(
          onOpenWorkOrders: () => context.go('/official/work-orders'),
        ),
        const SizedBox(height: AppSpacing.md),
        OutlinedButton.icon(
          onPressed: () => context.push('/official/statistics'),
          icon: const Icon(Icons.bar_chart_rounded),
          label: const Text('Barangay statistics'),
        ),
        const SizedBox(height: AppSpacing.xxl),
        Text(
          'Your validation summary',
          style: Theme.of(context).textTheme.titleLarge,
        ),
        const SizedBox(height: AppSpacing.sm),
        Wrap(
          spacing: AppSpacing.sm,
          runSpacing: AppSpacing.sm,
          children: [
            _MetricCard(
              label: 'Awaiting validation',
              value: summary.pending,
              icon: Icons.rate_review_outlined,
              color: AppColorsLight.alert,
            ),
            _MetricCard(
              label: 'Validated',
              value: summary.validated,
              icon: Icons.verified_outlined,
              color: AppColorsLight.success,
            ),
            _MetricCard(
              label: 'Rejected',
              value: summary.rejected,
              icon: Icons.cancel_outlined,
              color: AppColorsLight.critical,
            ),
            _MetricCard(
              label: 'Marked duplicate',
              value: summary.duplicate,
              icon: Icons.content_copy_outlined,
              color: AppColorsLight.info,
            ),
          ],
        ),
        const SizedBox(height: AppSpacing.xl),
        LunasCard(
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Icon(Icons.shield_outlined),
              const SizedBox(width: AppSpacing.md),
              Expanded(
                child: Text(
                  'Scope is enforced by the server. A report outside your jurisdiction or routing responsibility will not be available here.',
                  style: Theme.of(context).textTheme.bodyMedium,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _QueueCallout extends StatelessWidget {
  const _QueueCallout({required this.onOpenQueue});
  final VoidCallback onOpenQueue;

  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.all(AppSpacing.lg),
    decoration: BoxDecoration(
      gradient: const LinearGradient(
        colors: [Color(0xFF004D99), Color(0xFF087CC7)],
      ),
      borderRadius: BorderRadius.circular(16),
    ),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Icon(Icons.fact_check_outlined, color: Colors.white, size: 30),
        const SizedBox(height: AppSpacing.md),
        Text(
          'Pending validation',
          style: Theme.of(context).textTheme.titleLarge?.copyWith(
            color: Colors.white,
            fontWeight: FontWeight.w800,
          ),
        ),
        const SizedBox(height: AppSpacing.xs),
        Text(
          'Open the real server-scoped queue to inspect evidence, location, history, and duplicate candidates.',
          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
            color: Colors.white.withValues(alpha: .9),
          ),
        ),
        const SizedBox(height: AppSpacing.lg),
        FilledButton.icon(
          onPressed: onOpenQueue,
          icon: const Icon(Icons.arrow_forward_rounded),
          label: const Text('Open validation queue'),
          style: FilledButton.styleFrom(
            backgroundColor: Colors.white,
            foregroundColor: AppColorsLight.brandBase,
          ),
        ),
      ],
    ),
  );
}

class _WorkOrderCallout extends StatelessWidget {
  const _WorkOrderCallout({required this.onOpenWorkOrders});

  final VoidCallback onOpenWorkOrders;

  @override
  Widget build(BuildContext context) => LunasCard(
    child: Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Icon(Icons.assignment_outlined),
        const SizedBox(width: AppSpacing.md),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Work-order monitoring',
                style: Theme.of(context).textTheme.titleMedium,
              ),
              const SizedBox(height: AppSpacing.xxs),
              const Text(
                'Review server-scoped repair status and SLA warnings. This mobile view is read-only.',
              ),
              const SizedBox(height: AppSpacing.sm),
              OutlinedButton.icon(
                onPressed: onOpenWorkOrders,
                icon: const Icon(Icons.arrow_forward_rounded),
                label: const Text('Open work orders'),
              ),
            ],
          ),
        ),
      ],
    ),
  );
}

class _MetricCard extends StatelessWidget {
  const _MetricCard({
    required this.label,
    required this.value,
    required this.icon,
    required this.color,
  });

  final String label;
  final int value;
  final IconData icon;
  final Color color;

  @override
  Widget build(BuildContext context) => SizedBox(
    width: 190,
    child: LunasCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: color),
          const SizedBox(height: AppSpacing.md),
          Text('$value', style: Theme.of(context).textTheme.headlineSmall),
          const SizedBox(height: AppSpacing.xxs),
          Text(label, style: Theme.of(context).textTheme.bodySmall),
        ],
      ),
    ),
  );
}
