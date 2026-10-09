import 'package:flutter/material.dart';
import 'package:lunas_mobile/core/theme/app_spacing.dart';
import 'package:lunas_mobile/core/widgets/lunas_button.dart';
import 'package:lunas_mobile/features/auth/presentation/widgets/auth_layout.dart';
import 'package:lunas_mobile/features/auth/presentation/widgets/auth_scope.dart';

class RoleUnavailableScreen extends StatelessWidget {
  const RoleUnavailableScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final auth = AuthScope.of(context);
    final rawRole = auth.user?.role;
    final role = rawRole?.replaceAll('_', ' ') ?? 'this account role';
    final isWebOnlyRole = const {
      'barangay_official',
      'city_engineer',
      'utility_provider',
      'admin',
    }.contains(rawRole);
    return AuthLayout(
      scrollable: false,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const Spacer(),
          Icon(
            isWebOnlyRole
                ? Icons.open_in_new_rounded
                : Icons.admin_panel_settings_outlined,
            size: 72,
          ),
          const SizedBox(height: AppSpacing.xl),
          Text(
            isWebOnlyRole
                ? 'This account is intended for the LUNAS Web Command Center.'
                : 'A LUNAS mobile workspace is not available for $role.',
            textAlign: TextAlign.center,
            style: Theme.of(context).textTheme.headlineSmall,
          ),
          const SizedBox(height: AppSpacing.sm),
          Text(
            isWebOnlyRole
                ? 'Please use the web application to access official management functions. No operational screen is available for this role in the mobile app.'
                : 'This account does not have an implemented mobile workspace for its role. Your permissions continue to be enforced by the server.',
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: AppSpacing.xxl),
          LunasButton(
            label: 'Sign Out',
            isLoading: auth.isSubmitting,
            onPressed: auth.isSubmitting ? null : auth.logout,
          ),
          const Spacer(flex: 2),
        ],
      ),
    );
  }
}
