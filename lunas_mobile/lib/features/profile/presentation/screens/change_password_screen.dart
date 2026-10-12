import 'package:flutter/material.dart';
import 'package:lunas_mobile/core/theme/app_spacing.dart';
import 'package:lunas_mobile/core/widgets/lunas_button.dart';
import 'package:lunas_mobile/features/auth/presentation/widgets/auth_scope.dart';
import 'package:lunas_mobile/features/auth/presentation/widgets/auth_layout.dart';
import 'package:lunas_mobile/features/auth/presentation/screens/registration_password_screen.dart';

class ChangePasswordScreen extends StatefulWidget {
  const ChangePasswordScreen({super.key});
  @override
  State<ChangePasswordScreen> createState() => _ChangePasswordScreenState();
}

class _ChangePasswordScreenState extends State<ChangePasswordScreen> {
  final _key = GlobalKey<FormState>();
  final _fields = List.generate(3, (_) => TextEditingController());
  final _hidden = [true, true, true];
  bool _saving = false;
  String? _error;
  @override
  void dispose() {
    for (final field in _fields) {
      field.dispose();
    }
    super.dispose();
  }

  Future<void> _save() async {
    if (_saving || !_key.currentState!.validate()) return;
    setState(() {
      _saving = true;
      _error = null;
    });
    final auth = AuthScope.of(context);
    final ok = await auth.changePassword(
      currentPassword: _fields[0].text,
      newPassword: _fields[1].text,
    );
    if (!mounted) return;
    if (ok) {
      setState(() => _saving = false);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Password changed successfully.')),
      );
      Navigator.pop(context);
    } else {
      setState(() {
        _saving = false;
        _error = auth.message;
      });
    }
  }

  Widget _field(int index, String label) => TextFormField(
    controller: _fields[index],
    enabled: !_saving,
    obscureText: _hidden[index],
    autofillHints: [
      index == 0 ? AutofillHints.password : AutofillHints.newPassword,
    ],
    onChanged: (_) => setState(() {}),
    decoration: InputDecoration(
      labelText: label,
      suffixIcon: IconButton(
        onPressed: _saving
            ? null
            : () => setState(() => _hidden[index] = !_hidden[index]),
        tooltip: _hidden[index] ? 'Show password' : 'Hide password',
        icon: Icon(
          _hidden[index]
              ? Icons.visibility_off_outlined
              : Icons.visibility_outlined,
        ),
      ),
    ),
    validator: (value) {
      if (index == 0) {
        return (value ?? '').isEmpty ? 'Enter your current password.' : null;
      }
      if (index == 1) {
        final error = validatePassword(value);
        if (error != null) return error;
        if (value == _fields[0].text) {
          return 'Choose a password different from your current password.';
        }
      }
      if (index == 2 && (value ?? '').isEmpty) {
        return 'Confirm your new password.';
      }
      if (index == 2 && value != _fields[1].text) {
        return 'Passwords do not match.';
      }
      return null;
    },
  );
  @override
  Widget build(BuildContext context) => PopScope(
    canPop: !_saving,
    child: Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        leading: IconButton(
          onPressed: _saving ? null : () => Navigator.pop(context),
          icon: const Icon(Icons.arrow_back),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(AppSpacing.xl),
        child: Form(
          key: _key,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const AuthHeading(
                title: 'Change Password',
                description:
                    'Choose a unique password that is different from your current password.',
              ),
              const SizedBox(height: 24),
              _field(0, 'Current Password'),
              const SizedBox(height: 16),
              _field(1, 'New Password'),
              const SizedBox(height: 16),
              _field(2, 'Confirm New Password'),
              const SizedBox(height: 24),
              PasswordRequirements(password: _fields[1].text),
              if (_error != null)
                Padding(
                  padding: const EdgeInsets.only(top: 16),
                  child: Text(
                    _error!,
                    style: TextStyle(
                      color: Theme.of(context).colorScheme.error,
                    ),
                  ),
                ),
              const SizedBox(height: 24),
              LunasButton(
                label: 'Change Password',
                isLoading: _saving,
                onPressed: _saving ? null : _save,
              ),
            ],
          ),
        ),
      ),
    ),
  );
}
