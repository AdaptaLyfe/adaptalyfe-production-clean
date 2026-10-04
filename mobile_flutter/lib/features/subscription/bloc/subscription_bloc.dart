import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:in_app_purchase/in_app_purchase.dart';

import '../../../core/network/api_client.dart';
import '../data/purchase_service.dart';
import '../data/subscription_repository.dart';
import '../data/subscription_platform_policy.dart';
import '../models/subscription_purchase_contract.dart';
import '../models/subscription_models.dart';
import 'subscription_event.dart';
import 'subscription_state.dart';

class SubscriptionBloc extends Bloc<SubscriptionEvent, SubscriptionState> {
  static const _restoreEventTimeout = Duration(seconds: 12);

  SubscriptionBloc(
    this.repository,
    this.purchaseService,
  )
      : super(const SubscriptionState()) {
    on<SubscriptionStarted>(_load);
    on<RefreshSubscription>(_load);
    on<LoadPlans>(_loadPlans);
    on<PlanSelected>(_selectPlan);
    on<PlanPurchaseRequested>(_purchase);
    on<RestorePurchasesRequested>(_restore);
    on<ManageSubscriptionRequested>(_manage);
    on<SubscriptionNavigationHandled>(_clearDashboardNavigation);
    on<SubscriptionAuthenticationRefreshHandled>(
      _clearAuthenticationRefresh,
    );
    on<ManagementUrlHandled>(_clearManagementUrl);
    on<PurchaseUpdatesReceived>(_handlePurchases);
    _purchaseSubscription = purchaseService.purchaseStream.listen(
      (purchases) => add(
        PurchaseUpdatesReceived(
          purchases.cast<Object>(),
        ),
      ),
    );
  }

  final SubscriptionRepository repository;
  final PurchaseService purchaseService;
  late final StreamSubscription<List<PurchaseDetails>> _purchaseSubscription;
  List<ProductDetails> _products = [];
  bool _started = false;
  bool _loadInFlight = false;
  final Set<int> _startupGooglePlayRestoreAttemptedUserIds = {};
  Completer<void>? _restoreEventCompleter;
  final Set<String> _processingPurchaseEventKeys = {};
  final Set<String> _handledPurchaseEventKeys = {};

  void _loadPlans(
    LoadPlans event,
    Emitter<SubscriptionState> emit,
  ) {
    emit(state.copyWith(plans: subscriptionPlans));
  }

  void _selectPlan(
    PlanSelected event,
    Emitter<SubscriptionState> emit,
  ) {
    if (state.hasActiveSubscription || state.isBusy) return;
    final plan = _planFor(event.planId);
    if (plan == null) return;
    debugPrint(
      '[Subscription IAP] Selected plan: ${plan.id}, '
      'product ID: ${plan.productId}',
    );
    final storeProductAvailable = _productFor(plan.productId) != null;
    final unavailableMessage = state.availabilityMessage ??
        'The selected subscription was not returned by the current store. '
            'Check the store configuration and tester account.';
    emit(
      state.copyWith(
        selectedPlanId: event.planId,
        errorMessage: null,
        actionMessage: _started &&
                !storeProductAvailable &&
                usesNativeStoreBilling
            ? unavailableMessage
            : null,
      ),
    );
  }

