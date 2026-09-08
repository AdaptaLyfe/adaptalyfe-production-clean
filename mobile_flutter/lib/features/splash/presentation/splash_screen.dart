import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';

import '../../auth/bloc/auth_bloc.dart';
import '../../auth/bloc/auth_event.dart';
import '../../auth/bloc/auth_state.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> {
  @override
  void initState() {
    super.initState();
    final authBloc = context.read<AuthBloc>();
    if (authBloc.state is AuthInitial) {
      authBloc.add(const CheckAuthentication());
    }
  }

  @override
  Widget build(BuildContext context) {
    return BlocListener<AuthBloc, AuthState>(
      listener: (context, state) {
        if (state is Authenticated) {
          context.go('/home');
        } else if (state is Unauthenticated) {
          context.go('/login');
        }
      },
      child: BlocBuilder<AuthBloc, AuthState>(
        builder: (context, state) {
          final isError = state is AuthError;
          final errorMessage = isError ? state.message : null;

          return _SplashView(
            errorMessage: errorMessage,
            onRetry: () {
              context.read<AuthBloc>().add(const CheckAuthentication());
            },
            onContinueToLogin: () => context.go('/login'),
          );
        },
      ),
    );
  }
}

class _SplashView extends StatelessWidget {
  const _SplashView({
    required this.errorMessage,
    required this.onRetry,
    required this.onContinueToLogin,
  });

  final String? errorMessage;
  final VoidCallback onRetry;
  final VoidCallback onContinueToLogin;

  @override
  Widget build(BuildContext context) {
    return AnnotatedRegion(
      value: const SystemUiOverlayStyle(
        statusBarColor: Colors.white,
        statusBarIconBrightness: Brightness.dark,
        statusBarBrightness: Brightness.light,
      ),
      child: Scaffold(
        backgroundColor: const Color(0xFFECFDF5),
        body: SafeArea(
          child: Center(
            child: Padding(
              padding: const EdgeInsets.all(32),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Image.asset(
                    'assets/adaptalyfe-icon.png',
                    width: 132,
                    height: 106,
                    fit: BoxFit.contain,
                  ),
                  const SizedBox(height: 18),
                  const Text(
                    'Adaptalyfe',
                    style: TextStyle(
                      color: Color(0xFF166534),
                      fontSize: 30,
                      fontWeight: FontWeight.w700,
                      letterSpacing: 0.2,
                    ),
                  ),
                  const SizedBox(height: 8),
                  const Text(
                    'Grow with Guidance. Thrive with Confidence.',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      color: Color(0xFF166534),
                      fontSize: 14,
                    ),
                  ),
                  const SizedBox(height: 32),
                  if (errorMessage != null) ...[
                    Text(
                      errorMessage!,
                      textAlign: TextAlign.center,
                      style: const TextStyle(
                        color: Color(0xFF991B1B),
                        fontSize: 14,
                      ),
                    ),
                    const SizedBox(height: 20),
                    FilledButton(
                      onPressed: onRetry,
                      child: const Text('Try again'),
                    ),
                    TextButton(
                      onPressed: onContinueToLogin,
                      child: const Text('Continue to login'),
                    ),
                  ] else ...[
                    const SizedBox(
                      width: 28,
                      height: 28,
                      child: CircularProgressIndicator(
                        strokeWidth: 3,
                        color: Color(0xFF10B981),
                      ),
                    ),
                    const SizedBox(height: 14),
                    const Text(
                      'Checking your session…',
                      style: TextStyle(
                        color: Color(0xFF166534),
                        fontSize: 13,
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}