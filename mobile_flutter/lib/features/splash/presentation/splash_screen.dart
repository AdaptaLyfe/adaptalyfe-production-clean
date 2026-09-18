import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';

import '../../../core/layout/responsive.dart';
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
    final state = authBloc.state;
    if (state is AuthInitial) {
      authBloc.add(const CheckAuthentication());
    }
  }

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<AuthBloc, AuthState>(
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
           child: SingleChildScrollView(
             padding: AppResponsive.pagePadding(context).add(
               const EdgeInsets.symmetric(vertical: 24),
             ),
             child: ConstrainedBox(
               constraints: BoxConstraints(
                 minHeight: AppResponsive.height(context) -
                     MediaQuery.paddingOf(context).vertical -
                     48,
               ),
               child: Center(
                 child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                   Image.asset(
                    'assets/adaptalyfe-icon.png',
                     width: AppResponsive.isCompact(context) ? 104 : 132,
                     height: AppResponsive.isCompact(context) ? 84 : 106,
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
      ),
    );
  }
}