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

  test('subscription recovery is treated as a busy operation', () {
    const state = SubscriptionState(status: SubscriptionStatus.recovering);
    expect(state.isBusy, isTrue);
    expect(state.canPurchase, isFalse);
    expect(state.canUseStripe, isFalse);
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
      stripeAvailable: true,
    );

    expect(trialing.grantsAccess, isTrue);
    expect(state.hasActiveSubscription, isTrue);
    expect(state.canPurchase, isFalse);
    expect(state.canUseStripe, isFalse);
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