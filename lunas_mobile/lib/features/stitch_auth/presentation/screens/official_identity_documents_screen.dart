import 'package:flutter/material.dart';
import 'package:lunas_mobile/core/theme/app_colors.dart';
import 'package:lunas_mobile/core/theme/app_spacing.dart';
import 'package:lunas_mobile/core/widgets/lunas_button.dart';
import 'package:lunas_mobile/features/stitch_auth/presentation/screens/stitch_auth_widgets.dart';

/// Document-capture presentation for authorized personnel registration.
///
/// Capture/upload controls deliberately only set local placeholder state. Device
/// file access and identity verification belong to a protected backend flow.
class OfficialIdentityDocumentsScreen extends StatefulWidget {
  const OfficialIdentityDocumentsScreen({super.key});

  @override
  State<OfficialIdentityDocumentsScreen> createState() =>
      _OfficialIdentityDocumentsScreenState();
}

class _OfficialIdentityDocumentsScreenState
    extends State<OfficialIdentityDocumentsScreen> {
  final Set<_DocumentType> _readyDocuments = {};

  void _markReady(_DocumentType document, String action) {
    setState(() => _readyDocuments.add(document));
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('$action selected for ${document.label}. Placeholder marked ready.'),
      ),
    );
  }

  void _continue() {
    Navigator.pushNamed(context, '/registration/pending');
  }

  @override
  Widget build(BuildContext context) {
    return StitchAuthPage(
      subtitle: 'Authorized personnel registration',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const RegistrationProgress(
            step: 4,
            totalSteps: 6,
            title: 'Identity Documents',
            detail:
                'Add the documents required for department verification. Upload actions remain local placeholders in this prototype.',
          ),
          const SizedBox(height: AppSpacing.lg),
          const StitchInfoNotice(
            icon: Icons.info_outline_rounded,
            title: 'Upload guidance',
            message:
                'Place documents on a flat, well-lit surface. Keep all four corners visible and avoid glare so an authorized reviewer can assess them clearly.',
            color: AppColorsLight.brandBase,
          ),
          const SizedBox(height: AppSpacing.lg),
          StitchDocumentCard(
            title: _DocumentType.governmentId.label,
            description: 'Take a clear photo or select a government-issued ID.',
            icon: Icons.badge_outlined,
            isReady: _readyDocuments.contains(_DocumentType.governmentId),
            onCapture: () => _markReady(_DocumentType.governmentId, 'Camera'),
            onUpload: () => _markReady(_DocumentType.governmentId, 'Upload'),
          ),
          const SizedBox(height: AppSpacing.md),
          StitchDocumentCard(
            title: _DocumentType.employeeId.label,
            description: 'Show the front side of your employee or official ID.',
            icon: Icons.business_outlined,
            isReady: _readyDocuments.contains(_DocumentType.employeeId),
            onCapture: () => _markReady(_DocumentType.employeeId, 'Camera'),
            onUpload: () => _markReady(_DocumentType.employeeId, 'Upload'),
          ),
          const SizedBox(height: AppSpacing.md),
          StitchDocumentCard(
            title: _DocumentType.appointmentLetter.label,
            description: 'Select a scanned appointment letter or deployment order (PDF/JPG).',
            icon: Icons.description_outlined,
            note: 'The appointment letter must be dated within 30 days.',
            isReady: _readyDocuments.contains(_DocumentType.appointmentLetter),
            onCapture: () =>
                _markReady(_DocumentType.appointmentLetter, 'Camera'),
            onUpload: () =>
                _markReady(_DocumentType.appointmentLetter, 'Upload'),
          ),
          const SizedBox(height: AppSpacing.xxl),
          Row(
            children: [
              Expanded(
                child: OutlinedButton(
                  onPressed: () => ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Registration draft saved locally for this UI preview.')),
                  ),
                  child: const Text('Save Draft'),
                ),
              ),
              const SizedBox(width: AppSpacing.sm),
              Expanded(
                flex: 2,
                child: LunasButton(
                  label: 'Continue',
                  icon: Icons.chevron_right_rounded,
                  onPressed: _continue,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

enum _DocumentType {
  governmentId('Government-issued ID'),
  employeeId('Employee/Official ID'),
  appointmentLetter('Appointment Letter / Deployment Order');

  const _DocumentType(this.label);

  final String label;
}
