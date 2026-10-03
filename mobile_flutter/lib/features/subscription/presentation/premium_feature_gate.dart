import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';

import '../../auth/bloc/auth_bloc.dart';
import '../bloc/subscription_bloc.dart';
import '../bloc/subscription_event.dart';
import '../bloc/subscription_state.dart';
import '../data/subscription_platform_policy.dart';
import '../subscription_access.dart';

class PremiumFeatureGate extends StatefulWidget {
  const PremiumFeatureGate({
    required this.title,
    required this.child,
    required this.paywall,
    this.featureKey,
    super.key,
  });

  final String title;
  final Widget child;
  final Widget paywall;
  final String? featureKey;

  @override
  State<PremiumFeatureGate> createState() => _PremiumFeatureGateState();
}

class _PremiumFeatureGateState extends State<PremiumFeatureGate>
    with WidgetsBindingObserver {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) _refreshSubscription();
    });
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed && mounted) {
      _refreshSubscription();
    }
  }

  void _refreshSubscription() {
    context.read<SubscriptionBloc>().add(const RefreshSubscription());
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<SubscriptionBloc, SubscriptionState>(
      builder: (context, state) {
        final authState = context.read<AuthBloc>().state;
        if (canAccessPremiumFeatures(
          authState: authState,
          subscription: null,
          featureKey: widget.featureKey,
        )) {
          return widget.child;
        }
        if (state.isLoading) {
          return Scaffold(
            appBar: AppBar(title: Text(widget.title)),
            body: const Center(child: CircularProgressIndicator()),
          );
        }
        if (state.sessionInvalid) {
          return Scaffold(
            appBar: AppBar(title: Text(widget.title)),
            body: Center(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Text(
                      'Your sign-in has expired. Sign in again to verify '
                      'your subscription.',
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 12),
                    FilledButton(
                      onPressed: () => context.go('/login'),
                      child: const Text('Sign in again'),
                    ),
                  ],
                ),
              ),
            ),
          );
        }
        if (!state.accountStatusLoaded ||
            state.status == SubscriptionStatus.failure) {
          return Scaffold(
            appBar: AppBar(title: Text(widget.title)),
            body: Center(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      state.errorMessage ??
                          state.actionMessage ??
                          'We couldn’t verify your subscription right now.',
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 12),
                    OutlinedButton.icon(
                      onPressed: state.isBusy ? null : _refreshSubscription,
                      icon: const Icon(Icons.refresh_rounded),
                      label: const Text('Check again'),
                    ),
                    if (usesNativeStoreBilling)
                      OutlinedButton.icon(
                        onPressed: state.isBusy
                            ? null
                            : () => context
                                .read<SubscriptionBloc>()
                                .add(const RestorePurchasesRequested()),
                        icon: const Icon(Icons.restore_rounded),
                        label: Text(
                          state.status == SubscriptionStatus.restoring
                              ? 'Restoring purchases…'
                              : 'Restore purchases',
                        ),
                      ),
                    TextButton(
                      onPressed: () => context.go('/subscription'),
                      child: const Text('Open subscription options'),
                    ),
                  ],
                ),
              ),
            ),
          );
        }

        final hasAccess = canAccessPremiumFeatures(
          authState: authState,
          subscription: state.subscription,
          featureKey: widget.featureKey,
        );
        return hasAccess ? widget.child : widget.paywall;
      },
    );
  }
}