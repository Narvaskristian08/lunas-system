import 'package:flutter_test/flutter_test.dart';
import 'package:lunas_mobile/features/auth/data/models/auth_user.dart';

void main() {
  test('provider-created team leader details survive profile parsing', () {
    final user = AuthUser.fromJson({
      'id': 'worker', 'role': 'repair_personnel',
      'firstName': 'Maria', 'middleName': 'Santos',
      'lastName': 'Cruz', 'suffix': 'III',
      'email': 'leader@example.com', 'phone': '09123456789',
      'repairOrganization': 'Dagupan Water District',
      'repairAccountType': 'team', 'repairTeam': 'Water Crew A',
      'isVerified': true,
    });
    expect(user.fullName, 'Maria Santos Cruz III');
    expect(user.repairOrganization, 'Dagupan Water District');
    expect(user.repairAccountType, 'team');
    expect(user.repairTeam, 'Water Crew A');
    expect(user.phone, '09123456789');
    expect(user.copyWith(profileImage: 'avatar.png').repairTeam, 'Water Crew A');
  });
  test('individual accounts accept absent optional names and team', () {
    final user = AuthUser.fromJson({
      'id': 'worker', 'role': 'repair_personnel',
      'firstName': 'Juan', 'lastName': 'Cruz',
      'email': 'worker@example.com', 'phone': '09123456789',
      'organization': 'Utility A', 'repairAccountType': 'individual',
    });
    expect(user.fullName, 'Juan Cruz');
    expect(user.repairOrganization, 'Utility A');
    expect(user.repairTeam, isNull);
  });
}