  Future<void> _load(
    SubscriptionEvent event,
    Emitter<SubscriptionState> emit,
  ) async {
    if (_loadInFlight || state.isBusy) return;
    _loadInFlight = true;
    int? restoreUserId;
    emit(
      state.copyWith(
        status: SubscriptionStatus.loading,
        errorMessage: null,
        actionMessage: null,
        sessionInvalid: false,
      ),
    );

    try {
      final subscription = await repository.getSubscription();
      if ((event is SubscriptionStarted || event is RefreshSubscription) &&
          !subscription.grantsAccess &&
          !kIsWeb &&
          defaultTargetPlatform == TargetPlatform.android &&
          !_startupGooglePlayRestoreAttemptedUserIds
              .contains(subscription.id)) {
        restoreUserId = subscription.id;
      }
      final availability = await purchaseService.initialize();
      _products = availability.products;
      _started = true;
      emit(
        state.copyWith(
          status: SubscriptionStatus.ready,
          subscription: subscription,
          selectedPlanId:
              subscription.grantsAccess ? null : state.selectedPlanId,
          products: {
            for (final product in _products) product.id: product,
          },
          storeAvailable: availability.available,
          availabilityMessage: availability.message,
          errorMessage: availability.message,
          actionMessage: null,
        ),
      );
    } on ApiException catch (error) {
      emit(
        state.copyWith(
          status: SubscriptionStatus.failure,
          errorMessage: error.type == ApiErrorType.unauthorized
              ? null
              : _messageFor(error),
          sessionInvalid: error.type == ApiErrorType.unauthorized,
        ),
      );
    } catch (error) {
      emit(
        state.copyWith(
          status: SubscriptionStatus.failure,
          errorMessage: _messageFor(error),
        ),
      );
    } finally {
      _loadInFlight = false;
    }

    if (restoreUserId != null && !isClosed) {
      _startupGooglePlayRestoreAttemptedUserIds.add(restoreUserId);
      debugPrint(
        '[Subscription IAP] Automatic Android purchase restore requested.',
      );
      add(const RestorePurchasesRequested());
    }
  }

  Future<void> _purchase(
    PlanPurchaseRequested event,
    Emitter<SubscriptionState> emit,
  ) async {
    if (!_started || _loadInFlight || state.isBusy || state.hasActiveSubscription) {
      return;
    }
    final plan = _planFor(event.planId);
    if (plan == null) return;
    _handledPurchaseEventKeys.clear();
    debugPrint(
      '[Subscription IAP] Purchase requested: plan=${plan.id}, '
      'product ID=${plan.productId}',
    );
    var product = _productFor(plan.productId);
    if (product == null) {
      debugPrint(
        '[Subscription IAP] Product ${plan.productId} was not cached; '
        'retrying Google Play/App Store product lookup.',
      );
      final refreshedAvailability = await purchaseService.initialize();
      _products = refreshedAvailability.products;
      product = _productFor(plan.productId);
      emit(
        state.copyWith(
          products: {
            for (final item in _products) item.id: item,
          },
          storeAvailable: refreshedAvailability.available,
          availabilityMessage: refreshedAvailability.message,
        ),
      );
    }
    if (product == null) {
      debugPrint(
        '[Subscription IAP] Selected product ${plan.productId} is still '
        'unavailable after retry.',
      );
      emit(state.copyWith(
        status: SubscriptionStatus.ready,
        errorMessage: state.availabilityMessage ??
            'The selected subscription was not returned by the current store. '
                'Check the store configuration and tester account.',
      ));
      return;
    }

    emit(
      state.copyWith(
        status: SubscriptionStatus.purchasing,
        busyPlanId: plan.id,
        errorMessage: null,
        actionMessage: 'Complete your purchase in the store.',
        shouldNavigateToDashboard: false,
      ),
    );
    try {
      final started = await purchaseService.buy(product);
      if (!started) {
        emit(
          state.copyWith(
            status: SubscriptionStatus.ready,
            busyPlanId: null,
            errorMessage: 'The store could not start this purchase.',
          ),
        );
      }
    } catch (error) {
      emit(
        state.copyWith(
          status: SubscriptionStatus.failure,
          busyPlanId: null,
          errorMessage: _messageFor(error),
        ),
      );
    }
  }

