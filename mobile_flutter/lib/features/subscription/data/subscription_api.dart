import '../../../core/network/api_client.dart';
import '../models/subscription_models.dart';

/// Calls only the existing authenticated Adaptalyfe subscription endpoints.
class SubscriptionApi {
  const SubscriptionApi(this.client);

  final ApiClient client;

  Future<SubscriptionModel> getSubscription() async {
    final response = await client.get<dynamic>('/api/subscription');
    if (response.data is! Map) {
      throw const FormatException('Invalid subscription response.');
    }
    return SubscriptionModel.fromJson(
      Map<String, dynamic>.from(response.data as Map),
    );
  }

  Future<PurchaseVerification> verifyGooglePurchase({
    required String purchaseToken,
    required String productId,
    String? orderId,
  }) =>
      _postVerification(
        '/api/google-play/verify-purchase',
        {
          'purchaseToken': purchaseToken,
          'productId': productId,
          if (orderId != null && orderId.isNotEmpty) 'orderId': orderId,
        },
      );

  Future<PurchaseVerification> verifyApplePurchase({
    required String receiptData,
    required String productId,
    String? transactionId,
  }) =>
      _postVerification(
        '/api/apple/verify-purchase',
        {
          'receiptData': receiptData,
          'productId': productId,
          if (transactionId != null && transactionId.isNotEmpty)
            'transactionId': transactionId,
        },
      );

  Future<PurchaseVerification> restoreGooglePurchases({
    required List<Map<String, dynamic>> purchases,
  }) =>
      _postVerification(
        '/api/google-play/restore-purchases',
        {'purchases': purchases},
      );

  Future<PurchaseVerification> _postVerification(
    String path,
    Map<String, dynamic> body,
  ) async {
    final response = await client.post<dynamic>(path, data: body);
    if (response.data is! Map) {
      throw const FormatException('Invalid purchase verification response.');
    }
    return PurchaseVerification.fromJson(
      Map<String, dynamic>.from(response.data as Map),
    );
  }
}