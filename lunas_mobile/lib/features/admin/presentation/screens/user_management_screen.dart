import 'package:flutter/material.dart';
import 'package:lunas_mobile/core/theme/app_colors.dart';
import 'package:lunas_mobile/core/theme/app_spacing.dart';
import 'package:lunas_mobile/core/widgets/lunas_card.dart';
import 'package:lunas_mobile/features/admin/presentation/screens/admin_routes.dart';
import 'package:lunas_mobile/features/admin/presentation/screens/admin_widgets.dart';

/// Searchable presentation-only user directory for system administrators.
class UserManagementScreen extends StatefulWidget {
  const UserManagementScreen({super.key});

  @override
  State<UserManagementScreen> createState() => _UserManagementScreenState();
}

class _UserManagementScreenState extends State<UserManagementScreen> {
  String _selectedRole = 'All roles';

  @override
  Widget build(BuildContext context) {
    final visibleUsers = _selectedRole == 'All roles'
        ? _users
        : _users.where((user) => user.roleGroup == _selectedRole).toList();
    return AdminPage(
      title: 'User management',
      subtitle: 'Review LUNAS account access',
      selectedNavigationIndex: 1,
      actions: [
        IconButton(
          tooltip: 'Pending verification',
          onPressed: () => Navigator.pushNamed(context, AdminRoutes.verifyUser),
          icon: const Badge(
            smallSize: 8,
            child: Icon(Icons.person_add_alt_1_outlined),
          ),
        ),
        const SizedBox(width: AppSpacing.sm),
      ],
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          TextField(
            decoration: const InputDecoration(
              hintText: 'Search users, agencies, or roles',
              prefixIcon: Icon(Icons.search_rounded),
            ),
          ),
          const SizedBox(height: AppSpacing.sm),
          Wrap(
            spacing: AppSpacing.xs,
            runSpacing: AppSpacing.xs,
            children: _roleFilters
                .map(
                  (role) => ChoiceChip(
                    label: Text(role),
                    selected: _selectedRole == role,
                    onSelected: (_) => setState(() => _selectedRole = role),
                  ),
                )
                .toList(),
          ),
          const SizedBox(height: AppSpacing.lg),
          Row(
            children: [
              Expanded(
                child: Text(
                  '${visibleUsers.length} accounts shown',
                  style: Theme.of(context).textTheme.bodySmall,
                ),
              ),
              TextButton.icon(
                onPressed: () => showAdminMessage(
                  context,
                  'Advanced filters are a static prototype control.',
                ),
                icon: const Icon(Icons.tune_rounded, size: 18),
                label: const Text('Filter'),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.xs),
          for (final user in visibleUsers) ...[
            _UserCard(
              user: user,
              onOpen: () =>
                  Navigator.pushNamed(context, AdminRoutes.userDetails),
              onSuspend: () => showAdminMessage(
                context,
                'Account review opened for ${user.name}.',
              ),
            ),
            const SizedBox(height: AppSpacing.sm),
          ],
          const SizedBox(height: AppSpacing.md),
          LunasCard(
            color: AppColorsLight.alert.withValues(alpha: .08),
            padding: const EdgeInsets.all(AppSpacing.md),
            child: const Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Icon(Icons.info_outline_rounded, color: AppColorsLight.alert),
                SizedBox(width: AppSpacing.sm),
                Expanded(
                  child: Text(
                    'Account suspension and role changes are represented as local prototype feedback only.',
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

const _roleFilters = ['All roles', 'Citizens', 'Officials', 'Utility'];

const _users = [
  _UserRecord(
    initials: 'MS',
    name: 'Maria Santos',
    role: 'Barangay Official',
    organization: 'Barangay Pantal',
    roleGroup: 'Officials',
    verified: true,
  ),
  _UserRecord(
    initials: 'JD',
    name: 'Juan Dela Cruz',
    role: 'Field Technician',
    organization: 'Dagupan Electric Corporation',
    roleGroup: 'Utility',
    verified: true,
  ),
  _UserRecord(
    initials: 'AR',
    name: 'Ana Reyes',
    role: 'Citizen',
    organization: 'Barangay Tapuac',
    roleGroup: 'Citizens',
    verified: false,
  ),
];

class _UserRecord {
  const _UserRecord({
    required this.initials,
    required this.name,
    required this.role,
    required this.organization,
    required this.roleGroup,
    required this.verified,
  });

  final String initials;
  final String name;
  final String role;
  final String organization;
  final String roleGroup;
  final bool verified;
}

class _UserCard extends StatelessWidget {
  const _UserCard({
    required this.user,
    required this.onOpen,
    required this.onSuspend,
  });

  final _UserRecord user;
  final VoidCallback onOpen;
  final VoidCallback onSuspend;

  @override
  Widget build(BuildContext context) {
    final statusColor = user.verified
        ? AppColorsLight.success
        : AppColorsLight.alert;
    return LunasCard(
      onTap: onOpen,
      padding: const EdgeInsets.all(AppSpacing.md),
      child: Row(
        children: [
          CircleAvatar(
            radius: 24,
            backgroundColor: statusColor.withValues(alpha: .13),
            foregroundColor: statusColor,
            child: Text(
              user.initials,
              style: const TextStyle(fontWeight: FontWeight.w800),
            ),
          ),
          const SizedBox(width: AppSpacing.md),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        user.name,
                        style: Theme.of(context).textTheme.titleMedium
                            ?.copyWith(fontWeight: FontWeight.w800),
                      ),
                    ),
                    Icon(
                      user.verified
                          ? Icons.verified_rounded
                          : Icons.pending_outlined,
                      color: statusColor,
                      size: 19,
                    ),
                  ],
                ),
                const SizedBox(height: AppSpacing.xxs),
                Text(
                  '${user.role} • ${user.organization}',
                  style: Theme.of(context).textTheme.bodySmall,
                ),
                const SizedBox(height: AppSpacing.xs),
                AdminStatusPill(
                  label: user.verified ? 'Verified' : 'Needs review',
                  color: statusColor,
                ),
              ],
            ),
          ),
          PopupMenuButton<String>(
            tooltip: 'User actions',
            onSelected: (value) {
              if (value == 'view') onOpen();
              if (value == 'suspend') onSuspend();
            },
            itemBuilder: (context) => const [
              PopupMenuItem(value: 'view', child: Text('View account')),
              PopupMenuItem(value: 'suspend', child: Text('Review access')),
            ],
          ),
        ],
      ),
    );
  }
}
