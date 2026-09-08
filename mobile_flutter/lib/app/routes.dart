import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';

import '../core/network/api_client.dart';
import '../core/storage/local_storage.dart';
import '../features/auth/data/auth_api.dart';
import '../features/auth/data/auth_repository.dart';
import '../features/auth/presentation/login_screen.dart';
import '../features/auth/presentation/signup_screen.dart';
import '../features/home/presentation/home_screen.dart';
import '../features/splash/bloc/splash_bloc.dart';
import '../features/splash/bloc/splash_event.dart';
import '../features/splash/presentation/splash_screen.dart';

final GoRouter appRouter = GoRouter(
  initialLocation: '/splash',
  routes: [
    GoRoute(
      path: '/splash',
      builder: (context, state) => BlocProvider(
        create: (_) => SplashBloc(_createAuthRepository())
          ..add(const SplashStarted()),
        child: const SplashScreen(),
      ),
    ),
    GoRoute(
      path: '/login',
      builder: (context, state) => const LoginScreen(),
    ),
    GoRoute(
      path: '/signup',
      builder: (context, state) => const SignupScreen(),
    ),
    GoRoute(
      path: '/home',
      builder: (context, state) => const HomeScreen(),
    ),
  ],
);

AuthRepository _createAuthRepository() {
  final localStorage = LocalStorage();
  final apiClient = ApiClient(localStorage: localStorage);
  return AuthRepository(
    api: AuthApi(apiClient),
    localStorage: localStorage,
  );
}