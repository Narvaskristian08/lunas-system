import 'package:lunas_mobile/core/widgets/lunas_confirmation_dialog.dart';
import 'package:lunas_mobile/features/auth/presentation/widgets/auth_layout.dart';
import 'package:flutter/material.dart';
import 'package:lunas_mobile/core/theme/app_spacing.dart';
import 'package:lunas_mobile/core/widgets/lunas_button.dart';
import 'package:lunas_mobile/features/auth/presentation/widgets/auth_scope.dart';

class EditCitizenProfileScreen extends StatefulWidget {
  const EditCitizenProfileScreen({super.key});
  @override
  State<EditCitizenProfileScreen> createState() =>
      _EditCitizenProfileScreenState();
}

class _EditCitizenProfileScreenState extends State<EditCitizenProfileScreen> {
  final _key = GlobalKey<FormState>();
  final _fields = List.generate(6, (_) => TextEditingController());
  List<String>? _initial;
  bool _noMiddleName = false;
  bool _initialNoMiddle = false;
  bool _saving = false;
  bool _leaving = false;
  String? _error;
  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_initial != null) return;
    final user = AuthScope.of(context).user!;
    _initial = [
      user.firstName,
      user.middleName ?? '',
      user.lastName,
      user.suffix ?? '',
      user.phone,
      user.address?['street']?.toString() ?? '',
    ];
    for (var i = 0; i < 6; i++) {
      _fields[i].text = _initial![i];
      _fields[i].addListener(_changed);
    }
    _noMiddleName = _initialNoMiddle = (user.middleName ?? '').isEmpty;
  }

  void _changed() {
    if (mounted) setState(() {});
  }

  bool get _dirty =>
      _noMiddleName != _initialNoMiddle ||
      List.generate(
        6,
        (i) => _fields[i].text.trim() != _initial![i],
      ).any((value) => value);
  @override
  void dispose() {
    for (final field in _fields) {
      field.dispose();
    }
    super.dispose();
  }

  Future<void> _back() async {
    if (_saving) return;
    final discard =
        !_dirty ||
        await showDialog<bool>(
              context: context,
              builder: (context) => LunasConfirmationDialog(
                destructive: true,
                title: const Text('Discard Changes?'),
                content: const Text(
                  'Your unsaved profile changes will be lost.',
                ),
                actions: [
                  TextButton(
                    onPressed: () => Navigator.pop(context, false),
                    child: const Text('Keep Editing'),
                  ),
                  FilledButton(
                    onPressed: () => Navigator.pop(context, true),
                    child: const Text('Discard'),
                  ),
                ],
              ),
            ) ==
            true;
    if (!discard || !mounted) return;
    setState(() => _leaving = true);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) Navigator.pop(context);
    });
  }

  Future<void> _save() async {
    if (_saving || !_key.currentState!.validate()) return;
    setState(() {
      _saving = true;
      _error = null;
    });
    final auth = AuthScope.of(context);
    final ok = await auth.updateProfile(
      firstName: _fields[0].text.trim(),
      middleName: _noMiddleName ? '' : _fields[1].text.trim(),
      noMiddleName: _noMiddleName,
      lastName: _fields[2].text.trim(),
      suffix: _fields[3].text.trim(),
      phone: _fields[4].text.replaceAll(RegExp(r'\s+'), ''),
      address: _fields[5].text.trim(),
    );
    if (!mounted) return;
    if (ok) {
      setState(() {
        _saving = false;
        _leaving = true;
      });
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('Profile updated.')));
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) Navigator.pop(context);
      });
    } else {
      setState(() {
        _saving = false;
        _error = auth.message;
      });
    }
  }

  Widget _field(
    int index,
    String label, {
    int limit = 80,
    TextInputType? keyboard,
  }) => TextFormField(
    controller: _fields[index],
    enabled: !_saving && !(index == 1 && _noMiddleName),
    maxLength: limit,
    keyboardType: keyboard,
    textCapitalization: index < 4
        ? TextCapitalization.words
        : TextCapitalization.none,
    decoration: InputDecoration(
      isDense: true,
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
      labelText: label,
      counterText: '',
    ),
    validator: (value) {
      final text = (value ?? '').trim();
      if ((index == 0 || index == 2 || (index == 1 && !_noMiddleName)) &&
          text.isEmpty) {
        return 'Enter your ${label.toLowerCase()}.';
      }
      if (index == 4 &&
          text.isEmpty &&
          AuthScope.of(context).user?.isCitizen == false) {
        return 'Enter your mobile number.';
      }
      if (index == 4 &&
          text.isNotEmpty &&
          !RegExp(
            r'^(\+639|09)\d{9}$',
          ).hasMatch(text.replaceAll(RegExp(r'\s+'), ''))) {
        return 'Enter a valid Philippine mobile number.';
      }
      return null;
    },
  );
  @override
  Widget build(BuildContext context) => PopScope(
    canPop: _leaving,
    onPopInvokedWithResult: (didPop, result) {
      if (!didPop) _back();
    },
    child: Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        leading: IconButton(
          onPressed: _saving ? null : _back,
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
                title: 'Edit Profile',
                description: 'Update your personal and contact details.',
              ),
              const SizedBox(height: 24),
              _field(0, 'First Name'),
              const SizedBox(height: 16),
              _field(1, 'Middle Name'),
              CheckboxListTile(
                value: _noMiddleName,
                onChanged: _saving
                    ? null
                    : (value) => setState(() => _noMiddleName = value ?? false),
                contentPadding: EdgeInsets.zero,
                controlAffinity: ListTileControlAffinity.leading,
                title: const Text("I don't have a middle name"),
              ),
              const SizedBox(height: 8),
              _field(2, 'Last Name'),
              const SizedBox(height: 16),
              _field(3, 'Suffix (Optional)', limit: 20),
              const SizedBox(height: 16),
              _field(
                4,
                AuthScope.of(context).user?.isCitizen == true
                    ? 'Mobile Number (Optional)'
                    : 'Mobile Number',
                limit: 13,
                keyboard: TextInputType.phone,
              ),
              const SizedBox(height: 16),
              _field(5, 'Address (Optional)', limit: 160),
              const SizedBox(height: 16),
              TextFormField(
                initialValue: AuthScope.of(context).user?.email,
                readOnly: true,
                decoration: const InputDecoration(
                  labelText: 'Email Address',
                  helperText: 'Email address cannot be changed here.',
                ),
              ),
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
                label: 'Save Changes',
                isLoading: _saving,
                onPressed: _dirty && !_saving ? _save : null,
              ),
            ],
          ),
        ),
      ),
    ),
  );
}
