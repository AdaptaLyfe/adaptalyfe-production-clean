import 'package:equatable/equatable.dart';
import 'package:in_app_purchase/in_app_purchase.dart';

sealed class SubscriptionEvent extends Equatable {
  const SubscriptionEvent();

  @override
  List<Object?> get props => [];
}

final class SubscriptionStarted extends SubscriptionEvent {
  const SubscriptionStarted();
}

final class RefreshSubscription extends SubscriptionEvent {
  const RefreshSubscription();
}

final class PlanPurchaseRequested extends SubscriptionEvent {
  const PlanPurchaseRequested(this.planId);

  final String planId;

  @override
  List<Object?> get props => [planId];
}

final class RestorePurchasesRequested extends SubscriptionEvent {
  const RestorePurchasesRequested();
}

final class RetryPurchaseVerificationRequested extends SubscriptionEvent {
  const RetryPurchaseVerificationRequested();
}

final class ManageSubscriptionRequested extends SubscriptionEvent {
  const ManageSubscriptionRequested();
}

final class SubscriptionNavigationHandled extends SubscriptionEvent {
  const SubscriptionNavigationHandled();
}

final class SubscriptionAuthenticationRefreshHandled
    extends SubscriptionEvent {
  const SubscriptionAuthenticationRefreshHandled();
}

final class ManagementUrlHandled extends SubscriptionEvent {
  const ManagementUrlHandled();
}

final class PurchaseUpdatesReceived extends SubscriptionEvent {
  const PurchaseUpdatesReceived(this.purchases);

  final List<PurchaseDetails> purchases;

  @override
  List<Object?> get props => [purchases];
}

final class PurchaseStreamFailed extends SubscriptionEvent {
  const PurchaseStreamFailed();
}