  Future<void> _restore(
    RestorePurchasesRequested event,
    Emitter<SubscriptionState> emit,
  ) async {
    if (_loadInFlight || state.isBusy) return;
    if (state.hasActiveSubscription) {
      emit(state.copyWith(
        status: SubscriptionStatus.ready,
        actionMessage: 'Your ${state.subscription!.platformLabel} subscription is already active.',
      ));
      return;
    }
    final restoreEvent = Completer<void>();
    _restoreEventCompleter = restoreEvent;
    _handledPurchaseEventKeys.clear();
    emit(
      state.copyWith(
        status: SubscriptionStatus.restoring,
        errorMessage: null,
        actionMessage: 'Checking the store for previous purchases…',
        shouldNavigateToDashboard: false,
      ),
    );
    try {
      await purchaseService.restore();
      try {
        // restorePurchases() can return before the store publishes its
        // restored transactions on purchaseStream.
        await restoreEvent.future.timeout(_restoreEventTimeout);
      } on TimeoutException {
        if (state.status == SubscriptionStatus.restoring) {
          emit(
            state.copyWith(
              status: SubscriptionStatus.ready,
              actionMessage:
                  'No previous subscription was found on this store account.',
            ),
          );
        }
      }
    } catch (error) {
      emit(
        state.copyWith(
          status: SubscriptionStatus.failure,
          errorMessage: _messageFor(error),
        ),
      );
    } finally {
      if (identical(_restoreEventCompleter, restoreEvent)) {
        _restoreEventCompleter = null;
      }
    }
  }

  Future<void> _manage(
    ManageSubscriptionRequested event,
    Emitter<SubscriptionState> emit,
  ) async {
    final platform = state.subscription?.subscriptionPlatform;
    final url = platform == 'app_store'
        ? 'https://apps.apple.com/account/subscriptions'
        : platform == 'google_play'
            ? 'https://play.google.com/store/account/subscriptions'
            : null;
    emit(
      state.copyWith(
        status: SubscriptionStatus.ready,
        managementUrl: url,
        actionMessage: url == null
            ? 'Manage your subscription from the Adaptalyfe website.'
            : 'Open your ${state.subscription!.platformLabel} subscription settings.',
      ),
    );
  }

  void _clearManagementUrl(
    ManagementUrlHandled event,
    Emitter<SubscriptionState> emit,
  ) {
    if (state.managementUrl == null) return;
    emit(state.copyWith(managementUrl: null));
  }

  void _clearDashboardNavigation(
    SubscriptionNavigationHandled event,
    Emitter<SubscriptionState> emit,
  ) {
    if (!state.shouldNavigateToDashboard) return;
    emit(state.copyWith(shouldNavigateToDashboard: false));
  }

  void _clearAuthenticationRefresh(
    SubscriptionAuthenticationRefreshHandled event,
    Emitter<SubscriptionState> emit,
  ) {
    if (!state.shouldRefreshAuthentication) return;
    emit(state.copyWith(shouldRefreshAuthentication: false));
  }

