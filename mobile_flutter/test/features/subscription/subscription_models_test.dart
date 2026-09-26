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
  });
}