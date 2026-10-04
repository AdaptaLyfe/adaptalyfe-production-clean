import 'package:flutter/foundation.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:adaptalyfe_mobile/features/subscription/bloc/subscription_state.dart';
import 'package:adaptalyfe_mobile/features/subscription/data/subscription_platform_policy.dart';
import 'package:adaptalyfe_mobile/features/subscription/models/subscription_models.dart';

void main() {
  final originalPlatformOverride = debugDefaultTargetPlatformOverride;

  tearDown(() {
    debugDefaultTargetPlatformOverride = originalPlatformOverride;
  });

  test('Android and iOS subscriptions use their native stores', () {
    debugDefaultTargetPlatformOverride = TargetPlatform.android;
    expect(usesNativeStoreBilling, isTrue);

    debugDefaultTargetPlatformOverride = TargetPlatform.iOS;
    expect(usesNativeStoreBilling, isTrue);
  });

  test('desktop subscriptions do not require native store billing', () {
    debugDefaultTargetPlatformOverride = TargetPlatform.macOS;
    expect(usesNativeStoreBilling, isFalse);
  });

  test('restoring purchases is treated as a busy operation', () {
    const state = SubscriptionState(status: SubscriptionStatus.restoring);
    expect(state.isBusy, isTrue);
    expect(state.canPurchase, isFalse);
  });

  test('purchase is disabled until account status is checked and while verification is pending', () {
    const unchecked = SubscriptionState(storeAvailable: true);
    expect(unchecked.canPurchase, isFalse);
    const expired = SubscriptionModel(id: 7, planType: 'free', status: 'expired', billingCycle: 'monthly');
    const checked = SubscriptionState(status: SubscriptionStatus.ready, storeAvailable: true, subscription: expired);
    expect(checked.canPurchase, isTrue);
    expect(checked.copyWith(purchaseNeedsVerification: true).canPurchase, isFalse);
    expect(checked.copyWith(status: SubscriptionStatus.loading).canPurchase, isFalse);
    expect(checked.copyWith(status: SubscriptionStatus.failure).canPurchase, isFalse);
    expect(checked.copyWith(selectedPlanId: 'family').hasActiveSubscription, isFalse);
  });

  test('verified trialing subscriptions retain access without another checkout', () {
    const trialing = SubscriptionModel(
      id: 1,
      planType: 'basic',
      status: 'trialing',
      billingCycle: 'monthly',
    );
    const state = SubscriptionState(
      subscription: trialing,
      storeAvailable: true,
    );

    expect(trialing.grantsAccess, isTrue);
    expect(state.hasActiveSubscription, isTrue);
    expect(state.canPurchase, isFalse);
  });

  test('a free account trial grants Basic tools but still permits native checkout', () {
    final trial = SubscriptionModel.fromJson({
      'id': 7, 'planType': 'basic', 'status': 'trialing',
      'billingCycle': 'monthly', 'subscriptionPlatform': 'web',
      'isAccountTrial': true,
      'currentPeriodEnd': DateTime.now().add(const Duration(days: 7)).toIso8601String(),
    });
    final state = SubscriptionState(status: SubscriptionStatus.ready,
        subscription: trial, storeAvailable: true);
    expect(trial.grantsAccess, isTrue);
    expect(trial.hasPremiumAccess, isFalse);
    expect(state.hasActiveSubscription, isFalse);
    expect(state.canPurchase, isTrue);
  });

  test('recognizes a legacy free account trial response without its marker', () {
    final trial = SubscriptionModel.fromJson({
      'id': 7,
      'planType': 'basic',
      'status': 'trialing',
      'billingCycle': 'monthly',
      'trialDaysLeft': 7,
      'currentPeriodEnd':
          DateTime.now().add(const Duration(days: 7)).toIso8601String(),
    });
    const state = SubscriptionState(
      status: SubscriptionStatus.ready,
      storeAvailable: true,
    );
    final checked = state.copyWith(subscription: trial);

    expect(trial.isAccountTrial, isTrue);
    expect(trial.grantsAccess, isTrue);
    expect(checked.hasActiveSubscription, isFalse);
    expect(checked.canPurchase, isTrue);
  });

  test('does not infer a free account trial for a web-billed provider trial', () {
    final trial = SubscriptionModel.fromJson({
      'id': 8,
      'planType': 'basic',
      'status': 'trialing',
      'billingCycle': 'monthly',
      'subscriptionPlatform': 'web',
      'trialDaysLeft': 7,
      'currentPeriodEnd':
          DateTime.now().add(const Duration(days: 7)).toIso8601String(),
    });
    final state = SubscriptionState(
      status: SubscriptionStatus.ready,
      subscription: trial,
      storeAvailable: true,
    );

    expect(trial.isAccountTrial, isFalse);
    expect(state.hasActiveSubscription, isTrue);
    expect(state.canPurchase, isFalse);
  });

  test('dashboard navigation signal can be cleared after routing', () {
    const completed = SubscriptionState(shouldNavigateToDashboard: true);
    expect(
      completed.copyWith(shouldNavigateToDashboard: false)
          .shouldNavigateToDashboard,
      isFalse,
    );
  });
}