  Future<void> _handlePurchases(
    PurchaseUpdatesReceived event,
    Emitter<SubscriptionState> emit,
  ) async {
    final purchases = event.purchases.whereType<PurchaseDetails>().toList();
    for (final purchase in purchases) {
      debugPrint(
        '[Subscription IAP] Purchase update received: '
        'productId=${purchase.productID}, status=${purchase.status.name}, '
        'source=${purchase.verificationData.source}',
      );
    }
    final restorePurchases = purchases
        .where(
          (item) =>
              item.status == PurchaseStatus.restored ||
              (_restoreEventCompleter != null &&
                  item.status == PurchaseStatus.purchased),
        )
        .toList();
    final restoreKeys = restorePurchases.map(_purchaseEventKey).toSet();
    if (restorePurchases.isNotEmpty) {
      await _handleRestoredPurchases(restorePurchases, emit);
    }

    for (final item in purchases) {
      if (restoreKeys.contains(_purchaseEventKey(item))) continue;
      if (item.status == PurchaseStatus.pending) {
        emit(state.copyWith(
          status: SubscriptionStatus.ready,
          actionMessage: 'Waiting for the store to finish…',
        ));
        continue;
      }
      if (item.status == PurchaseStatus.error) {
        final key = _claimPurchaseEvent(item);
        if (key == null) continue;
        final errorCode = item.error?.code.toLowerCase() ?? '';
        final errorMessage = item.error?.message.toLowerCase() ?? '';
        final cancelled =
            errorCode.contains('cancel') || errorMessage.contains('cancel');
        try {
          await purchaseService.complete(item);
          emit(
            state.copyWith(
              status: cancelled
                  ? SubscriptionStatus.cancelled
                  : SubscriptionStatus.failure,
              busyPlanId: null,
              errorMessage: cancelled
                  ? null
                  : 'The store could not complete your purchase. '
                      'Check your store account and try again.',
              actionMessage: cancelled ? 'Payment was cancelled.' : null,
              shouldNavigateToDashboard: false,
            ),
          );
          _signalRestoreEvent();
        } catch (error) {
          emit(
            state.copyWith(
              status: SubscriptionStatus.failure,
              busyPlanId: null,
              errorMessage: _messageFor(error),
            ),
          );
          _signalRestoreEvent();
        } finally {
          _finishPurchaseEvent(key);
        }
        continue;
      }
      if (item.status == PurchaseStatus.canceled) {
        final key = _claimPurchaseEvent(item);
        if (key == null) continue;
        try {
          await purchaseService.complete(item);
          emit(
            state.copyWith(
              status: SubscriptionStatus.cancelled,
              busyPlanId: null,
              errorMessage: null,
              actionMessage: 'Payment was cancelled.',
              shouldNavigateToDashboard: false,
            ),
          );
          _signalRestoreEvent();
        } catch (error) {
          emit(
            state.copyWith(
              status: SubscriptionStatus.failure,
              busyPlanId: null,
              errorMessage: _messageFor(error),
            ),
          );
          _signalRestoreEvent();
        } finally {
          _finishPurchaseEvent(key);
        }
        continue;
      }
      if (item.status != PurchaseStatus.purchased) {
        await purchaseService.complete(item);
        continue;
      }

      _signalRestoreEvent();
      await _handlePurchasedItem(item, emit);
    }
  }

