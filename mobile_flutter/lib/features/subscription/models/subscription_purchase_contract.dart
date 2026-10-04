import 'subscription_models.dart';

const subscriptionProductIds = <String>{
  'adaptalyfe_basic_monthly',
  'adaptalyfe_premium_monthly',
  'adaptalyfe_family_monthly',
};

enum SubscriptionStore { googlePlay, appStore }

String? productIdForPlan(String planId) {
  for (final plan in subscriptionPlans) {
    if (plan.id == planId) return plan.productId;
  }
  return null;
}

SubscriptionStore? subscriptionStoreFromSource(String source) {
  final normalized = source.toLowerCase().replaceAll(RegExp(r'[^a-z0-9]'), '');
  if (normalized.contains('googleplay') ||
      normalized == 'playstore' ||
      normalized == 'android') {
    return SubscriptionStore.googlePlay;
  }
  if (normalized.contains('appstore') ||
      normalized.contains('apple') ||
      normalized == 'ios') {
    return SubscriptionStore.appStore;
  }
  return null;
}