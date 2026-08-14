import 'package:lunas_mobile/core/network/api_client.dart';
import 'package:lunas_mobile/core/storage/secure_session_store.dart';
import 'package:lunas_mobile/features/auth/data/services/auth_service.dart';
import 'package:lunas_mobile/features/auth/presentation/controllers/auth_controller.dart';
import 'package:lunas_mobile/features/reporting/data/services/category_service.dart';
import 'package:lunas_mobile/features/reporting/data/services/evidence_service.dart';
import 'package:lunas_mobile/features/reporting/data/services/report_service.dart';
import 'package:lunas_mobile/features/validation/data/services/validation_service.dart';

/// Application-owned services for the production mobile path.
/// Tests can construct each service/controller directly with a fake client.
final secureSessionStore = SecureSessionStore();
final apiClient = ApiClient(sessionStore: secureSessionStore);
final authService = AuthService(
  apiClient: apiClient,
  sessionStore: secureSessionStore,
);
final authController = AuthController(authService);
final reportService = ReportService(apiClient: apiClient);
final categoryService = CategoryService(apiClient: apiClient);
final evidenceService = EvidenceService();
final validationService = ValidationService(apiClient: apiClient);

void configureAppServices() {
  apiClient.onAuthenticationFailure = authController.expireSession;
}
