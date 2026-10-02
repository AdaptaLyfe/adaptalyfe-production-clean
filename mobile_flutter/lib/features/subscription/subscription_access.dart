import '../auth/bloc/auth_state.dart';
import 'models/subscription_models.dart';

bool canAccessPremiumFeatures({
  required AuthState authState,
  required SubscriptionModel? subscription,
}) {
  if (authState is! Authenticated) return false;
  final user = authState.user;
  final isAdmin = user.accountType == 'admin' || user.username == 'admin';
  return isAdmin || subscription?.hasPremiumAccess == true;
}