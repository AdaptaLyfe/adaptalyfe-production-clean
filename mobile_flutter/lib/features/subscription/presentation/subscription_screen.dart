import 'dart:async';

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
                  .add(const RefreshSubscription()),
              icon: const Icon(Icons.refresh_rounded),
            ),
          ],
        ),
        body: BlocBuilder<SubscriptionBloc, SubscriptionState>(
          builder: (context, state) {
            if (state.isLoading && state.subscription == null) {
              return const Center(child: CircularProgressIndicator());
            }

            final subscription = state.subscription;
            final selectedPlan = state.plans.firstWhere(
              (plan) => plan.id == _selectedPlanId,
              orElse: () => state.plans.first,
            );
            final selectedProduct = state.products[selectedPlan.productId];
            return ListView(
              padding: const EdgeInsets.fromLTRB(20, 12, 20, 32),
              children: [
                Text(
                  'Choose the support that fits your routine.',
                  style: Theme.of(context).textTheme.headlineSmall,
                ),
                const SizedBox(height: 8),
                Text(
                  'Plans are billed monthly through the app store. The store shows the exact price and terms before you confirm.',
                  style: Theme.of(context).textTheme.bodyMedium,
                ),
                if (state.errorMessage != null) ...[
                  const SizedBox(height: 16),
                  _MessageCard(
                    icon: Icons.info_outline_rounded,
                    message: state.errorMessage!,
                    actionLabel: 'Try again',
                    onAction: () => context
                        .read<SubscriptionBloc>()
                        .add(const RefreshSubscription()),
                  ),
                ],
                if (subscription != null) ...[
                  const SizedBox(height: 20),
                  _CurrentPlanCard(subscription: subscription),
                ],
                if (state.availabilityMessage != null) ...[
                  const SizedBox(height: 16),
                  _MessageCard(
                    icon: Icons.storefront_outlined,
                    message: state.availabilityMessage!,
                  ),
                ],
                const SizedBox(height: 22),
                for (final plan in state.plans) ...[
                  _PlanCard(
                    plan: plan,
                    product: state.products[plan.productId],
                    state: state,
                    selectedPlanId: _selectedPlanId ?? '',
                    selected: _selectedPlanId == plan.id,
                    onSelect: () => setState(() => _selectedPlanId = plan.id),
                  ),
                  const SizedBox(height: 14),
                ],
                if (state.subscription?.isAccountTrial == true) ...[
                  const SizedBox(height: 2),
                  const _MessageCard(
                    icon: Icons.info_outline_rounded,
                    message:
                        'Your free 7-day Adaptalyfe account trial provides Basic access. Starting a store subscription is separate and begins at the price shown above.',
                  ),
                  const SizedBox(height: 12),
                ],
                if (!state.hasActiveSubscription &&
                    !state.requiresStoreRecovery) ...[
                  if (selectedProduct != null)
                    Padding(
                      padding: const EdgeInsets.only(bottom: 8),
                      child: Text(
                        '${selectedPlan.name}: ${selectedProduct.price} per month',
                        textAlign: TextAlign.center,
                        style: Theme.of(context).textTheme.titleSmall,
                      ),
                    ),
                  SizedBox(
                    width: double.infinity,
                    child: FilledButton(
                      onPressed: state.canPurchase &&
                              !state.isBusy &&
                              selectedProduct != null
                          ? () => context.read<SubscriptionBloc>().add(
                                PlanPurchaseRequested(
                                  _selectedPlanId ?? subscriptionPlans.first.id,
                                ),
                              )
                          : null,
                      child: Text(
                        state.status == SubscriptionStatus.purchasing
                            ? 'Opening store…'
                            : state.storeAvailable
                                ? 'Continue to checkout'
                                : 'Subscriptions unavailable',
                      ),
                    ),
                  ),
                  if (state.storeAvailable &&
                      selectedProduct == null &&
                      state.status != SubscriptionStatus.loading)
                    const Padding(
                      padding: EdgeInsets.only(top: 8),
                      child: Text(
                        'This plan is not currently available from the app store.',
                        textAlign: TextAlign.center,
                      ),
                    ),
                  const SizedBox(height: 12),
                ],
                if (state.purchaseNeedsVerification) ...[
                  const SizedBox(height: 4),
                  _MessageCard(
                    icon: Icons.sync_rounded,
                    message:
                        'A store purchase still needs server verification. Retry the store restore to finish linking it to this account.',
                    actionLabel: 'Retry verification',
                    onAction: state.isBusy
                        ? null
                        : () => context.read<SubscriptionBloc>().add(
                              const RetryPurchaseVerificationRequested(),
                            ),
                  ),
                ],
                if (state.purchasePending) ...[
                  const SizedBox(height: 4),
                  const _MessageCard(
                    icon: Icons.hourglass_top_rounded,
                    message:
                        'Payment is still pending in the store. Adaptalyfe will update access after the store confirms it.',
                  ),
                ],
                const SizedBox(height: 12),
                OutlinedButton.icon(
                  onPressed: !state.storeAvailable || state.isBusy
                      ? null
                      : () => context
                          .read<SubscriptionBloc>()
                          .add(const RestorePurchasesRequested()),
                  icon: state.status == SubscriptionStatus.restoring
                      ? const SizedBox(
                          width: 18,
                          height: 18,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : const Icon(Icons.restore_rounded),
                  label: const Text('Restore purchases'),
                ),
                const SizedBox(height: 14),
                Text(
                  'Subscriptions renew automatically until cancelled. You can manage or cancel them from the store account used to subscribe. A plan already active on another platform works here too; you will not be asked to buy it again.',
                  style: Theme.of(context).textTheme.bodySmall,
                  textAlign: TextAlign.center,
                ),
              ],
            );
          },
        ),
      ),
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
  });

  final SubscriptionPlan plan;
  final ProductDetails? product;
  final SubscriptionState state;
  final String selectedPlanId;
  final bool selected;
  final VoidCallback onSelect;

  @override
  Widget build(BuildContext context) {
    final active = state.hasActiveSubscription;
    final isCurrent = active &&
        state.subscription?.planType.toLowerCase() == plan.id.toLowerCase();
    final priceLabel =
        product == null ? 'Store price unavailable' : '${product.price} / month';

    return Card(
      color: selected ? Theme.of(context).colorScheme.primaryContainer : null,
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: state.canSelectPlan ? onSelect : null,
        child: Padding(
          padding: const EdgeInsets.all(18),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Radio<String>(
                    value: plan.id,
                    groupValue: selectedPlanId,
                    onChanged:
                        state.canSelectPlan ? (_) => onSelect() : null,
                  ),
                  const SizedBox(width: 4),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Flexible(
                              child: Text(
                                plan.name,
                                style: Theme.of(context).textTheme.titleLarge,
                              ),
                            ),
                            if (plan.popular) ...[
                              const SizedBox(width: 8),
                              const Chip(
                                label: Text('Popular'),
                                visualDensity: VisualDensity.compact,
                              ),
                            ],
                            if (isCurrent) ...[
                              const SizedBox(width: 8),
                              const Chip(
                                label: Text('Current'),
                                visualDensity: VisualDensity.compact,
                              ),
                            ],
                          ],
                        ),
                        const SizedBox(height: 4),
                        Text(plan.description),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Text(priceLabel, style: Theme.of(context).textTheme.titleMedium),
              const SizedBox(height: 12),
              for (final feature in plan.features)
                Padding(
                  padding: const EdgeInsets.symmetric(vertical: 3),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Icon(Icons.check_rounded, size: 18),
                      const SizedBox(width: 8),
                      Expanded(child: Text(feature)),
                    ],
                  ),
                ),
              const SizedBox(height: 10),
              Text(
                state.canSelectPlan
                    ? selected
                        ? 'Selected'
                        : 'Tap to select this plan'
                    : active && !isCurrent
                        ? 'Manage your active plan through its billing provider to change tiers.'
                        : '',
                style: Theme.of(context).textTheme.bodySmall,
              ),
            ],
          ),
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