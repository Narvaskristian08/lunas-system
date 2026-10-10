import 'package:lunas_mobile/core/network/api_client.dart';
import 'package:lunas_mobile/features/auth/domain/auth_role_policy.dart';
import 'package:lunas_mobile/features/reporting/data/models/reporting_restriction.dart';

class AuthUser {
  const AuthUser({
    required this.id,
    required this.firstName,
    required this.lastName,
    required this.email,
    required this.phone,
    required this.role,
    required this.isVerified,
    this.address,
    this.barangay,
    this.profileImage,
    this.reportingRestriction = const ReportingRestriction(),
  });

  final String id;
  final String firstName;
  final String lastName;
  final String email;
  final String phone;
  final String role;
  final bool isVerified;
  final Map<String, dynamic>? address;
  final String? barangay;
  final String? profileImage;
  final ReportingRestriction reportingRestriction;

  String get fullName => '$firstName $lastName'.trim();
  bool get isCitizen => isCitizenRole(role);
  bool get hasSupportedMobileWorkspace => isSupportedMobileRole(role);

  factory AuthUser.fromJson(Map<String, dynamic> json) {
    return AuthUser(
      id: (json['id'] ?? json['_id'] ?? '').toString(),
      firstName: (json['firstName'] ?? '').toString(),
      lastName: (json['lastName'] ?? '').toString(),
      email: (json['email'] ?? '').toString(),
      phone: (json['phone'] ?? '').toString(),
      // Do not treat a malformed or incomplete account response as a citizen
      // session. The router will place an unknown role in the safe
      // role-unavailable state instead.
      role: (json['role'] ?? '').toString(),
      isVerified: json['isVerified'] == true,
      address: json['address'] is Map
          ? Map<String, dynamic>.from(json['address'] as Map)
          : null,
      barangay: json['barangay']?.toString(),
      profileImage: json['profileImage']?.toString(),
      reportingRestriction: ReportingRestriction.fromJson(
        json['reportingRestriction'] is Map
            ? Map<String, dynamic>.from(json['reportingRestriction'] as Map)
            : null,
      ),
    );
  }

  AuthUser copyWith({
    String? firstName,
    String? lastName,
    String? phone,
    Map<String, dynamic>? address,
    String? profileImage,
    ReportingRestriction? reportingRestriction,
  }) {
    return AuthUser(
      id: id,
      firstName: firstName ?? this.firstName,
      lastName: lastName ?? this.lastName,
      email: email,
      phone: phone ?? this.phone,
      role: role,
      isVerified: isVerified,
      address: address ?? this.address,
      barangay: barangay,
      profileImage: profileImage ?? this.profileImage,
      reportingRestriction: reportingRestriction ?? this.reportingRestriction,
    );
  }
}

Map<String, dynamic> authData(JsonMap payload) {
  final data = payload['data'];
  return data is Map<String, dynamic>
      ? data
      : data is Map
      ? Map<String, dynamic>.from(data)
      : <String, dynamic>{};
}
