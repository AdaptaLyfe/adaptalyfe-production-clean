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
        if (state.isLoading && !state.accountStatusLoaded) {
          return const Center(child: CircularProgressIndicator());
        }
        if (!state.accountStatusLoaded) {
          final bloc = context.read<SubscriptionBloc>();
          return _SubscriptionRecoveryView(
            message: state.errorMessage ??
                state.actionMessage ??
                'We could not verify your subscription. '
                    'Your existing access has not been changed.',
            busy: state.isBusy,
            sessionInvalid: state.sessionInvalid,
            onRetry: () => bloc.add(const RefreshSubscription()),
            onRestore: () {
              FirebaseAnalyticsService.instance
                  .logSubscriptionEvent('restore', 'store');
              bloc.add(const RestorePurchasesRequested());
            },
            onRecover: () => bloc.add(const RecoverSubscriptionRequested()),
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
                if (!state.hasActiveSubscription) ...[
                  const SizedBox(height: 14),
                  _StripeRecoveryCard(
                    enabled: !state.isBusy && !state.sessionInvalid,
                    onPressed: () {
                      context
                          .read<SubscriptionBloc>()
                          .add(const RecoverSubscriptionRequested());
                    },
                  ),
                ],
                if (usesNativeStoreBilling) ...[
                  const SizedBox(height: 12),
                  _RestoreCard(
                    enabled: !state.isBusy && !state.sessionInvalid,
                    onPressed: () {
                      FirebaseAnalyticsService.instance
                          .logSubscriptionEvent('restore', 'store');
                      context
                          .read<SubscriptionBloc>()
                          .add(const RestorePurchasesRequested());
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
                if (state.hasActiveSubscription)
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
    final plan = _planForTier(subscription.planType);
    final planName = plan?.name ?? '${_titleCase(subscription.planType)} plan';
    final periodEnd = subscription.currentPeriodEnd;
    final includedFeatures = plan?.features
            .where((feature) => !feature.toLowerCase().contains('trial'))
            .toList() ??
        const <String>[];

    return _Panel(
      color: Colors.white,
      borderColor: const Color(0xFFBBF7D0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const CircleAvatar(
                backgroundColor: Color(0xFFDCFCE7),
                child: Icon(Icons.verified_rounded, color: Color(0xFF15803D)),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      subscription.isTrialing
                          ? '$planName trial is active'
                          : '$planName is active',
                      style: const TextStyle(
                        color: Color(0xFF14532D),
                        fontSize: 17,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '${_titleCase(subscription.billingCycle)} billing · '
                      '${subscription.platformLabel}.',
                      style: const TextStyle(
                        color: Color(0xFF4B5563),
                        fontSize: 13,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                decoration: BoxDecoration(
                  color: const Color(0xFFDCFCE7),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  subscription.isTrialing ? 'Trial' : 'Active',
                  style: const TextStyle(
                    color: Color(0xFF166534),
                    fontSize: 12,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
            ],
          ),
          if (periodEnd != null) ...[
            const SizedBox(height: 14),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: const Color(0xFFF0FDF4),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Text(
                '${subscription.isTrialing ? 'Trial ends' : 'Current period ends'} '
                '${MaterialLocalizations.of(context).formatMediumDate(periodEnd.toLocal())}',
                style: const TextStyle(
                  color: Color(0xFF166534),
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ],
          if (subscription.isTrialing &&
              (subscription.trialDaysLeft ?? 0) > 0) ...[
            const SizedBox(height: 8),
            Text(
              '${subscription.trialDaysLeft} '
              '${subscription.trialDaysLeft == 1 ? 'day' : 'days'} left in your trial.',
              style: const TextStyle(
                color: Color(0xFF166534),
                fontSize: 13,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
          if (includedFeatures.isNotEmpty) ...[
            const SizedBox(height: 16),
            const Text(
              'Included in your plan',
              style: TextStyle(
                color: Color(0xFF111827),
                fontSize: 14,
                fontWeight: FontWeight.w800,
              ),
            ),
            const SizedBox(height: 8),
            ...includedFeatures.map(
              (feature) => Padding(
                padding: const EdgeInsets.only(bottom: 6),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Icon(
                      Icons.check_rounded,
                      color: Color(0xFF16A34A),
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
            ),
          ],
        ],
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
    final hasPlanEntitlement = subscription?.hasPlanEntitlement == true;
    final String message;
    if (subscription?.isTrialing == true) {
      if (daysLeft != null && daysLeft > 0) {
        final continuation = hasPlanEntitlement
            ? 'Manage or cancel your subscription below.'
            : 'Choose a plan below to keep access.';
        message = 'Your free trial has $daysLeft '
            '${daysLeft == 1 ? 'day' : 'days'} remaining. '
            '$continuation';
      } else {
        message = hasPlanEntitlement
            ? 'Your free trial is ending. Manage or cancel your subscription below.'
            : 'Your free trial is ending. Choose a plan below to keep access.';
      }
    } else if (subscription?.isExpired == true) {
      message = 'Your previous subscription has ended. '
          'Choose a plan to restart.';
    } else if (const {'cancelled', 'canceled'}
        .contains(subscription?.status.toLowerCase())) {
      message = 'Your previous subscription was cancelled. '
          'Choose a plan to restart.';
    } else {
      message =
          'Plans renew monthly. Choose the option that fits your support needs.';
    }
    final trialEnd = subscription?.isTrialing == true
        ? subscription?.currentPeriodEnd
        : null;
    return _Panel(
      color: Colors.white,
      child: Row(
        children: [
          const Icon(
            Icons.access_time_rounded,
            color: Color(0xFF2563EB),
            size: 28,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  message,
                  style: const TextStyle(
                    color: Color(0xFF374151),
                    fontSize: 14,
                  ),
                ),
                if (trialEnd != null) ...[
                  const SizedBox(height: 5),
                  Text(
                    'Trial ends '
                    '${MaterialLocalizations.of(context).formatMediumDate(trialEnd.toLocal())}.',
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
    final hasStoreProduct = usesNativeStoreBilling &&
        product != null &&
        state.storeAvailable;
    final stripeConfigured = !usesNativeStoreBilling && state.stripeAvailable;
    final selectable = state.accountStatusLoaded &&
        !state.isLoading &&
        !state.sessionInvalid &&
        !state.hasActiveSubscription &&
        !state.isBusy;
    final storePrice = product?.price;
    final price = storePrice is String && storePrice.trim().isNotEmpty
        ? storePrice
        : usesNativeStoreBilling
            ? null
            : '\$${plan.monthlyPrice.toStringAsFixed(2)}';
    final trialAvailable = state.subscription?.isTrialing == true &&
        (state.subscription?.trialDaysLeft ?? 0) > 0;
    final storeButtonLabel = trialAvailable
        ? 'Start Free Trial'
        : defaultTargetPlatform == TargetPlatform.android
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
                  Expanded(
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
                  if (selected)
                    const Padding(
                      padding: EdgeInsets.only(left: 8, top: 4),
                      child: Icon(
                        Icons.check_circle_rounded,
                        color: Color(0xFF2563EB),
                        size: 22,
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
                      const Icon(
                        Icons.check_rounded,
                        color: Color(0xFF16A34A),
                        size: 18,
                      ),
                      const SizedBox(width: 6),
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
              ),
              const SizedBox(height: 10),
              if (stripeConfigured)
                SizedBox(
                  width: double.infinity,
                  child: OutlinedButton.icon(
                    onPressed: selectable && state.canUseStripe
                        ? () => _chooseStripePayment(context)
                        : null,
                    icon: const Icon(Icons.account_balance_wallet_outlined),
                    label: Text(
                      state.busyPlanId == plan.id
                          ? 'Processing…'
                          : trialAvailable
                              ? 'Start Free Trial'
                              : 'Pay by card or wallet',
                    ),
                  ),
                ),
              if (stripeConfigured && hasStoreProduct)
                const SizedBox(height: 8),
              if (hasStoreProduct)
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
              if (!stripeConfigured && !hasStoreProduct)
                const Padding(
                  padding: EdgeInsets.only(top: 7),
                  child: _StoreAvailabilityMessage(),
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
    final basicMessage = subscription.isTrialing
        ? 'Your Basic trial is active. Meal Planning is included with '
            'Premium and Family. Change your plan through '
            '${subscription.platformLabel} to upgrade without starting '
            'a second subscription.'
        : 'Your Basic plan is active. Meal Planning is included with '
            'Premium and Family. Change your plan through '
            '${subscription.platformLabel} to upgrade without starting '
            'a second subscription.';
    final actionLabel = switch (subscription.subscriptionPlatform) {
      'google_play' => 'Manage or change plan',
      'app_store' => 'Manage in Apple ID settings',
      _ => 'Open subscription settings',
    };
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
            isBasic
                ? basicMessage
                : 'Renewals and cancellations are managed by ${subscription.platformLabel}.',
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
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
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
            ],
          ),
          Align(
            alignment: Alignment.centerRight,
            child: TextButton(
              onPressed: enabled ? onPressed : null,
              child: const Text('Restore website access'),
            ),
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
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Icon(Icons.restore_rounded, color: Color(0xFFB45309)),
              const SizedBox(width: 12),
              const Expanded(
                child: Text(
                  'Already subscribed? Restore purchases from this store account.',
                  style: TextStyle(color: Color(0xFF92400E), fontSize: 13),
                ),
              ),
            ],
          ),
          Align(
            alignment: Alignment.centerRight,
            child: TextButton(
              onPressed: enabled ? onPressed : null,
              child: const Text('Restore purchases'),
            ),
          ),
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

class _SubscriptionRecoveryView extends StatelessWidget {
  const _SubscriptionRecoveryView({
    required this.message,
    required this.busy,
    required this.sessionInvalid,
    required this.onRetry,
    required this.onRestore,
    required this.onRecover,
  });

  final String message;
  final bool busy;
  final bool sessionInvalid;
  final VoidCallback onRetry;
  final VoidCallback onRestore;
  final VoidCallback onRecover;

  @override
  Widget build(BuildContext context) {
    final actionsEnabled = !busy && !sessionInvalid;
    return Container(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          colors: [Color(0xFFEFF6FF), Color(0xFFF5F3FF), Color(0xFFF0FDFA)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
      ),
      child: ListView(
        padding: AppResponsive.pagePadding(context).copyWith(
          top: 28,
          bottom: 32,
        ),
        children: [
          const Icon(
            Icons.cloud_off_rounded,
            color: Color(0xFF2563EB),
            size: 42,
          ),
          const SizedBox(height: 14),
          const Text(
            'We couldn’t verify your subscription',
            textAlign: TextAlign.center,
            style: TextStyle(
              color: Color(0xFF111827),
              fontSize: 22,
              fontWeight: FontWeight.w800,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            message,
            textAlign: TextAlign.center,
            style: const TextStyle(color: Color(0xFF4B5563), height: 1.45),
          ),
          const SizedBox(height: 18),
          OutlinedButton.icon(
            onPressed: actionsEnabled ? onRetry : null,
            icon: const Icon(Icons.refresh_rounded),
            label: const Text('Check again'),
          ),
          if (busy) ...[
            const SizedBox(height: 14),
            const LinearProgressIndicator(),
          ],
          if (usesNativeStoreBilling) ...[
            const SizedBox(height: 18),
            _RestoreCard(
              enabled: actionsEnabled,
              onPressed: onRestore,
            ),
          ],
          const SizedBox(height: 14),
          _StripeRecoveryCard(
            enabled: actionsEnabled,
            onPressed: onRecover,
          ),
          const SizedBox(height: 14),
          const Text(
            'New purchases stay unavailable until your current account status '
            'is verified, to help prevent duplicate subscriptions.',
            textAlign: TextAlign.center,
            style: TextStyle(color: Color(0xFF6B7280), fontSize: 12),
          ),
        ],
      ),
    );
  }
}

SubscriptionPlan? _planForTier(String tier) {
  for (final plan in subscriptionPlans) {
    if (plan.id == tier.toLowerCase()) return plan;
  }
  return null;
}

String _titleCase(String value) {
  if (value.isEmpty) return value;
  return '${value[0].toUpperCase()}${value.substring(1)}';
}