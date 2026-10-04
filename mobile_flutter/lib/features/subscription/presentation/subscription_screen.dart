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

class SubscriptionScreen extends StatelessWidget {
  const SubscriptionScreen({super.key});

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
                    onPurchase: () => context
                        .read<SubscriptionBloc>()
                        .add(PlanPurchaseRequested(plan.id)),
                    onManage: () => context
                        .read<SubscriptionBloc>()
                        .add(const ManageSubscriptionRequested()),
                  ),
                  const SizedBox(height: 14),
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
        ? 'Account trial'
        : '${_titleCase(subscription.planType)} plan';
    final status = subscription.isAccountTrial
        ? 'Your Adaptalyfe account trial is active.'
        : subscription.isCancelled
            ? 'Cancelled — access remains until the current period ends.'
            : subscription.isInGracePeriod
                ? 'Payment is in a grace period.'
                : subscription.grantsAccess
                    ? 'Active through ${_formatDate(subscription.currentPeriodEnd)}.'
                    : 'No active paid plan.';

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
            if (subscription.subscriptionPlatform != null) ...[
              const SizedBox(height: 4),
              Text('Billed through ${subscription.platformLabel}.'),
            ],
            if (subscription.grantsAccess &&
                !subscription.isAccountTrial) ...[
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
    required this.onPurchase,
    required this.onManage,
  });

  final SubscriptionPlan plan;
  final ProductDetails? product;
  final SubscriptionState state;
  final VoidCallback onPurchase;
  final VoidCallback onManage;

  @override
  Widget build(BuildContext context) {
    final active = state.hasActiveSubscription;
    final isCurrent = active &&
        state.subscription?.planType.toLowerCase() == plan.id.toLowerCase();
    final isBusy = state.status == SubscriptionStatus.purchasing &&
        state.busyPlanId == plan.id;
    final priceLabel =
        product == null ? 'Store price unavailable' : '${product.price} / month';

    return Card(
      clipBehavior: Clip.antiAlias,
      child: Padding(
        padding: const EdgeInsets.all(18),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
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
                        ],
                      ),
                      const SizedBox(height: 4),
                      Text(plan.description),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 14),
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
            const SizedBox(height: 16),
            if (active)
              SizedBox(
                width: double.infinity,
                child: isCurrent
                    ? OutlinedButton(
                        onPressed: onManage,
                        child: const Text('Current plan · manage'),
                      )
                    : OutlinedButton(
                        onPressed: onManage,
                        child: const Text('Manage current plan to change'),
                      ),
              )
            else
              SizedBox(
                width: double.infinity,
                child: FilledButton(
                  onPressed: product != null &&
                          state.canPurchase &&
                          !state.isBusy
                      ? onPurchase
                      : null,
                  child: isBusy
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : Text(product == null ? 'Not available' : 'Subscribe'),
                ),
              ),
          ],
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

String _formatDate(DateTime? value) {
  if (value == null) return 'the end of the current billing period';
  return '${value.year}-${value.month.toString().padLeft(2, '0')}-${value.day.toString().padLeft(2, '0')}';
}