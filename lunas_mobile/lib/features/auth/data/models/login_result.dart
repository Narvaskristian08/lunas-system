import 'package:lunas_mobile/features/auth/data/models/auth_session.dart';
import 'package:lunas_mobile/features/auth/data/models/auth_user.dart';
import 'package:lunas_mobile/features/auth/data/models/privileged_login_mfa_challenge.dart';

class LoginResult {
  const LoginResult._({this.session, this.mfaChallenge});

  final AuthSession? session;
  final PrivilegedLoginMfaChallenge? mfaChallenge;

  factory LoginResult.fromResponse(Map<String, dynamic> payload) {
    final data = authData(payload);
    if (data['mfaRequired'] == true) {
      return LoginResult._(
        mfaChallenge: PrivilegedLoginMfaChallenge.fromResponse(payload),
      );
    }
    return LoginResult._(session: AuthSession.fromResponse(payload));
  }
}
