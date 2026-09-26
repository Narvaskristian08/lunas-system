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
    return AuthLayout(
      scrollable: false,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const Spacer(),
          const Icon(Icons.admin_panel_settings_outlined, size: 72),
          const SizedBox(height: AppSpacing.xl),
          Text(
            'A LUNAS mobile workspace is not available for $role.',
            textAlign: TextAlign.center,
            style: Theme.of(context).textTheme.headlineSmall,
          ),
          const SizedBox(height: AppSpacing.sm),
          Text(
            'This account does not have an implemented mobile workspace for its role. Your permissions continue to be enforced by the server.',
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: AppSpacing.xxl),
          LunasButton(
            label: 'Sign out',
            isLoading: auth.isSubmitting,
            onPressed: auth.isSubmitting ? null : auth.logout,
          ),
          const Spacer(flex: 2),
        ],
      ),
    );
  }
}