  Future<void> _handleRestoredPurchases(
    List<PurchaseDetails> purchases,
    Emitter<SubscriptionState> emit,
  ) async {
    _signalRestoreEvent();
    final claimedPurchases = <PurchaseDetails>[];
    final claimedKeys = <String>[];
    for (final purchase in purchases) {
      final key = _claimPurchaseEvent(purchase);
      if (key == null) continue;
      claimedPurchases.add(purchase);
      claimedKeys.add(key);
    }
    if (claimedPurchases.isEmpty) return;

    final verifiablePurchases = claimedPurchases.where((purchase) {
      return _planFor(purchase.productID) != null &&
          purchase.verificationData.serverVerificationData.trim().isNotEmpty;
    }).toList();
    var keepRetryable = false;
    emit(
      state.copyWith(
        status: SubscriptionStatus.purchasing,
        busyPlanId: null,
        errorMessage: null,
        actionMessage: 'Verifying your restored subscription securely…',
      ),
    );
    try {
      if (verifiablePurchases.isEmpty) {
        throw const FormatException(
          'The store did not return verifiable subscription data.',
        );
      }
      final firstPlatform = subscriptionStorePlatformFromSource(
        verifiablePurchases.first.verificationData.source,
      );
      if (firstPlatform == null ||
          verifiablePurchases.any(
            (purchase) =>
                subscriptionStorePlatformFromSource(
                  purchase.verificationData.source,
                ) !=
                firstPlatform,
          )) {
        throw const FormatException(
          'The store returned an unsupported subscription source.',
        );
      }

      final verification = firstPlatform == SubscriptionStorePlatform.appStore
          ? await _verifyAppleRestoredPurchases(verifiablePurchases)
          : await repository.restoreGooglePurchases(
              verifiablePurchases
                  .map(
                    (purchase) => googlePlayRestorePurchasePayload(
                      purchaseToken:
                          purchase.verificationData.serverVerificationData,
                      productId: purchase.productID,
                      orderId: purchase.purchaseID,
                    ),
                  )
                  .toList(),
            );

      if (!verification.success) {
        if (verification.status == 'pending') {
          keepRetryable = true;
          emit(
            state.copyWith(
              status: SubscriptionStatus.ready,
              busyPlanId: null,
              errorMessage: null,
              actionMessage:
                  'The store is still processing this subscription. '
                  'Access will update when payment completes.',
            ),
          );
          return;
        }
        await _completePurchases(verifiablePurchases);
        emit(
          state.copyWith(
            status: SubscriptionStatus.ready,
            busyPlanId: null,
            errorMessage:
                "No active store subscription was found to restore.",
            actionMessage: null,
          ),
        );
        return;
      }

      await _completePurchases(verifiablePurchases);
      final subscription = await _loadVerifiedSubscription(verification);
      if (!subscription.grantsAccess) {
        emit(
          state.copyWith(
            status: SubscriptionStatus.ready,
            subscription: subscription,
            busyPlanId: null,
            errorMessage:
                'Your previous subscription was found, but its status could '
                'not be refreshed. Please refresh and try again.',
            actionMessage: null,
          ),
        );
        return;
      }
      emit(
        state.copyWith(
          status: SubscriptionStatus.ready,
          subscription: subscription,
          busyPlanId: null,
          selectedPlanId: null,
          errorMessage: null,
          actionMessage: 'Your previous subscription was restored.',
          shouldRefreshAuthentication: true,
        ),
      );
    } on ApiException catch (error) {
      // Restore requests can contain multiple transactions. Without a clear
      // server response, leave them pending so a later restore can retry.
      emit(
        state.copyWith(
          status: error.type == ApiErrorType.unauthorized
              ? SubscriptionStatus.failure
              : SubscriptionStatus.ready,
          busyPlanId: null,
          errorMessage: error.type == ApiErrorType.unauthorized
              ? null
              : _messageFor(error),
          actionMessage: null,
          sessionInvalid: error.type == ApiErrorType.unauthorized,
        ),
      );
    } catch (error) {
      emit(
        state.copyWith(
          status: SubscriptionStatus.failure,
          busyPlanId: null,
          errorMessage: _messageFor(error),
          actionMessage: null,
        ),
      );
    } finally {
      for (final key in claimedKeys) {
        if (keepRetryable) {
          _processingPurchaseEventKeys.remove(key);
        } else {
          // A failed network request remains unacknowledged. A new explicit
          // restore clears this in-memory dedupe marker and can retry it.
          _finishPurchaseEvent(key);
        }
      }
    }
  }

  Future<PurchaseVerification> _verifyAppleRestoredPurchases(
    List<PurchaseDetails> purchases,
  ) async {
    try {
      return await repository.restoreApplePurchase(
        receiptData: purchases.first.verificationData.serverVerificationData,
        transactionId: purchases.first.purchaseID,
      );
    } on ApiException catch (error) {
      if (!_shouldCompleteRejectedPurchase(error.type)) rethrow;
      return PurchaseVerification(
        success: false,
        message: error.message,
      );
    }
  }

