import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';

import '../core/network/api_client.dart';
import '../core/storage/local_storage.dart';
import '../features/auth/bloc/auth_bloc.dart';
import '../features/auth/bloc/auth_state.dart';
import '../features/auth/data/auth_api.dart';
import '../features/auth/data/auth_repository.dart';
import '../features/auth/presentation/login_screen.dart';
import '../features/auth/presentation/signup_screen.dart';
import '../features/home/bloc/home_bloc.dart';
import '../features/home/bloc/home_event.dart';
import '../features/home/data/home_repository.dart';
import '../features/home/presentation/home_screen.dart';
import '../features/splash/presentation/splash_screen.dart';

GoRouter createAppRouter(AuthBloc authBloc) {
  return GoRouter(
    initialLocation: '/splash',
    refreshListenable: _AuthRouterRefresh(authBloc),
    redirect: (context, state) {
      final location = state.uri.path;
      final authState = authBloc.state;
      final isAuthRoute =
          location == '/splash' ||
          location == '/login' ||
          location == '/signup';

      if (authState is AuthInitial || authState is AuthChecking) {
        return location == '/splash' ? null : '/splash';
      }

      if (authState is Authenticated && isAuthRoute) {
        return '/home';
      }

      if (location == '/home' && authState is! Authenticated) {
        if (authState is Unauthenticated) {
          return '/login';
        }
        if (authState is AuthLoading) {
          return null;
        }
        return '/splash';
      }

      return null;
    },
    routes: [
      GoRoute(
        path: '/splash',
        builder: (context, state) => const SplashScreen(),
      ),
      GoRoute(
        path: '/login',
        builder: (context, state) => LoginScreen(
          initialInvitationCode: state.uri.queryParameters['code'],
        ),
      ),
      GoRoute(
        path: '/signup',
        builder: (context, state) => SignupScreen(
          initialInvitationCode: state.uri.queryParameters['code'],
        ),
      ),
      GoRoute(
        path: '/home',
        builder: (context, state) => BlocProvider(
          create: (_) => HomeBloc(_createHomeRepository())
            ..add(const HomeStarted()),
          child: const HomeScreen(),
        ),
      ),
    ],
  );
}

AuthRepository createAuthRepository() {
  final localStorage = LocalStorage();
  final apiClient = ApiClient(localStorage: localStorage);
  return AuthRepository(
    api: AuthApi(apiClient),
    localStorage: localStorage,
  );
}

class _AuthRouterRefresh extends ChangeNotifier {
  _AuthRouterRefresh(AuthBloc authBloc) {
    _subscription = authBloc.stream.listen((_) => notifyListeners());
  }

  late final StreamSubscription<AuthState> _subscription;

  @override
  void dispose() {
    _subscription.cancel();
    super.dispose();
  }
}

HomeRepository _createHomeRepository() {
  final localStorage = LocalStorage();
  return HomeRepository(
    ApiClient(localStorage: localStorage),
  );
}