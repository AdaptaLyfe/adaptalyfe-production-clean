import 'package:adaptalyfe_mobile/features/subscription/models/subscription_purchase_contract.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('Google Play purchase catalog', () {
    test('uses the product IDs already mapped by the backend', () {
      expect(productIdForPlan('basic'), 'adaptalyfe_basic_monthly');
      expect(productIdForPlan('premium'), 'adaptalyfe_premium_monthly');
      expect(productIdForPlan('family'), 'adaptalyfe_family_monthly');
      expect(productIdForPlan('unknown'), isNull);
    });

    test('normalizes store source names from the purchase plugin', () {
      expect(
        subscriptionStoreFromSource('GooglePlay'),
        SubscriptionStore.googlePlay,
      );
      expect(
        subscriptionStoreFromSource('AppStore'),
        SubscriptionStore.appStore,
      );
      expect(subscriptionStoreFromSource('unknown'), isNull);
    });
  });
}