import 'package:equatable/equatable.dart';

import '../data/stripe_payment_service.dart';

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

final class PlanSelected extends SubscriptionEvent {
  const PlanSelected(this.planId);

  final String planId;

  @override
  List<Object?> get props => [planId];
}

final class PlanPurchaseRequested extends SubscriptionEvent {
  const PlanPurchaseRequested(this.planId);

  final String planId;

  @override
  List<Object?> get props => [planId];
}

final class StripePaymentRequested extends SubscriptionEvent {
  const StripePaymentRequested(this.planId, this.method);

  final String planId;
  final StripePaymentMethod method;

  @override
  List<Object?> get props => [planId, method];
}

final class RestorePurchasesRequested extends SubscriptionEvent {
  const RestorePurchasesRequested();
}

final class RecoverSubscriptionRequested extends SubscriptionEvent {
  const RecoverSubscriptionRequested();
}

final class ManageSubscriptionRequested extends SubscriptionEvent {
  const ManageSubscriptionRequested();
}

final class SubscriptionNavigationHandled extends SubscriptionEvent {
  const SubscriptionNavigationHandled();
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