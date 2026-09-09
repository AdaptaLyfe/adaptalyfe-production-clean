import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';

import '../core/analytics/firebase_analytics_service.dart';
import '../features/auth/bloc/auth_bloc.dart';
import '../features/auth/bloc/auth_state.dart';
import 'routes.dart';

class AdaptalyfeApp extends StatefulWidget {
  const AdaptalyfeApp({super.key});

  @override
  State<AdaptalyfeApp> createState() => _AdaptalyfeAppState();
}

class _AdaptalyfeAppState extends State<AdaptalyfeApp>
    with WidgetsBindingObserver {
  late final AuthBloc _authBloc;
  late final GoRouter _router;
  final _analytics = FirebaseAnalyticsService.instance;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _authBloc = AuthBloc(createAuthRepository());
    _router = createAppRouter(_authBloc);
    _router.routerDelegate.addListener(_trackCurrentRoute);
    WidgetsBinding.instance.addPostFrameCallback((_) => _trackCurrentRoute());
    _analytics.startSession();
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _router.routerDelegate.removeListener(_trackCurrentRoute);
    _analytics.endSession();
    _router.dispose();
    _authBloc.close();
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      _analytics.startSession();
    } else if (state == AppLifecycleState.paused ||
        state == AppLifecycleState.detached) {
      _analytics.endSession();
    }
  }

  void _trackCurrentRoute() {
    final route = _router.routerDelegate.currentConfiguration.uri.path;
    _analytics.trackRoute(route);
  }

  @override
  Widget build(BuildContext context) {
    return BlocProvider.value(
      value: _authBloc,
      child: BlocListener<AuthBloc, AuthState>(
        listener: (context, state) {
          if (state is Authenticated) {
            final user = state.user;
            final createdAt = user.createdAt;
            final daysSinceSignup = createdAt == null
                ? null
                : DateTime.now()
                    .difference(createdAt)
                    .inDays
                    .clamp(0, 100000)
                    .toInt();
            _analytics.setAnalyticsUser(
              user.id,
              properties: {
                if (user.accountType != null)
                  'account_type': user.accountType!,
                if (user.subscriptionTier != null)
                  'subscription_tier': user.subscriptionTier!,
                if (user.subscriptionStatus != null)
                  'subscription_status': user.subscriptionStatus!,
                if (daysSinceSignup != null)
                  'days_since_signup': '$daysSinceSignup',
              },
            );
            if (daysSinceSignup != null) {
              _analytics.logRetention(daysSinceSignup, true);
            }
          }
        },
        child: MaterialApp.router(
          title: 'Adaptalyfe',
          theme: ThemeData(
            colorScheme: ColorScheme.fromSeed(
              seedColor: const Color(0xFF2E7D6B),
            ),
            useMaterial3: true,
          ),
          routerConfig: _router,
        ),
      ),
    );
  }
}