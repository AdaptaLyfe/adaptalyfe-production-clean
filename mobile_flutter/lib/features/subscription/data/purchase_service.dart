import 'dart:async';

import 'package:in_app_purchase/in_app_purchase.dart';

import '../models/subscription_models.dart';

class PurchaseService {
  PurchaseService({InAppPurchase? store})
      : _store = store ?? InAppPurchase.instance;

  final InAppPurchase _store;

  Stream<List<PurchaseDetails>> get purchaseStream => _store.purchaseStream;

  Future<PurchaseAvailability> initialize() async {
    final available = await _store.isAvailable();
    if (!available) {
      return const PurchaseAvailability(available: false);
    }

    final response = await _store.queryProductDetails(
      subscriptionPlans.map((plan) => plan.productId).toSet(),
    );
    return PurchaseAvailability(
      available: true,
      products: response.productDetails,
      notFoundIds: response.notFoundIDs,
    );
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
}

class PurchaseAvailability {
  const PurchaseAvailability({
    required this.available,
    this.products = const [],
    this.notFoundIds = const [],
  });

  final bool available;
  final List<ProductDetails> products;
  final List<String> notFoundIds;
}