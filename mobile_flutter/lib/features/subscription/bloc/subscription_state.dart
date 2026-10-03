import 'package:equatable/equatable.dart';
import 'package:in_app_purchase/in_app_purchase.dart';

import '../models/subscription_models.dart';

enum SubscriptionStatus {
  initial,
  loading,
  ready,
  purchasing,
  restoring,
  recovering,
  cancelled,
  failure,
}

class SubscriptionState extends Equatable {
  const SubscriptionState({
    this.status = SubscriptionStatus.initial,
    this.accountStatusLoaded = false,
    this.plans = subscriptionPlans,
    this.subscription,
    this.products = const <String, ProductDetails>{},
    this.errorMessage,
    this.actionMessage,
    this.sessionInvalid = false,
    this.storeAvailable = false,
    this.availabilityMessage,
    this.busyPlanId,
    this.selectedPlanId,
    this.managementUrl,
    this.shouldNavigateToDashboard = false,
    this.shouldRefreshAuthentication = false,
  });

  final SubscriptionStatus status;
  final bool accountStatusLoaded;
  final List<SubscriptionPlan> plans;
  final SubscriptionModel? subscription;
  final Map<String, ProductDetails> products;
  final String? errorMessage;
  final String? actionMessage;
  final bool sessionInvalid;
  final bool storeAvailable;
  final String? availabilityMessage;
  final String? busyPlanId;
  final String? selectedPlanId;
  final String? managementUrl;
  final bool shouldNavigateToDashboard;
  final bool shouldRefreshAuthentication;

  bool get isLoading =>
      status == SubscriptionStatus.loading ||
      status == SubscriptionStatus.initial;
  bool get isBusy =>
      status == SubscriptionStatus.purchasing ||
      status == SubscriptionStatus.restoring ||
      status == SubscriptionStatus.recovering;
  bool get hasActiveSubscription =>
      accountStatusLoaded && subscription?.hasPlanEntitlement == true;
  bool get canPurchase =>
      accountStatusLoaded &&
      !isLoading &&
      !sessionInvalid &&
      storeAvailable &&
      !hasActiveSubscription &&
      !isBusy;
  SubscriptionState copyWith({
    SubscriptionStatus? status,
    bool? accountStatusLoaded,
    List<SubscriptionPlan>? plans,
    Object? subscription = _notSet,
    Map<String, ProductDetails>? products,
    Object? errorMessage = _notSet,
    Object? actionMessage = _notSet,
    bool? sessionInvalid,
    bool? storeAvailable,
    Object? availabilityMessage = _notSet,
    Object? busyPlanId = _notSet,
    Object? selectedPlanId = _notSet,
    Object? managementUrl = _notSet,
    bool? shouldNavigateToDashboard,
    bool? shouldRefreshAuthentication,
  }) {
    return SubscriptionState(
      status: status ?? this.status,
      accountStatusLoaded: accountStatusLoaded ?? this.accountStatusLoaded,
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
      availabilityMessage: identical(availabilityMessage, _notSet)
          ? this.availabilityMessage
          : availabilityMessage as String?,
      busyPlanId: identical(busyPlanId, _notSet)
          ? this.busyPlanId
          : busyPlanId as String?,
      selectedPlanId: identical(selectedPlanId, _notSet)
          ? this.selectedPlanId
          : selectedPlanId as String?,
      managementUrl: identical(managementUrl, _notSet)
          ? this.managementUrl
          : managementUrl as String?,
      shouldNavigateToDashboard:
          shouldNavigateToDashboard ?? this.shouldNavigateToDashboard,
      shouldRefreshAuthentication:
          shouldRefreshAuthentication ?? this.shouldRefreshAuthentication,
    );
  }

  @override
  List<Object?> get props => [
        status,
        accountStatusLoaded,
        plans,
        subscription,
        products,
        errorMessage,
        actionMessage,
        sessionInvalid,
        storeAvailable,
        availabilityMessage,
        busyPlanId,
        selectedPlanId,
        managementUrl,
        shouldNavigateToDashboard,
        shouldRefreshAuthentication,
      ];
}

const _notSet = Object();