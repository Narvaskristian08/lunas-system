import 'package:flutter/material.dart';
import 'package:lunas_mobile/core/theme/app_spacing.dart';
import 'package:lunas_mobile/core/widgets/lunas_app_bar.dart';
import 'package:lunas_mobile/core/widgets/lunas_card.dart';
import 'package:lunas_mobile/features/profile/presentation/widgets/profile_widgets.dart';

class AccountScreen extends StatelessWidget {
  const AccountScreen({super.key});
  @override
  Widget build(BuildContext context) => _Page(
    title: 'Account',
    subtitle: 'Your account information',
    children: [
      const _InfoRow(label: 'Full Name', value: 'Alex Dela Cruz'),
      const _InfoRow(label: 'Email', value: 'alex.delacruz@example.com'),
      const _InfoRow(label: 'Mobile', value: '+63 917 123 4567'),
      const _InfoRow(label: 'Account Type', value: 'Verified Citizen'),
      const SizedBox(height: AppSpacing.md),
      OutlinedButton.icon(
        onPressed: () => Navigator.pushNamed(context, '/profile/edit'),
        icon: const Icon(Icons.edit_outlined),
        label: const Text('Edit Account Information'),
      ),
    ],
  );
}

class SecurityScreen extends StatefulWidget {
  const SecurityScreen({super.key});
  @override
  State<SecurityScreen> createState() => _SecurityScreenState();
}

class _SecurityScreenState extends State<SecurityScreen> {
  bool biometric = true;
  bool loginAlerts = true;
  @override
  Widget build(BuildContext context) => _Page(
    title: 'Security',
    subtitle: 'Protect your account',
    children: [
      SettingsSwitchTile(
        icon: Icons.fingerprint_rounded,
        title: 'Biometric Login',
        subtitle: 'Use your fingerprint or face ID',
        value: biometric,
        onChanged: (v) => setState(() => biometric = v),
      ),
      SettingsSwitchTile(
        icon: Icons.notifications_active_outlined,
        title: 'Login Alerts',
        subtitle: 'Notify me about new sign-ins',
        value: loginAlerts,
        onChanged: (v) => setState(() => loginAlerts = v),
      ),
      const Divider(),
      ListTile(
        contentPadding: EdgeInsets.zero,
        leading: const Icon(Icons.password_rounded),
        title: const Text('Change Password'),
        trailing: const Icon(Icons.chevron_right),
        onTap: () => Navigator.pushNamed(context, '/reset-password'),
      ),
      ListTile(
        contentPadding: EdgeInsets.zero,
        leading: const Icon(Icons.devices_outlined),
        title: const Text('Active Devices'),
        subtitle: const Text('1 device signed in'),
        trailing: const Icon(Icons.chevron_right),
      ),
    ],
  );
}

class PreferencesScreen extends StatefulWidget {
  const PreferencesScreen({super.key});
  @override
  State<PreferencesScreen> createState() => _PreferencesScreenState();
}

class _PreferencesScreenState extends State<PreferencesScreen> {
  bool reports = true;
  bool alerts = true;
  bool updates = false;
  @override
  Widget build(BuildContext context) => _Page(
    title: 'Preferences',
    subtitle: 'Customize your experience',
    children: [
      SettingsSwitchTile(
        icon: Icons.fact_check_outlined,
        title: 'Report Updates',
        subtitle: 'Status and assignment notifications',
        value: reports,
        onChanged: (v) => setState(() => reports = v),
      ),
      SettingsSwitchTile(
        icon: Icons.warning_amber_rounded,
        title: 'Community Alerts',
        subtitle: 'Urgent notices near your location',
        value: alerts,
        onChanged: (v) => setState(() => alerts = v),
      ),
      SettingsSwitchTile(
        icon: Icons.campaign_outlined,
        title: 'Service Announcements',
        subtitle: 'General LUNAS news and updates',
        value: updates,
        onChanged: (v) => setState(() => updates = v),
      ),
      const Divider(),
      const ListTile(
        contentPadding: EdgeInsets.zero,
        leading: Icon(Icons.language_rounded),
        title: Text('Language'),
        trailing: Text('English'),
      ),
      const ListTile(
        contentPadding: EdgeInsets.zero,
        leading: Icon(Icons.light_mode_outlined),
        title: Text('Appearance'),
        trailing: Text('Light'),
      ),
    ],
  );
}

