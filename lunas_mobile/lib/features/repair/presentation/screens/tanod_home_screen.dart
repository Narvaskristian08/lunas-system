import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:lunas_mobile/app/app_services.dart';
import 'package:lunas_mobile/core/network/api_exception.dart';
import 'package:lunas_mobile/core/theme/app_spacing.dart';
import 'package:lunas_mobile/core/widgets/lunas_card.dart';
import 'package:lunas_mobile/core/widgets/lunas_state_view.dart';
import 'package:lunas_mobile/features/auth/presentation/widgets/auth_scope.dart';
import 'package:lunas_mobile/features/repair/data/models/inspection_models.dart';
import 'package:lunas_mobile/features/repair/presentation/widgets/repair_widgets.dart';
import 'package:lunas_mobile/features/repair/routes/repair_routes.dart';

class TanodHomeScreen extends StatefulWidget {
  const TanodHomeScreen({super.key});

  @override
  State<TanodHomeScreen> createState() => _TanodHomeScreenState();
}

class _TanodHomeScreenState extends State<TanodHomeScreen> {
  bool _loading = true;
  String? _error;
  List<TanodInspection> _inspections = const [];

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
      final inspections = await repairService.getMyInspections();
      if (!mounted) return;
      setState(() {
        _inspections = inspections;
        _loading = false;
      });
    } on ApiException catch (error) {
      if (!mounted) return;
      setState(() {
        _error = error.message;
        _loading = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _error =
            'LUNAS could not load your assigned verifications. Check your connection and try again.';
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = AuthScope.of(context).user;
    final needsVerification = _inspections.where(_needsAction).toList();
    final initialVerification = needsVerification
        .where((item) => item.type != 'completion')
        .toList();
    final finalVerification = needsVerification
        .where((item) => item.type == 'completion')
        .toList();
    return RepairPage(
      appBar: RepairAppBar(
        title: 'LUNAS',
        subtitle: 'Barangay Tanod',
        actions: [
          IconButton(
            onPressed: _loading ? null : _load,
            tooltip: 'Refresh home',
            icon: const Icon(Icons.refresh_rounded),
          ),
          const SizedBox(width: AppSpacing.sm),
        ],
      ),
      selectedNavigationIndex: 0,
      fillAvailableHeight: _loading || _error != null,
      child: _loading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
          ? LunasStateView(
              state: LunasViewState.error,
              title: 'Could not load your workspace',
              message: _error!,
              actionLabel: 'Try Again',
              onAction: _load,
            )
          : Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text(
                  'Hello${user?.firstName.trim().isNotEmpty == true ? ', ${user!.firstName}' : ''}',
                  style: Theme.of(context).textTheme.headlineLarge?.copyWith(
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: AppSpacing.xs),
                const Text('Verify citizen reports assigned to your barangay.'),
                const SizedBox(height: AppSpacing.xl),
                LunasCard(
                  color: Theme.of(context).colorScheme.primaryContainer,
                  child: Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Work verifications needing action',
                              style: Theme.of(context).textTheme.titleMedium
                                  ?.copyWith(fontWeight: FontWeight.w700),
                            ),
                            const SizedBox(height: AppSpacing.xs),
                            Text(
                              needsVerification.isEmpty
                                  ? 'No pending verifications.'
                                  : 'Only reports that still need your findings and photo evidence are shown below.',
                            ),
                          ],
                        ),
                      ),
                      CircleAvatar(
                        radius: 25,
                        child: Text(
                          '${needsVerification.length}',
                          style: Theme.of(context).textTheme.titleLarge
                              ?.copyWith(fontWeight: FontWeight.w700),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: AppSpacing.lg),
                FilledButton.icon(
                  onPressed: () => context.go(RepairRoutes.workOrders),
                  icon: const Icon(Icons.assignment_outlined),
                  label: const Text('Open Work Verification'),
                ),
                const SizedBox(height: AppSpacing.lg),
                _RecentVerificationSection(
                  title: 'Needs initial verification',
                  emptyText: 'No initial reports need verification.',
                  items: initialVerification,
                  onOpen: (item) => context.go(
                    '${RepairRoutes.workOrders}?filter=initial&inspectionId=${Uri.encodeComponent(item.id)}',
                  ),
                  onViewMore: () =>
                      context.go('${RepairRoutes.workOrders}?filter=initial'),
                ),
                const SizedBox(height: AppSpacing.lg),
                _RecentVerificationSection(
                  title: 'Needs final verification',
                  emptyText: 'No completed work needs final verification.',
                  items: finalVerification,
                  onOpen: (item) => context.go(
                    '${RepairRoutes.workOrders}?filter=completion&inspectionId=${Uri.encodeComponent(item.id)}',
                  ),
                  onViewMore: () => context.go(
                    '${RepairRoutes.workOrders}?filter=completion',
                  ),
                ),
                const SizedBox(height: AppSpacing.lg),
                Text(
                  'How it works',
                  style: Theme.of(
                    context,
                  ).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w700),
                ),
                const SizedBox(height: AppSpacing.sm),
                const LunasCard(
                  child: Text(
                    'Visit the citizen report location, record your findings, attach a photo, and send it to the Barangay Secretary. The Secretary decides whether the report is accepted and routed to the responsible agency.',
                  ),
                ),
              ],
            ),
    );
  }

  bool _needsAction(TanodInspection item) =>
      item.status == 'assigned' || item.status == 'in_progress';
}

class _RecentVerificationSection extends StatelessWidget {
  const _RecentVerificationSection({
    required this.title,
    required this.emptyText,
    required this.items,
    required this.onOpen,
    required this.onViewMore,
  });

  final String title;
  final String emptyText;
  final List<TanodInspection> items;
  final ValueChanged<TanodInspection> onOpen;
  final VoidCallback onViewMore;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text(
          title,
          style: Theme.of(
            context,
          ).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w700),
        ),
        const SizedBox(height: AppSpacing.sm),
        if (items.isEmpty)
          LunasCard(child: Text(emptyText))
        else
          ...items
              .take(3)
              .map(
                (item) => Padding(
                  padding: const EdgeInsets.only(bottom: AppSpacing.sm),
                  child: LunasCard(
                    onTap: () => onOpen(item),
                    child: Row(
                      children: [
                        CircleAvatar(
                          backgroundColor: Theme.of(
                            context,
                          ).colorScheme.primaryContainer,
                          child: Icon(
                            Icons.assignment_outlined,
                            color: Theme.of(context).colorScheme.primary,
                          ),
                        ),
                        const SizedBox(width: AppSpacing.md),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                item.reportNumber ?? 'Citizen report',
                                style: Theme.of(context).textTheme.titleMedium
                                    ?.copyWith(fontWeight: FontWeight.w700),
                              ),
                              const SizedBox(height: 3),
                              Text(
                                item.category ?? 'Report',
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                              const SizedBox(height: 3),
                              Text(
                                item.barangay ?? 'Barangay',
                                style: Theme.of(context).textTheme.bodySmall,
                              ),
                            ],
                          ),
                        ),
                        const Icon(Icons.chevron_right_rounded),
                      ],
                    ),
                  ),
                ),
              ),
        if (items.length > 3)
          Align(
            alignment: Alignment.centerRight,
            child: TextButton(
              onPressed: onViewMore,
              child: const Text('View more'),
            ),
          ),
      ],
    );
  }
}