  Future<void> _handlePurchasedItem(
    PurchaseDetails item,
    Emitter<SubscriptionState> emit,
  ) async {
    final key = _claimPurchaseEvent(item);
    if (key == null) return;
    var keepRetryable = false;
    try {
      final plan = _planFor(item.productID);
      if (plan == null) {
        throw const FormatException('The store returned an unknown plan.');
      }
      final verification = await _verify(item, plan, emit);
      debugPrint(
        '[Subscription IAP] Verification result: '
        'productId=${plan.productId}, success=${verification.success}, '
        'status=${verification.status ?? "unknown"}',
      );
      if (!verification.success) {
        if (verification.status == 'pending') {
          keepRetryable = true;
          emit(
            state.copyWith(
              status: SubscriptionStatus.ready,
              busyPlanId: null,
              errorMessage: null,
              actionMessage:
                  'The store is still processing this subscription. '
                  'Access will update when payment completes.',
            ),
          );
          return;
        }
        await purchaseService.complete(item);
        throw ApiException(
          type: ApiErrorType.unknown,
          message: verification.message ?? 'The purchase could not be verified.',
        );
      }
      await purchaseService.complete(item);
      final subscription = await _loadVerifiedSubscription(verification);
      debugPrint(
        '[Subscription IAP] Subscription refreshed: '
        'plan=${subscription.planType}, status=${subscription.status}',
      );
      if (!subscription.grantsAccess) {
        emit(
          state.copyWith(
            status: SubscriptionStatus.ready,
            subscription: subscription,
            busyPlanId: null,
            errorMessage:
                'Your purchase was verified, but the subscription status could '
                'not be refreshed. Please refresh and try again.',
            actionMessage: null,
          ),
        );
        return;
      }
      emit(
        state.copyWith(
          status: SubscriptionStatus.ready,
          subscription: subscription,
          busyPlanId: null,
          selectedPlanId: null,
          errorMessage: null,
          actionMessage: 'Your subscription is now active.',
          shouldNavigateToDashboard: true,
          shouldRefreshAuthentication: true,
        ),
      );
    } on ApiException catch (error) {
      keepRetryable = _shouldKeepPurchaseRetryable(error.type);
      if (_shouldCompleteRejectedPurchase(error.type)) {
        try {
          await purchaseService.complete(item);
        } catch (completionError) {
          emit(
            state.copyWith(
              status: SubscriptionStatus.failure,
              busyPlanId: null,
              errorMessage: _messageFor(completionError),
            ),
          );
          return;
        }
      }
      emit(
        state.copyWith(
          status: error.type == ApiErrorType.unauthorized
              ? SubscriptionStatus.failure
              : SubscriptionStatus.ready,
          busyPlanId: null,
          errorMessage: error.type == ApiErrorType.unauthorized
              ? null
              : keepRetryable
                  ? _purchaseVerificationRetryMessage
                  : _messageFor(error),
          sessionInvalid: error.type == ApiErrorType.unauthorized,
        ),
      );
    } catch (error) {
      keepRetryable = true;
      debugPrint(
        '[Subscription IAP] Purchase processing failed: '
        'productId=${item.productID}, errorType=${error.runtimeType}',
      );
      emit(
        state.copyWith(
          status: SubscriptionStatus.failure,
          busyPlanId: null,
          errorMessage: _purchaseVerificationRetryMessage,
        ),
      );
    } finally {
      if (keepRetryable) {
        _processingPurchaseEventKeys.remove(key);
      } else {
        _finishPurchaseEvent(key);
      }
    }
  }

  Future<void> _completePurchases(List<PurchaseDetails> purchases) async {
    for (final purchase in purchases) {
      await purchaseService.complete(purchase);
    }
  }

  String? _claimPurchaseEvent(PurchaseDetails purchase) {
    final key = _purchaseEventKey(purchase);
    if (_handledPurchaseEventKeys.contains(key) ||
        !_processingPurchaseEventKeys.add(key)) {
      return null;
    }
    return key;
  }

  void _finishPurchaseEvent(String key) {
    _processingPurchaseEventKeys.remove(key);
    _handledPurchaseEventKeys.add(key);
  }

  String _purchaseEventKey(PurchaseDetails purchase) {
    return subscriptionPurchaseEventKey(
      source: purchase.verificationData.source,
      productId: purchase.productID,
      status: purchase.status.name,
      purchaseId: purchase.purchaseID,
      verificationData: purchase.verificationData.serverVerificationData,
      errorCode: purchase.error?.code,
    );
  }

  void _signalRestoreEvent() {
    final completer = _restoreEventCompleter;
    if (completer != null && !completer.isCompleted) {
      completer.complete();
    }
  }

