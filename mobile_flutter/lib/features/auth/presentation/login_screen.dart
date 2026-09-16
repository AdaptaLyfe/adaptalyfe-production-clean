import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';

import '../../../core/analytics/firebase_analytics_service.dart';
import '../../../core/layout/responsive.dart';
import '../bloc/auth_bloc.dart';
import '../bloc/auth_event.dart';
import '../bloc/auth_state.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({
    super.key,
    this.initialInvitationCode,
  });

  final String? initialInvitationCode;

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _usernameController;
  late final TextEditingController _passwordController;
  late final TextEditingController _invitationCodeController;

  @override
  void initState() {
    super.initState();
    _usernameController = TextEditingController();
    _passwordController = TextEditingController();
    _invitationCodeController = TextEditingController(
      text: widget.initialInvitationCode ?? '',
    );
  }

  @override
  void dispose() {
    _usernameController.dispose();
    _passwordController.dispose();
    _invitationCodeController.dispose();
    super.dispose();
  }

  void _submit() {
    FocusScope.of(context).unfocus();

    if (!(_formKey.currentState?.validate() ?? false)) {
      return;
    }

    context.read<AuthBloc>().add(
          LoginSubmitted(
            username: _usernameController.text.trim(),
            password: _passwordController.text,
          ),
        );
  }

  @override
  Widget build(BuildContext context) {
    return BlocConsumer<AuthBloc, AuthState>(
      listener: (context, state) {
        if (state is Authenticated) {
          FirebaseAnalyticsService.instance.logLogin('password');
          final code = _invitationCodeController.text.trim();
          if (code.isNotEmpty) {
            context.go(
              '/accept-invitation?code=${Uri.encodeComponent(code)}',
            );
          } else {
            context.go('/home');
          }
        }
      },
      builder: (context, state) {
        final isLoading = state is AuthLoading;
        final errorMessage = state is AuthError ? state.message : null;

        return Scaffold(
          body: Container(
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                colors: [
                  Color(0xFFEFF6FF),
                  Color(0xFFF5F3FF),
                ],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
            ),
            child: SafeArea(
              child: Column(
                children: [
                  _LoginNavigationBar(),
                  Expanded(
                    child: SingleChildScrollView(
                       padding: AppResponsive.pagePadding(context).add(
                         EdgeInsets.only(
                           top: AppResponsive.isCompact(context) ? 20 : 48,
                           bottom: 40,
                         ),
                       ),
                      child: Center(
                        child: ConstrainedBox(
                          constraints: const BoxConstraints(maxWidth: 440),
                          child: _LoginCard(
                            formKey: _formKey,
                            usernameController: _usernameController,
                            passwordController: _passwordController,
                            invitationCodeController:
                                _invitationCodeController,
                            hasInitialInvitationCode:
                                widget.initialInvitationCode != null &&
                                    widget.initialInvitationCode!
                                        .trim()
                                        .isNotEmpty,
                            errorMessage: errorMessage,
                            isLoading: isLoading,
                            onSubmit: _submit,
                            onSignup: () {
                              final code = _invitationCodeController.text.trim();
                              final destination = code.isEmpty
                                  ? '/signup'
                                  : '/signup?code=${Uri.encodeComponent(code)}';
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

class _LoginNavigationBar extends StatelessWidget {
  const _LoginNavigationBar();

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 64,
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
          const Text(
            'Adaptalyfe',
            style: TextStyle(
              color: Color(0xFF111827),
              fontSize: 20,
              fontWeight: FontWeight.w700,
            ),
          ),
        ],
      ),
    );
  }
}

class _LoginCard extends StatelessWidget {
  const _LoginCard({
    required this.formKey,
    required this.usernameController,
    required this.passwordController,
    required this.invitationCodeController,
    required this.hasInitialInvitationCode,
    required this.errorMessage,
    required this.isLoading,
    required this.onSubmit,
    required this.onSignup,
  });

  final GlobalKey<FormState> formKey;
  final TextEditingController usernameController;
  final TextEditingController passwordController;
  final TextEditingController invitationCodeController;
  final bool hasInitialInvitationCode;
  final String? errorMessage;
  final bool isLoading;
  final VoidCallback onSubmit;
  final VoidCallback onSignup;

  @override
  Widget build(BuildContext context) {
    final invitationLabel = hasInitialInvitationCode
        ? 'Caregiver Invitation Code'
        : 'Have a Caregiver Invitation Code? (Optional)';
    final invitationHint = hasInitialInvitationCode
        ? 'Enter invitation code'
        : 'Enter invitation code to become a caregiver';

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
                    Icons.login_rounded,
                    color: Color(0xFF2563EB),
                    size: 32,
                  ),
                ),
              ),
              const SizedBox(height: 16),
              const Text(
                'Welcome Back',
                textAlign: TextAlign.center,
                style: TextStyle(
                  color: Color(0xFF111827),
                  fontSize: 26,
                  fontWeight: FontWeight.w700,
                ),
              ),
              const SizedBox(height: 6),
              const Text(
                'Sign in to continue your independence journey',
                textAlign: TextAlign.center,
                style: TextStyle(
                  color: Color(0xFF4B5563),
                  fontSize: 15,
                ),
              ),
              const SizedBox(height: 24),
              if (errorMessage != null) ...[
                _ErrorBanner(message: errorMessage!),
                const SizedBox(height: 16),
              ],
              TextFormField(
                controller: usernameController,
                enabled: !isLoading,
                textInputAction: TextInputAction.next,
                autofillHints: const [AutofillHints.username],
                decoration: const InputDecoration(
                  labelText: 'Username',
                  hintText: 'Enter your username',
                  border: OutlineInputBorder(),
                ),
                validator: (value) {
                  if (value == null || value.trim().isEmpty) {
                    return 'Username is required';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 20),
              TextFormField(
                controller: passwordController,
                enabled: !isLoading,
                obscureText: true,
                textInputAction: TextInputAction.done,
                autofillHints: const [AutofillHints.password],
                onFieldSubmitted: (_) {
                  if (!isLoading) onSubmit();
                },
                decoration: const InputDecoration(
                  labelText: 'Password',
                  hintText: 'Enter your password',
                  border: OutlineInputBorder(),
                ),
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Password is required';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 20),
              Container(
                padding: hasInitialInvitationCode
                    ? const EdgeInsets.all(12)
                    : EdgeInsets.zero,
                decoration: hasInitialInvitationCode
                    ? BoxDecoration(
                        color: const Color(0xFFEFF6FF),
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: const Color(0xFFBFDBFE)),
                      )
                    : null,
                child: TextFormField(
                  controller: invitationCodeController,
                  enabled: !isLoading && !hasInitialInvitationCode,
                  textCapitalization: TextCapitalization.characters,
                  decoration: InputDecoration(
                    labelText: invitationLabel,
                    hintText: invitationHint,
                    border: const OutlineInputBorder(),
                    labelStyle: hasInitialInvitationCode
                        ? const TextStyle(
                            color: Color(0xFF1D4ED8),
                            fontWeight: FontWeight.w600,
                          )
                        : null,
                  ),
                ),
              ),
              if (hasInitialInvitationCode) ...[
                const SizedBox(height: 6),
                const Text(
                  "You'll become a caregiver after logging in",
                  style: TextStyle(
                    color: Color(0xFF2563EB),
                    fontSize: 12,
                  ),
                ),
              ],
              const SizedBox(height: 24),
              SizedBox(
                height: 52,
                child: FilledButton(
                  onPressed: isLoading ? null : onSubmit,
                  style: FilledButton.styleFrom(
                    backgroundColor: const Color(0xFF86EFAC),
                    foregroundColor: Colors.black,
                    disabledBackgroundColor: const Color(0xFFBBF7D0),
                    side: const BorderSide(
                      color: Color(0xFF15803D),
                      width: 2,
                    ),
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
                                color: Colors.black,
                              ),
                            ),
                            SizedBox(width: 10),
                            Text(
                              'Signing In...',
                              style: TextStyle(fontWeight: FontWeight.w700),
                            ),
                          ],
                        )
                      : const Text(
                          'Sign In',
                          style: TextStyle(
                            fontWeight: FontWeight.w700,
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
                    "Don't have an account? ",
                    style: TextStyle(
                      color: Color(0xFF4B5563),
                      fontSize: 14,
                    ),
                  ),
                  GestureDetector(
                    onTap: isLoading ? null : onSignup,
                    child: Text(
                      'Create one here',
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
            ],
          ),
        ),
      ),
    );
  }
}

class _ErrorBanner extends StatelessWidget {
  const _ErrorBanner({required this.message});

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