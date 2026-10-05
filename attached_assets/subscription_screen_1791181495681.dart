import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../core/analytics/firebase_analytics_service.dart';
import '../../../core/layout/responsive.dart';
import '../../auth/bloc/auth_bloc.dart';
import '../../auth/bloc/auth_event.dart';
import '../bloc/subscription_bloc.dart';
import '../bloc/subscription_event.dart';
import '../bloc/subscription_state.dart';
import '../data/stripe_payment_service.dart';
import '../data/subscription_platform_policy.dart';
import '../models/subscription_models.dart';

class SubscriptionScreen extends StatefulWidget {
  const SubscriptionScreen({super.key});

  @override
  State<SubscriptionScreen> createState() => _SubscriptionScreenState();
}

class _SubscriptionScreenState extends State<SubscriptionScreen>
    with WidgetsBindingObserver {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed && mounted) {
      context.read<SubscriptionBloc>().add(const RefreshSubscription());
    }
  }

  @override
  Widget build(BuildContext context) {
    return BlocListener<SubscriptionBloc, SubscriptionState>(
      listenWhen: (previous, current) =>
          (current.managementUrl != null &&
              previous.managementUrl != current.managementUrl) ||
          previous.sessionInvalid != current.sessionInvalid ||
          previous.errorMessage != current.errorMessage ||
          previous.actionMessage != current.actionMessage ||
          previous.subscription != current.subscription ||
          (!previous.shouldRefreshAuthentication &&
              current.shouldRefreshAuthentication) ||
          (!previous.shouldNavigateToDashboard &&
              current.shouldNavigateToDashboard),
      listener: (context, state) async {
        if (state.sessionInvalid) {
          if (context.mounted) context.go('/login');
          return;
        }
        if (state.shouldRefreshAuthentication) {
          context.read<AuthBloc>().add(const RefreshAuthentication());
          context
              .read<SubscriptionBloc>()
              .add(const SubscriptionAuthenticationRefreshHandled());
        }
        final url = state.managementUrl;
        if (url != null) {
          await launchUrl(
            Uri.parse(url),
            mode: LaunchMode.externalApplication,
          );
          if (context.mounted) {
            context
                .read<SubscriptionBloc>()
                .add(const ManagementUrlHandled());
          }
        }
        final message = state.errorMessage ?? state.actionMessage;
        if (message != null && context.mounted) {
          ScaffoldMessenger.of(context)
            ..hideCurrentSnackBar()
            ..showSnackBar(SnackBar(content: Text(message)));
        }

        if (state.shouldNavigateToDashboard) {
          Future<void>.delayed(const Duration(milliseconds: 1500), () {
            if (!context.mounted) return;
            final bloc = context.read<SubscriptionBloc>();
            if (!bloc.state.shouldNavigateToDashboard) return;
            bloc.add(const SubscriptionNavigationHandled());
            context.go('/dashboard');
          });
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
               padding: AppResponsive.pagePadding(context).copyWith(
                 top: 20,
                 bottom: 32,
               ),
              children: [
                _SubscriptionHeader(subscription: state.subscription),
                if (state.actionMessage != null) ...[
                  const SizedBox(height: 14),
                  _SubscriptionNotice(
                    message: state.actionMessage!,
                    isError: false,
                  ),
                ],
                if (state.purchaseVerificationPending) ...[
                  const SizedBox(height: 10),
                  _SubscriptionNotice(
                    message: 'A payment was received, but the matching plan '
                        'is not active yet. Pull to refresh or restore with the '
                        'original store. Do not pay again.',
                    isError: true,
                  ),
                ] else if (state.errorMessage != null) ...[
                  const SizedBox(height: 10),
                  _SubscriptionNotice(
                    message: state.errorMessage!,
                    isError: true,
                  ),
                ],
                if (!state.hasActiveSubscription &&
                    !state.requiresBillingRecovery &&
                    !state.purchaseVerificationPending &&
                    !state.isBusy) ...[
                  const SizedBox(height: 14),
                  _StripeRecoveryCard(
                    enabled: !state.isBusy,
                    onPressed: () {
                      context
                          .read<SubscriptionBloc>()
                          .add(const RecoverSubscriptionRequested());
                    },
                  ),
                ],
                const SizedBox(height: 16),
                if (state.hasActiveSubscription)
                  _ActiveSubscriptionCard(subscription: state.subscription!)
                else
                  _TrialCard(subscription: state.subscription),
                const SizedBox(height: 20),
                if (state.status == SubscriptionStatus.purchasing ||
                    state.status == SubscriptionStatus.restoring ||
                    state.status == SubscriptionStatus.recovering)
                  const Padding(
                    padding: EdgeInsets.only(bottom: 16),
                    child: LinearProgressIndicator(),
                  ),
                if (state.hasActiveSubscription ||
                    state.requiresBillingRecovery)
                  _ManageCard(state: state)
                else
                  ...state.plans.map(
                    (plan) => Padding(
                      padding: const EdgeInsets.only(bottom: 14),
                      child: _PlanCard(
                        plan: plan,
                        product: state.products[plan.productId],
                        state: state,
                        selected: state.selectedPlanId == plan.id,
                        onSelect: () => context
                            .read<SubscriptionBloc>()
                            .add(PlanSelected(plan.id)),
                        onPurchase: () => context
                            .read<SubscriptionBloc>()
                            .add(PlanPurchaseRequested(plan.id)),
                      ),
                    ),
                  ),
                const SizedBox(height: 4),
                if (usesNativeStoreBilling) ...[
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
                ],
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
    final active = subscription?.hasPlanEntitlement == true;
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
    final needsAttention =
        subscription.isCancelled || subscription.isInGracePeriod;
    final title = subscription.isCancelled
        ? 'Renewal cancelled'
        : subscription.isInGracePeriod
            ? 'Payment needs attention'
            : subscription.isTrialing
                ? '${_titleCase(subscription.planType)} trial active'
                : '${_titleCase(subscription.planType)} plan is active';

    return _Panel(
      color: needsAttention ? const Color(0xFFFFFBEB) : const Color(0xFFECFDF5),
      borderColor:
          needsAttention ? const Color(0xFFFDE68A) : const Color(0xFFA7F3D0),
      child: Row(
        children: [
          CircleAvatar(
            backgroundColor:
                needsAttention ? const Color(0xFFFEF3C7) : const Color(0xFFD1FAE5),
            child: Icon(
              needsAttention
                  ? Icons.warning_amber_rounded
                  : Icons.check_rounded,
              color: needsAttention
                  ? const Color(0xFFB45309)
                  : const Color(0xFF047857),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    color: Color(0xFF111827),
                    fontWeight: FontWeight.w800,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  _subscriptionLifecycleMessage(subscription),
                  style: const TextStyle(color: Color(0xFF4B5563), fontSize: 13),
                ),
                if (subscription.subscriptionPlatform != null) ...[
                  const SizedBox(height: 4),
                  Text(
                    'Billed through ${subscription.platformLabel}.',
                    style: const TextStyle(
                      color: Color(0xFF6B7280),
                      fontSize: 12,
                    ),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _SubscriptionNotice extends StatelessWidget {
  const _SubscriptionNotice({
    required this.message,
    required this.isError,
  });

  final String message;
  final bool isError;

  @override
  Widget build(BuildContext context) {
    final color = isError ? const Color(0xFFB91C1C) : const Color(0xFF1D4ED8);
    return Semantics(
      liveRegion: true,
      child: _Panel(
        color: isError ? const Color(0xFFFEF2F2) : const Color(0xFFEFF6FF),
        borderColor: isError ? const Color(0xFFFECACA) : const Color(0xFFBFDBFE),
        child: Row(
          children: [
            Icon(
              isError ? Icons.error_outline_rounded : Icons.info_outline_rounded,
              color: color,
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Text(
                message,
                style: TextStyle(color: color, fontSize: 13),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _TrialCard extends StatelessWidget {
  const _TrialCard({required this.subscription});

  final SubscriptionModel? subscription;

  @override
  Widget build(BuildContext context) {
    final daysLeft = subscription?.trialDaysLeft;
    final String message;
    if (subscription?.isAccountTrial == true) {
      if (daysLeft != null && daysLeft > 0) {
        message = 'Your free 7-day Basic account trial has $daysLeft '
            '${daysLeft == 1 ? 'day' : 'days'} remaining. '
            'Basic access continues during the trial. Store billing is separate; '
            'review the price and start date shown by the store before confirming.';
      } else {
        message = 'Your free 7-day Basic account trial is ending. '
            'Review the store price and start date before choosing a paid plan.';
      }
    } else if (subscription?.requiresBillingRecovery == true ||
        subscription?.isRevoked == true ||
        subscription?.isCancelled == true ||
        subscription?.isInGracePeriod == true) {
      message = _subscriptionLifecycleMessage(subscription!);
    } else if (subscription?.isExpired == true) {
      message = 'Your previous subscription has ended. Choose a plan to restart.';
    } else if (subscription?.isTrialing == true) {
      message = _subscriptionLifecycleMessage(subscription!);
    } else {
      message =
          'Plans renew monthly. Choose the option that fits your support needs.';
    }
    final needsAttention = subscription?.requiresBillingRecovery == true ||
        subscription?.isRevoked == true ||
        subscription?.isExpired == true;
    return _Panel(
      color: needsAttention ? const Color(0xFFFFFBEB) : Colors.white,
      borderColor: needsAttention ? const Color(0xFFFDE68A) : null,
      child: Row(
        children: [
          Icon(
            needsAttention ? Icons.warning_amber_rounded : Icons.access_time_rounded,
            color: needsAttention ? const Color(0xFFB45309) : const Color(0xFF2563EB),
            size: 28,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              message,
              style: const TextStyle(color: Color(0xFF374151), fontSize: 14),
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
    required this.selected,
    required this.onSelect,
    required this.onPurchase,
  });

  final SubscriptionPlan plan;
  final dynamic product;
  final SubscriptionState state;
  final bool selected;
  final VoidCallback onSelect;
  final VoidCallback onPurchase;

  @override
  Widget build(BuildContext context) {
    final storeProductAvailable =
        usesNativeStoreBilling && product != null;
    final stripeAvailable =
        !usesNativeStoreBilling && state.canUseStripe;
    final selectable = state.canSelectPlan;
    final storePrice = product?.price;
    final price = storePrice is String && storePrice.trim().isNotEmpty
        ? storePrice
        : usesNativeStoreBilling
            ? null
            : '\$${plan.monthlyPrice.toStringAsFixed(2)}';
    final storeButtonLabel = defaultTargetPlatform == TargetPlatform.android
        ? 'Subscribe via Google Play'
        : defaultTargetPlatform == TargetPlatform.iOS
            ? 'Subscribe via App Store'
            : 'Subscribe through store';
    return Semantics(
      selected: selected,
      child: GestureDetector(
        onTap: selectable ? onSelect : null,
        child: _Panel(
          color: selected ? const Color(0xFFEFF6FF) : Colors.white,
          borderColor: selected
              ? const Color(0xFF2563EB)
              : plan.popular
                  ? const Color(0xFF8B5CF6)
                  : const Color(0xFFE5E7EB),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Radio<String>(
                    value: plan.id,
                    groupValue: state.selectedPlanId,
                    onChanged: selectable ? (_) => onSelect() : null,
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
                                maxLines: 2,
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(
                                  color: Color(0xFF111827),
                                  fontSize: 20,
                                  fontWeight: FontWeight.w800,
                                ),
                              ),
                            ),
                            if (plan.popular) ...[
                              const SizedBox(width: 8),
                              const Chip(
                                label: Text('Popular'),
                                backgroundColor: Color(0xFFEDE9FE),
                                labelStyle: TextStyle(color: Color(0xFF6D28D9)),
                              ),
                            ],
                          ],
                        ),
                        const SizedBox(height: 4),
                        Text(
                          plan.description,
                          style: const TextStyle(color: Color(0xFF6B7280)),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
          const SizedBox(height: 12),
          Text(
            price == null ? 'Store price unavailable' : '$price / month',
            style: const TextStyle(
              color: Color(0xFF111827),
              fontSize: 22,
              fontWeight: FontWeight.w800,
            ),
          ),
          const SizedBox(height: 10),
          ...plan.features.map(
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
          if (stripeAvailable)
            SizedBox(
              width: double.infinity,
              child: OutlinedButton.icon(
                 onPressed: selectable
                     ? () => _chooseStripePayment(context)
                     : null,
                icon: const Icon(Icons.account_balance_wallet_outlined),
                label: const Text('Pay by card or wallet'),
              ),
            ),
          if (stripeAvailable && storeProductAvailable)
            const SizedBox(height: 8),
          if (storeProductAvailable)
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                 onPressed: selectable && state.canPurchase
                     ? () {
                          onSelect();
                          FirebaseAnalyticsService.instance
                              .logSubscriptionEvent('upgrade', plan.id);
                          onPurchase();
                        }
                     : null,
                child: Text(
                  state.busyPlanId == plan.id
                      ? 'Processing…'
                      : storeButtonLabel,
                ),
              ),
            ),
          if (usesNativeStoreBilling && !storeProductAvailable)
            const Padding(
              padding: EdgeInsets.only(top: 7),
               child: _StoreAvailabilityMessage(),
            ),
          if (!usesNativeStoreBilling && !stripeAvailable)
            const Padding(
              padding: EdgeInsets.only(top: 7),
              child: Text(
                'Card and wallet payments are not configured.',
                style: TextStyle(color: Color(0xFF6B7280), fontSize: 12),
              ),
            ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _chooseStripePayment(BuildContext context) async {
    onSelect();
    final method = await showModalBottomSheet<StripePaymentMethod>(
      context: context,
      showDragHandle: true,
      builder: (sheetContext) => _PaymentMethodPicker(
        walletAvailable: state.walletAvailable,
      ),
    );
    if (!context.mounted || method == null) return;

    FirebaseAnalyticsService.instance.logSubscriptionEvent(
      'upgrade',
      '${plan.id}_${method.name}',
    );
    context.read<SubscriptionBloc>().add(
          StripePaymentRequested(plan.id, method),
        );
  }
}

class _PaymentMethodPicker extends StatelessWidget {
  const _PaymentMethodPicker({required this.walletAvailable});

  final bool walletAvailable;

  @override
  Widget build(BuildContext context) {
    final walletMethod = defaultTargetPlatform == TargetPlatform.android
        ? StripePaymentMethod.googlePay
        : defaultTargetPlatform == TargetPlatform.iOS
            ? StripePaymentMethod.applePay
            : null;

    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Payment method',
              style: TextStyle(
                color: Color(0xFF111827),
                fontSize: 18,
                fontWeight: FontWeight.w800,
              ),
            ),
            const SizedBox(height: 8),
            const Text(
              'Choose how you want to complete this subscription.',
              style: TextStyle(color: Color(0xFF6B7280)),
            ),
            const SizedBox(height: 8),
            ListTile(
              leading: const Icon(Icons.credit_card_rounded),
              title: const Text('Credit/Debit Card'),
              onTap: () => Navigator.of(context).pop(StripePaymentMethod.card),
            ),
            if (walletAvailable && walletMethod != null)
              ListTile(
                leading: Icon(
                  walletMethod == StripePaymentMethod.googlePay
                      ? Icons.account_balance_wallet_rounded
                      : Icons.apple,
                ),
                title: Text(
                  walletMethod == StripePaymentMethod.googlePay
                      ? 'Google Pay'
                      : 'Apple Pay',
                ),
                onTap: () => Navigator.of(context).pop(walletMethod),
              ),
          ],
        ),
      ),
    );
  }
}

class _ManageCard extends StatelessWidget {
  const _ManageCard({required this.state});

  final SubscriptionState state;

  @override
  Widget build(BuildContext context) {
    final subscription = state.subscription!;
    final isBasic = subscription.hasPlanEntitlement &&
        subscription.planType.toLowerCase() == 'basic';
    final websiteRecovery = state.requiresBillingRecovery &&
        subscription.subscriptionPlatform == 'web';
    final actionLabel = switch (subscription.subscriptionPlatform) {
      'google_play' => 'Manage or change plan',
      'app_store' => 'Manage in Apple ID settings',
      'web' => websiteRecovery
          ? 'Restore website subscription'
          : 'Open website billing',
      _ => 'Open subscription settings',
    };
    final description = state.requiresBillingRecovery
        ? _subscriptionLifecycleMessage(subscription)
        : isBasic
            ? 'Your Basic plan is active. Meal Planning is included with Premium and Family. Change your plan through ${subscription.platformLabel} to upgrade without starting a second subscription.'
            : '${_subscriptionLifecycleMessage(subscription)} '
                'Renewals and cancellations are managed by ${subscription.platformLabel}.';
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
            description,
            style: const TextStyle(color: Color(0xFF6B7280), fontSize: 13),
          ),
          const SizedBox(height: 12),
          SizedBox(
            width: double.infinity,
            child: OutlinedButton.icon(
              onPressed: () => context.read<SubscriptionBloc>().add(
                    websiteRecovery
                        ? const RecoverSubscriptionRequested()
                        : const ManageSubscriptionRequested(),
                  ),
              icon: const Icon(Icons.open_in_new_rounded),
              label: Text(actionLabel),
            ),
          ),
        ],
      ),
    );
  }
}

class _StripeRecoveryCard extends StatelessWidget {
  const _StripeRecoveryCard({
    required this.enabled,
    required this.onPressed,
  });

  final bool enabled;
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    return _Panel(
      color: const Color(0xFFFFF7ED),
      borderColor: const Color(0xFFFDBA74),
      child: Row(
        children: [
          const Icon(Icons.receipt_long_rounded, color: Color(0xFFB45309)),
          const SizedBox(width: 12),
          const Expanded(
            child: Text(
              'Already paid on the Adaptalyfe website? Check your Stripe '
              'subscription and restore access.',
              style: TextStyle(color: Color(0xFF92400E), fontSize: 13),
            ),
          ),
          const SizedBox(width: 8),
          TextButton(
            onPressed: enabled ? onPressed : null,
            child: const Text('Restore access'),
          ),
        ],
      ),
    );
  }
}

class _StoreAvailabilityMessage extends StatelessWidget {
  const _StoreAvailabilityMessage();

  @override
  Widget build(BuildContext context) {
    final message = context.select(
      (SubscriptionBloc bloc) => bloc.state.availabilityMessage,
    );
    return Text(
      message ??
          'The selected subscription was not returned by the current store. '
              'Check the store configuration and tester account.',
      style: const TextStyle(color: Color(0xFF6B7280), fontSize: 12),
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
       child: Wrap(
         spacing: 10,
         runSpacing: 8,
         crossAxisAlignment: WrapCrossAlignment.center,
         children: [
          const Icon(Icons.restore_rounded, color: Color(0xFFB45309)),
          const SizedBox(width: 10),
           const SizedBox(
             width: 230,
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
    final terms = usesNativeStoreBilling
        ? 'Native subscriptions renew monthly unless cancelled. The App Store or '
            'Google Play charges the account after confirmation. Manage or cancel '
            'from the same store account used to subscribe; store checkout shows '
            'the exact price and terms before you confirm.'
        : 'Website subscriptions renew monthly unless cancelled. Charges use '
            'the payment method shown at checkout. Manage or cancel website '
            'billing through Adaptalyfe.';
    return _Panel(
      color: const Color(0xFFF9FAFB),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Subscription terms',
            style: TextStyle(color: Color(0xFF111827), fontWeight: FontWeight.w800),
          ),
          const SizedBox(height: 8),
          Text(
            terms,
            style: const TextStyle(
              color: Color(0xFF6B7280),
              fontSize: 12,
              height: 1.45,
            ),
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

String _subscriptionLifecycleMessage(SubscriptionModel subscription) {
  if (subscription.isAccountTrial) {
    return 'Your free 7-day account trial includes Basic features.';
  }
  if (subscription.isCancelled) {
    return subscription.grantsAccess
        ? 'Cancelled. Access continues through '
            '${_formatDate(subscription.currentPeriodEnd)}; renewal is off.'
        : 'Cancelled. Access has ended. Choose a plan to subscribe again.';
  }
  if (subscription.isInGracePeriod) {
    return 'Payment failed. ${subscription.platformLabel} grace-period access '
        'continues through ${_formatDate(subscription.currentPeriodEnd)}. '
        'Update billing to avoid losing access.';
  }
  if (subscription.isOnHold) {
    return 'Payment failed and the subscription is on hold with '
        '${subscription.platformLabel}. Fix billing with that provider to '
        'restore access.';
  }
  if (subscription.isPaymentFailed) {
    return 'Payment failed. Update billing with ${subscription.platformLabel} '
        'to restore your subscription.';
  }
  if (subscription.isPaused) {
    return 'Your subscription is paused with ${subscription.platformLabel}. '
        'Resume it there to restore paid access.';
  }
  if (subscription.isPending) {
    return 'The store is still processing this subscription. Access begins '
        'after the store confirms payment.';
  }
  if (subscription.isRevoked) {
    return 'This subscription was revoked and no longer grants paid access.';
  }
  if (subscription.isExpired) {
    return 'Your subscription expired. Choose a plan below to subscribe again.';
  }
  if (subscription.isTrialing && subscription.hasPlanEntitlement) {
    return 'Your ${_titleCase(subscription.planType)} provider trial is active '
        'through ${_formatDate(subscription.currentPeriodEnd)}.';
  }
  if (subscription.grantsAccess && subscription.autoRenew == true) {
    return 'Active and set to renew on '
        '${_formatDate(subscription.currentPeriodEnd)}.';
  }
  if (subscription.grantsAccess && subscription.autoRenew == false) {
    return 'Active through ${_formatDate(subscription.currentPeriodEnd)}. '
        'Automatic renewal is off.';
  }
  if (subscription.grantsAccess) {
    return 'Active through ${_formatDate(subscription.currentPeriodEnd)}.';
  }
  return 'No active paid subscription.';
}

String _formatDate(DateTime? value) {
  if (value == null) return 'the end of the current billing period';
  return '${value.year}-${value.month.toString().padLeft(2, '0')}-'
      '${value.day.toString().padLeft(2, '0')}';
}