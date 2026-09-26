import '../../../core/network/api_client.dart';
import '../models/subscription_models.dart';

class SubscriptionApi {
  const SubscriptionApi(this.client);

  final ApiClient client;

  Future<SubscriptionModel> getSubscription() async {
    final response = await client.get<dynamic>('/api/subscription');
    if (response.data is! Map) {
      throw const FormatException('Invalid subscription response');
    }
    return SubscriptionModel.fromJson(
      Map<String, dynamic>.from(response.data as Map),
    );
  }

  Future<PurchaseVerification> verifyApplePurchase({
    required String receiptData,
    required String productId,
    String? transactionId,
  }) =>
      _verify(
        '/api/apple/verify-purchase',
        {
          'receiptData': receiptData,
          'productId': productId,
          if (transactionId != null) 'transactionId': transactionId,
        },
      );

  Future<PurchaseVerification> verifyGooglePurchase({
    required String purchaseToken,
    required String productId,
    String? orderId,
  }) =>
      _verify(
        '/api/google-play/verify-purchase',
        {
          'purchaseToken': purchaseToken,
          'productId': productId,
          if (orderId != null) 'orderId': orderId,
        },
      );

  Future<PurchaseVerification> restoreApplePurchase({
    required String receiptData,
  }) =>
      _verify('/api/apple/restore-purchases', {'receiptData': receiptData});

  Future<PurchaseVerification> restoreGooglePurchases(
    List<Map<String, dynamic>> purchases,
  ) =>
      _verify('/api/google-play/restore-purchases', {'purchases': purchases});

  Future<StripeSubscriptionSetup> createStripeSubscription({
    required String planType,
    required String billingCycle,
  }) async {
    final response = await client.post<dynamic>(
      '/api/create-subscription',
      data: {
        'planType': planType,
        'billingCycle': billingCycle,
      },
    );
    if (response.data is! Map) {
      throw const FormatException('Invalid subscription setup response');
    }
    return StripeSubscriptionSetup.fromJson(
      Map<String, dynamic>.from(response.data as Map),
    );
  }

  Future<PurchaseVerification> confirmStripeSubscription(
    String subscriptionId,
  ) =>
      _verify(
        '/api/confirm-subscription',
        {'subscriptionId': subscriptionId},
      );

  Future<void> recoverStripeSubscription() async {
    final response = await client.post<dynamic>('/api/recover-subscription');
    if (response.data is! Map) {
      throw const FormatException('Invalid subscription recovery response');
    }
  }

  Future<PurchaseVerification> _verify(
    String path,
    Map<String, dynamic> body,
  ) async {
    final response = await client.post<dynamic>(path, data: body);
    if (response.data is! Map) {
      throw const FormatException('Invalid subscription action response');
    }
    return PurchaseVerification.fromJson(
      Map<String, dynamic>.from(response.data as Map),
    );
  }
}