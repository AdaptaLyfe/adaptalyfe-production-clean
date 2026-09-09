import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../core/analytics/firebase_analytics_service.dart';
import '../bloc/subscription_bloc.dart';
import '../bloc/subscription_event.dart';
import '../bloc/subscription_state.dart';
import '../models/subscription_models.dart';

class SubscriptionScreen extends StatelessWidget {
  const SubscriptionScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocListener<SubscriptionBloc, SubscriptionState>(
      listenWhen: (previous, current) =>
          previous.managementUrl != current.managementUrl ||
          previous.sessionInvalid != current.sessionInvalid ||
          previous.errorMessage != current.errorMessage ||
          previous.actionMessage != current.actionMessage ||
          previous.subscription != current.subscription,
      listener: (context, state) async {
        if (state.sessionInvalid) {
          if (context.mounted) context.go('/login');
          return;
        }
        final url = state.managementUrl;
        if (url != null) {
          await launchUrl(
            Uri.parse(url),
            mode: LaunchMode.externalApplication,
          );
        }
        final message = state.errorMessage ?? state.actionMessage;
        if (message != null && context.mounted) {
          ScaffoldMessenger.of(context)
            ..hideCurrentSnackBar()
            ..showSnackBar(SnackBar(content: Text(message)));
        }

        final subscription = state.subscription;
        if (subscription != null) {
          final analytics = FirebaseAnalyticsService.instance;
          if (subscription.trialDaysLeft != null) {
            analytics.logTrialStatus(
              subscription.trialDaysLeft!,
              subscription.status,
            );
            if (subscription.trialDaysLeft! <= 2) {
              analytics.logChurnRisk(
                'trial_ending_soon',
                details: {'days_left': '${subscription.trialDaysLeft}'},
              );
            }
          } else if (subscription.status == 'expired') {
            analytics.logChurnRisk(
              'trial_expired',
              details: {'plan_type': subscription.planType},
            );
          }
          analytics.setAnalyticsUserProperties({
            'plan_type': subscription.planType,
            'subscription_status': subscription.status,
          });
        }
      },
      child: Scaffold(
        appBar: AppBar(
          title: const Text('Subscription'),
          actions: [
            IconButton(
              tooltip: 'Refresh subscription',
              onPressed: () => context
                  .read<SubscriptionBloc>()
                  .add(const RefreshSubscription()),
              icon: const Icon(Icons.refresh_rounded),
            ),
          ],
        ),
        body: const _SubscriptionBody(),
      ),
    );
  }
}

class _SubscriptionBody extends StatelessWidget {
  const _SubscriptionBody();

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<SubscriptionBloc, SubscriptionState>(
      builder: (context, state) {
        if (state.isLoading && state.subscription == null) {
          return const Center(child: CircularProgressIndicator());
        }
        if (state.status == SubscriptionStatus.failure &&
            state.subscription == null) {
          return _SubscriptionError(
            message: state.errorMessage ?? 'Unable to load your subscription.',
            onRetry: () => context
                .read<SubscriptionBloc>()
                .add(const RefreshSubscription()),
          );
        }

        return Container(
          decoration: const BoxDecoration(
            gradient: LinearGradient(
              colors: [Color(0xFFEFF6FF), Color(0xFFF5F3FF), Color(0xFFF0FDFA)],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
          ),
          child: RefreshIndicator(
            onRefresh: () => _refresh(context),
            child: ListView(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: const EdgeInsets.fromLTRB(16, 20, 16, 32),
              children: [
                _SubscriptionHeader(subscription: state.subscription),
                const SizedBox(height: 16),
                if (state.subscription?.isActive == true)
                  _ActiveSubscriptionCard(subscription: state.subscription!)
                else
                  const _TrialCard(),
                const SizedBox(height: 20),
                if (state.status == SubscriptionStatus.purchasing ||
                    state.status == SubscriptionStatus.restoring)
                  const Padding(
                    padding: EdgeInsets.only(bottom: 16),
                    child: LinearProgressIndicator(),
                  ),
                if (state.subscription?.isActive == true)
                  _ManageCard(state: state)
                else
                  ...state.plans.map(
                    (plan) => Padding(
                      padding: const EdgeInsets.only(bottom: 14),
                      child: _PlanCard(
                        plan: plan,
                        product: state.products[plan.productId],
                        state: state,
                      ),
                    ),
                  ),
                const SizedBox(height: 4),
                _RestoreCard(
                  enabled: !state.isBusy,
                  onPressed: () {
                    FirebaseAnalyticsService.instance
                        .logSubscriptionEvent('restore', 'store');
                    context
                        .read<SubscriptionBloc>()
                        .add(const RestorePurchasesRequested());
                  },
                ),
                const SizedBox(height: 20),
                const _TermsCard(),
              ],
            ),
          ),
        );
      },
    );
  }

