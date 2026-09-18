import 'package:equatable/equatable.dart';

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

final class LoadPlans extends SubscriptionEvent {
  const LoadPlans();
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

final class ManageSubscriptionRequested extends SubscriptionEvent {
  const ManageSubscriptionRequested();
}

final class ManagementUrlHandled extends SubscriptionEvent {
  const ManagementUrlHandled();
}

final class PurchaseUpdatesReceived extends SubscriptionEvent {
  const PurchaseUpdatesReceived(this.purchases);

  final List<Object> purchases;

  @override
  List<Object?> get props => [purchases];
}