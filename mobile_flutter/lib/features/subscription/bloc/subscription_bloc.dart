import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:in_app_purchase/in_app_purchase.dart';

import '../../../core/network/api_client.dart';
import '../data/purchase_service.dart';
import '../data/subscription_repository.dart';
import '../models/subscription_models.dart';
import 'subscription_event.dart';
import 'subscription_state.dart';

class SubscriptionBloc extends Bloc<SubscriptionEvent, SubscriptionState> {
  SubscriptionBloc(this.repository, this.purchaseService)
      : super(const SubscriptionState()) {
    on<SubscriptionStarted>(_load);
    on<RefreshSubscription>(_refresh);
    on<PlanPurchaseRequested>(_purchase);
    on<RestorePurchasesRequested>(_restore);
    on<RetryPurchaseVerificationRequested>(_restore);
    on<ManageSubscriptionRequested>(_manage);
    on<SubscriptionNavigationHandled>(_clearDashboardNavigation);
    on<SubscriptionAuthenticationRefreshHandled>(
      _clearAuthenticationRefresh,
    );
    on<ManagementUrlHandled>(_clearManagementUrl);
    on<PurchaseUpdatesReceived>(
      _handlePurchases,
      transformer: (events, mapper) => events.asyncExpand(mapper),
    );
    on<PurchaseStreamFailed>((event, emit) {
      emit(state.copyWith(
        actionMessage: 'The store connection was interrupted. Try again.',
      ));
    });

    _purchaseSubscription = purchaseService.purchaseStream.listen(
      (purchases) => add(PurchaseUpdatesReceived(purchases)),
      onError: (Object _) => add(const PurchaseStreamFailed()),
    );
  }

  final SubscriptionRepository repository;
  final PurchaseService purchaseService;
  late final StreamSubscription<List<PurchaseDetails>> _purchaseSubscription;
  final Set<String> _verifiedPurchaseKeys = {};

  Future<void> _load(
    SubscriptionStarted event,
    Emitter<SubscriptionState> emit,
  ) async {
    emit(state.copyWith(
      status: SubscriptionStatus.loading,
      errorMessage: null,
      actionMessage: null,
    ));

    var storeAvailable = false;
    var products = state.products;
    String? availabilityMessage;
    try {
      storeAvailable = await purchaseService.isAvailable();
      if (storeAvailable) {
        final catalog = await purchaseService.loadSubscriptionProducts();
        products = catalog.products;
        availabilityMessage = _catalogMessage(catalog);
      } else {
        availabilityMessage =
            'Subscriptions are available only through the app store on this device.';
      }
    } catch (_) {
      availabilityMessage =
          'The store could not load subscription prices. Check your connection and try again.';
    }

    try {
      final subscription = await repository.getSubscription();
      emit(state.copyWith(
        status: storeAvailable
            ? SubscriptionStatus.ready
            : SubscriptionStatus.notAvailable,
        subscription: subscription,
        products: products,
        storeAvailable: storeAvailable,
        availabilityMessage: availabilityMessage,
        sessionInvalid: false,
        errorMessage: null,
      ));
    } on ApiException catch (error) {
      emit(state.copyWith(
        status: SubscriptionStatus.failure,
        products: products,
        storeAvailable: storeAvailable,
        availabilityMessage: availabilityMessage,
        sessionInvalid: error.type == ApiErrorType.unauthorized,
        errorMessage: error.message,
      ));
    } catch (_) {
      emit(state.copyWith(
        status: SubscriptionStatus.failure,
        products: products,
        storeAvailable: storeAvailable,
        availabilityMessage: availabilityMessage,
        errorMessage: 'Could not load your subscription. Please try again.',
      ));
    }
  }

  Future<void> _refresh(
    RefreshSubscription event,
    Emitter<SubscriptionState> emit,
  ) async {
    if (state.subscription == null) {
      emit(state.copyWith(status: SubscriptionStatus.loading));
    }
    try {
      final subscription = await repository.getSubscription();
      emit(state.copyWith(
        status: state.storeAvailable
            ? SubscriptionStatus.ready
            : SubscriptionStatus.notAvailable,
        subscription: subscription,
        sessionInvalid: false,
        errorMessage: null,
      ));
    } on ApiException catch (error) {
      emit(state.copyWith(
        status: SubscriptionStatus.failure,
        sessionInvalid: error.type == ApiErrorType.unauthorized,
        errorMessage: error.message,
      ));
    } catch (_) {
      emit(state.copyWith(
        status: SubscriptionStatus.failure,
        errorMessage: 'Could not check your subscription. Please try again.',
      ));
    }
  }