  Future<void> _refresh(BuildContext context) async {
    final bloc = context.read<SubscriptionBloc>();
    bloc.add(const RefreshSubscription());
    await bloc.stream.firstWhere(
      (state) =>
          (state.status == SubscriptionStatus.ready ||
              state.status == SubscriptionStatus.failure) &&
          !state.isBusy,
    );
  }
}

class _SubscriptionHeader extends StatelessWidget {
  const _SubscriptionHeader({required this.subscription});

  final SubscriptionModel? subscription;

  @override
  Widget build(BuildContext context) {
    final active = subscription?.isActive == true;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          active ? 'Manage your subscription' : 'Choose your plan',
          style: const TextStyle(
            color: Color(0xFF111827),
            fontSize: 28,
            fontWeight: FontWeight.w800,
          ),
        ),
        const SizedBox(height: 7),
        Text(
          active
              ? 'Your Adaptalyfe access works across your devices.'
              : 'Unlock the tools that help you build independence every day.',
          style: const TextStyle(color: Color(0xFF4B5563), fontSize: 15),
        ),
      ],
    );
  }
}

class _ActiveSubscriptionCard extends StatelessWidget {
  const _ActiveSubscriptionCard({required this.subscription});

  final SubscriptionModel subscription;

  @override
  Widget build(BuildContext context) {
    return _Panel(
      color: const Color(0xFFECFDF5),
      borderColor: const Color(0xFFA7F3D0),
      child: Row(
        children: [
          const CircleAvatar(
            backgroundColor: Color(0xFFD1FAE5),
            child: Icon(Icons.check_rounded, color: Color(0xFF047857)),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '${_titleCase(subscription.planType)} plan is active',
                  style: const TextStyle(
                    color: Color(0xFF065F46),
                    fontWeight: FontWeight.w800,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  'Billed through ${subscription.platformLabel}.',
                  style: const TextStyle(color: Color(0xFF047857), fontSize: 13),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _TrialCard extends StatelessWidget {
  const _TrialCard();

  @override
  Widget build(BuildContext context) {
    return _Panel(
      color: Colors.white,
      child: Row(
        children: [
          const Icon(Icons.access_time_rounded, color: Color(0xFF2563EB), size: 28),
          const SizedBox(width: 12),
          const Expanded(
            child: Text(
              'Plans renew monthly. Choose the option that fits your support needs.',
              style: TextStyle(color: Color(0xFF374151), fontSize: 14),
            ),
          ),
        ],
      ),
    );
  }
}

class _PlanCard extends StatelessWidget {
  const _PlanCard({
    required this.plan,
    required this.product,
    required this.state,
  });

  final SubscriptionPlan plan;
  final dynamic product;
  final SubscriptionState state;

  @override
  Widget build(BuildContext context) {
    final available = product != null && state.canPurchase;
    final price = product?.price ?? '\$${plan.monthlyPrice.toStringAsFixed(2)}';
    return _Panel(
      color: Colors.white,
      borderColor: plan.popular ? const Color(0xFF8B5CF6) : const Color(0xFFE5E7EB),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  plan.name,
                  style: const TextStyle(
                    color: Color(0xFF111827),
                    fontSize: 20,
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ),
              if (plan.popular)
                const Chip(
                  label: Text('Popular'),
                  backgroundColor: Color(0xFFEDE9FE),
                  labelStyle: TextStyle(color: Color(0xFF6D28D9)),
                ),
            ],
          ),
          const SizedBox(height: 4),
          Text(plan.description, style: const TextStyle(color: Color(0xFF6B7280))),
          const SizedBox(height: 12),
          Text(
            '$price / month',
            style: const TextStyle(
              color: Color(0xFF111827),
              fontSize: 22,
              fontWeight: FontWeight.w800,
            ),
          ),
          const SizedBox(height: 10),
          ...plan.features.take(5).map(
                (feature) => Padding(
                  padding: const EdgeInsets.only(bottom: 5),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Icon(Icons.check_rounded, color: Color(0xFF16A34A), size: 18),
                      const SizedBox(width: 6),
                      Expanded(
                        child: Text(
                          feature,
                          style: const TextStyle(color: Color(0xFF4B5563), fontSize: 13),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
          const SizedBox(height: 10),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: available
                  ? () {
                      FirebaseAnalyticsService.instance
                          .logSubscriptionEvent('upgrade', plan.id);
                      context
                          .read<SubscriptionBloc>()
                          .add(PlanPurchaseRequested(plan.id));
                    }
                  : null,
              child: Text(
                state.busyPlanId == plan.id ? 'Processing…' : 'Subscribe',
              ),
            ),
          ),
          if (!available)
            const Padding(
              padding: EdgeInsets.only(top: 7),
              child: Text(
                'This plan is not available in the current store.',
                style: TextStyle(color: Color(0xFF6B7280), fontSize: 12),
              ),
            ),
        ],
      ),
    );
  }
}

class _ManageCard extends StatelessWidget {
  const _ManageCard({required this.state});

  final SubscriptionState state;

  @override
  Widget build(BuildContext context) {
    return _Panel(
      color: Colors.white,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Manage billing',
            style: TextStyle(color: Color(0xFF111827), fontSize: 18, fontWeight: FontWeight.w800),
          ),
          const SizedBox(height: 6),
          Text(
            'Renewals and cancellations are managed by ${state.subscription!.platformLabel}.',
            style: const TextStyle(color: Color(0xFF6B7280), fontSize: 13),
          ),
          const SizedBox(height: 12),
          SizedBox(
            width: double.infinity,
            child: OutlinedButton.icon(
              onPressed: () => context
                  .read<SubscriptionBloc>()
                  .add(const ManageSubscriptionRequested()),
              icon: const Icon(Icons.open_in_new_rounded),
              label: const Text('Open subscription settings'),
            ),
          ),
        ],
      ),
    );
  }
}

class _RestoreCard extends StatelessWidget {
  const _RestoreCard({required this.enabled, required this.onPressed});

  final bool enabled;
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    return _Panel(
      color: const Color(0xFFFFFBEB),
      borderColor: const Color(0xFFFDE68A),
      child: Row(
        children: [
          const Icon(Icons.restore_rounded, color: Color(0xFFB45309)),
          const SizedBox(width: 10),
          const Expanded(
            child: Text(
              'Already subscribed? Restore purchases from this store account.',
              style: TextStyle(color: Color(0xFF92400E), fontSize: 13),
            ),
          ),
          TextButton(onPressed: enabled ? onPressed : null, child: const Text('Restore')),
        ],
      ),
    );
  }
}

class _TermsCard extends StatelessWidget {
  const _TermsCard();

