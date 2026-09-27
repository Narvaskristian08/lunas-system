import 'package:lunas_mobile/features/auth/data/models/auth_user.dart';

class PrivilegedLoginMfaChallenge {
  const PrivilegedLoginMfaChallenge({
    required this.challengeToken,
    required this.email,
    required this.expiresInSeconds,
    required this.resendAfterSeconds,
    this.developmentCode,
  });

  final String challengeToken;
  final String email;
  final int expiresInSeconds;
  final int resendAfterSeconds;
  final String? developmentCode;

  factory PrivilegedLoginMfaChallenge.fromResponse(
    Map<String, dynamic> payload,
  ) {
    final data = authData(payload);
    final challengeToken = (data['challengeToken'] ?? '').toString();
    final email = (data['email'] ?? '').toString();
    if (data['mfaRequired'] != true ||
        challengeToken.isEmpty ||
        email.isEmpty) {
      throw const FormatException(
        'The server did not return a privileged login verification challenge.',
      );
    }
    return PrivilegedLoginMfaChallenge(
      challengeToken: challengeToken,
      email: email,
      expiresInSeconds:
          int.tryParse((data['expiresInSeconds'] ?? 600).toString()) ?? 600,
      resendAfterSeconds:
          int.tryParse((data['resendAfterSeconds'] ?? 60).toString()) ?? 60,
      developmentCode: data['developmentCode']?.toString(),
    );
  }
}
