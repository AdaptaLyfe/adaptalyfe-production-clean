import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';

import '../../auth/bloc/auth_bloc.dart';
import '../bloc/subscription_bloc.dart';
import '../bloc/subscription_event.dart';
import '../bloc/subscription_state.dart';
import '../subscription_access.dart';

class SubscriptionFeaturePaywall extends StatelessWidget {
  const SubscriptionFeaturePaywall({required this.title, super.key});
  final String title;

  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: Text(title)),
    body: Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text('$title requires an active Premium or Family plan.',
                textAlign: TextAlign.center),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: () => context.go('/subscription'),
              child: const Text('View plans or restore'),
            ),
          ],
        ),
      ),
    ),
  );
}

class PremiumFeatureGate extends StatefulWidget {
  const PremiumFeatureGate({
    required this.title,
    required this.child,
    required this.paywall,
    super.key,
  });

  final String title;
  final Widget child;
  final Widget paywall;

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
        )) {
          return widget.child;
        }
        if (state.isLoading) {
          return Scaffold(
            appBar: AppBar(title: Text(widget.title)),
            body: const Center(child: CircularProgressIndicator()),
          );
        }
        if (state.status == SubscriptionStatus.failure) {
          return Scaffold(
            appBar: AppBar(title: Text(widget.title)),
            body: Center(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Text(
                      'We couldn’t verify your subscription right now.',
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 12),
                    OutlinedButton.icon(
                      onPressed: _refreshSubscription,
                      icon: const Icon(Icons.refresh_rounded),
                      label: const Text('Check again'),
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
        );
        return hasAccess ? widget.child : widget.paywall;
      },
    );
  }
}