import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:lunas_mobile/app/app_services.dart';
import 'package:lunas_mobile/core/network/api_exception.dart';
import 'package:lunas_mobile/core/theme/app_spacing.dart';
import 'package:lunas_mobile/core/widgets/lunas_app_scaffold.dart';
import 'package:lunas_mobile/core/widgets/lunas_button.dart';
import 'package:lunas_mobile/core/widgets/lunas_card.dart';
import 'package:lunas_mobile/features/reporting/data/models/reporting_appeal.dart';

class ReportingAppealScreen extends StatefulWidget {
  const ReportingAppealScreen({super.key});

  @override
  State<ReportingAppealScreen> createState() => _ReportingAppealScreenState();
}

class _ReportingAppealScreenState extends State<ReportingAppealScreen> {
  final _formKey = GlobalKey<FormState>();
  final _explanationController = TextEditingController();
  final _referenceController = TextEditingController();
  ReportingAppeal? _appeal;
  bool _loading = true;
  bool _submitting = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadAppeal();
  }

  @override
  void dispose() {
    _explanationController.dispose();
    _referenceController.dispose();
    super.dispose();
  }

  Future<void> _loadAppeal() async {
    try {
      final appeal = await reportService.getMyAppeal();
      if (!mounted) return;
      setState(() {
        _appeal = appeal;
        _loading = false;
        _error = null;
      });
    } on ApiException catch (error) {
      if (mounted)
        setState(() {
          _loading = false;
          _error = error.message;
        });
    } catch (_) {
      if (mounted)
        setState(() {
          _loading = false;
          _error = 'We could not load your appeal. Please try again.';
        });
    }
  }

  Future<void> _submit() async {
    if (!(_formKey.currentState?.validate() ?? false)) return;
    setState(() {
      _submitting = true;
      _error = null;
    });
    try {
      final appeal = await reportService.submitAppeal(
        explanation: _explanationController.text.trim(),
        evidenceReference: _referenceController.text.trim(),
      );
      if (!mounted) return;
      setState(() {
        _appeal = appeal;
        _submitting = false;
      });
    } on ApiException catch (error) {
      if (mounted)
        setState(() {
          _submitting = false;
          _error = error.message;
        });
    } catch (_) {
      if (mounted)
        setState(() {
          _submitting = false;
          _error = 'We could not submit your appeal. Please try again.';
        });
    }
  }

  @override
  Widget build(BuildContext context) {
    final appeal = _appeal;
    return LunasAppScaffold(
      title: 'Reporting Appeal',
      subtitle: 'Request a review of your reporting access.',
      showBackButton: true,
      child: _loading
          ? const Center(child: CircularProgressIndicator())
          : Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                if (_error != null) ...[
                  Text(
                    _error!,
                    style: TextStyle(
                      color: Theme.of(context).colorScheme.error,
                    ),
                  ),
                  const SizedBox(height: AppSpacing.md),
                ],
                if (appeal != null) ...[
                  LunasCard(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Appeal ${appeal.status[0].toUpperCase()}${appeal.status.substring(1)}',
                          style: Theme.of(context).textTheme.titleLarge,
                        ),
                        const SizedBox(height: AppSpacing.sm),
                        Text('Assigned Barangay: ${appeal.assignedBarangay}'),
                        const SizedBox(height: AppSpacing.md),
                        Text(
                          appeal.status == 'pending'
                              ? 'A Barangay Official will review your explanation and supporting reference.'
                              : appeal.status == 'approved'
                              ? 'Report submission available. Your reporting access has been restored.'
                              : 'Your reporting access remains paused. The assigned Barangay Official may review a new appeal.',
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: AppSpacing.md),
                ],
                if (appeal == null || appeal.status == 'rejected')
                  Form(
                    key: _formKey,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        LunasCard(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.stretch,
                            children: [
                              Text(
                                'Why should access be restored?',
                                style: Theme.of(context).textTheme.titleMedium,
                              ),
                              const SizedBox(height: AppSpacing.sm),
                              TextFormField(
                                controller: _explanationController,
                                minLines: 5,
                                maxLines: 8,
                                maxLength: 2000,
                                decoration: const InputDecoration(
                                  labelText: 'Explanation',
                                ),
                                validator: (value) =>
                                    (value?.trim().length ?? 0) < 20
                                    ? 'Explain the appeal in at least 20 characters.'
                                    : null,
                              ),
                              const SizedBox(height: AppSpacing.sm),
                              TextFormField(
                                controller: _referenceController,
                                maxLength: 500,
                                decoration: const InputDecoration(
                                  labelText: 'Supporting evidence or reference',
                                ),
                                validator: (value) =>
                                    value?.trim().isEmpty ?? true
                                    ? 'Add a supporting evidence or reference.'
                                    : null,
                              ),
                              const SizedBox(height: AppSpacing.sm),
                              Text(
                                'Use the existing report evidence and provide any relevant reference details. New image or PDF uploads are not required.',
                                style: Theme.of(context).textTheme.bodySmall,
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: AppSpacing.md),
                        LunasButton(
                          label: 'Submit Appeal',
                          isLoading: _submitting,
                          onPressed: _submitting ? null : _submit,
                        ),
                      ],
                    ),
                  ),
                if (appeal?.status == 'pending')
                  OutlinedButton(
                    onPressed: () => context.pop(),
                    child: const Text('Back to reports'),
                  ),
              ],
            ),
    );
  }
}
