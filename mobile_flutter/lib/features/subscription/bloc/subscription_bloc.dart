import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:in_app_purchase/in_app_purchase.dart';

import '../../../core/network/api_client.dart';
import '../data/purchase_service.dart';
import '../data/subscription_repository.dart';
import '../models/subscription_models.dart';
import '../models/subscription_purchase_contract.dart';
import 'subscription_event.dart';
import 'subscription_state.dart';

class SubscriptionBloc extends Bloc<SubscriptionEvent, SubscriptionState> {
  SubscriptionBloc(
    this.repository,
    this.purchaseService, {
    this.restoreTimeout = const Duration(seconds: 10),
  })
      : super(const SubscriptionState()) {
    on<SubscriptionStarted>(
      _load,
      transformer: (events, mapper) => events.asyncExpand(mapper),
    );
    on<RefreshSubscription>(
      _refresh,
      transformer: (events, mapper) => events.asyncExpand(mapper),
    );
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
  final Duration restoreTimeout;
  late final StreamSubscription<List<PurchaseDetails>> _purchaseSubscription;
  final Set<String> _verifiedPurchaseKeys = {};
  Completer<bool>? _restoreCompletion;
  Timer? _restoreTimeoutTimer;
  int _entitlementRevision = 0;
  bool _purchaseVerificationInProgress = false;

  Future<void> _load(
    SubscriptionStarted event,
    Emitter<SubscriptionState> emit,
  ) async {
    final entitlementRevisionAtStart = _entitlementRevision;
    emit(state.copyWith(
      status: SubscriptionStatus.loading,
      products: const {},
      storeAvailable: false,
      availabilityMessage: null,
      errorMessage: null,
      actionMessage: null,
    ));

    var storeAvailable = false;
    var products = <String, ProductDetails>{};
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

    emit(state.copyWith(
      status: SubscriptionStatus.loading,
      products: products,
      storeAvailable: storeAvailable,
      availabilityMessage: availabilityMessage,
    ));

    try {
      final subscription = await repository.getSubscription();
      if (entitlementRevisionAtStart != _entitlementRevision) {
        emit(state.copyWith(
          status: storeAvailable
              ? SubscriptionStatus.ready
              : SubscriptionStatus.notAvailable,
          products: products,
          storeAvailable: storeAvailable,
          availabilityMessage: availabilityMessage,
          sessionInvalid: false,
          errorMessage: null,
        ));
        return;
      }
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
      if (entitlementRevisionAtStart != _entitlementRevision) {
        emit(state.copyWith(
          status: state.storeAvailable
              ? SubscriptionStatus.ready
              : SubscriptionStatus.notAvailable,
          sessionInvalid: false,
          errorMessage: null,
        ));
        return;
      }
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
    if (state.isBusy || _purchaseVerificationInProgress) return;
    final entitlementRevisionAtStart = _entitlementRevision;
    if (state.subscription == null) {
      emit(state.copyWith(status: SubscriptionStatus.loading));
    }
    try {
      final subscription = await repository.getSubscription();
      if (entitlementRevisionAtStart != _entitlementRevision) {
        emit(state.copyWith(
          status: state.storeAvailable
              ? SubscriptionStatus.ready
              : SubscriptionStatus.notAvailable,
          sessionInvalid: false,
          errorMessage: null,
        ));
        return;
      }
      emit(state.copyWith(
        status: state.storeAvailable
            ? SubscriptionStatus.ready
            : SubscriptionStatus.notAvailable,
        subscription: subscription,
        sessionInvalid: false,
        errorMessage: null,
      ));
    } on ApiException catch (error) {
      if (entitlementRevisionAtStart != _entitlementRevision) {
        emit(state.copyWith(
          status: state.storeAvailable
              ? SubscriptionStatus.ready
              : SubscriptionStatus.notAvailable,
          sessionInvalid: false,
          errorMessage: null,
        ));
        return;
      }
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
    if (plan == null ||
        !state.canPurchase ||
        _purchaseVerificationInProgress) {
      return;
    }

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
    if (state.isBusy || _purchaseVerificationInProgress) return;
    if (!state.storeAvailable) {
      emit(state.copyWith(
        actionMessage: 'The app store is not available on this device.',
      ));
      return;
    }
    final completion = Completer<bool>();
    _restoreTimeoutTimer?.cancel();
    _restoreCompletion = completion;
    _restoreTimeoutTimer = Timer(
      restoreTimeout,
      () => _completeRestoreWait(false),
    );
    emit(state.copyWith(
      status: SubscriptionStatus.restoring,
      actionMessage: null,
    ));
    try {
      await Future.any<void>([
        purchaseService.restorePurchases(),
        completion.future.then<void>((_) {}),
      ]);
      final foundPurchase = await completion.future;
      if (isClosed) return;
      if (state.status == SubscriptionStatus.restoring) {
        emit(state.copyWith(
          status: state.storeAvailable
              ? SubscriptionStatus.ready
              : SubscriptionStatus.notAvailable,
          actionMessage: foundPurchase
              ? 'The store returned a purchase, but it could not be linked to this account.'
              : 'The store has not returned a previous purchase yet. If you still have an active subscription, retry restore when the store is available.',
        ));
      }
    } catch (_) {
      if (!isClosed) {
        emit(state.copyWith(
          status: state.storeAvailable
              ? SubscriptionStatus.ready
              : SubscriptionStatus.notAvailable,
          actionMessage: 'The store could not restore purchases. Try again.',
        ));
      }
    } finally {
      _restoreTimeoutTimer?.cancel();
      _restoreTimeoutTimer = null;
      if (identical(_restoreCompletion, completion)) {
        _restoreCompletion = null;
      }
    }
  }

  Future<void> _handlePurchases(
    PurchaseUpdatesReceived event,
    Emitter<SubscriptionState> emit,
  ) async {
    final restoredPurchases = event.purchases
        .where((purchase) => purchase.status == PurchaseStatus.restored)
        .toList();
    final googleRestoredPurchases = restoredPurchases
        .where((purchase) =>
            _purchaseStore(purchase) == SubscriptionStore.googlePlay)
        .toList();
    if (googleRestoredPurchases.isNotEmpty) {
      await _restoreGooglePurchases(googleRestoredPurchases, emit);
    }
    for (final purchase in restoredPurchases) {
      if (isClosed) return;
      if (_purchaseStore(purchase) == SubscriptionStore.googlePlay) continue;
      await _handlePurchase(purchase, emit);
    }
    for (final purchase in event.purchases.where(
      (purchase) => purchase.status != PurchaseStatus.restored,
    )) {
      if (isClosed) return;
      await _handlePurchase(purchase, emit);
    }
    if (event.purchases.isEmpty) _completeRestoreWait(false);
  }

  Future<void> _handlePurchase(
    PurchaseDetails purchase,
    Emitter<SubscriptionState> emit,
  ) async {
    if (!subscriptionProductIds.contains(purchase.productID)) {
      emit(state.copyWith(
        status: SubscriptionStatus.failure,
        busyPlanId: null,
        purchaseNeedsVerification: true,
        purchasePending: false,
        actionMessage:
            'The store returned a product that is not in Adaptalyfe’s plan catalog. No access was granted; contact support before purchasing again.',
      ));
      _completeRestoreWait(true);
      return;
    }
    switch (purchase.status) {
      case PurchaseStatus.pending:
        emit(state.copyWith(
          status: state.storeAvailable
              ? SubscriptionStatus.ready
              : SubscriptionStatus.notAvailable,
          busyPlanId: null,
          purchasePending: true,
          actionMessage:
              'The store is still processing payment. Access begins after it confirms the purchase.',
        ));
        _completeRestoreWait(true);
        return;
      case PurchaseStatus.canceled:
        emit(state.copyWith(
          status: state.storeAvailable
              ? SubscriptionStatus.ready
              : SubscriptionStatus.notAvailable,
          busyPlanId: null,
          actionMessage: 'Purchase cancelled.',
        ));
        _completeRestoreWait(false);
        return;
      case PurchaseStatus.error:
        emit(state.copyWith(
          status: state.storeAvailable
              ? SubscriptionStatus.ready
              : SubscriptionStatus.notAvailable,
          busyPlanId: null,
          actionMessage:
              'The store could not complete this purchase. Check your Play account and try again.',
        ));
        _completeRestoreWait(false);
        return;
      case PurchaseStatus.purchased:
      case PurchaseStatus.restored:
        await _verifyPurchase(purchase, emit);
        _completeRestoreWait(true);
        return;
    }
  }

  Future<void> _restoreGooglePurchases(
    List<PurchaseDetails> purchases,
    Emitter<SubscriptionState> emit,
  ) async {
    final knownPurchases = purchases
        .where((purchase) => subscriptionProductIds.contains(purchase.productID))
        .toList();
    if (knownPurchases.isEmpty) {
      emit(state.copyWith(
        status: SubscriptionStatus.failure,
        purchaseNeedsVerification: true,
        actionMessage:
            'Google Play returned no recognized Adaptalyfe plan. No access was granted; contact support before purchasing again.',
      ));
      _completeRestoreWait(true);
      return;
    }
    if (_purchaseVerificationInProgress) return;

    _purchaseVerificationInProgress = true;
    emit(state.copyWith(
      status: SubscriptionStatus.restoring,
      busyPlanId: null,
      actionMessage: null,
    ));
    try {
      final verification =
          await repository.restoreGooglePurchases(knownPurchases);
      if (!verification.success) {
        final verificationStatus = verification.status?.toLowerCase();
        if (verificationStatus == 'pending') {
          emit(state.copyWith(
            status: state.storeAvailable
                ? SubscriptionStatus.ready
                : SubscriptionStatus.notAvailable,
            busyPlanId: null,
            purchaseNeedsVerification: false,
            purchasePending: true,
            actionMessage: verification.message ??
                'Google Play is still processing this subscription.',
          ));
          return;
        }
        if (verificationStatus == 'missing_purchase_data') {
          emit(state.copyWith(
            status: SubscriptionStatus.failure,
            busyPlanId: null,
            purchaseNeedsVerification: true,
            purchasePending: false,
            actionMessage: verification.message ??
                'Google Play did not return enough information to verify this purchase. Retry restore.',
          ));
          return;
        }
        await _finishInactivePurchases(
          knownPurchases,
          verification.message ??
              'No active Google Play subscription was found.',
          emit,
          completeTransactions: false,
        );
        return;
      }

      var entitlement = verification.subscription;
      if (!_matchesAnyVerifiedPurchase(entitlement, knownPurchases)) {
        entitlement = await repository.getSubscription();
      }
      if (!_matchesAnyVerifiedPurchase(entitlement, knownPurchases)) {
        emit(state.copyWith(
          status: SubscriptionStatus.failure,
          busyPlanId: null,
          purchaseNeedsVerification: true,
          purchasePending: false,
          actionMessage:
              'Google Play returned a purchase, but its active plan could not be confirmed on this account. Retry restore; do not purchase again.',
        ));
        return;
      }

      // The bulk restore endpoint acknowledges its verified active purchase.
      // Its response omits the matching token, so do not locally acknowledge
      // every transaction returned by the store.
      _entitlementRevision++;
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
        sessionInvalid: false,
      ));
    } on ApiException catch (error) {
      if (error.statusCode == 409) {
        await _refreshAfterPurchaseConflict(error, emit);
        return;
      }
      emit(state.copyWith(
        status: SubscriptionStatus.failure,
        busyPlanId: null,
        purchaseNeedsVerification: true,
        purchasePending: false,
        sessionInvalid: error.type == ApiErrorType.unauthorized,
        actionMessage:
            'Google Play could not link this purchase to your account. Retry restore; do not purchase again.',
        errorMessage: error.message,
      ));
    } catch (_) {
      emit(state.copyWith(
        status: SubscriptionStatus.failure,
        busyPlanId: null,
        purchaseNeedsVerification: true,
        purchasePending: false,
        actionMessage:
            'Google Play could not link this purchase to your account. Retry restore; do not purchase again.',
      ));
    } finally {
      _purchaseVerificationInProgress = false;
      _completeRestoreWait(true);
    }
  }

  Future<void> _verifyPurchase(
    PurchaseDetails purchase,
    Emitter<SubscriptionState> emit,
  ) async {
    if (_purchaseVerificationInProgress) return;
    _purchaseVerificationInProgress = true;
    try {
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
          final verificationStatus = verification.status?.toLowerCase();
          if (verificationStatus == 'pending') {
            emit(state.copyWith(
              status: state.storeAvailable
                  ? SubscriptionStatus.ready
                  : SubscriptionStatus.notAvailable,
              busyPlanId: null,
              purchaseNeedsVerification: false,
              purchasePending: true,
              actionMessage: verification.message ??
                  'The store is still processing this purchase.',
            ));
            return;
          }
          if (_isTerminalStoreStatus(verificationStatus)) {
            await _finishInactivePurchases(
              [purchase],
              verification.message ??
                  'The store reports that this subscription is not active. No paid access was granted.',
              emit,
            );
          } else {
            emit(state.copyWith(
              status: SubscriptionStatus.failure,
              busyPlanId: null,
              purchaseNeedsVerification: true,
              purchasePending: false,
              actionMessage: verification.message ??
                  'The store purchase could not be verified yet. Retry verification; do not purchase again.',
            ));
          }
          return;
        }

        SubscriptionModel? entitlement = verification.subscription;
        if (!_matchesVerifiedPurchase(entitlement, purchase)) {
          entitlement = await repository.getSubscription();
        }
        if (!_matchesVerifiedPurchase(entitlement, purchase)) {
          emit(state.copyWith(
            status: SubscriptionStatus.failure,
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
        _entitlementRevision++;

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
        if (error.statusCode == 409) {
          await _refreshAfterPurchaseConflict(error, emit);
          return;
        }
        if (error.statusCode == 400) {
          await _finishInactivePurchases(
            [purchase],
            error.message.isNotEmpty
                ? error.message
                : 'The store reports that this subscription is not active. No paid access was granted.',
            emit,
          );
          return;
        }
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
    } finally {
      _purchaseVerificationInProgress = false;
    }
  }

  Future<void> _refreshAfterPurchaseConflict(
    ApiException error,
    Emitter<SubscriptionState> emit,
  ) async {
    try {
      final currentSubscription = await repository.getSubscription();
      _entitlementRevision++;
      emit(state.copyWith(
        status: state.storeAvailable
            ? SubscriptionStatus.ready
            : SubscriptionStatus.notAvailable,
        subscription: currentSubscription,
        busyPlanId: null,
        purchaseNeedsVerification: !currentSubscription.grantsAccess,
        purchasePending: false,
        sessionInvalid: false,
        errorMessage: null,
        actionMessage: error.message,
      ));
    } on ApiException catch (refreshError) {
      emit(state.copyWith(
        status: SubscriptionStatus.failure,
        subscription: null,
        busyPlanId: null,
        purchaseNeedsVerification: true,
        purchasePending: false,
        sessionInvalid: refreshError.type == ApiErrorType.unauthorized,
        errorMessage: refreshError.message,
        actionMessage: error.message,
      ));
    } catch (_) {
      emit(state.copyWith(
        status: SubscriptionStatus.failure,
        subscription: null,
        busyPlanId: null,
        purchaseNeedsVerification: true,
        purchasePending: false,
        errorMessage: 'Could not refresh your subscription status.',
        actionMessage: error.message,
      ));
    }
  }

  Future<void> _finishInactivePurchases(
    List<PurchaseDetails> purchases,
    String message,
    Emitter<SubscriptionState> emit, {
    bool completeTransactions = true,
  }) async {
    if (completeTransactions) {
      for (final purchase in purchases) {
        await _completeStoreTransaction(purchase);
      }
    }
    try {
      final currentSubscription = await repository.getSubscription();
      _entitlementRevision++;
      emit(state.copyWith(
        status: state.storeAvailable
            ? SubscriptionStatus.ready
            : SubscriptionStatus.notAvailable,
        subscription: currentSubscription,
        busyPlanId: null,
        purchaseNeedsVerification: false,
        purchasePending: false,
        sessionInvalid: false,
        errorMessage: null,
        actionMessage: message,
      ));
    } on ApiException catch (error) {
      _entitlementRevision++;
      emit(state.copyWith(
        status: SubscriptionStatus.failure,
        subscription: null,
        busyPlanId: null,
        purchaseNeedsVerification: false,
        purchasePending: false,
        sessionInvalid: error.type == ApiErrorType.unauthorized,
        errorMessage: error.message,
        actionMessage: message,
      ));
    } catch (_) {
      _entitlementRevision++;
      emit(state.copyWith(
        status: SubscriptionStatus.failure,
        subscription: null,
        busyPlanId: null,
        purchaseNeedsVerification: false,
        purchasePending: false,
        errorMessage: 'Could not refresh your subscription status.',
        actionMessage: message,
      ));
    }
  }

  bool _matchesAnyVerifiedPurchase(
    SubscriptionModel? entitlement,
    List<PurchaseDetails> purchases,
  ) =>
      purchases.any(
        (purchase) => _matchesVerifiedPurchase(entitlement, purchase),
      );

  bool _isTerminalStoreStatus(String? status) => const {
        'cancelled',
        'canceled',
        'expired',
        'inactive',
        'invalid',
        'not_active',
        'revoked',
      }.contains(status);

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

    final expectedPlatform = switch (_purchaseStore(purchase)) {
      SubscriptionStore.googlePlay => 'google_play',
      SubscriptionStore.appStore => 'app_store',
      null => null,
    };
    return expectedPlatform == null ||
        entitlement.subscriptionPlatform == expectedPlatform;
  }

  SubscriptionStore? _purchaseStore(PurchaseDetails purchase) =>
      subscriptionStoreFromSource(purchase.verificationData.source) ??
      switch (defaultTargetPlatform) {
        TargetPlatform.android => SubscriptionStore.googlePlay,
        TargetPlatform.iOS => SubscriptionStore.appStore,
        _ => null,
      };

  void _completeRestoreWait(bool foundPurchase) {
    final completion = _restoreCompletion;
    if (completion != null && !completion.isCompleted) {
      completion.complete(foundPurchase);
    }
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
    _restoreTimeoutTimer?.cancel();
    _completeRestoreWait(false);
    await _purchaseSubscription.cancel();
    await super.close();
  }
}