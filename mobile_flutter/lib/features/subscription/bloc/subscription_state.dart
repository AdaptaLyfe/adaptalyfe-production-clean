import 'package:equatable/equatable.dart';
import 'package:in_app_purchase/in_app_purchase.dart';

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
    this.availabilityMessage,
    this.busyPlanId,
    this.managementUrl,
    this.shouldNavigateToDashboard = false,
    this.shouldRefreshAuthentication = false,
    this.purchaseNeedsVerification = false,
    this.purchasePending = false,
  });

  final SubscriptionStatus status;
  final List<SubscriptionPlan> plans;
  final SubscriptionModel? subscription;
  final Map<String, ProductDetails> products;
  final String? errorMessage;
  final String? actionMessage;
  final bool sessionInvalid;
  final bool storeAvailable;
  final String? availabilityMessage;
  final String? busyPlanId;
  final String? managementUrl;
  final bool shouldNavigateToDashboard;
  final bool shouldRefreshAuthentication;
  final bool purchaseNeedsVerification;
  final bool purchasePending;

  bool get isLoading =>
      status == SubscriptionStatus.loading ||
      status == SubscriptionStatus.initial;

  bool get isBusy =>
      status == SubscriptionStatus.purchasing ||
      status == SubscriptionStatus.restoring;

  bool get hasActiveSubscription =>
      subscription?.grantsAccess == true &&
      subscription?.isAccountTrial != true;

  bool get canStartPurchase =>
      subscription != null &&
      status == SubscriptionStatus.ready &&
      !sessionInvalid &&
      !hasActiveSubscription &&
      !purchaseNeedsVerification &&
      !purchasePending;

  bool get canPurchase => storeAvailable && canStartPurchase;

  SubscriptionState copyWith({
    SubscriptionStatus? status,
    List<SubscriptionPlan>? plans,
    Object? subscription = _notSet,
    Map<String, ProductDetails>? products,
    Object? errorMessage = _notSet,
    Object? actionMessage = _notSet,
    bool? sessionInvalid,
    bool? storeAvailable,
    Object? availabilityMessage = _notSet,
    Object? busyPlanId = _notSet,
    Object? managementUrl = _notSet,
    bool? shouldNavigateToDashboard,
    bool? shouldRefreshAuthentication,
    bool? purchaseNeedsVerification,
    bool? purchasePending,
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
      availabilityMessage: identical(availabilityMessage, _notSet)
          ? this.availabilityMessage
          : availabilityMessage as String?,
      busyPlanId: identical(busyPlanId, _notSet)
          ? this.busyPlanId
          : busyPlanId as String?,
      managementUrl: identical(managementUrl, _notSet)
          ? this.managementUrl
          : managementUrl as String?,
      shouldNavigateToDashboard:
          shouldNavigateToDashboard ?? this.shouldNavigateToDashboard,
      shouldRefreshAuthentication:
          shouldRefreshAuthentication ?? this.shouldRefreshAuthentication,
      purchaseNeedsVerification:
          purchaseNeedsVerification ?? this.purchaseNeedsVerification,
      purchasePending: purchasePending ?? this.purchasePending,
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
        availabilityMessage,
        busyPlanId,
        managementUrl,
        shouldNavigateToDashboard,
        shouldRefreshAuthentication,
        purchaseNeedsVerification,
        purchasePending,
      ];
}

const _notSet = Object();