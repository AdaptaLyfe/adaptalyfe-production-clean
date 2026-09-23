import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:in_app_purchase/in_app_purchase.dart';

import '../models/subscription_models.dart';

class PurchaseService {
  PurchaseService({InAppPurchase? store})
      : _store = store ?? InAppPurchase.instance;

  final InAppPurchase _store;

  Stream<List<PurchaseDetails>> get purchaseStream => _store.purchaseStream;

  Future<PurchaseAvailability> initialize() async {
    final storeName = _storeName;
    final requestedProductIds =
        subscriptionPlans.map((plan) => plan.productId).toSet();
    debugPrint(
      '[Subscription IAP] Requested Product IDs: $requestedProductIds',
    );
    try {
      final available = await _store.isAvailable();
      debugPrint('[Subscription IAP] Store Available: $available ($storeName)');
      if (!available) {
        return PurchaseAvailability(
          available: false,
          message:
              '$storeName is not available. Install this app from the store '
              'and try again.',
        );
      }

      final response = await _store.queryProductDetails(
        requestedProductIds,
      );
      final products = response.productDetails;
      final returnedProductIds = products.map((product) => product.id).toList();
      debugPrint(
        '[Subscription IAP] Returned Product IDs: $returnedProductIds',
      );
      debugPrint(
        '[Subscription IAP] Not Found Product IDs: ${response.notFoundIDs}',
      );
      final message = response.notFoundIDs.isNotEmpty
          ? '$storeName did not return one or more subscription products. '
              'Confirm the product IDs, app identifier, store listing, and '
              'tester account.'
          : products.isEmpty
              ? '$storeName returned no subscription products. Confirm that '
                  'the products are configured for this app and available to '
                  'the current tester account.'
              : null;

      return PurchaseAvailability(
        available: products.isNotEmpty,
        products: products,
        notFoundIds: response.notFoundIDs,
        message: message,
      );
    } catch (error) {
      debugPrint('[Subscription IAP] Product query error: $error');
      return PurchaseAvailability(
        available: false,
        message:
            'Could not connect to $storeName. Check the store account and '
            'billing setup, then try again.',
      );
    }
  }

  Future<bool> buy(ProductDetails product) {
    // Subscriptions are non-consumable from the Flutter plugin's purchase
    // API. StoreKit/Play still own renewal and cancellation.
    return _store.buyNonConsumable(
      purchaseParam: PurchaseParam(productDetails: product),
    );
  }

  Future<void> restore() => _store.restorePurchases();

  Future<void> complete(PurchaseDetails purchase) async {
    if (purchase.pendingCompletePurchase) {
      await _store.completePurchase(purchase);
    }
  }

  String get _storeName {
    switch (defaultTargetPlatform) {
      case TargetPlatform.android:
        return 'Google Play';
      case TargetPlatform.iOS:
        return 'The App Store';
      default:
        return 'The app store';
    }
  }
}

class PurchaseAvailability {
  const PurchaseAvailability({
    required this.available,
    this.products = const [],
    this.notFoundIds = const [],
    this.message,
  });

  final bool available;
  final List<ProductDetails> products;
  final List<String> notFoundIds;
  final String? message;
}