  bool _shouldCompleteRejectedPurchase(ApiErrorType type) {
    return type == ApiErrorType.badRequest ||
        type == ApiErrorType.forbidden ||
        type == ApiErrorType.notFound;
  }

  bool _shouldKeepPurchaseRetryable(ApiErrorType type) {
    return type == ApiErrorType.unauthorized ||
        type == ApiErrorType.server ||
        type == ApiErrorType.network ||
        type == ApiErrorType.timeout ||
        type == ApiErrorType.unknown;
  }

  static const _purchaseVerificationRetryMessage =
      'The store reported a purchase, but secure verification did not finish. '
      'Do not buy again; tap Restore purchases to retry verification.';

  Future<SubscriptionModel> _loadVerifiedSubscription(
    PurchaseVerification verification,
  ) async {
    try {
      return await repository.getSubscription();
    } on ApiException catch (error) {
      final verifiedSubscription = verification.subscription;
      if (error.type != ApiErrorType.unauthorized &&
          verifiedSubscription?.grantsAccess == true) {
        debugPrint(
          '[Subscription IAP] Using the just-verified entitlement after '
          'the subscription refresh failed: '
          'plan=${verifiedSubscription!.planType}.',
        );
        return verifiedSubscription;
      }
      rethrow;
    } catch (error) {
      final verifiedSubscription = verification.subscription;
      if (verifiedSubscription?.grantsAccess == true) {
        debugPrint(
          '[Subscription IAP] Using the just-verified entitlement after '
          'the subscription refresh failed: '
          'plan=${verifiedSubscription!.planType}.',
        );
        return verifiedSubscription;
      }
      rethrow;
    }
  }

  Future<PurchaseVerification> _verify(
    PurchaseDetails purchase,
    SubscriptionPlan plan,
    Emitter<SubscriptionState> emit,
  ) {
    emit(state.copyWith(
      status: SubscriptionStatus.purchasing,
      actionMessage: 'Verifying your purchase securely…',
    ));
    final serverData = purchase.verificationData.serverVerificationData;
    if (serverData.trim().isEmpty) {
      throw const FormatException('The store did not return verification data.');
    }

    // The plugin exposes the platform-native server verification value:
    // base64 receipt data on iOS and the purchase token on Android.
    final source = purchase.verificationData.source.toLowerCase();
    final storePlatform = subscriptionStorePlatformFromSource(source);
    debugPrint(
      '[Subscription IAP] Verification started: '
      'productId=${plan.productId}, source=$source',
    );
    if (storePlatform == SubscriptionStorePlatform.appStore) {
      return repository.verifyApplePurchase(
        receiptData: serverData,
        productId: plan.productId,
        transactionId: purchase.purchaseID,
      );
    }
    if (storePlatform == SubscriptionStorePlatform.googlePlay) {
      return repository.verifyGooglePurchase(
        purchaseToken: serverData,
        productId: plan.productId,
        orderId: purchase.purchaseID,
      );
    }
    throw const FormatException('The store returned an unsupported source.');
  }

  SubscriptionPlan? _planFor(String productOrPlanId) {
    for (final plan in subscriptionPlans) {
      if (plan.id == productOrPlanId || plan.productId == productOrPlanId) {
        return plan;
      }
    }
    return null;
  }

  ProductDetails? _productFor(String productId) {
    for (final product in _products) {
      if (product.id == productId) return product;
    }
    return null;
  }

  String _messageFor(Object error) {
    if (error is ApiException) {
      return switch (error.type) {
        ApiErrorType.network => 'Check your connection and try again.',
        ApiErrorType.timeout => 'The request took too long. Please try again.',
        ApiErrorType.unauthorized => 'Please sign in again to continue.',
        _ => 'Unable to complete this subscription action. Please try again.',
      };
    }
    if (error is FormatException) return error.message;
    return 'Unable to complete this subscription action. Please try again.';
  }

  @override
  Future<void> close() async {
    await _purchaseSubscription.cancel();
    return super.close();
  }
}