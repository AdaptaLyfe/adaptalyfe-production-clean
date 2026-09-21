import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';

import '../../../core/analytics/firebase_analytics_service.dart';
import '../../../core/layout/responsive.dart';
import '../bloc/auth_bloc.dart';
import '../bloc/auth_event.dart';
import '../bloc/auth_state.dart';

class SignupScreen extends StatefulWidget {
  const SignupScreen({
    super.key,
    this.initialInvitationCode,
  });

  final String? initialInvitationCode;

  @override
  State<SignupScreen> createState() => _SignupScreenState();
}

class _SignupScreenState extends State<SignupScreen> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _nameController;
  late final TextEditingController _emailController;
  late final TextEditingController _usernameController;
  late final TextEditingController _passwordController;
  late final TextEditingController _confirmPasswordController;
  late final TextEditingController _invitationCodeController;

  final _nameFieldKey = GlobalKey<FormFieldState<String>>();
  final _emailFieldKey = GlobalKey<FormFieldState<String>>();
  final _usernameFieldKey = GlobalKey<FormFieldState<String>>();
  final _passwordFieldKey = GlobalKey<FormFieldState<String>>();
  final _confirmPasswordFieldKey = GlobalKey<FormFieldState<String>>();

  bool _ageVerified = false;
  bool _agreeToTerms = false;
  bool _subscribeNewsletter = false;
  String? _localError;
  String? _activeValidationField;

  @override
  void initState() {
    super.initState();
    _nameController = TextEditingController();
    _emailController = TextEditingController();
    _usernameController = TextEditingController();
    _passwordController = TextEditingController();
    _confirmPasswordController = TextEditingController();
    _invitationCodeController = TextEditingController(
      text: widget.initialInvitationCode ?? '',
    );
  }

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _usernameController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    _invitationCodeController.dispose();
    super.dispose();
  }

  bool get _hasInvitationCode =>
      _invitationCodeController.text.trim().isNotEmpty;

  void _submit() {
    FocusScope.of(context).unfocus();
    _activeValidationField = null;
    _clearFieldValidationErrors();
    setState(() => _localError = null);

    if (!_validateField(_nameFieldKey, 'name') ||
        !_validateField(_emailFieldKey, 'email') ||
        !_validateField(_usernameFieldKey, 'username') ||
        !_validateField(_passwordFieldKey, 'password') ||
        !_validateField(_confirmPasswordFieldKey, 'confirmPassword')) {
      return;
    }

    if (_passwordController.text != _confirmPasswordController.text) {
      _showLocalError('Password: Passwords do not match');
      return;
    }

    if (!_ageVerified) {
      _showLocalError(
        'Age Verification Required: Users under 13 must have a parent '
        'or guardian create an account',
      );
      return;
    }

    if (!_agreeToTerms) {
      _showLocalError(
        'Terms Required: Please agree to the terms of service',
      );
      return;
    }

    context.read<AuthBloc>().add(
          SignupSubmitted(
            name: _nameController.text.trim(),
            email: _emailController.text.trim(),
            username: _usernameController.text.trim(),
            password: _passwordController.text,
            subscribeNewsletter: _subscribeNewsletter,
            invitationCode: _invitationCodeController.text.trim(),
          ),
        );
  }

  bool _validateField(
    GlobalKey<FormFieldState<String>> fieldKey,
    String fieldName,
  ) {
    _activeValidationField = fieldName;
    return fieldKey.currentState?.validate() ?? true;
  }

  void _clearFieldValidationErrors() {
    for (final fieldKey in [
      _nameFieldKey,
      _emailFieldKey,
      _usernameFieldKey,
      _passwordFieldKey,
      _confirmPasswordFieldKey,
    ]) {
      fieldKey.currentState?.validate();
    }
  }

  void _showLocalError(String message) {
    setState(() => _localError = message);
  }

  @override
  Widget build(BuildContext context) {
    return BlocConsumer<AuthBloc, AuthState>(
      listener: (context, state) {
        if (state is Authenticated) {
          FirebaseAnalyticsService.instance.logSignUp('email');
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(
                'Registration Successful! Welcome to AdaptaLyfe, '
                '${_nameController.text.trim()}!',
              ),
            ),
          );
          final code = _invitationCodeController.text.trim();
          if (code.isNotEmpty) {
            if (state.organizationCodeApplied) {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text(
                    'Organization Code Applied! Free access granted.',
                  ),
                ),
              );
              context.go('/home');
            } else {
              context.go(
                '/accept-invitation?code=${Uri.encodeComponent(code)}',
              );
            }
          } else {
            context.go('/subscription');
          }
        }
      },
      builder: (context, state) {
        final isLoading = state is AuthLoading;
        final backendError = state is AuthError ? state.message : null;

        return Scaffold(
          body: Container(
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                colors: [
                  Color(0xFFEFF6FF),
                  Color(0xFFF5F3FF),
                  Color(0xFFF0FDFA),
                ],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
            ),
            child: SafeArea(
              child: Column(
                children: [
                  const _SignupHeader(),
                  Expanded(
                    child: SingleChildScrollView(
                       padding: AppResponsive.pagePadding(context).add(
                         EdgeInsets.only(
                           top: AppResponsive.isCompact(context) ? 16 : 36,
                           bottom: 40 +
                               MediaQuery.viewInsetsOf(context).bottom,
                         ),
                       ),
                      child: Center(
                        child: ConstrainedBox(
                          constraints: const BoxConstraints(maxWidth: 440),
                          child: _SignupCard(
                            formKey: _formKey,
                            nameController: _nameController,
                            emailController: _emailController,
                            usernameController: _usernameController,
                            passwordController: _passwordController,
                            confirmPasswordController:
                                _confirmPasswordController,
                            nameFieldKey: _nameFieldKey,
                            emailFieldKey: _emailFieldKey,
                            usernameFieldKey: _usernameFieldKey,
                            passwordFieldKey: _passwordFieldKey,
                            confirmPasswordFieldKey: _confirmPasswordFieldKey,
                            invitationCodeController:
                                _invitationCodeController,
                            hasInvitationCode: _hasInvitationCode,
                            ageVerified: _ageVerified,
                            agreeToTerms: _agreeToTerms,
                            subscribeNewsletter: _subscribeNewsletter,
                            localError: _localError,
                            backendError: backendError,
                            isLoading: isLoading,
                            isValidationFieldActive: (field) =>
                                _activeValidationField == field,
                            onAgeChanged: (value) {
                              setState(() => _ageVerified = value);
                            },
                            onTermsChanged: (value) {
                              setState(() => _agreeToTerms = value);
                            },
                            onNewsletterChanged: (value) {
                              setState(() => _subscribeNewsletter = value);
                            },
                            onSubmit: _submit,
                            onLogin: () {
                              final code = _invitationCodeController.text.trim();
                              final destination = code.isEmpty
                                  ? '/login'
                                  : '/login?code=${Uri.encodeComponent(code)}';
                              context.go(destination);
                            },
                          ),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }
}

class _SignupHeader extends StatelessWidget {
  const _SignupHeader();

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 78,
      padding: const EdgeInsets.symmetric(horizontal: 16),
      decoration: const BoxDecoration(
        color: Colors.white,
        border: Border(
          bottom: BorderSide(color: Color(0xFFE5E7EB)),
        ),
        boxShadow: [
          BoxShadow(
            color: Color(0x10000000),
            blurRadius: 6,
            offset: Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(9),
            child: Image.asset(
              'assets/adaptalyfe-icon.png',
              width: 38,
              height: 38,
              fit: BoxFit.cover,
            ),
          ),
          const SizedBox(width: 10),
          const Expanded(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Adaptalyfe',
                  style: TextStyle(
                    color: Color(0xFF111827),
                    fontSize: 20,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                Text(
                  'Grow with Guidance. Thrive with Confidence.',
                  style: TextStyle(
                    color: Color(0xFF6B7280),
                    fontSize: 11,
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

class _SignupCard extends StatelessWidget {
  const _SignupCard({
    required this.formKey,
    required this.nameController,
    required this.emailController,
    required this.usernameController,
    required this.passwordController,
    required this.confirmPasswordController,
    required this.invitationCodeController,
    required this.hasInvitationCode,
    required this.ageVerified,
    required this.agreeToTerms,
    required this.subscribeNewsletter,
    required this.localError,
    required this.backendError,
    required this.isLoading,
    required this.onAgeChanged,
    required this.onTermsChanged,
    required this.onNewsletterChanged,
    required this.onSubmit,
    required this.onLogin,
  });

  final GlobalKey<FormState> formKey;
  final TextEditingController nameController;
  final TextEditingController emailController;
  final TextEditingController usernameController;
  final TextEditingController passwordController;
  final TextEditingController confirmPasswordController;
  final TextEditingController invitationCodeController;
  final bool hasInvitationCode;
  final bool ageVerified;
  final bool agreeToTerms;
  final bool subscribeNewsletter;
  final String? localError;
  final String? backendError;
  final bool isLoading;
  final ValueChanged<bool> onAgeChanged;
  final ValueChanged<bool> onTermsChanged;
  final ValueChanged<bool> onNewsletterChanged;
  final VoidCallback onSubmit;
  final VoidCallback onLogin;

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 8,
      shadowColor: const Color(0x22000000),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: const BorderSide(
          color: Color(0xFFE5E7EB),
          width: 2,
        ),
      ),
      child: Padding(
         padding: EdgeInsets.all(AppResponsive.isCompact(context) ? 16 : 24),
        child: Form(
          key: formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Center(
                child: Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: [
                        Color(0xFFDBEAFE),
                        Color(0xFFEDE9FE),
                      ],
                    ),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: const Icon(
                    Icons.favorite_outline_rounded,
                    color: Color(0xFF2563EB),
                    size: 32,
                  ),
                ),
              ),
              const SizedBox(height: 16),
              const Text(
                'Create Your Account',
                textAlign: TextAlign.center,
                style: TextStyle(
                  color: Color(0xFF111827),
                  fontSize: 26,
                  fontWeight: FontWeight.w700,
                ),
              ),
              const SizedBox(height: 6),
              const Text(
                'Start your independence journey with Adaptalyfe',
                textAlign: TextAlign.center,
                style: TextStyle(
                  color: Color(0xFF4B5563),
                  fontSize: 15,
                ),
              ),
              const SizedBox(height: 24),
              if (localError != null) ...[
                _SignupErrorBanner(message: localError!),
                const SizedBox(height: 16),
              ],
              if (backendError != null) ...[
                _SignupErrorBanner(
                  message: 'Registration Failed: $backendError',
                ),
                const SizedBox(height: 16),
              ],
              const _SectionHeading('Personal Information'),
              const SizedBox(height: 14),
              _textField(
                controller: nameController,
                label: 'Full Name',
                hint: 'Enter your full name',
                enabled: !isLoading,
                textInputAction: TextInputAction.next,
                validator: (value) => _required(value, 'Full name'),
              ),
              const SizedBox(height: 16),
              _textField(
                controller: emailController,
                label: 'Email Address',
                hint: 'Enter your email',
                enabled: !isLoading,
                keyboardType: TextInputType.emailAddress,
                textInputAction: TextInputAction.next,
                validator: _emailValidator,
              ),
              const SizedBox(height: 24),
              const _SectionHeading('Account Setup'),
              const SizedBox(height: 14),
              _textField(
                controller: usernameController,
                label: 'Username',
                hint: 'Choose a username',
                enabled: !isLoading,
                textInputAction: TextInputAction.next,
                validator: (value) => _required(value, 'Username'),
              ),
              const SizedBox(height: 16),
              _textField(
                controller: passwordController,
                label: 'Password',
                hint: 'Create a strong password',
                enabled: !isLoading,
                obscureText: true,
                textInputAction: TextInputAction.next,
                validator: (value) => _required(value, 'Password'),
              ),
              const SizedBox(height: 16),
              _textField(
                controller: confirmPasswordController,
                label: 'Confirm Password',
                hint: 'Confirm your password',
                enabled: !isLoading,
                obscureText: true,
                textInputAction: TextInputAction.next,
                validator: (value) => _required(value, 'Confirm password'),
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: invitationCodeController,
                enabled: !isLoading,
                textCapitalization: TextCapitalization.characters,
                onChanged: (value) {
                  final uppercase = value.toUpperCase();
                  if (uppercase != value) {
                    invitationCodeController.value =
                        invitationCodeController.value.copyWith(
                      text: uppercase,
                      selection: TextSelection.collapsed(
                        offset: uppercase.length,
                      ),
                    );
                  }
                },
                decoration: const InputDecoration(
                  labelText: 'Organization or Invitation Code (Optional)',
                  hintText: 'Enter organization or invitation code',
                  border: OutlineInputBorder(),
                ),
              ),
              if (hasInvitationCode) ...[
                const SizedBox(height: 6),
                const Text(
                  '✓ Code detected - will be applied after registration',
                  style: TextStyle(
                    color: Color(0xFF16A34A),
                    fontSize: 13,
                  ),
                ),
              ],
              const SizedBox(height: 24),
              const _SectionHeading('Age Verification'),
              const SizedBox(height: 12),
              _CheckboxPanel(
                backgroundColor: const Color(0xFFFFFBEB),
                borderColor: const Color(0xFFFDE68A),
                value: ageVerified,
                onChanged: isLoading ? null : onAgeChanged,
                title: 'I confirm that I am 13 years of age or older',
                description: 'Users under 13 must have a parent or guardian '
                    'create an account on their behalf.',
                descriptionColor: const Color(0xFFB45309),
              ),
              const SizedBox(height: 20),
              CheckboxListTile(
                value: agreeToTerms,
                onChanged: isLoading
                    ? null
                    : (value) => onTermsChanged(value ?? false),
                contentPadding: EdgeInsets.zero,
                controlAffinity: ListTileControlAffinity.leading,
                title: const Text.rich(
                  TextSpan(
                    text: 'I agree to the ',
                    children: [
                      TextSpan(
                        text: 'Terms of Service',
                        style: TextStyle(color: Color(0xFF2563EB)),
                      ),
                      TextSpan(text: ' and '),
                      TextSpan(
                        text: 'Privacy Policy',
                        style: TextStyle(color: Color(0xFF2563EB)),
                      ),
                    ],
                  ),
                  style: TextStyle(
                    color: Color(0xFF374151),
                    fontSize: 14,
                  ),
                ),
              ),
              CheckboxListTile(
                value: subscribeNewsletter,
                onChanged: isLoading
                    ? null
                    : (value) => onNewsletterChanged(value ?? false),
                contentPadding: EdgeInsets.zero,
                controlAffinity: ListTileControlAffinity.leading,
                title: const Text(
                  'Subscribe to updates and independence tips (optional)',
                  style: TextStyle(
                    color: Color(0xFF374151),
                    fontSize: 14,
                  ),
                ),
              ),
              const SizedBox(height: 12),
              SizedBox(
                height: 52,
                child: FilledButton(
                  onPressed: isLoading ? null : onSubmit,
                  style: FilledButton.styleFrom(
                    backgroundColor: const Color(0xFF16A34A),
                    foregroundColor: Colors.white,
                    disabledBackgroundColor: const Color(0xFF86EFAC),
                    elevation: 4,
                  ),
                  child: isLoading
                      ? const Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            SizedBox(
                              width: 20,
                              height: 20,
                              child: CircularProgressIndicator(
                                strokeWidth: 2.5,
                                color: Colors.white,
                              ),
                            ),
                            SizedBox(width: 10),
                            Text(
                              'Creating Account...',
                              style: TextStyle(fontWeight: FontWeight.w600),
                            ),
                          ],
                        )
                      : const Text(
                          'Create Account',
                          style: TextStyle(
                            fontWeight: FontWeight.w600,
                            fontSize: 16,
                          ),
                        ),
                ),
              ),
              const SizedBox(height: 20),
              Wrap(
                alignment: WrapAlignment.center,
                children: [
                  const Text(
                    'Already have an account? ',
                    style: TextStyle(
                      color: Color(0xFF4B5563),
                      fontSize: 14,
                    ),
                  ),
                  GestureDetector(
                    onTap: isLoading ? null : onLogin,
                    child: Text(
                      'Sign in here',
                      style: TextStyle(
                        color: isLoading
                            ? const Color(0xFF9CA3AF)
                            : const Color(0xFF2563EB),
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        decoration: TextDecoration.underline,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: const Color(0xFFEFF6FF),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Icon(
                      Icons.shield_outlined,
                      color: Color(0xFF2563EB),
                      size: 20,
                    ),
                    SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        '1-day free trial • Cancel anytime • Secure payment processing',
                        style: TextStyle(
                          color: Color(0xFF1E40AF),
                          fontSize: 13,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _textField({
    required TextEditingController controller,
    required String label,
    required String hint,
    required bool enabled,
    required String? Function(String?) validator,
    TextInputType? keyboardType,
    TextInputAction? textInputAction,
    bool obscureText = false,
  }) {
    return TextFormField(
      controller: controller,
      enabled: enabled,
      keyboardType: keyboardType,
      textInputAction: textInputAction,
      obscureText: obscureText,
      decoration: InputDecoration(
        labelText: label,
        hintText: hint,
        border: const OutlineInputBorder(),
      ),
      validator: validator,
    );
  }

  String? _required(String? value, String label) {
    if (value == null || value.trim().isEmpty) {
      return '$label is required';
    }
    return null;
  }

  String? _emailValidator(String? value) {
    final requiredError = _required(value, 'Email address');
    if (requiredError != null) {
      return requiredError;
    }

    final email = value!.trim();
    if (!RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$').hasMatch(email)) {
      return 'Enter a valid email address';
    }
    return null;
  }
}

class _SectionHeading extends StatelessWidget {
  const _SectionHeading(this.text);

  final String text;

  @override
  Widget build(BuildContext context) {
    return Text(
      text,
      style: const TextStyle(
        color: Color(0xFF111827),
        fontSize: 16,
        fontWeight: FontWeight.w700,
      ),
    );
  }
}

class _CheckboxPanel extends StatelessWidget {
  const _CheckboxPanel({
    required this.backgroundColor,
    required this.borderColor,
    required this.value,
    required this.onChanged,
    required this.title,
    required this.description,
    required this.descriptionColor,
  });

  final Color backgroundColor;
  final Color borderColor;
  final bool value;
  final ValueChanged<bool>? onChanged;
  final String title;
  final String description;
  final Color descriptionColor;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
      decoration: BoxDecoration(
        color: backgroundColor,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: borderColor),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Checkbox(
            value: value,
            onChanged: onChanged == null ? null : (next) => onChanged!(next ?? false),
          ),
          Expanded(
            child: Padding(
              padding: const EdgeInsets.only(top: 8),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: const TextStyle(
                      color: Color(0xFF111827),
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    description,
                    style: TextStyle(
                      color: descriptionColor,
                      fontSize: 13,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _SignupErrorBanner extends StatelessWidget {
  const _SignupErrorBanner({required this.message});

  final String message;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: const Color(0xFFFEF2F2),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: const Color(0xFFFECACA)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Icon(
            Icons.error_outline,
            color: Color(0xFFB91C1C),
            size: 20,
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              message,
              style: const TextStyle(
                color: Color(0xFF991B1B),
                fontSize: 14,
              ),
            ),
          ),
        ],
      ),
    );
  }
}