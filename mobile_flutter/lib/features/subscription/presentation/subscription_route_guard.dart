import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';

import '../../auth/bloc/auth_bloc.dart';
import '../../auth/bloc/auth_state.dart';
import '../bloc/subscription_bloc.dart';
import '../bloc/subscription_event.dart';
import '../bloc/subscription_state.dart';
import '../subscription_access.dart';

/// Applies the same app-wide access rule as the React wrapper while leaving
/// account settings and subscription recovery reachable.
class SubscriptionRouteGuard extends StatefulWidget {
  const SubscriptionRouteGuard({
    required this.location,
    required this.child,
    super.key,
  });

  final String location;
  final Widget child;

  @override
  State<SubscriptionRouteGuard> createState() => _SubscriptionRouteGuardState();
}

class _SubscriptionRouteGuardState extends State<SubscriptionRouteGuard>
    with WidgetsBindingObserver {
  bool _redirectScheduled = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed && mounted) {
      context.read<SubscriptionBloc>().add(const RefreshSubscription());
    }
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  bool get _isAlwaysAccessible =>
      widget.location == '/subscription' ||
      widget.location.startsWith('/subscription/') ||
      widget.location == '/settings' ||
      widget.location.startsWith('/settings/') ||
      widget.location == '/pricing' ||
      widget.location.startsWith('/pricing/');

  void _redirectTo(String route) {
    if (_redirectScheduled) return;
    _redirectScheduled = true;
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _redirectScheduled = false;
      if (!mounted) return;
      if (widget.location != route) context.go(route);
    });
  }

  @override
  Widget build(BuildContext context) {
    final authState = context.watch<AuthBloc>().state;
    if (authState is! Authenticated) return widget.child;

    return BlocBuilder<SubscriptionBloc, SubscriptionState>(
      builder: (context, state) {
        if (state.sessionInvalid) {
          _redirectTo('/login');
          return const _AccessCheckProgress();
        }

        if (_isAlwaysAccessible) return widget.child;

        if (canAccessApplication(
          authState: authState,
          subscription: state.subscription,
        )) {
          return widget.child;
        }

        if (state.status == SubscriptionStatus.failure &&
            !state.accountStatusLoaded &&
            state.subscription == null) {
          // Match the wrapper: an unavailable entitlement response does not
          // revoke the user's last known app access.
          return widget.child;
        }

        if (state.isLoading || !state.accountStatusLoaded) {
          if (!state.accountStatusLoaded &&
              state.status != SubscriptionStatus.initial &&
              !state.isLoading) {
            _redirectTo('/subscription');
          }
          return const _AccessCheckProgress();
        }

        _redirectTo('/subscription');
        return const _AccessCheckProgress();
      },
    );
  }
}

class _AccessCheckProgress extends StatelessWidget {
  const _AccessCheckProgress();

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      body: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            CircularProgressIndicator(),
            SizedBox(height: 16),
            Text('Checking your subscription…'),
          ],
        ),
      ),
    );
  }
}