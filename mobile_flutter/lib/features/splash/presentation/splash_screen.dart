import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';

import '../bloc/splash_bloc.dart';
import '../bloc/splash_event.dart';
import '../bloc/splash_state.dart';

class SplashScreen extends StatelessWidget {
  const SplashScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocListener<SplashBloc, SplashState>(
      listener: (context, state) {
        if (state is SplashAuthenticated) {
          context.go('/home');
        } else if (state is SplashUnauthenticated) {
          context.go('/login');
        }
      },
      child: BlocBuilder<SplashBloc, SplashState>(
        builder: (context, state) {
          return _SplashView(
            state: state,
            onRetry: () => context.read<SplashBloc>().add(
                  const SplashStarted(),
                ),
            onContinueToLogin: () => context.go('/login'),
          );
        },
      ),
    );
  }
}

class _SplashView extends StatelessWidget {
  const _SplashView({
    required this.state,
    required this.onRetry,
    required this.onContinueToLogin,
  });

  final SplashState state;
  final VoidCallback onRetry;
  final VoidCallback onContinueToLogin;

  @override
  Widget build(BuildContext context) {
    final isError = state is SplashError;
    final errorMessage = isError ? (state as SplashError).message : null;

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
                  if (isError) ...[
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