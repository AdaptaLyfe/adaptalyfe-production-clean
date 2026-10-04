import 'dart:io';

import 'package:in_app_purchase/in_app_purchase.dart';
import 'package:in_app_purchase_android/in_app_purchase_android.dart';

import '../models/subscription_purchase_contract.dart';

class StoreProductCatalog {
  const StoreProductCatalog({
    required this.products,
    required this.notFoundProductIds,
    this.errorMessage,
  });

  final Map<String, ProductDetails> products;
  final Set<String> notFoundProductIds;
  final String? errorMessage;
}

/// Thin adapter over the official store plugin. It has no entitlement logic:
/// every completed purchase is verified by the existing Adaptalyfe backend.
class PurchaseService {
  PurchaseService({InAppPurchase? store})
      : _store = store ?? InAppPurchase.instance;

  final InAppPurchase _store;

  Stream<List<PurchaseDetails>> get purchaseStream => _store.purchaseStream;

  Future<bool> isAvailable() => _store.isAvailable();

  Future<StoreProductCatalog> loadSubscriptionProducts() async {
    final response = await _store.queryProductDetails(subscriptionProductIds);
    final products = <String, ProductDetails>{};
    final notFound = response.notFoundIDs.toSet();

    for (final productId in subscriptionProductIds) {
      final candidates = response.productDetails
          .where((product) => product.id == productId)
          .toList(growable: false);
      if (candidates.isEmpty) {
        notFound.add(productId);
        continue;
      }

      if (Platform.isAndroid) {
        final eligibleOffers = candidates
            .whereType<GooglePlayProductDetails>()
            .where((product) =>
                product.offerToken != null && product.offerToken!.isNotEmpty)
            .toList(growable: false);
        if (eligibleOffers.isEmpty) {
          notFound.add(productId);
          continue;
        }
        products[productId] = eligibleOffers.first;
      } else {
        products[productId] = candidates.first;
      }
    }

    return StoreProductCatalog(
      products: Map.unmodifiable(products),
      notFoundProductIds: Set.unmodifiable(notFound),
      errorMessage: response.error?.message,
    );
  }

  Future<bool> buySubscription(ProductDetails product) {
    final PurchaseParam purchaseParam;
    if (Platform.isAndroid) {
      if (product is! GooglePlayProductDetails ||
          product.offerToken == null ||
          product.offerToken!.isEmpty) {
        throw StateError(
          'Google Play did not return an eligible subscription offer.',
        );
      }
      purchaseParam = GooglePlayPurchaseParam(
        productDetails: product,
        offerToken: product.offerToken!,
      );
    } else {
      purchaseParam = PurchaseParam(productDetails: product);
    }

    return _store.buyNonConsumable(purchaseParam: purchaseParam);
  }

  Future<void> restorePurchases() => _store.restorePurchases();

  Future<void> completePurchase(PurchaseDetails purchase) =>
      _store.completePurchase(purchase);
}