  Future<void> _purchase(
    PlanPurchaseRequested event,
    Emitter<SubscriptionState> emit,
  ) async {
    SubscriptionPlan? plan;
    for (final candidate in subscriptionPlans) {
      if (candidate.id == event.planId) {
        plan = candidate;
        break;
      }
    }
    if (plan == null || !state.canPurchase) return;

    final product = state.products[plan.productId];
    if (product == null) {
      emit(state.copyWith(
        actionMessage:
            'This plan is not available in the store. Check the product ID and active base plan in Play Console.',
      ));
      return;
    }

    emit(state.copyWith(
      status: SubscriptionStatus.purchasing,
      busyPlanId: plan.id,
      actionMessage: null,
      errorMessage: null,
    ));
    try {
      final launched = await purchaseService.buySubscription(product);
      if (!launched && state.status == SubscriptionStatus.purchasing) {
        emit(state.copyWith(
          status: SubscriptionStatus.ready,
          busyPlanId: null,
          actionMessage: 'The store did not start the purchase. Try again.',
        ));
      }
    } catch (_) {
      emit(state.copyWith(
        status: SubscriptionStatus.ready,
        busyPlanId: null,
        actionMessage: 'The store could not start this purchase. Try again.',
      ));
    }
  }

  Future<void> _restore(
    SubscriptionEvent event,
    Emitter<SubscriptionState> emit,
  ) async {
    if (!state.storeAvailable) {
      emit(state.copyWith(
        actionMessage: 'The app store is not available on this device.',
      ));
      return;
    }
    emit(state.copyWith(
      status: SubscriptionStatus.restoring,
      actionMessage: null,
    ));
    try {
      await purchaseService.restorePurchases();
      if (state.status == SubscriptionStatus.restoring) {
        emit(state.copyWith(
          status: SubscriptionStatus.ready,
          actionMessage:
              'Restore requested. Any purchase found by the store will be verified with your Adaptalyfe account.',
        ));
      }
    } catch (_) {
      emit(state.copyWith(
        status: SubscriptionStatus.ready,
        actionMessage: 'The store could not restore purchases. Try again.',
      ));
    }
  }

  Future<void> _handlePurchases(
    PurchaseUpdatesReceived event,
    Emitter<SubscriptionState> emit,
  ) async {
    for (final purchase in event.purchases) {
      if (isClosed) return;
      await _handlePurchase(purchase, emit);
    }
  }

  Future<void> _handlePurchase(
    PurchaseDetails purchase,
    Emitter<SubscriptionState> emit,
  ) async {
    switch (purchase.status) {
      case PurchaseStatus.pending:
        emit(state.copyWith(
          status: SubscriptionStatus.ready,
          busyPlanId: null,
          purchaseNeedsVerification: false,
          purchasePending: true,
          actionMessage:
              'The store is still processing payment. Access begins after it confirms the purchase.',
        ));
        return;
      case PurchaseStatus.canceled:
        emit(state.copyWith(
          status: state.storeAvailable
              ? SubscriptionStatus.ready
              : SubscriptionStatus.notAvailable,
          busyPlanId: null,
          purchaseNeedsVerification: false,
          purchasePending: false,
          actionMessage: 'Purchase cancelled.',
        ));
        return;
      case PurchaseStatus.error:
        emit(state.copyWith(
          status: state.storeAvailable
              ? SubscriptionStatus.ready
              : SubscriptionStatus.notAvailable,
          busyPlanId: null,
          purchaseNeedsVerification: false,
          purchasePending: false,
          actionMessage:
              'The store could not complete this purchase. Check your Play account and try again.',
        ));
        return;
      case PurchaseStatus.purchased:
      case PurchaseStatus.restored:
        await _verifyPurchase(purchase, emit);
        return;
    }
  }

  Future<void> _verifyPurchase(
    PurchaseDetails purchase,
    Emitter<SubscriptionState> emit,
  ) async {
    final purchaseKey = _purchaseKey(purchase);
    if (_verifiedPurchaseKeys.contains(purchaseKey)) {
      await _completeStoreTransaction(purchase);
      return;
    }

    SubscriptionPlan? plan;
    for (final candidate in subscriptionPlans) {
      if (candidate.productId == purchase.productID) {
        plan = candidate;
        break;
      }
    }
    emit(state.copyWith(
      status: SubscriptionStatus.purchasing,
      busyPlanId: plan?.id,
      purchaseNeedsVerification: true,
      purchasePending: false,
      actionMessage: null,
    ));

    try {
      final verification = await repository.verifyPurchase(purchase);
      if (!verification.success) {
        emit(state.copyWith(
          status: SubscriptionStatus.ready,
          busyPlanId: null,
          purchaseNeedsVerification: true,
          purchasePending: false,
          actionMessage: verification.message ??
              'The store purchase is not active yet. Restore purchases to check again.',
        ));
        return;
      }

      SubscriptionModel? entitlement = verification.subscription;
      if (!_matchesVerifiedPurchase(entitlement, purchase)) {
        entitlement = await repository.getSubscription();
      }
      if (!_matchesVerifiedPurchase(entitlement, purchase)) {
        emit(state.copyWith(
          status: SubscriptionStatus.ready,
          busyPlanId: null,
          purchaseNeedsVerification: true,
          purchasePending: false,
          actionMessage:
              'Payment was received, but the matching plan is not active on your account yet. Retry verification; you will not be charged again.',
        ));
        return;
      }

      await _completeStoreTransaction(purchase);
      _verifiedPurchaseKeys.add(purchaseKey);

      emit(state.copyWith(
        status: SubscriptionStatus.ready,
        subscription: entitlement,
        busyPlanId: null,
        purchaseNeedsVerification: false,
        purchasePending: false,
        shouldNavigateToDashboard: true,
        shouldRefreshAuthentication: true,
        actionMessage: 'Your subscription is verified and active.',
        errorMessage: null,
      ));
    } on ApiException catch (error) {
      emit(state.copyWith(
        status: SubscriptionStatus.failure,
        busyPlanId: null,
        purchaseNeedsVerification: true,
        purchasePending: false,
        sessionInvalid: error.type == ApiErrorType.unauthorized,
        actionMessage:
            'The store payment could not be linked to your account yet. Retry verification; do not purchase again.',
        errorMessage: error.message,
      ));
    } catch (_) {
      emit(state.copyWith(
        status: SubscriptionStatus.ready,
        busyPlanId: null,
        purchaseNeedsVerification: true,
        purchasePending: false,
        actionMessage:
            'The store payment could not be linked to your account yet. Retry verification; do not purchase again.',
      ));
    }
  }

