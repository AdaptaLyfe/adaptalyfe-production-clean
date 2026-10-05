import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:in_app_purchase/in_app_purchase.dart';
import 'package:url_launcher/url_launcher.dart';

import '../bloc/subscription_bloc.dart';
import '../bloc/subscription_event.dart';
import '../bloc/subscription_state.dart';
import '../models/subscription_models.dart';

class SubscriptionScreen extends StatefulWidget {
  const SubscriptionScreen({super.key});

  @override
  State<SubscriptionScreen> createState() => _SubscriptionScreenState();
}

class _SubscriptionScreenState extends State<SubscriptionScreen> {
  String? _selectedPlanId = subscriptionPlans.first.id;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      context.read<SubscriptionBloc>().add(const SubscriptionStarted());
    });
  }

  @override
  Widget build(BuildContext context) {
    return BlocListener<SubscriptionBloc, SubscriptionState>(
      listenWhen: (previous, current) =>
          (previous.actionMessage != current.actionMessage &&
              current.actionMessage != null) ||
          previous.managementUrl != current.managementUrl ||
          previous.shouldNavigateToDashboard !=
              current.shouldNavigateToDashboard,
      listener: (context, state) {
        if (state.actionMessage != null) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(state.actionMessage!)),
          );
        }
        final managementUrl = state.managementUrl;
        if (managementUrl != null) {
          unawaited(_openManagementPage(context, managementUrl));
        }
        if (state.shouldNavigateToDashboard) {
          context
              .read<SubscriptionBloc>()
              .add(const SubscriptionNavigationHandled());
          context.go('/home');
        }
      },
      child: Scaffold(
        appBar: AppBar(
          title: const Text('Plans'),
          actions: [
            IconButton(
              tooltip: 'Refresh subscription',
              onPressed: () => context
                  .read<SubscriptionBloc>()
                  .add(const SubscriptionStarted()),
              icon: const Icon(Icons.refresh_rounded),
            ),
          ],
        ),
        body: BlocBuilder<SubscriptionBloc, SubscriptionState>(
          builder: (context, state) {
            final subscription = state.subscription;
            final hasActiveSubscription = state.hasActiveSubscription;
            final trialDaysLeft = subscription?.trialDaysLeft ?? 0;
            final trialStatusText = state.isLoading && subscription == null
                ? 'Checking trial status…'
                : state.errorMessage != null && subscription == null
                    ? 'Trial status unavailable'
                    : subscription?.requiresStoreRecovery == true
                        ? 'Billing needs attention'
                        : trialDaysLeft > 0
                            ? 'Free trial: $trialDaysLeft ${trialDaysLeft == 1 ? 'day' : 'days'} remaining'
                            : 'Trial expired — Subscribe to continue';
            final trialIsPositive = trialDaysLeft > 0 &&
                subscription?.requiresStoreRecovery != true;
            return Container(
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  colors: [
                    Color(0xFFCFFAFE),
                    Color(0xFFF0FDFA),
                    Color(0xFFDBEAFE),
                  ],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
              ),
              child: RefreshIndicator(
                onRefresh: _refreshSubscription,
                child: ListView(
                  physics: const AlwaysScrollableScrollPhysics(),
                  padding: const EdgeInsets.fromLTRB(16, 24, 16, 32),
                  children: [
                    Center(
                      child: ConstrainedBox(
                        constraints: const BoxConstraints(maxWidth: 1160),
                        child: SizedBox(
                          width: double.infinity,
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.stretch,
                            children: [
                              Text(
                                hasActiveSubscription
                                    ? 'Manage Your Subscription'
                                    : 'Choose Your Plan',
                                textAlign: TextAlign.center,
                                style: const TextStyle(
                                  color: Color(0xFF111827),
                                  fontSize: 32,
                                  fontWeight: FontWeight.w800,
                                ),
                              ),
                              const SizedBox(height: 12),
                              Text(
                                hasActiveSubscription
                                    ? "You're subscribed to the ${_titleCase(subscription!.planType)} Plan. You can return to your dashboard."
                                    : "Unlock your full potential with Adaptalyfe's comprehensive features.",
                                textAlign: TextAlign.center,
                                style: const TextStyle(
                                  color: Color(0xFF4B5563),
                                  fontSize: 17,
                                ),
                              ),
                              if (hasActiveSubscription) ...[
                                const SizedBox(height: 16),
                                Center(
                                  child: FilledButton(
                                    onPressed: () => context.go('/home'),
                                    child: const Text('Go to Dashboard'),
                                  ),
                                ),
                              ],
                              if (!hasActiveSubscription) ...[
                                const SizedBox(height: 22),
                                const _ExplanationCard(),
                                const SizedBox(height: 16),
                                Center(
                                  child: _StatusBadge(
                                    text: trialStatusText,
                                    color: trialIsPositive
                                        ? const Color(0xFFDBEAFE)
                                        : const Color(0xFFFEE2E2),
                                    textColor: trialIsPositive
                                        ? const Color(0xFF1E40AF)
                                        : const Color(0xFF991B1B),
                                  ),
                                ),
                              ] else ...[
                                const SizedBox(height: 18),
                                Center(
                                  child: _StatusBadge(
                                    text:
                                        'Active ${_titleCase(subscription!.planType)} subscription',
                                    color: const Color(0xFFDCFCE7),
                                    textColor: const Color(0xFF166534),
                                  ),
                                ),
                              ],
                              const SizedBox(height: 16),
                              const Center(
                                child: _StatusBadge(
                                  text:
                                      'Monthly Subscription — auto-renewable, cancel anytime',
                                  color: Color(0xFFE5E7EB),
                                  textColor: Color(0xFF374151),
                                ),
                              ),
                              const SizedBox(height: 10),
                              const Text(
                                'Some features require an active subscription. All plans are auto-renewing monthly subscriptions.',
                                textAlign: TextAlign.center,
                                style: TextStyle(
                                  color: Color(0xFF4B5563),
                                  fontSize: 13,
                                  fontStyle: FontStyle.italic,
                                ),
                              ),
                              if (state.isLoading) ...[
                                const SizedBox(height: 18),
                                const LinearProgressIndicator(),
                              ],
                              if (state.errorMessage != null) ...[
                                const SizedBox(height: 16),
                                _MessageCard(
                                  icon: Icons.error_outline_rounded,
                                  message: state.errorMessage!,
                                  actionLabel: 'Try again',
                                  onAction: () => context
                                      .read<SubscriptionBloc>()
                                      .add(const SubscriptionStarted()),
                                ),
                              ],
                              if (subscription != null) ...[
                                const SizedBox(height: 18),
                                _CurrentPlanCard(subscription: subscription),
                              ],
                              if (state.availabilityMessage != null) ...[
                                const SizedBox(height: 16),
                                _MessageCard(
                                  icon: Icons.storefront_outlined,
                                  message: state.availabilityMessage!,
                                ),
                              ],
                              if (subscription?.isAccountTrial == true) ...[
                                const SizedBox(height: 12),
                                const _MessageCard(
                                  icon: Icons.info_outline_rounded,
                                  message:
                                      'Your free 7-day Adaptalyfe account trial provides Basic access. Starting a store subscription is separate and follows the price and terms shown by the store.',
                                ),
                              ],
                              if (state.purchaseNeedsVerification) ...[
                                const SizedBox(height: 12),
                                _MessageCard(
                                  icon: Icons.sync_rounded,
                                  message:
                                      'A store purchase still needs server verification. Retry the store restore to finish linking it to this account.',
                                  actionLabel: 'Retry verification',
                                  onAction: state.isBusy
                                      ? null
                                      : () => context
                                          .read<SubscriptionBloc>()
                                          .add(
                                            const RetryPurchaseVerificationRequested(),
                                          ),
                                ),
                              ],
                              if (state.purchasePending) ...[
                                const SizedBox(height: 12),
                                const _MessageCard(
                                  icon: Icons.hourglass_top_rounded,
                                  message:
                                      'Payment is still pending in the store. Adaptalyfe will update access after the store confirms it.',
                                ),
                              ],
                              if (state.availabilityMessage != null ||
                                  state.errorMessage != null ||
                                  state.actionMessage != null) ...[
                                const SizedBox(height: 18),
                              ] else
                                const SizedBox(height: 22),
                              LayoutBuilder(
                                builder: (context, constraints) {
                                  final columns = constraints.maxWidth >= 768
                                      ? 3
                                      : constraints.maxWidth >= 600
                                          ? 2
                                          : 1;
                                  const gap = 16.0;
                                  final cardWidth =
                                      (constraints.maxWidth -
                                              (columns - 1) * gap) /
                                          columns;
                                  return Wrap(
                                    spacing: gap,
                                    runSpacing: gap,
                                    children: [
                                      for (final plan in state.plans)
                                        SizedBox(
                                          width: cardWidth,
                                          child: _PlanCard(
                                            plan: plan,
                                            product:
                                                state.products[plan.productId],
                                            state: state,
                                            selectedPlanId:
                                                _selectedPlanId ?? '',
                                            selected:
                                                _selectedPlanId == plan.id,
                                            onSelect: () => setState(
                                              () => _selectedPlanId = plan.id,
                                            ),
                                            onPurchase: () => context
                                                .read<SubscriptionBloc>()
                                                .add(PlanPurchaseRequested(
                                                  plan.id,
                                                )),
                                          ),
                                        ),
                                    ],
                                  );
                                },
                              ),
                              if (!hasActiveSubscription) ...[
                                const SizedBox(height: 20),
                                Center(
                                  child: OutlinedButton.icon(
                                    onPressed: !state.storeAvailable ||
                                            state.isBusy ||
                                            state.isLoading
                                        ? null
                                        : () => context
                                            .read<SubscriptionBloc>()
                                            .add(
                                              const RestorePurchasesRequested(),
                                            ),
                                    icon: state.status ==
                                            SubscriptionStatus.restoring
                                        ? const SizedBox(
                                            width: 18,
                                            height: 18,
                                            child: CircularProgressIndicator(
                                              strokeWidth: 2,
                                            ),
                                          )
                                        : const Icon(Icons.restore_rounded),
                                    label: Text(
                                      state.status ==
                                              SubscriptionStatus.restoring
                                          ? 'Restoring…'
                                          : 'Restore Previous Purchase',
                                    ),
                                  ),
                                ),
                                const SizedBox(height: 8),
                                Text(
                                  'Already subscribed? Restore your ${defaultTargetPlatform == TargetPlatform.iOS ? 'App Store' : 'Google Play'} subscription here.',
                                  textAlign: TextAlign.center,
                                  style: const TextStyle(
                                    color: Color(0xFF6B7280),
                                    fontSize: 13,
                                  ),
                                ),
                              ],
                              const SizedBox(height: 22),
                              Text(
                                'Subscriptions renew automatically until cancelled. Manage or cancel them from the store account used to subscribe. An active plan from another platform works here too; you will not be asked to buy it again.',
                                textAlign: TextAlign.center,
                                style: Theme.of(context).textTheme.bodySmall,
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            );
          },
        ),
      ),
    );
  }

  Future<void> _refreshSubscription() async {
    final bloc = context.read<SubscriptionBloc>();
    bloc.add(const SubscriptionStarted());
    await bloc.stream.firstWhere(
      (state) =>
          (state.status == SubscriptionStatus.ready ||
              state.status == SubscriptionStatus.notAvailable ||
              state.status == SubscriptionStatus.failure ||
              state.status == SubscriptionStatus.configurationError) &&
          !state.isBusy,
    );
  }

  Future<void> _openManagementPage(
    BuildContext context,
    String url,
  ) async {
    final uri = Uri.tryParse(url);
    var opened = false;
    try {
      opened = uri != null &&
          await launchUrl(uri, mode: LaunchMode.externalApplication);
    } catch (_) {
      opened = false;
    }
    if (!opened && context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Could not open the subscription management page.'),
        ),
      );
    }
    if (context.mounted) {
      context
          .read<SubscriptionBloc>()
          .add(const ManagementUrlHandled());
    }
  }
}

class _CurrentPlanCard extends StatelessWidget {
  const _CurrentPlanCard({required this.subscription});

  final SubscriptionModel subscription;

  @override
  Widget build(BuildContext context) {
    final title = subscription.isAccountTrial
        ? 'Free 7-day Basic trial'
        : '${_titleCase(subscription.planType)} plan';
    final status = _subscriptionStatusMessage(subscription);
    final canManage =
        !subscription.isAccountTrial &&
        (subscription.grantsAccess ||
            (subscription.usesStoreBilling &&
                !subscription.isExpired &&
                !subscription.isRevoked));

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(18),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(Icons.verified_user_outlined),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    title,
                    style: Theme.of(context).textTheme.titleLarge,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Text(status),
            if (subscription.isAccountTrial &&
                subscription.trialDaysLeft != null)
              Padding(
                padding: const EdgeInsets.only(top: 4),
                child: Text(
                  '${subscription.trialDaysLeft} trial days remaining.',
                ),
              ),
            if (!subscription.isAccountTrial &&
                subscription.subscriptionPlatform != null) ...[
              const SizedBox(height: 4),
              Text('Billed through ${subscription.platformLabel}.'),
            ],
            if (canManage) ...[
              const SizedBox(height: 14),
              OutlinedButton.icon(
                onPressed: () => context
                    .read<SubscriptionBloc>()
                    .add(const ManageSubscriptionRequested()),
                icon: const Icon(Icons.open_in_new_rounded),
                label: const Text('Manage subscription'),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _PlanCard extends StatelessWidget {
  const _PlanCard({
    required this.plan,
    required this.product,
    required this.state,
    required this.selectedPlanId,
    required this.selected,
    required this.onSelect,
    required this.onPurchase,
  });

  final SubscriptionPlan plan;
  final ProductDetails? product;
  final SubscriptionState state;
  final String selectedPlanId;
  final bool selected;
  final VoidCallback onSelect;
  final VoidCallback onPurchase;

  @override
  Widget build(BuildContext context) {
    final active = state.hasActiveSubscription;
    final isCurrent = active &&
        state.subscription?.planType.toLowerCase() == plan.id.toLowerCase();
    final selectable = !active &&
        !state.requiresStoreRecovery &&
        !state.purchaseNeedsVerification &&
        !state.purchasePending &&
        !state.isBusy;
    final priceLabel = product != null
        ? '${product!.price} / month'
        : state.isLoading
            ? 'Loading store price…'
            : 'Store price unavailable';
    final purchaseEnabled =
        state.canPurchase && product != null && !state.isBusy;
    final purchaseLabel = active
        ? isCurrent
            ? 'Current Plan'
            : 'Subscription Already Active'
        : state.requiresStoreRecovery
            ? 'Fix billing with ${state.subscription?.subscriptionPlatform == 'app_store' ? 'Apple' : 'Google Play'}'
            : state.purchaseNeedsVerification
                ? 'Verifying purchase…'
                : state.purchasePending
                    ? 'Store payment pending'
                    : state.isBusy && state.busyPlanId == plan.id
                        ? 'Setting up…'
                        : state.isLoading && product == null
                            ? 'Loading price…'
                            : !state.storeAvailable
                                ? state.isLoading
                                    ? 'Checking store…'
                                    : 'Subscriptions unavailable'
                                : product == null
                                    ? 'Unavailable in store'
                                    : defaultTargetPlatform ==
                                            TargetPlatform.iOS
                                        ? 'Subscribe via App Store'
                                        : defaultTargetPlatform ==
                                                TargetPlatform.android
                                            ? 'Subscribe via Google Play'
                                            : 'Subscribe';

    return Card(
      key: ValueKey('subscription-plan-${plan.id}'),
      color: selected
          ? const Color(0xFFEFF6FF)
          : active && isCurrent
              ? const Color(0xFFF0FDF4)
              : Colors.white,
      elevation: plan.popular ? 4 : 1,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(18),
        side: BorderSide(
          color: selected
              ? const Color(0xFF2563EB)
              : plan.popular
                  ? const Color(0xFF3B82F6)
                  : const Color(0xFFE5E7EB),
          width: selected || plan.popular ? 2 : 1,
        ),
      ),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: selectable ? onSelect : null,
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              if (plan.popular)
                const Align(
                  alignment: Alignment.topCenter,
                  child: _StatusBadge(
                    text: '★ Most Popular',
                    color: Color(0xFF3B82F6),
                    textColor: Colors.white,
                  ),
                ),
              const SizedBox(height: 8),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    switch (plan.id) {
                      'basic' => Icons.bolt_rounded,
                      'premium' => Icons.star_rounded,
                      'family' => Icons.groups_rounded,
                      _ => Icons.check_circle_outline_rounded,
                    },
                    color: const Color(0xFF2563EB),
                    size: 22,
                  ),
                  const SizedBox(width: 8),
                  Flexible(
                    child: Text(
                      plan.name,
                      textAlign: TextAlign.center,
                      style: const TextStyle(
                        color: Color(0xFF111827),
                        fontSize: 20,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 6),
              Text(
                plan.description,
                textAlign: TextAlign.center,
                style: const TextStyle(
                  color: Color(0xFF6B7280),
                  fontSize: 13,
                ),
              ),
              const SizedBox(height: 14),
              Text(
                priceLabel,
                textAlign: TextAlign.center,
                style: const TextStyle(
                  color: Color(0xFF111827),
                  fontSize: 25,
                  fontWeight: FontWeight.w800,
                ),
              ),
              const SizedBox(height: 14),
              for (final feature in plan.features)
                Padding(
                  padding: const EdgeInsets.symmetric(vertical: 4),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Icon(
                        Icons.check_circle_rounded,
                        color: Color(0xFF22C55E),
                        size: 18,
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          feature,
                          style: const TextStyle(
                            color: Color(0xFF4B5563),
                            fontSize: 13,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              const SizedBox(height: 14),
              if (selectable)
                RadioListTile<String>(
                  contentPadding: EdgeInsets.zero,
                  visualDensity: VisualDensity.compact,
                  title: Text(selected ? 'Selected' : 'Select this plan'),
                  value: plan.id,
                  groupValue: selectedPlanId,
                  onChanged: (_) => onSelect(),
                )
              else if (active && !isCurrent)
                const Padding(
                  padding: EdgeInsets.only(bottom: 12),
                  child: Text(
                    'Manage your active plan through its billing provider to change tiers.',
                    style: TextStyle(color: Color(0xFF6B7280), fontSize: 12),
                  ),
                ),
              SizedBox(
                width: double.infinity,
                child: plan.popular
                    ? FilledButton(
                        onPressed: purchaseEnabled
                            ? () {
                                onSelect();
                                onPurchase();
                              }
                            : null,
                        child: Text(purchaseLabel),
                      )
                    : OutlinedButton(
                        onPressed: purchaseEnabled
                            ? () {
                                onSelect();
                                onPurchase();
                              }
                            : null,
                        child: Text(purchaseLabel),
                      ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _ExplanationCard extends StatelessWidget {
  const _ExplanationCard();

  @override
  Widget build(BuildContext context) {
    return Card(
      color: Colors.white,
      elevation: 1,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(18),
        side: const BorderSide(color: Color(0xFFCCFBF1)),
      ),
      child: const Padding(
        padding: EdgeInsets.all(18),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            CircleAvatar(
              backgroundColor: Color(0xFFCCFBF1),
              child: Icon(Icons.info_outline_rounded, color: Color(0xFF0F766E)),
            ),
            SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Get full access to Adaptalyfe',
                    style: TextStyle(
                      color: Color(0xFF111827),
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  SizedBox(height: 5),
                  Text(
                    'Adaptalyfe helps with daily tasks, finances, mood tracking, appointments, and connecting with your support network. Choose a plan to unlock its features. Subscriptions are billed monthly through your app store and can be cancelled in your device settings.',
                    style: TextStyle(
                      color: Color(0xFF4B5563),
                      fontSize: 13,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _StatusBadge extends StatelessWidget {
  const _StatusBadge({
    required this.text,
    required this.color,
    required this.textColor,
  });

  final String text;
  final Color color;
  final Color textColor;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 9),
      decoration: BoxDecoration(
        color: color,
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: textColor.withValues(alpha: 0.12)),
      ),
      child: Text(
        text,
        textAlign: TextAlign.center,
        style: TextStyle(
          color: textColor,
          fontSize: 13,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }
}

class _MessageCard extends StatelessWidget {
  const _MessageCard({
    required this.icon,
    required this.message,
    this.actionLabel,
    this.onAction,
  });

  final IconData icon;
  final String message;
  final String? actionLabel;
  final VoidCallback? onAction;

  @override
  Widget build(BuildContext context) {
    return Card(
      color: Theme.of(context).colorScheme.surfaceContainerHighest,
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(icon),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(message),
                  if (actionLabel != null) ...[
                    const SizedBox(height: 8),
                    TextButton(
                      onPressed: onAction,
                      child: Text(actionLabel!),
                    ),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

String _titleCase(String value) {
  if (value.isEmpty) return value;
  return '${value[0].toUpperCase()}${value.substring(1).toLowerCase()}';
}

String _subscriptionStatusMessage(SubscriptionModel subscription) {
  if (subscription.isAccountTrial) {
    return 'Your account trial includes Basic access.';
  }
  if (subscription.isCancelled) {
    return 'Cancelled — access remains until '
        '${_formatDate(subscription.currentPeriodEnd)}.';
  }
  if (subscription.isInGracePeriod) {
    return 'Payment failed. Google Play grace-period access continues until '
        '${_formatDate(subscription.currentPeriodEnd)}.';
  }
  if (subscription.isOnHold) {
    return 'Payment failed and the account is on hold. Access resumes after '
        'you fix billing with the app store.';
  }
  if (subscription.isPaymentFailed) {
    return 'Payment failed. Update your payment method with '
        '${subscription.platformLabel} to restore access.';
  }
  if (subscription.isPaused) {
    return 'The subscription is paused. Resume it in the app store to '
        'restore paid access.';
  }
  if (subscription.isPending) {
    return 'The store is still processing this subscription. Access starts '
        'after confirmation.';
  }
  if (subscription.isRevoked) {
    return 'This subscription was revoked and no longer grants paid access.';
  }
  if (subscription.isExpired) {
    return 'This subscription has expired. Choose a plan below to subscribe again.';
  }
  if (subscription.isTrialing && subscription.usesStoreBilling) {
    return 'Your store trial is active through '
        '${_formatDate(subscription.currentPeriodEnd)}.';
  }
  if (subscription.grantsAccess && subscription.autoRenew == true) {
    return 'Active and set to renew on '
        '${_formatDate(subscription.currentPeriodEnd)}.';
  }
  if (subscription.grantsAccess) {
    return 'Active through ${_formatDate(subscription.currentPeriodEnd)}.';
  }
  return 'No active paid plan.';
}

String _formatDate(DateTime? value) {
  if (value == null) return 'the end of the current billing period';
  return '${value.year}-${value.month.toString().padLeft(2, '0')}-${value.day.toString().padLeft(2, '0')}';
}