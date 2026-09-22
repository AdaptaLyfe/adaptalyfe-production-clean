import 'package:equatable/equatable.dart';

import '../models/subscription_models.dart';

enum SubscriptionStatus {
  initial,
  loading,
  ready,
  purchasing,
  restoring,
  cancelled,
  notAvailable,
  configurationError,
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
    this.selectedPlanId,
    this.managementUrl,
    this.stripeAvailable = false,
    this.walletAvailable = false,
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
  final String? selectedPlanId;
  final String? managementUrl;
  final bool stripeAvailable;
  final bool walletAvailable;

  bool get isLoading =>
      status == SubscriptionStatus.loading || status == SubscriptionStatus.initial;
  bool get isBusy =>
      status == SubscriptionStatus.purchasing ||
      status == SubscriptionStatus.restoring;
  bool get hasActiveSubscription => subscription?.isActive == true;
  bool get canPurchase => storeAvailable && !hasActiveSubscription && !isBusy;
  bool get canUseStripe =>
      stripeAvailable && !hasActiveSubscription && !isBusy;

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
    Object? selectedPlanId = _notSet,
    Object? managementUrl = _notSet,
    bool? stripeAvailable,
    bool? walletAvailable,
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
      selectedPlanId: identical(selectedPlanId, _notSet)
          ? this.selectedPlanId
          : selectedPlanId as String?,
      managementUrl: identical(managementUrl, _notSet)
          ? this.managementUrl
          : managementUrl as String?,
      stripeAvailable: stripeAvailable ?? this.stripeAvailable,
      walletAvailable: walletAvailable ?? this.walletAvailable,
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
    selectedPlanId,
        managementUrl,
        stripeAvailable,
        walletAvailable,
      ];
}

const _notSet = Object();