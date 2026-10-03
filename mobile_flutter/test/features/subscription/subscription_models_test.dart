import 'package:flutter_test/flutter_test.dart';

import 'package:adaptalyfe_mobile/features/subscription/models/subscription_models.dart';

void main() {
  group('subscription product and entitlement models', () {
    test('keeps the existing store product IDs and monthly prices', () {
      expect(
        subscriptionPlans.map((plan) => plan.productId).toList(),
        [
          'adaptalyfe_basic_monthly',
          'adaptalyfe_premium_monthly',
          'adaptalyfe_family_monthly',
        ],
      );
      expect(
        subscriptionPlans.map((plan) => plan.monthlyPrice).toList(),
        [4.99, 12.99, 24.99],
      );
    });

    test('reads server trial status and remaining days without local guessing',
        () {
      final subscription = SubscriptionModel.fromJson({
        'id': 5,
        'planType': 'free',
        'status': 'trialing',
        'billingCycle': 'monthly',
        'subscriptionPlatform': 'web',
        'trialDaysLeft': 1,
      });

      expect(subscription.isTrialing, isTrue);
      expect(subscription.trialDaysLeft, 1);
      expect(subscription.isActive, isFalse);
      expect(subscription.platformLabel, 'the Adaptalyfe website');
    });

    test('recognizes an active store subscription and restore response', () {
      final subscription = SubscriptionModel.fromJson({
        'id': 9,
        'planType': 'premium',
        'status': 'active',
        'billingCycle': 'monthly',
        'subscriptionPlatform': 'google_play',
      });
      final restored = PurchaseVerification.fromJson({
        'restored': true,
        'planType': 'premium',
        'expiresAt': '2027-01-15T12:00:00.000Z',
      });

      expect(subscription.isActive, isTrue);
      expect(subscription.platformLabel, 'Google Play');
      expect(restored.success, isTrue);
      expect(restored.planType, 'premium');
    });

    test('Basic is active but does not include Premium features', () {
      final subscription = SubscriptionModel.fromJson({
        'id': 10,
        'planType': 'basic',
        'status': 'active',
        'billingCycle': 'monthly',
        'subscriptionPlatform': 'google_play',
      });

      expect(subscription.grantsAccess, isTrue);
      expect(subscription.hasPremiumAccess, isFalse);
    });

    test('Basic trial grants Basic access without Premium features', () {
      final subscription = SubscriptionModel.fromJson({
        'id': 10,
        'planType': 'basic',
        'status': 'trialing',
        'billingCycle': 'monthly',
      });

      expect(subscription.grantsAccess, isTrue);
      expect(subscription.hasPremiumAccess, isFalse);
    });

    test('Premium and Family trials include Premium features', () {
      for (final tier in ['premium', 'family']) {
        final subscription = SubscriptionModel.fromJson({
          'id': 11,
          'planType': tier,
          'status': 'trialing',
          'billingCycle': 'monthly',
        });

        expect(subscription.hasPremiumAccess, isTrue, reason: tier);
      }
    });

    test('Premium and Family plans include Premium features only while active',
        () {
      for (final tier in ['premium', 'family']) {
        final active = SubscriptionModel.fromJson({
          'id': 11,
          'planType': tier,
          'status': 'active',
          'billingCycle': 'monthly',
        });
        final expired = SubscriptionModel.fromJson({
          'id': 12,
          'planType': tier,
          'status': 'expired',
          'billingCycle': 'monthly',
        });

        expect(active.hasPremiumAccess, isTrue, reason: tier);
        expect(expired.hasPremiumAccess, isFalse, reason: tier);
      }
    });
  });
}