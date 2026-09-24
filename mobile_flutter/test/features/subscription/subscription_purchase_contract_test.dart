import 'package:flutter_test/flutter_test.dart';

import 'package:adaptalyfe_mobile/features/subscription/models/subscription_purchase_contract.dart';

void main() {
  group('subscription store contracts', () {
    test('recognizes only the configured store sources', () {
      expect(
        subscriptionStorePlatformFromSource('app_store'),
        SubscriptionStorePlatform.appStore,
      );
      expect(
        subscriptionStorePlatformFromSource('ios'),
        SubscriptionStorePlatform.appStore,
      );
      expect(
        subscriptionStorePlatformFromSource('google_play'),
        SubscriptionStorePlatform.googlePlay,
      );
      expect(
        subscriptionStorePlatformFromSource('android'),
        SubscriptionStorePlatform.googlePlay,
      );
      expect(subscriptionStorePlatformFromSource('unknown'), isNull);
    });

    test('deduplicates repeated store transaction updates', () {
      final first = subscriptionPurchaseEventKey(
        source: 'google_play',
        productId: 'adaptalyfe_premium_monthly',
        status: 'purchased',
        purchaseId: 'order-123',
        verificationData: 'purchase-token',
      );
      final replay = subscriptionPurchaseEventKey(
        source: 'google_play',
        productId: 'adaptalyfe_premium_monthly',
        status: 'purchased',
        purchaseId: 'order-123',
        verificationData: 'purchase-token',
      );
      final differentTransaction = subscriptionPurchaseEventKey(
        source: 'google_play',
        productId: 'adaptalyfe_premium_monthly',
        status: 'purchased',
        purchaseId: 'order-124',
        verificationData: 'another-token',
      );

      expect(replay, first);
      expect(differentTransaction, isNot(first));
    });

    test('builds the existing Google Play restore request shape', () {
      expect(
        googlePlayRestorePurchasePayload(
          purchaseToken: 'purchase-token',
          productId: 'adaptalyfe_basic_monthly',
          orderId: 'order-456',
        ),
        {
          'purchaseToken': 'purchase-token',
          'productId': 'adaptalyfe_basic_monthly',
          'orderId': 'order-456',
        },
      );
      expect(
        googlePlayRestorePurchasePayload(
          purchaseToken: 'purchase-token',
          productId: 'adaptalyfe_basic_monthly',
        ),
        {
          'purchaseToken': 'purchase-token',
          'productId': 'adaptalyfe_basic_monthly',
        },
      );
    });
  });
}