import '../models/subscription_models.dart';
import 'subscription_api.dart';

class SubscriptionRepository {
  const SubscriptionRepository(this.api);

  final SubscriptionApi api;

  Future<SubscriptionModel> getSubscription() async {
    final subscription = await api.getSubscription();
    final hasOrganizationAccess =
        await api.hasActiveOrganizationMembership();
    return subscription.withOrganizationAccess(hasOrganizationAccess);
  }

  Future<PurchaseVerification> verifyApplePurchase({
    required String receiptData,
    required String productId,
    String? transactionId,
  }) =>
      api.verifyApplePurchase(
        receiptData: receiptData,
        productId: productId,
        transactionId: transactionId,
      );

  Future<PurchaseVerification> verifyGooglePurchase({
    required String purchaseToken,
    required String productId,
    String? orderId,
  }) =>
      api.verifyGooglePurchase(
        purchaseToken: purchaseToken,
        productId: productId,
        orderId: orderId,
      );

  Future<PurchaseVerification> restoreGooglePurchases(
    List<Map<String, dynamic>> purchases,
  ) =>
      api.restoreGooglePurchases(purchases);

  Future<void> recoverStripeSubscription() =>
      api.recoverStripeSubscription();
}
