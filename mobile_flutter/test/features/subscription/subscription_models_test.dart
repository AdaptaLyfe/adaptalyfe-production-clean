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
        'currentPeriodEnd': DateTime.now().add(const Duration(days: 30)).toIso8601String(),
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

    test('uses the server-verified plan payload for all three Play products',
        () {
      final expectedTiers = {
        'adaptalyfe_basic_monthly': 'basic',
        'adaptalyfe_premium_monthly': 'premium',
        'adaptalyfe_family_monthly': 'family',
      };

      for (final plan in subscriptionPlans) {
        final verification = PurchaseVerification.fromJson({
          'success': true,
          'planType': expectedTiers[plan.productId],
          'status': 'active',
          'subscription': {
            'id': 24,
            'planType': expectedTiers[plan.productId],
            'status': 'active',
            'billingCycle': 'monthly',
            'subscriptionPlatform': 'google_play',
            'currentPeriodEnd': '2027-01-15T12:00:00.000Z',
          },
        });

        expect(verification.success, isTrue, reason: plan.productId);
        expect(
          verification.subscription?.planType,
          expectedTiers[plan.productId],
          reason: plan.productId,
        );
        expect(
          verification.subscription?.hasPremiumAccess,
          plan.id != 'basic',
          reason: plan.productId,
        );
      }
    });

    test('Basic is active but does not include Premium features', () {
      final subscription = SubscriptionModel.fromJson({
        'id': 10,
        'planType': 'basic',
        'status': 'active',
        'billingCycle': 'monthly',
        'subscriptionPlatform': 'google_play',
        'currentPeriodEnd': DateTime.now().add(const Duration(days: 30)).toIso8601String(),
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

    test('native active subscriptions need a known tier and verified future expiry', () {
      for (final tier in ['basic', 'premium', 'family']) {
        for (final expiry in [null, DateTime.now().subtract(const Duration(seconds: 1)).toIso8601String()]) {
          final subscription = SubscriptionModel.fromJson({
            'id': 7, 'planType': tier, 'status': 'active',
            'billingCycle': 'monthly', 'subscriptionPlatform': 'google_play',
            'currentPeriodEnd': expiry,
          });
          expect(subscription.grantsAccess, isFalse, reason: '$tier / $expiry');
        }
      }
      final unknown = SubscriptionModel.fromJson({
        'id': 7, 'planType': 'unknown', 'status': 'active',
        'billingCycle': 'monthly', 'subscriptionPlatform': 'google_play',
        'currentPeriodEnd': DateTime.now().add(const Duration(days: 30)).toIso8601String(),
      });
      expect(unknown.grantsAccess, isFalse);
    });

    test('cancelled and grace-period store plans keep access until expiry', () {
      for (final status in ['cancelled', 'in_grace_period']) {
        final subscription = SubscriptionModel.fromJson({
          'id': 12,
          'planType': 'basic',
          'status': status,
          'billingCycle': 'monthly',
          'subscriptionPlatform': 'google_play',
          'currentPeriodEnd':
              DateTime.now().add(const Duration(days: 30)).toIso8601String(),
        });

        expect(subscription.grantsAccess, isTrue, reason: status);
        expect(subscription.hasPremiumAccess, isFalse, reason: status);
      }
    });

    test('cancelled access ends with the verified period', () {
      final expiredCancellation = SubscriptionModel.fromJson({
        'id': 13,
        'planType': 'premium',
        'status': 'cancelled',
        'billingCycle': 'monthly',
        'subscriptionPlatform': 'app_store',
        'currentPeriodEnd':
            DateTime.now().subtract(const Duration(seconds: 1)).toIso8601String(),
      });
      final webGrace = SubscriptionModel.fromJson({
        'id': 14,
        'planType': 'premium',
        'status': 'in_grace_period',
        'billingCycle': 'monthly',
        'subscriptionPlatform': 'web',
        'currentPeriodEnd':
            DateTime.now().add(const Duration(days: 30)).toIso8601String(),
      });
      final cancelledWeb = SubscriptionModel.fromJson({
        'id': 15,
        'planType': 'premium',
        'status': 'cancelled',
        'billingCycle': 'monthly',
        'subscriptionPlatform': 'web',
        'currentPeriodEnd':
            DateTime.now().add(const Duration(days: 30)).toIso8601String(),
      });

      expect(expiredCancellation.grantsAccess, isFalse);
      expect(webGrace.grantsAccess, isFalse);
      expect(cancelledWeb.grantsAccess, isTrue);
      expect(cancelledWeb.hasPremiumAccess, isTrue);
    });

    test('pending store verification is not treated as a completed purchase', () {
      final verification = PurchaseVerification.fromJson({
        'success': false,
        'status': 'pending',
        'message': 'The store is still processing this purchase.',
      });

      expect(verification.success, isFalse);
      expect(verification.status, 'pending');
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