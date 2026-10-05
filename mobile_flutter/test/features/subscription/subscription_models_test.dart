import 'package:adaptalyfe_mobile/features/subscription/models/subscription_models.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('subscription plan catalog', () {
    test('matches the wrapper plan names, features, and store product IDs', () {
      expect(
        subscriptionPlans.map((plan) => plan.name).toList(),
        ['Basic Plan', 'Premium Plan', 'Family Plan'],
      );
      expect(
        subscriptionPlans.map((plan) => plan.description).toList(),
        [
          'Essential features for daily independence',
          'Advanced features for enhanced independence',
          'Complete solution for families and care teams',
        ],
      );
      expect(
        subscriptionPlans.map((plan) => plan.productId).toList(),
        [
          'adaptalyfe_basic_monthly',
          'adaptalyfe_premium_monthly',
          'adaptalyfe_family_monthly',
        ],
      );
      expect(
        subscriptionPlans
            .map((plan) => plan.websiteMonthlyPrice)
            .toList(),
        ['\$4.99', '\$12.99', '\$24.99'],
      );
      expect(
        subscriptionPlans.map((plan) => plan.features).toList(),
        [
          [
            'Daily task management (up to 50 tasks)',
            'Basic mood tracking',
            'Financial tracking & bill reminders',
            '1 caregiver connection',
            'Basic reminders & notifications',
            '7-day free trial',
            'Email support',
          ],
          [
            'Everything in Basic',
            'Unlimited tasks (up to 1,000)',
            'Advanced analytics & insights',
            'Medication management',
            'Up to 5 caregiver connections',
            'Voice commands',
            'Smart notifications',
            'Meal planning & grocery lists',
            'Academic planner',
            'Priority support',
          ],
          [
            'Everything in Premium',
            'Up to 5 additional member accounts',
            'Unlimited caregiver connections',
            'Family dashboard & shared progress',
            'Emergency protocols & alerts',
            'Custom reporting',
            'Phone support',
          ],
        ],
      );
      expect(subscriptionPlans[1].popular, isTrue);
    });
  });

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

    test('keeps cancelled store access only through the paid period', () {
      final model = SubscriptionModel.fromJson({
        'id': 42,
        'planType': 'premium',
        'status': 'cancelled',
        'billingCycle': 'monthly',
        'subscriptionPlatform': 'app_store',
        'currentPeriodEnd':
            DateTime.now().add(const Duration(days: 2)).toIso8601String(),
      });

      expect(model.grantsAccess, isTrue);
      expect(model.hasPremiumAccess, isTrue);
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