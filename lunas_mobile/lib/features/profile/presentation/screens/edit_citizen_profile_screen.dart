import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:lunas_mobile/core/theme/app_spacing.dart';
import 'package:lunas_mobile/core/widgets/lunas_app_bar.dart';
import 'package:lunas_mobile/core/widgets/lunas_button.dart';
import 'package:lunas_mobile/core/widgets/lunas_confirmation_dialog.dart';
import 'package:lunas_mobile/features/auth/presentation/widgets/auth_scope.dart';
import 'package:lunas_mobile/features/profile/presentation/utils/phone_number_formatter.dart';

class EditCitizenProfileScreen extends StatefulWidget {
  const EditCitizenProfileScreen({super.key});

  @override
  State<EditCitizenProfileScreen> createState() =>
      _EditCitizenProfileScreenState();
}

class _EditCitizenProfileScreenState extends State<EditCitizenProfileScreen> {
  static const _fieldKeys = [
    'firstName',
    'middleName',
    'lastName',
    'suffix',
    'phone',
    'address',
  ];

  final _key = GlobalKey<FormState>();
  final _fields = List.generate(6, (_) => TextEditingController());
  List<String>? _initial;
  Map<String, String> _fieldErrors = const {};
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
      formatPhilippineMobileNumber(user.phone),
      user.address?['street']?.toString() ?? '',
    ];
    for (var i = 0; i < _fields.length; i++) {
      _fields[i].text = _initial![i];
      _fields[i].addListener(() => _changed(i));
    }
    _noMiddleName = _initialNoMiddle = (user.middleName ?? '').isEmpty;
  }

  void _changed(int index) {
    if (!mounted) return;
    final fieldKey = _fieldKeys[index];
    setState(() {
      _error = null;
      if (_fieldErrors.containsKey(fieldKey)) {
        _fieldErrors = Map.of(_fieldErrors)..remove(fieldKey);
      }
    });
  }

  bool get _dirty =>
      _noMiddleName != _initialNoMiddle ||
      List.generate(
        _fields.length,
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
    setState(() {
      _fieldErrors = const {};
      _error = null;
    });
    if (_saving || !_key.currentState!.validate()) return;
    setState(() => _saving = true);
    final auth = AuthScope.of(context);
    final ok = await auth.updateProfile(
      firstName: _fields[0].text.trim(),
      middleName: _noMiddleName ? '' : _fields[1].text.trim(),
      noMiddleName: _noMiddleName,
      lastName: _fields[2].text.trim(),
      suffix: _fields[3].text.trim(),
      phone: normalizePhilippineMobileNumber(_fields[4].text),
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
      return;
    }

    setState(() {
      _saving = false;
      _fieldErrors = auth.profileFieldErrors;
      _error = _fieldErrors.isEmpty ? auth.message : null;
    });
    _key.currentState?.validate();
  }

  Widget _field(
    int index,
    String label, {
    int limit = 80,
    TextInputType? keyboard,
    TextCapitalization capitalization = TextCapitalization.none,
    List<TextInputFormatter>? inputFormatters,
    int minLines = 1,
    int maxLines = 1,
    TextInputAction? textInputAction = TextInputAction.next,
  }) => TextFormField(
    controller: _fields[index],
    enabled: !_saving && !(index == 1 && _noMiddleName),
    maxLength: limit,
    minLines: minLines,
    maxLines: maxLines,
    keyboardType: keyboard,
    textCapitalization: capitalization,
    textInputAction: textInputAction,
    inputFormatters: inputFormatters,
    decoration: InputDecoration(labelText: label, counterText: ''),
    validator: (value) {
      final text = (value ?? '').trim();
      if ((index == 0 || index == 2 || (index == 1 && !_noMiddleName)) &&
          text.isEmpty) {
        return 'Enter your ${label.toLowerCase()}.';
      }
      if (index == 4 && text.isNotEmpty) {
        final normalized = normalizePhilippineMobileNumber(text);
        if (!RegExp(r'^(\+639|09)\d{9}$').hasMatch(normalized)) {
          return 'Enter a valid Philippine mobile number.';
        }
      }
      return _fieldErrors[_fieldKeys[index]];
    },
  );

  Widget _sectionTitle(String title) => Text(
    title,
    style: Theme.of(
      context,
    ).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700),
  );

  Widget _accountEmail(String email) {
    final theme = Theme.of(context);
    return Container(
      padding: const EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        color: theme.colorScheme.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: theme.colorScheme.outlineVariant),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(
            'Email Address',
            style: theme.textTheme.labelMedium?.copyWith(
              color: theme.colorScheme.onSurfaceVariant,
              fontWeight: FontWeight.w500,
            ),
          ),
          const SizedBox(height: AppSpacing.xs),
          Text(
            email,
            style: theme.textTheme.bodyMedium?.copyWith(
              color: theme.colorScheme.onSurface,
              fontWeight: FontWeight.w500,
            ),
          ),
          const SizedBox(height: AppSpacing.xs),
          Text(
            'Email address cannot be changed here.',
            style: theme.textTheme.bodySmall,
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) => PopScope(
    canPop: _leaving,
    onPopInvokedWithResult: (didPop, result) {
      if (!didPop) _back();
    },
    child: Scaffold(
      backgroundColor: Colors.white,
      appBar: LunasAppBar(
        title: 'Edit Personal Details',
        subtitle: 'Update your name and contact information.',
        showBackButton: true,
        onBack: _saving ? () {} : _back,
      ),
      body: SafeArea(
        top: false,
        child: Column(
          children: [
            Expanded(
              child: LayoutBuilder(
                builder: (context, constraints) => SingleChildScrollView(
                  padding: EdgeInsets.fromLTRB(
                    constraints.maxWidth < 360 ? AppSpacing.md : AppSpacing.xl,
                    AppSpacing.lg,
                    constraints.maxWidth < 360 ? AppSpacing.md : AppSpacing.xl,
                    AppSpacing.xl,
                  ),
                  child: Align(
                    alignment: Alignment.topCenter,
                    child: ConstrainedBox(
                      constraints: const BoxConstraints(maxWidth: 760),
                      child: Form(
                        key: _key,
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            _sectionTitle('Name'),
                            const SizedBox(height: AppSpacing.md),
                            _field(
                              0,
                              'First Name',
                              capitalization: TextCapitalization.words,
                            ),
                            const SizedBox(height: AppSpacing.md),
                            _field(
                              1,
                              'Middle Name',
                              capitalization: TextCapitalization.words,
                            ),
                            CheckboxListTile(
                              value: _noMiddleName,
                              onChanged: _saving
                                  ? null
                                  : (value) => setState(() {
                                      _noMiddleName = value ?? false;
                                      _fieldErrors = Map.of(_fieldErrors)
                                        ..remove('middleName');
                                    }),
                              contentPadding: EdgeInsets.zero,
                              controlAffinity: ListTileControlAffinity.leading,
                              title: const Text("I don't have a middle name"),
                            ),
                            const SizedBox(height: AppSpacing.xs),
                            _field(
                              2,
                              'Last Name',
                              capitalization: TextCapitalization.words,
                            ),
                            const SizedBox(height: AppSpacing.md),
                            _field(
                              3,
                              'Suffix (Optional)',
                              limit: 20,
                              capitalization: TextCapitalization.words,
                            ),
                            const SizedBox(height: AppSpacing.xl),
                            _sectionTitle('Contact Details'),
                            const SizedBox(height: AppSpacing.md),
                            _field(
                              4,
                              'Mobile Number (Optional)',
                              limit: 16,
                              keyboard: TextInputType.phone,
                              inputFormatters: const [
                                PhilippineMobileInputFormatter(),
                              ],
                            ),
                            const SizedBox(height: AppSpacing.md),
                            _field(
                              5,
                              'Address (Optional)',
                              limit: 160,
                              keyboard: TextInputType.streetAddress,
                              capitalization: TextCapitalization.sentences,
                              minLines: 2,
                              maxLines: 3,
                              textInputAction: TextInputAction.newline,
                            ),
                            const SizedBox(height: AppSpacing.xl),
                            _sectionTitle('Account'),
                            const SizedBox(height: AppSpacing.md),
                            _accountEmail(
                              AuthScope.of(context).user?.email ?? '',
                            ),
                            if (_error != null)
                              Padding(
                                padding: const EdgeInsets.only(
                                  top: AppSpacing.md,
                                ),
                                child: Text(
                                  _error!,
                                  style: TextStyle(
                                    color: Theme.of(context).colorScheme.error,
                                  ),
                                ),
                              ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ),
              ),
            ),
            DecoratedBox(
              decoration: BoxDecoration(
                color: Theme.of(context).colorScheme.surface,
                border: const Border(top: BorderSide(color: Color(0xFFE2E8F0))),
              ),
              child: Padding(
                padding: EdgeInsets.fromLTRB(
                  MediaQuery.sizeOf(context).width < 360
                      ? AppSpacing.md
                      : AppSpacing.xl,
                  AppSpacing.md,
                  MediaQuery.sizeOf(context).width < 360
                      ? AppSpacing.md
                      : AppSpacing.xl,
                  AppSpacing.md,
                ),
                child: LunasButton(
                  label: 'Save Changes',
                  isLoading: _saving,
                  onPressed: _dirty && !_saving ? _save : null,
                ),
              ),
            ),
          ],
        ),
      ),
    ),
  );
}