  @override
  Widget build(BuildContext context) {
    return _Panel(
      color: const Color(0xFFF9FAFB),
      child: const Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Subscription terms',
            style: TextStyle(color: Color(0xFF111827), fontWeight: FontWeight.w800),
          ),
          SizedBox(height: 8),
          Text(
            'Subscriptions renew automatically each month unless cancelled at least 24 hours before the end of the current period. Payment is charged to your Apple ID or Google Play account after confirmation. You can manage or cancel in your store account settings.',
            style: TextStyle(color: Color(0xFF6B7280), fontSize: 12, height: 1.45),
          ),
        ],
      ),
    );
  }
}

class _Panel extends StatelessWidget {
  const _Panel({required this.child, this.color = Colors.white, this.borderColor});

  final Widget child;
  final Color color;
  final Color? borderColor;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: color,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: borderColor ?? const Color(0xFFE5E7EB)),
        boxShadow: const [
          BoxShadow(color: Color(0x10000000), blurRadius: 8, offset: Offset(0, 3)),
        ],
      ),
      child: child,
    );
  }
}

class _SubscriptionError extends StatelessWidget {
  const _SubscriptionError({required this.message, required this.onRetry});

  final String message;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.cloud_off_rounded, color: Color(0xFFB91C1C), size: 42),
            const SizedBox(height: 12),
            Text(message, textAlign: TextAlign.center),
            const SizedBox(height: 14),
            OutlinedButton.icon(
              onPressed: onRetry,
              icon: const Icon(Icons.refresh_rounded),
              label: const Text('Try again'),
            ),
          ],
        ),
      ),
    );
  }
}

String _titleCase(String value) {
  if (value.isEmpty) return value;
  return '${value[0].toUpperCase()}${value.substring(1)}';
}