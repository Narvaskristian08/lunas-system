import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:lunas_mobile/core/theme/app_spacing.dart';
import 'package:lunas_mobile/core/widgets/lunas_button.dart';
import 'package:lunas_mobile/features/auth/presentation/widgets/auth_layout.dart';
import 'package:lunas_mobile/features/auth/presentation/widgets/auth_scope.dart';

class CitizenLoginScreen extends StatefulWidget {
  const CitizenLoginScreen({super.key});

  @override
  State<CitizenLoginScreen> createState() => _CitizenLoginScreenState();
}

class _CitizenLoginScreenState extends State<CitizenLoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _obscurePassword = true;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    final auth = AuthScope.of(context);
    final success = await auth.login(
      email: _emailController.text.trim(),
      password: _passwordController.text,
    );
    if (!success && mounted && auth.message != null) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text(auth.message!)));
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = AuthScope.of(context);
    return AuthLayout(
      showBrand: false,
      centerContent: true,
      footer: Text(
        '© 2024 LUNAS Urban Infrastructure Management',
        textAlign: TextAlign.center,
        style: Theme.of(context).textTheme.labelSmall,
      ),
      child: Column(
        children: [
          const LunasBrand(
            centered: true,
            large: true,
            showTitle: false,
            showSubtitle: false,
          ),
          const SizedBox(height: AppSpacing.xl),
          AuthPanel(
            padding: EdgeInsets.zero,
            child: Form(
              key: _formKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Text(
                    'Welcome Back',
                    textAlign: TextAlign.center,
                    style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                      fontWeight: FontWeight.w700,
                      fontSize: 28,
                    ),
                  ),
                  const SizedBox(height: AppSpacing.xs),
                  Text(
                    'Log in to your LUNAS account.',
                    textAlign: TextAlign.center,
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: Theme.of(context).colorScheme.onSurfaceVariant,
                    ),
                  ),
                  const SizedBox(height: AppSpacing.xl),
                  TextFormField(
                    controller: _emailController,
                    decoration: const InputDecoration(
                      isDense: true,
                      contentPadding: EdgeInsets.symmetric(
                        horizontal: 16,
                        vertical: 16,
                      ),
                      labelText: 'Email Address',
                      hintText: 'you@example.com',
                    ),
                    autofillHints: const [AutofillHints.email],
                    keyboardType: TextInputType.emailAddress,
                    textInputAction: TextInputAction.next,
                    validator: validateEmail,
                  ),
                  const SizedBox(height: AppSpacing.md),
                  TextFormField(
                    controller: _passwordController,
                    autofillHints: const [AutofillHints.password],
                    obscureText: _obscurePassword,
                    textInputAction: TextInputAction.done,
                    onFieldSubmitted: (_) {
                      if (!auth.isSubmitting) _submit();
                    },
                    decoration: InputDecoration(
                      isDense: true,
                      contentPadding: const EdgeInsets.symmetric(
                        horizontal: 16,
                        vertical: 16,
                      ),
                      labelText: 'Password',
                      hintText: 'Enter your password',
                      suffixIcon: IconButton(
                        onPressed: () => setState(
                          () => _obscurePassword = !_obscurePassword,
                        ),
                        icon: Icon(
                          _obscurePassword
                              ? Icons.visibility_off_outlined
                              : Icons.visibility_outlined,
                        ),
                        tooltip: _obscurePassword
                            ? 'Show password'
                            : 'Hide password',
                      ),
                    ),
                    validator: (value) => (value?.isEmpty ?? true)
                        ? 'Enter your password.'
                        : null,
                  ),
                  Align(
                    alignment: Alignment.centerRight,
                    child: TextButton(
                      onPressed: auth.isSubmitting
                          ? null
                          : () => context.push('/forgot-password'),
                      child: const Text('Forgot Password?'),
                    ),
                  ),
                  if (auth.message != null) ...[
                    AuthMessage(message: auth.message!),
                    const SizedBox(height: AppSpacing.md),
                  ],
                  const SizedBox(height: AppSpacing.xs),
                  LunasButton(
                    label: 'Login',
                    isLoading: auth.isSubmitting,
                    onPressed: auth.isSubmitting ? null : _submit,
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: AppSpacing.md),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(
                "Don't have an account?",
                style: Theme.of(context).textTheme.bodySmall,
              ),
              TextButton(
                onPressed: auth.isSubmitting
                    ? null
                    : () => context.push('/register'),
                child: const Text('Sign Up'),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class AuthMessage extends StatelessWidget {
  const AuthMessage({required this.message, this.isError = true, super.key});
  final String message;
  final bool isError;

  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.all(AppSpacing.md),
    decoration: BoxDecoration(
      color: isError
          ? Theme.of(context).colorScheme.errorContainer
          : Theme.of(context).colorScheme.primaryContainer,
      borderRadius: BorderRadius.circular(12),
    ),
    child: Row(
      children: [
        Icon(
          Icons.info_outline_rounded,
          color: isError
              ? Theme.of(context).colorScheme.onErrorContainer
              : Theme.of(context).colorScheme.onPrimaryContainer,
        ),
        const SizedBox(width: AppSpacing.sm),
        Expanded(
          child: Text(
            message,
            style: TextStyle(
              color: isError
                  ? Theme.of(context).colorScheme.onErrorContainer
                  : Theme.of(context).colorScheme.onPrimaryContainer,
            ),
          ),
        ),
      ],
    ),
  );
}

String? validateEmail(String? value) {
  final email = value?.trim() ?? '';
  if (email.isEmpty) return 'Enter your email address.';
  if (!RegExp(r'^\S+@\S+\.\S+$').hasMatch(email)) {
    return 'Enter a valid email address.';
  }
  return null;
}
