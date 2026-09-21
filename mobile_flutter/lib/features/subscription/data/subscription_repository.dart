import '../models/subscription_models.dart';
import 'subscription_api.dart';

class SubscriptionRepository {
  const SubscriptionRepository(this.api);

  final SubscriptionApi api;

  Future<SubscriptionModel> getSubscription() => api.getSubscription();

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

  Future<PurchaseVerification> restoreApplePurchase(String receiptData) =>
      api.restoreApplePurchase(receiptData: receiptData);

  Future<PurchaseVerification> restoreGooglePurchases(
    List<Map<String, dynamic>> purchases,
  ) =>
      api.restoreGooglePurchases(purchases);

  Future<StripeSubscriptionSetup> createStripeSubscription({
    required String planType,
    required String billingCycle,
  }) =>
      api.createStripeSubscription(
        planType: planType,
        billingCycle: billingCycle,
      );

  Future<PurchaseVerification> confirmStripeSubscription(
    String subscriptionId,
  ) =>
      api.confirmStripeSubscription(subscriptionId);
}