class AboutScreen extends StatelessWidget {
  const AboutScreen({super.key});
  @override
  Widget build(BuildContext context) => _Page(
    title: 'About LUNAS',
    subtitle: 'Your city reporting platform',
    children: [
      Center(
          child: Image.asset(
            'assets/icons/lunas_logo.png',
            width: 96,
            height: 96,
            fit: BoxFit.contain,
          ),
      ),
      SizedBox(height: AppSpacing.md),
      Center(
        child: Text(
          'LUNAS Mobile',
          style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800),
        ),
      ),
      Center(child: Text('Version 1.0.0')),
      SizedBox(height: AppSpacing.xxl),
      Text(
        'LUNAS connects citizens and local government teams through transparent reporting, verified updates, and accountable public service.',
      ),
      SizedBox(height: AppSpacing.xl),
      ListTile(
        contentPadding: EdgeInsets.zero,
        title: Text('Terms of Service'),
        trailing: Icon(Icons.open_in_new_rounded),
      ),
      ListTile(
        contentPadding: EdgeInsets.zero,
        title: Text('Privacy Policy'),
        trailing: Icon(Icons.open_in_new_rounded),
      ),
      ListTile(
        contentPadding: EdgeInsets.zero,
        title: Text('Open-source Licenses'),
        trailing: Icon(Icons.chevron_right),
      ),
    ],
  );
}

class HelpScreen extends StatelessWidget {
  const HelpScreen({super.key});
  @override
  Widget build(BuildContext context) => _Page(
    title: 'Help & Support',
    subtitle: 'How can we help?',
    children: [
      const TextField(
        decoration: InputDecoration(
          prefixIcon: Icon(Icons.search_rounded),
          hintText: 'Search help articles',
        ),
      ),
      const SizedBox(height: AppSpacing.xl),
      Text(
        'Frequently Asked Questions',
        style: Theme.of(context).textTheme.titleLarge,
      ),
      const SizedBox(height: AppSpacing.sm),
      for (final question in [
        'How do I submit a report?',
        'How can I track my report?',
        'Why does LUNAS need my location?',
        'How do I update my account?',
      ])
        ExpansionTile(
          tilePadding: EdgeInsets.zero,
          title: Text(question),
          children: const [
            Padding(
              padding: EdgeInsets.only(bottom: AppSpacing.md),
              child: Text(
                'Open the relevant LUNAS feature and follow the guided steps shown on screen.',
              ),
            ),
          ],
        ),
      const SizedBox(height: AppSpacing.xl),
      FilledButton.icon(
        onPressed: () => ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Support request started.')),
        ),
        icon: const Icon(Icons.support_agent_rounded),
        label: const Text('Contact Support'),
      ),
    ],
  );
}

class _Page extends StatelessWidget {
  const _Page({
    required this.title,
    required this.subtitle,
    required this.children,
  });
  final String title;
  final String subtitle;
  final List<Widget> children;
  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: LunasAppBar(title: title, subtitle: subtitle, showBackButton: true),
    body: SafeArea(
      top: false,
      child: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(
          AppSpacing.xl,
          AppSpacing.md,
          AppSpacing.xl,
          AppSpacing.hero,
        ),
        child: Align(
          alignment: Alignment.topCenter,
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 600),
            child: LunasCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: children,
              ),
            ),
          ),
        ),
      ),
    ),
  );
}

class _InfoRow extends StatelessWidget {
  const _InfoRow({required this.label, required this.value});
  final String label;
  final String value;
  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.symmetric(vertical: AppSpacing.sm),
    child: Row(
      children: [
        Expanded(
          child: Text(label, style: Theme.of(context).textTheme.bodySmall),
        ),
        Flexible(
          child: Text(
            value,
            textAlign: TextAlign.right,
            style: Theme.of(context).textTheme.titleMedium,
          ),
        ),
      ],
    ),
  );
}
