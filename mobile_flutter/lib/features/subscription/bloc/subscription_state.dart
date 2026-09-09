import 'package:equatable/equatable.dart';

import '../models/subscription_models.dart';

enum SubscriptionStatus {
  initial,
  loading,
  ready,
  purchasing,
  restoring,
  failure,
}

class SubscriptionState extends Equatable {
  const SubscriptionState({
    this.status = SubscriptionStatus.initial,
    this.plans = subscriptionPlans,
    this.subscription,
    this.products = const {},
    this.errorMessage,
    this.actionMessage,
    this.sessionInvalid = false,
    this.storeAvailable = false,
    this.busyPlanId,
    this.managementUrl,
  });

  final SubscriptionStatus status;
  final List<SubscriptionPlan> plans;
  final SubscriptionModel? subscription;
  final Map<String, dynamic> products;
  final String? errorMessage;
  final String? actionMessage;
  final bool sessionInvalid;
  final bool storeAvailable;
  final String? busyPlanId;
  final String? managementUrl;

  bool get isLoading =>
      status == SubscriptionStatus.loading || status == SubscriptionStatus.initial;
  bool get isBusy =>
      status == SubscriptionStatus.purchasing ||
      status == SubscriptionStatus.restoring;
  bool get hasActiveSubscription => subscription?.isActive == true;
  bool get canPurchase => storeAvailable && !hasActiveSubscription && !isBusy;

  SubscriptionState copyWith({
    SubscriptionStatus? status,
    List<SubscriptionPlan>? plans,
    Object? subscription = _notSet,
    Map<String, dynamic>? products,
    Object? errorMessage = _notSet,
    Object? actionMessage = _notSet,
    bool? sessionInvalid,
    bool? storeAvailable,
    Object? busyPlanId = _notSet,
    Object? managementUrl = _notSet,
  }) {
    return SubscriptionState(
      status: status ?? this.status,
      plans: plans ?? this.plans,
      subscription: identical(subscription, _notSet)
          ? this.subscription
          : subscription as SubscriptionModel?,
      products: products ?? this.products,
      errorMessage: identical(errorMessage, _notSet)
          ? this.errorMessage
          : errorMessage as String?,
      actionMessage: identical(actionMessage, _notSet)
          ? this.actionMessage
          : actionMessage as String?,
      sessionInvalid: sessionInvalid ?? this.sessionInvalid,
      storeAvailable: storeAvailable ?? this.storeAvailable,
      busyPlanId: identical(busyPlanId, _notSet)
          ? this.busyPlanId
          : busyPlanId as String?,
      managementUrl: identical(managementUrl, _notSet)
          ? this.managementUrl
          : managementUrl as String?,
    );
  }

  @override
  List<Object?> get props => [
        status,
        plans,
        subscription,
        products,
        errorMessage,
        actionMessage,
        sessionInvalid,
        storeAvailable,
        busyPlanId,
        managementUrl,
      ];
}

const _notSet = Object();