  bool _matchesVerifiedPurchase(
    SubscriptionModel? entitlement,
    PurchaseDetails purchase,
  ) {
    if (entitlement == null ||
        !entitlement.grantsAccess ||
        entitlement.isAccountTrial ||
        !entitlement.usesStoreBilling) {
      return false;
    }

    SubscriptionPlan? plan;
    for (final candidate in subscriptionPlans) {
      if (candidate.productId == purchase.productID) {
        plan = candidate;
        break;
      }
    }
    if (plan == null ||
        entitlement.planType.toLowerCase() != plan.id.toLowerCase()) {
      return false;
    }

    final source = purchase.verificationData.source
        .trim()
        .toLowerCase()
        .replaceAll(RegExp(r'[^a-z0-9]'), '');
    final expectedPlatform = source.contains('apple') ||
            source.contains('appstore') ||
            source == 'ios'
        ? 'app_store'
        : source.contains('googleplay') ||
                source == 'playstore' ||
                source == 'android'
            ? 'google_play'
            : null;
    return expectedPlatform == null ||
        entitlement.subscriptionPlatform == expectedPlatform;
  }

  String _purchaseKey(PurchaseDetails purchase) {
    final source = purchase.verificationData.source.trim().toLowerCase();
    final purchaseId = purchase.purchaseID?.trim();
    final transaction = purchaseId != null && purchaseId.isNotEmpty
        ? purchaseId
        : purchase.verificationData.serverVerificationData.hashCode.toString();
    return '$source|${purchase.productID}|$transaction';
  }

  Future<void> _completeStoreTransaction(PurchaseDetails purchase) async {
    if (!purchase.pendingCompletePurchase) return;
    try {
      await purchaseService.completePurchase(purchase);
    } catch (_) {
      // The persisted backend entitlement remains active. A later store update
      // can retry local completion without verifying or granting access again.
    }
  }

  void _manage(
    ManageSubscriptionRequested event,
    Emitter<SubscriptionState> emit,
  ) {
    final platform = state.subscription?.subscriptionPlatform;
    final url = switch (platform) {
      'google_play' =>
        'https://play.google.com/store/account/subscriptions?package=com.adaptalyfe.app',
      'app_store' => 'https://apps.apple.com/account/subscriptions',
      'web' => null,
      _ => defaultTargetPlatform == TargetPlatform.iOS
          ? 'https://apps.apple.com/account/subscriptions'
          : 'https://play.google.com/store/account/subscriptions?package=com.adaptalyfe.app',
    };
    if (url == null) {
      emit(state.copyWith(
        actionMessage: 'Manage this subscription on the Adaptalyfe website.',
      ));
      return;
    }
    emit(state.copyWith(managementUrl: url));
  }

  void _clearDashboardNavigation(
    SubscriptionNavigationHandled event,
    Emitter<SubscriptionState> emit,
  ) {
    emit(state.copyWith(
      shouldNavigateToDashboard: false,
      actionMessage: null,
    ));
  }

  void _clearAuthenticationRefresh(
    SubscriptionAuthenticationRefreshHandled event,
    Emitter<SubscriptionState> emit,
  ) {
    emit(state.copyWith(shouldRefreshAuthentication: false));
  }

  void _clearManagementUrl(
    ManagementUrlHandled event,
    Emitter<SubscriptionState> emit,
  ) {
    emit(state.copyWith(managementUrl: null));
  }

  String? _catalogMessage(StoreProductCatalog catalog) {
    final missing = catalog.notFoundProductIds;
    final parts = <String>[];
    if (missing.isNotEmpty) {
      parts.add('Unavailable store products: ${missing.join(', ')}.');
    }
    if (catalog.errorMessage != null &&
        catalog.errorMessage!.trim().isNotEmpty) {
      parts.add(catalog.errorMessage!.trim());
    }
    return parts.isEmpty ? null : parts.join(' ');
  }

  @override
  Future<void> close() async {
    await _purchaseSubscription.cancel();
    await super.close();
  }
}