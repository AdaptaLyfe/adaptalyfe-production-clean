import 'package:flutter/foundation.dart';
import 'package:in_app_purchase/in_app_purchase.dart';

import '../models/subscription_models.dart';
import '../models/subscription_purchase_contract.dart';
import 'subscription_api.dart';

class SubscriptionRepository {
  const SubscriptionRepository(this.api);

  final SubscriptionApi api;

  Future<SubscriptionModel> getSubscription() => api.getSubscription();

  Future<PurchaseVerification> verifyPurchase(PurchaseDetails purchase) async {
    final productId = purchase.productID;
    if (!subscriptionProductIds.contains(productId)) {
      return const PurchaseVerification(
        success: false,
        message: 'This store product is not part of the Adaptalyfe catalog.',
      );
    }

    final store = subscriptionStoreFromSource(
      purchase.verificationData.source,
    ) ?? _defaultStore();
    if (store == null) {
      return const PurchaseVerification(
        success: false,
        message: 'Purchases from this platform are not supported.',
      );
    }
    switch (store) {
      case SubscriptionStore.googlePlay:
        final token = purchase.verificationData.serverVerificationData.trim();
        if (token.isEmpty) {
          return const PurchaseVerification(
            success: false,
            message: 'Google Play did not provide a purchase token.',
          );
        }
        return api.verifyGooglePurchase(
          purchaseToken: token,
          productId: productId,
          orderId: purchase.purchaseID,
        );
      case SubscriptionStore.appStore:
        final receipt = purchase.verificationData.serverVerificationData.trim();
        if (receipt.isEmpty) {
          return const PurchaseVerification(
            success: false,
            message: 'The App Store did not provide purchase data.',
          );
        }
        return api.verifyApplePurchase(
          receiptData: receipt,
          productId: productId,
          transactionId: purchase.purchaseID,
        );
    }
  }

  static SubscriptionStore? _defaultStore() {
    switch (defaultTargetPlatform) {
      case TargetPlatform.android:
        return SubscriptionStore.googlePlay;
      case TargetPlatform.iOS:
        return SubscriptionStore.appStore;
      default:
        return null;
    }
  }
}