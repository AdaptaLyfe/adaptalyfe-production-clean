import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'core/network/api_client.dart';
import 'core/storage/token_storage.dart';
import 'features/auth/data/auth_repository_impl.dart';
import 'features/auth/presentation/auth_cubit.dart';
import 'features/auth/presentation/auth_pages.dart';

class AdaptalyfeApp extends StatefulWidget {
  const AdaptalyfeApp({super.key});
  @override
  State<AdaptalyfeApp> createState() => _AdaptalyfeAppState();
}

class _AdaptalyfeAppState extends State<AdaptalyfeApp> {
  late final AuthCubit _cubit;
  late final GoRouter _router;
  @override
  void initState() {
    super.initState();
    final storage = TokenStorage();
    _cubit = AuthCubit(AuthRepositoryImpl(ApiClient(storage), storage))
      ..restore();
    _router = GoRouter(
      initialLocation: '/',
      refreshListenable: _CubitRefresh(_cubit),
      redirect: (_, state) {
        final auth = _cubit.state;
        final atAuth = state.matchedLocation == '/login' ||
            state.matchedLocation == '/signup';
        if (auth is AuthLoading) {
          return state.matchedLocation == '/' ? null : '/';
        }
        // Keep restoration failures on the splash screen so its typed error and
        // retry action remain visible instead of being redirected away.
        if (auth is AuthFailure && state.matchedLocation == '/') return null;
        if (auth is AuthAuthenticated) {
          return atAuth || state.matchedLocation == '/' ? '/home' : null;
        }
        return atAuth ? null : '/login';
      },
      routes: [
        GoRoute(path: '/', builder: (_, __) => const SplashPage()),
        GoRoute(path: '/login', builder: (_, __) => const LoginPage()),
        GoRoute(path: '/signup', builder: (_, __) => const SignupPage()),
        GoRoute(path: '/home', builder: (_, __) => const HomePage()),
      ],
    );
  }

  @override
  void dispose() {
    _router.dispose();
    _cubit.close();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return BlocProvider.value(
      value: _cubit,
      child: MaterialApp.router(
        title: 'AdaptaLyfe',
        theme: ThemeData(
            colorScheme:
                ColorScheme.fromSeed(seedColor: const Color(0xff168f49)),
            useMaterial3: true),
        routerConfig: _router,
      ),
    );
  }
}

class _CubitRefresh extends ChangeNotifier {
  _CubitRefresh(AuthCubit cubit) {
    _subscription = cubit.stream.listen((_) => notifyListeners());
  }
  late final StreamSubscription<AuthState> _subscription;
  @override
  void dispose() {
    _subscription.cancel();
    super.dispose();
  }
}
