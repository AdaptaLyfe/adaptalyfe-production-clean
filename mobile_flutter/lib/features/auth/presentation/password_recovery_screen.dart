import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';

import '../../../core/layout/responsive.dart';
import '../bloc/password_recovery_bloc.dart';
import '../bloc/password_recovery_event.dart';
import '../bloc/password_recovery_state.dart';

class ForgotPasswordScreen extends StatefulWidget {
  const ForgotPasswordScreen({super.key});

  @override
  State<ForgotPasswordScreen> createState() => _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends State<ForgotPasswordScreen> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _emailController;

  @override
  void initState() {
    super.initState();
    _emailController = TextEditingController();
  }

  @override
  void dispose() {
    _emailController.dispose();
    super.dispose();
  }

  void _submit() {
    FocusScope.of(context).unfocus();
    if (!(_formKey.currentState?.validate() ?? false)) return;
    context
        .read<PasswordRecoveryBloc>()
        .add(ForgotPasswordSubmitted(_emailController.text.trim()));
  }

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<PasswordRecoveryBloc, PasswordRecoveryState>(
      builder: (context, state) {
        final isLoading = state is PasswordRecoveryLoading &&
            state.operation == PasswordRecoveryOperation.request;
        final submitted = state is PasswordResetRequestSent;
        final error = state is PasswordRecoveryError ? state.message : null;

        return _AuthPageScaffold(
          backLabel: 'Back to Login',
          onBack: () => context.go('/login'),
          child: Card(
            elevation: 8,
            shadowColor: const Color(0x22000000),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
              side: const BorderSide(color: Color(0xFFE5E7EB), width: 2),
            ),
            child: Padding(
              padding: EdgeInsets.all(
                AppResponsive.isCompact(context) ? 16 : 24,
              ),
              child: Column(
                children: [
                  const _RecoveryIcon(icon: Icons.key_rounded),
                  const SizedBox(height: 16),
                  const Text(
                    'Forgot your password?',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      color: Color(0xFF111827),
                      fontSize: 26,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const SizedBox(height: 8),
                  const Text(
                    'Enter your email and we\'ll send instructions to reset it.',
                    textAlign: TextAlign.center,
                    style: TextStyle(color: Color(0xFF4B5563), fontSize: 15),
                  ),
                  const SizedBox(height: 24),
                  if (submitted)
                    const _SuccessPanel(
                      text:
                          'If an account with that email exists, we sent password reset instructions. Check your inbox and spam folder.',
                    )
                  else ...[
                    Form(
                      key: _formKey,
                      child: TextFormField(
                        controller: _emailController,
                        enabled: !isLoading,
                        keyboardType: TextInputType.emailAddress,
                        textInputAction: TextInputAction.done,
                        autofillHints: const [AutofillHints.email],
                        onFieldSubmitted: (_) {
                          if (!isLoading) _submit();
                        },
                        decoration: const InputDecoration(
                          labelText: 'Email address',
                          hintText: 'you@example.com',
                          prefixIcon: Icon(Icons.mail_outline),
                          border: OutlineInputBorder(),
                        ),
                        validator: _emailValidator,
                      ),
                    ),
                    if (error != null) ...[
                      const SizedBox(height: 12),
                      _ErrorPanel(text: error),
                    ],
                    const SizedBox(height: 24),
                    SizedBox(
                      width: double.infinity,
                      height: 52,
                      child: FilledButton(
                        onPressed: isLoading ? null : _submit,
                        style: FilledButton.styleFrom(
                          backgroundColor: const Color(0xFF86EFAC),
                          foregroundColor: Colors.black,
                          side: const BorderSide(
                            color: Color(0xFF15803D),
                            width: 2,
                          ),
                          elevation: 4,
                        ),
                        child: isLoading
                            ? const _LoadingLabel(label: 'Sending...')
                            : const Text(
                                'Send reset instructions',
                                style: TextStyle(
                                  fontWeight: FontWeight.w700,
                                  fontSize: 16,
                                ),
                              ),
                      ),
                    ),
                  ],
                  const SizedBox(height: 16),
                  TextButton(
                    onPressed: () => context.go('/login'),
                    child: const Text('Return to login'),
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  String? _emailValidator(String? value) {
    if (value == null || value.trim().isEmpty) {
      return 'Email address is required';
    }
    if (!RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$').hasMatch(value.trim())) {
      return 'Enter a valid email address';
    }
    return null;
  }
}

class ResetPasswordScreen extends StatefulWidget {
  const ResetPasswordScreen({
    super.key,
    required this.token,
  });

  final String token;

  @override
  State<ResetPasswordScreen> createState() => _ResetPasswordScreenState();
}

class _ResetPasswordScreenState extends State<ResetPasswordScreen> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _passwordController;
  late final TextEditingController _confirmPasswordController;

  @override
  void initState() {
    super.initState();
    _passwordController = TextEditingController();
    _confirmPasswordController = TextEditingController();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) {
        context
            .read<PasswordRecoveryBloc>()
            .add(ResetTokenValidationRequested(widget.token));
      }
    });
  }

  @override
  void dispose() {
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  void _submit() {
    FocusScope.of(context).unfocus();
    if (!(_formKey.currentState?.validate() ?? false)) return;
    context.read<PasswordRecoveryBloc>().add(
          ResetPasswordSubmitted(
            token: widget.token,
            password: _passwordController.text,
          ),
        );
  }

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<PasswordRecoveryBloc, PasswordRecoveryState>(
      builder: (context, state) {
        final isChecking = state is PasswordRecoveryLoading &&
            state.operation == PasswordRecoveryOperation.validate;
        final isSubmitting = state is PasswordRecoveryLoading &&
            state.operation == PasswordRecoveryOperation.reset;
        final isValid = state is PasswordResetTokenChecked && state.isValid;
        final isInvalid =
            state is PasswordResetTokenChecked && !state.isValid;
        final completed = state is PasswordResetCompleted;
        final error = state is PasswordRecoveryError ? state.message : null;
        final resetError = state is PasswordRecoveryError &&
            state.operation == PasswordRecoveryOperation.reset;
        final hasCheckedToken = state is PasswordResetTokenChecked;

        return _AuthPageScaffold(
          backLabel: 'Back to Login',
          onBack: () => context.go('/login'),
          child: Card(
            elevation: 8,
            shadowColor: const Color(0x22000000),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
              side: const BorderSide(color: Color(0xFFE5E7EB), width: 2),
            ),
            child: Padding(
              padding: EdgeInsets.all(
                AppResponsive.isCompact(context) ? 16 : 24,
              ),
              child: Column(
                children: [
                  const _RecoveryIcon(icon: Icons.key_rounded),
                  const SizedBox(height: 16),
                  const Text(
                    'Create a new password',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      color: Color(0xFF111827),
                      fontSize: 26,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const SizedBox(height: 8),
                  const Text(
                    'Choose a new password with at least 8 characters.',
                    textAlign: TextAlign.center,
                    style: TextStyle(color: Color(0xFF4B5563), fontSize: 15),
                  ),
                  const SizedBox(height: 24),
                  if (isChecking)
                    const Text(
                      'Checking your reset link...',
                      textAlign: TextAlign.center,
                      style: TextStyle(color: Color(0xFF4B5563)),
                    )
                  else if (completed)
                    Column(
                      children: [
                        const _SuccessPanel(
                          text:
                              'Your password was reset successfully. You can now sign in.',
                        ),
                        const SizedBox(height: 12),
                        TextButton(
                          onPressed: () => context.go('/login'),
                          child: const Text('Continue to login'),
                        ),
                      ],
                    )
                  else if (isInvalid ||
                      (!isValid && !hasCheckedToken && !resetError))
                    Column(
                      children: [
                        _ErrorPanel(
                          text: error ??
                              (isInvalid
                              ? 'This reset link is invalid, expired, or has already been used.'
                              : 'This reset link is invalid or missing.'),
                        ),
                        const SizedBox(height: 12),
                        TextButton(
                          onPressed: () => context.go('/forgot-password'),
                          child: const Text('Request a new reset link'),
                        ),
                      ],
                    )
                  else ...[
                    Form(
                      key: _formKey,
                      child: Column(
                        children: [
                          TextFormField(
                            controller: _passwordController,
                            enabled: !isSubmitting,
                            obscureText: true,
                            textInputAction: TextInputAction.next,
                            decoration: const InputDecoration(
                              labelText: 'New password',
                              hintText: 'At least 8 characters',
                              border: OutlineInputBorder(),
                            ),
                            validator: (value) {
                              if (value == null || value.length < 8) {
                                return 'Your password must be at least 8 characters.';
                              }
                              return null;
                            },
                          ),
                          const SizedBox(height: 16),
                          TextFormField(
                            controller: _confirmPasswordController,
                            enabled: !isSubmitting,
                            obscureText: true,
                            textInputAction: TextInputAction.done,
                            onFieldSubmitted: (_) {
                              if (!isSubmitting) _submit();
                            },
                            decoration: const InputDecoration(
                              labelText: 'Confirm password',
                              border: OutlineInputBorder(),
                            ),
                            validator: (value) {
                              if (value != _passwordController.text) {
                                return 'Passwords do not match.';
                              }
                              return null;
                            },
                          ),
                        ],
                      ),
                    ),
                    if (error != null) ...[
                      const SizedBox(height: 12),
                      _ErrorPanel(text: error),
                    ],
                    const SizedBox(height: 24),
                    SizedBox(
                      width: double.infinity,
                      height: 52,
                      child: FilledButton(
                        onPressed: isSubmitting ? null : _submit,
                        style: FilledButton.styleFrom(
                          backgroundColor: const Color(0xFF86EFAC),
                          foregroundColor: Colors.black,
                          side: const BorderSide(
                            color: Color(0xFF15803D),
                            width: 2,
                          ),
                          elevation: 4,
                        ),
                        child: isSubmitting
                            ? const _LoadingLabel(label: 'Resetting...')
                            : const Text(
                                'Reset password',
                                style: TextStyle(
                                  fontWeight: FontWeight.w700,
                                  fontSize: 16,
                                ),
                              ),
                      ),
                    ),
                  ],
                  if (!isChecking && !completed) const SizedBox(height: 16),
                  if (!isChecking && !completed)
                    TextButton(
                      onPressed: () => context.go('/login'),
                      child: const Text('Return to login'),
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

class _AuthPageScaffold extends StatelessWidget {
  const _AuthPageScaffold({
    required this.backLabel,
    required this.onBack,
    required this.child,
  });

  final String backLabel;
  final VoidCallback onBack;
  final Widget child;

  @override
  Widget build(BuildContext context) {
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
              _AuthHeader(backLabel: backLabel, onBack: onBack),
              Expanded(
                child: SingleChildScrollView(
                  padding: AppResponsive.pagePadding(context).add(
                    EdgeInsets.only(
                      top: AppResponsive.isCompact(context) ? 20 : 48,
                      bottom: 40 +
                          MediaQuery.viewInsetsOf(context).bottom,
                    ),
                  ),
                  child: Center(
                    child: ConstrainedBox(
                      constraints: const BoxConstraints(maxWidth: 440),
                      child: child,
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _AuthHeader extends StatelessWidget {
  const _AuthHeader({
    required this.backLabel,
    required this.onBack,
  });

  final String backLabel;
  final VoidCallback onBack;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      decoration: const BoxDecoration(
        color: Colors.white,
        border: Border(bottom: BorderSide(color: Color(0xFFE5E7EB))),
        boxShadow: [
          BoxShadow(
            color: Color(0x10000000),
            blurRadius: 6,
            offset: Offset(0, 2),
          ),
        ],
      ),
      child: LayoutBuilder(
        builder: (context, constraints) {
          final compact = constraints.maxWidth < 360;
          return Row(
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
                child: Text(
                  'Adaptalyfe',
                  style: TextStyle(
                    color: Color(0xFF111827),
                    fontSize: 20,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
              if (compact)
                IconButton(
                  onPressed: onBack,
                  tooltip: backLabel,
                  icon: const Icon(Icons.arrow_back),
                )
              else
                TextButton.icon(
                  onPressed: onBack,
                  icon: const Icon(Icons.arrow_back, size: 18),
                  label: Text(backLabel),
                ),
            ],
          );
        },
      ),
    );
  }
}

class _RecoveryIcon extends StatelessWidget {
  const _RecoveryIcon({required this.icon});

  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          colors: [Color(0xFFDBEAFE), Color(0xFFEDE9FE)],
        ),
        borderRadius: BorderRadius.all(Radius.circular(10)),
      ),
      child: Icon(icon, color: const Color(0xFF2563EB), size: 32),
    );
  }
}

class _SuccessPanel extends StatelessWidget {
  const _SuccessPanel({required this.text});

  final String text;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFFF0FDF4),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: const Color(0xFFBBF7D0)),
      ),
      child: Text(
        text,
        textAlign: TextAlign.center,
        style: const TextStyle(color: Color(0xFF166534), fontSize: 14),
      ),
    );
  }
}

class _ErrorPanel extends StatelessWidget {
  const _ErrorPanel({required this.text});

  final String text;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: const Color(0xFFFEF2F2),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: const Color(0xFFFECACA)),
      ),
      child: Text(
        text,
        textAlign: TextAlign.center,
        style: const TextStyle(color: Color(0xFF991B1B), fontSize: 14),
      ),
    );
  }
}

class _LoadingLabel extends StatelessWidget {
  const _LoadingLabel({required this.label});

  final String label;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        const SizedBox(
          width: 20,
          height: 20,
          child: CircularProgressIndicator(
            strokeWidth: 2.5,
            color: Colors.black,
          ),
        ),
        const SizedBox(width: 10),
        Text(
          label,
          style: const TextStyle(fontWeight: FontWeight.w700),
        ),
      ],
    );
  }
}