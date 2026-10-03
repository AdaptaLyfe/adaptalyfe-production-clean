import 'package:flutter_test/flutter_test.dart';

import 'package:adaptalyfe_mobile/features/auth/bloc/auth_state.dart';
import 'package:adaptalyfe_mobile/features/subscription/models/subscription_models.dart';
import 'package:adaptalyfe_mobile/features/subscription/subscription_access.dart';
import 'package:adaptalyfe_mobile/models/user_model.dart';

void main() {
  const subscriber = Authenticated(
    UserModel(id: 1, username: 'subscriber'),
  );

  group('subscription feature access', () {
    test('active Basic subscription opens generic paid routes', () {
      const basic = SubscriptionModel(
        id: 1,
        planType: 'basic',
        status: 'active',
        billingCycle: 'monthly',
        features: {'mealPlanning': false},
      );

      expect(
        canAccessApplication(
          authState: subscriber,
          subscription: basic,
        ),
        isTrue,
      );
      expect(
        canAccessPremiumFeatures(
          authState: subscriber,
          subscription: basic,
        ),
        isTrue,
      );
      expect(
        canAccessPremiumFeatures(
          authState: subscriber,
          subscription: basic,
          featureKey: 'mealPlanning',
        ),
        isFalse,
      );
    });

    test('feature-specific routes require the backend feature entitlement', () {
      const premium = SubscriptionModel(
        id: 2,
        planType: 'premium',
        status: 'active',
        billingCycle: 'monthly',
        features: {
          'advancedAnalytics': true,
          'mealPlanning': false,
        },
      );

      expect(
        canAccessPremiumFeatures(
          authState: subscriber,
          subscription: premium,
          featureKey: 'advancedAnalytics',
        ),
        isTrue,
      );
      expect(
        canAccessPremiumFeatures(
          authState: subscriber,
          subscription: premium,
          featureKey: 'mealPlanning',
        ),
        isFalse,
      );
    });

    test('trial access ends when the server reports no days remaining', () {
      const currentTrial = SubscriptionModel(
        id: 3,
        planType: 'free',
        status: 'trialing',
        billingCycle: 'monthly',
        trialDaysLeft: 2,
        features: {'mealPlanning': true},
      );
      const endedTrial = SubscriptionModel(
        id: 4,
        planType: 'free',
        status: 'trialing',
        billingCycle: 'monthly',
        trialDaysLeft: 0,
        features: {'mealPlanning': true},
      );

      expect(
        canAccessApplication(
          authState: subscriber,
          subscription: currentTrial,
        ),
        isTrue,
      );
      expect(
        canAccessPremiumFeatures(
          authState: subscriber,
          subscription: currentTrial,
        ),
        isTrue,
      );
      expect(
        canAccessPremiumFeatures(
          authState: subscriber,
          subscription: currentTrial,
          featureKey: 'mealPlanning',
        ),
        isTrue,
      );
      expect(
        canAccessApplication(
          authState: subscriber,
          subscription: endedTrial,
        ),
        isFalse,
      );
      expect(
        canAccessPremiumFeatures(
          authState: subscriber,
          subscription: endedTrial,
        ),
        isFalse,
      );
      expect(
        canAccessPremiumFeatures(
          authState: subscriber,
          subscription: endedTrial,
          featureKey: 'mealPlanning',
        ),
        isFalse,
      );
    });

    test('admins bypass subscription checks and signed-out users do not', () {
      const admin = Authenticated(
        UserModel(id: 5, username: 'admin', accountType: 'admin'),
      );

      expect(
        canAccessPremiumFeatures(
          authState: admin,
          subscription: null,
          featureKey: 'mealPlanning',
        ),
        isTrue,
      );
      expect(
        canAccessApplication(
          authState: admin,
          subscription: null,
        ),
        isTrue,
      );
      expect(
        canAccessApplication(
          authState: const Unauthenticated(),
          subscription: null,
        ),
        isFalse,
      );
      expect(
        canAccessPremiumFeatures(
          authState: const Unauthenticated(),
          subscription: null,
        ),
        isFalse,
      );
    });

    test('active organization members bypass paid feature restrictions', () {
      const member = SubscriptionModel(
        id: 6,
        planType: 'free',
        status: 'expired',
        billingCycle: 'monthly',
        hasOrganizationAccess: true,
        features: {'mealPlanning': false},
      );

      expect(
        canAccessApplication(
          authState: subscriber,
          subscription: member,
        ),
        isTrue,
      );
      expect(
        canAccessPremiumFeatures(
          authState: subscriber,
          subscription: member,
          featureKey: 'mealPlanning',
        ),
        isTrue,
      );
    });
  });
}