enum SubscriptionStorePlatform {
  appStore,
  googlePlay,
}

SubscriptionStorePlatform? subscriptionStorePlatformFromSource(String source) {
  // The official in_app_purchase plugin reports `AppStore` and `GooglePlay`.
  // Compact separators so those values and the API's snake_case values match.
  final normalized =
      source.trim().toLowerCase().replaceAll(RegExp(r'[^a-z0-9]'), '');
  if (normalized.contains('appstore') || normalized.contains('ios')) {
    return SubscriptionStorePlatform.appStore;
  }
  if (normalized.contains('googleplay') || normalized.contains('android')) {
    return SubscriptionStorePlatform.googlePlay;
  }
  return null;
}

String subscriptionPurchaseEventKey({
  required String source,
  required String productId,
  required String status,
  required String? purchaseId,
  required String verificationData,
  String? errorCode,
}) {
  final normalizedPurchaseId = purchaseId?.trim();
  final normalizedVerificationData = verificationData.trim();
  final String transactionReference;
  if (normalizedPurchaseId != null && normalizedPurchaseId.isNotEmpty) {
    transactionReference = normalizedPurchaseId;
  } else if (normalizedVerificationData.isNotEmpty) {
    transactionReference = normalizedVerificationData.hashCode.toString();
  } else {
    transactionReference = 'no-transaction-id';
  }
  return [
    source.trim().toLowerCase(),
    productId.trim(),
    status.trim().toLowerCase(),
    errorCode?.trim().toLowerCase() ?? '',
    transactionReference,
  ].join('|');
}

Map<String, dynamic> googlePlayRestorePurchasePayload({
  required String purchaseToken,
  required String productId,
  String? orderId,
}) {
  return {
    'purchaseToken': purchaseToken,
    'productId': productId,
    if (orderId != null && orderId.isNotEmpty) 'orderId': orderId,
  };
}