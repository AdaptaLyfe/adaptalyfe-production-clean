import '../auth/bloc/auth_state.dart';
import 'models/subscription_models.dart';

bool canAccessPremiumFeatures({
  required AuthState authState,
  required SubscriptionModel? subscription,
  String? featureKey,
}) {
  if (authState is! Authenticated) return false;
  final user = authState.user;
  final isAdmin = user.accountType == 'admin' || user.username == 'admin';
  if (isAdmin) return true;

  if (subscription?.hasPremiumAccess != true) return false;
  return featureKey == null || subscription!.hasFeatureAccess(featureKey);
}