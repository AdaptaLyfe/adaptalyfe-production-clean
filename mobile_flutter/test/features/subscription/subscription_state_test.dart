import 'package:adaptalyfe_mobile/features/subscription/bloc/subscription_state.dart';
import 'package:adaptalyfe_mobile/features/subscription/models/subscription_models.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('a free account trial allows store checkout but not premium access', () {
    final trial = SubscriptionModel.fromJson({
      'id': 7,
      'planType': 'premium',
      'status': 'trialing',
      'trialDaysLeft': 4,
    });
    final state = SubscriptionState(
      status: SubscriptionStatus.ready,
      subscription: trial,
      storeAvailable: true,
    );

    expect(trial.hasPremiumAccess, isFalse);
    expect(state.hasActiveSubscription, isFalse);
    expect(state.canStartPurchase, isTrue);
    expect(state.canSelectPlan, isTrue);
    expect(state.canPurchase, isTrue);
  });

  test('a pending store payment blocks starting a second purchase', () {
    final account = SubscriptionModel.fromJson({
      'id': 7,
      'planType': 'free',
      'status': 'expired',
    });
    final state = SubscriptionState(
      status: SubscriptionStatus.ready,
      subscription: account,
      storeAvailable: true,
      purchasePending: true,
    );

    expect(state.canStartPurchase, isFalse);
  });

  test('purchase remains disabled until account loading succeeds', () {
    final accountTrial = SubscriptionModel.fromJson({
      'id': 7,
      'planType': 'basic',
      'status': 'trialing',
      'trialDaysLeft': 4,
    });

    for (final status in [
      SubscriptionStatus.initial,
      SubscriptionStatus.loading,
      SubscriptionStatus.failure,
    ]) {
      final state = SubscriptionState(
        status: status,
        subscription: accountTrial,
        storeAvailable: true,
      );

      expect(state.canStartPurchase, isFalse);
      expect(state.canPurchase, isFalse);
    }
  });

  test('an unresolved account cannot be purchased after an API error', () {
    final state = SubscriptionState(
      status: SubscriptionStatus.failure,
      storeAvailable: true,
      errorMessage: 'Subscription service unavailable.',
    );

    expect(state.plans, hasLength(3));
    expect(state.canSelectPlan, isFalse);
    expect(state.canPurchase, isFalse);
  });

  test('an account-hold subscription must be recovered, not repurchased', () {
    final subscription = SubscriptionModel.fromJson({
      'id': 7,
      'planType': 'premium',
      'status': 'on_hold',
      'subscriptionPlatform': 'google_play',
      'currentPeriodEnd':
          DateTime.now().add(const Duration(days: 3)).toIso8601String(),
    });
    final state = SubscriptionState(
      status: SubscriptionStatus.ready,
      subscription: subscription,
      storeAvailable: true,
    );

    expect(subscription.grantsAccess, isFalse);
    expect(subscription.isPaymentFailed, isTrue);
    expect(state.requiresStoreRecovery, isTrue);
    expect(state.canSelectPlan, isFalse);
    expect(state.canPurchase, isFalse);
  });

  test('a store-billed trial is active and cannot start another purchase', () {
    final trial = SubscriptionModel.fromJson({
      'id': 7,
      'planType': 'premium',
      'status': 'trialing',
      'billingCycle': 'monthly',
      'subscriptionPlatform': 'google_play',
      'currentPeriodEnd':
          DateTime.now().add(const Duration(days: 14)).toIso8601String(),
    });
    final state = SubscriptionState(
      status: SubscriptionStatus.ready,
      subscription: trial,
      storeAvailable: true,
    );

    expect(trial.isAccountTrial, isFalse);
    expect(trial.grantsAccess, isTrue);
    expect(trial.hasPremiumAccess, isTrue);
    expect(state.hasActiveSubscription, isTrue);
    expect(state.canStartPurchase, isFalse);
  });
}