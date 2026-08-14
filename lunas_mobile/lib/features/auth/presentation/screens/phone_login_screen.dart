import 'package:lunas_mobile/features/auth/presentation/screens/citizen_login_screen.dart';

/// Legacy route compatibility. The established backend accepts email/password,
/// so this intentionally uses the real email login UI rather than a fake SMS
/// sign-in path.
class PhoneLoginScreen extends CitizenLoginScreen {
  const PhoneLoginScreen({super.key});
}
