import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:lunas_mobile/core/app_services.dart';
import 'package:lunas_mobile/core/network/api_exception.dart';
import 'package:lunas_mobile/core/theme/app_spacing.dart';
import 'package:lunas_mobile/core/widgets/lunas_card.dart';
import 'package:lunas_mobile/core/widgets/lunas_state_view.dart';
import 'package:lunas_mobile/features/repair/data/models/repair_models.dart';

/// Server-backed personnel assignment for one validated incident.
class AssignPersonnelWorkflowScreen extends StatefulWidget {
  const AssignPersonnelWorkflowScreen({required this.incidentId, super.key});

  final String incidentId;

  @override
  State<AssignPersonnelWorkflowScreen> createState() =>
      _AssignPersonnelWorkflowScreenState();
}

class _AssignPersonnelWorkflowScreenState
    extends State<AssignPersonnelWorkflowScreen> {
  final _instructions = TextEditingController();
  bool _loading = true;
  bool _canAssign = false;
  bool _submitting = false;
  String? _error;
  String? _workOrderId;
  List<RepairPerson> _personnel = const [];
  String? _selectedId;

  @override
  void initState() {
    super.initState();
    _prepare();
  }

  @override
  void dispose() {
    _instructions.dispose();
    super.dispose();
  }

  Future<void> _prepare() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final incident = await validationService.getIncident(widget.incidentId);
      if (incident.status != 'validated') {
        throw StateError(
          'Only a validated incident can be assigned. Current status: ${incident.status}.',
        );
      }
      if (mounted) setState(() => _canAssign = true);
      final existingWorkOrderId = incident.workOrderId;
      if (existingWorkOrderId != null && existingWorkOrderId.isNotEmpty) {
        if (mounted) setState(() => _workOrderId = existingWorkOrderId);
        await _loadEligiblePersonnel(existingWorkOrderId);
      }
    } on ApiException catch (error) {
      if (mounted) setState(() => _error = error.message);
    } on StateError catch (error) {
      if (mounted) setState(() => _error = error.message);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _createAndLoadPersonnel() async {
    setState(() {
      _submitting = true;
      _error = null;
    });
    try {
      final order = await repairService.createWorkOrderFromIncident(
        widget.incidentId,
        instructions: _instructions.text,
      );
      if (mounted) setState(() => _workOrderId = order.id);
      await _loadEligiblePersonnel(order.id);
    } on ApiException catch (error) {
      if (mounted) setState(() => _error = error.message);
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  Future<void> _loadEligiblePersonnel(String workOrderId) async {
    try {
      final personnel = await repairService.getEligiblePersonnel(workOrderId);
      if (mounted) setState(() => _personnel = personnel);
    } on ApiException catch (error) {
      if (mounted) setState(() => _error = error.message);
    }
  }

  Future<void> _assign() async {
    final id = _selectedId;
    final orderId = _workOrderId;
    if (id == null || orderId == null || _submitting) return;
    setState(() {
      _submitting = true;
      _error = null;
    });
    try {
      await repairService.assignPersonnel(orderId, personnelId: id);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Repair personnel assigned.')),
        );
        context.pop(true);
      }
    } on ApiException catch (error) {
      if (mounted) setState(() => _error = error.message);
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Scaffold(
        body: LunasStateView(
          state: LunasViewState.loading,
          title: 'Checking incident',
          message: 'Confirming the current server workflow state.',
        ),
      );
    }
    return Scaffold(
      appBar: AppBar(title: const Text('Assign repair personnel')),
      body: ListView(
        padding: const EdgeInsets.all(AppSpacing.lg),
        children: [
          Text(
            'Incident ${widget.incidentId}',
            style: Theme.of(context).textTheme.titleMedium,
          ),
          const SizedBox(height: AppSpacing.md),
          if (_error != null) ...[
            LunasCard(
              child: Text(
                _error!,
                style: TextStyle(color: Theme.of(context).colorScheme.error),
              ),
            ),
            const SizedBox(height: AppSpacing.md),
          ],
          if (_workOrderId == null && _canAssign) ...[
            TextField(
              controller: _instructions,
              maxLines: 3,
              decoration: const InputDecoration(
                labelText: 'Dispatch instructions',
                hintText: 'Optional instructions for the repair team',
              ),
            ),
            const SizedBox(height: AppSpacing.lg),
            FilledButton(
              onPressed: _submitting ? null : _createAndLoadPersonnel,
              child: Text(
                _submitting
                    ? 'Preparing assignment…'
                    : 'Create work order and find personnel',
              ),
            ),
          ] else if (_workOrderId == null) ...[
            FilledButton(
              onPressed: _loading ? null : _prepare,
              child: const Text('Retry incident check'),
            ),
          ] else ...[
            Text(
              'Available personnel',
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: AppSpacing.sm),
            if (_personnel.isEmpty)
              LunasCard(
                child: Column(
                  children: [
                    const Text(
                      'No eligible personnel are currently available for this work order.',
                    ),
                    TextButton(
                      onPressed: _submitting
                          ? null
                          : () => _loadEligiblePersonnel(_workOrderId!),
                      child: const Text('Refresh personnel'),
                    ),
                  ],
                ),
              )
            else
              for (final person in _personnel)
                Card(
                  child: ListTile(
                    selected: _selectedId == person.id,
                    onTap: _submitting
                        ? null
                        : () => setState(() => _selectedId = person.id),
                    leading: Icon(
                      _selectedId == person.id
                          ? Icons.radio_button_checked
                          : Icons.radio_button_unchecked,
                    ),
                    title: Text(person.name),
                    subtitle: Text(
                      [person.team, person.availability]
                          .whereType<String>()
                          .where((item) => item.isNotEmpty)
                          .join(' · '),
                    ),
                  ),
                ),
            const SizedBox(height: AppSpacing.md),
            FilledButton(
              onPressed: _selectedId == null || _submitting ? null : _assign,
              child: Text(_submitting ? 'Assigning…' : 'Assign personnel'),
            ),
          ],
        ],
      ),
    );
  }
}
