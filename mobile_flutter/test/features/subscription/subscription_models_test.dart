import 'package:adaptalyfe_mobile/features/subscription/models/subscription_models.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('SubscriptionModel', () {
    test('keeps a verified, unexpired Google Play plan active', () {
      final model = SubscriptionModel.fromJson({
        'id': 42,
        'planType': 'premium',
        'status': 'active',
        'billingCycle': 'monthly',
        'subscriptionPlatform': 'google_play',
        'currentPeriodEnd':
            DateTime.now().add(const Duration(days: 25)).toIso8601String(),
      });

      expect(model.grantsAccess, isTrue);
      expect(model.hasPremiumAccess, isTrue);
      expect(model.platformLabel, 'Google Play');
    });

    test('does not treat an account trial as a paid Premium plan', () {
      final model = SubscriptionModel.fromJson({
        'id': 42,
        'planType': 'premium',
        'status': 'trialing',
        'billingCycle': 'monthly',
        'trialDaysLeft': 5,
      });

      expect(model.isAccountTrial, isTrue);
      expect(model.grantsAccess, isTrue);
      expect(model.hasPremiumAccess, isFalse);
    });

    test('does not grant native-store access after the period ends', () {
      final model = SubscriptionModel.fromJson({
        'id': 42,
        'planType': 'family',
        'status': 'cancelled',
        'billingCycle': 'monthly',
        'subscriptionPlatform': 'google_play',
        'currentPeriodEnd':
            DateTime.now().subtract(const Duration(days: 1)).toIso8601String(),
      });

      expect(model.grantsAccess, isFalse);
      expect(model.hasPremiumAccess, isFalse);
    });

    test('retains lifecycle status and auto-renew details from the server', () {
      final model = SubscriptionModel.fromJson({
        'id': 42,
        'planType': 'premium',
        'status': 'on_hold',
        'billingCycle': 'monthly',
        'subscriptionPlatform': 'google_play',
        'currentPeriodEnd':
            DateTime.now().add(const Duration(days: 3)).toIso8601String(),
        'autoRenew': false,
      });

      expect(model.isOnHold, isTrue);
      expect(model.isPaymentFailed, isTrue);
      expect(model.requiresStoreRecovery, isTrue);
      expect(model.autoRenew, isFalse);
      expect(model.grantsAccess, isFalse);
    });
  });
}