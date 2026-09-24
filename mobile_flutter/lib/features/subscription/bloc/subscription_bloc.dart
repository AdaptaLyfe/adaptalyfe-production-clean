import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:in_app_purchase/in_app_purchase.dart';

import '../../../core/network/api_client.dart';
import '../data/purchase_service.dart';
import '../data/stripe_payment_service.dart';
import '../data/subscription_repository.dart';
import '../models/subscription_purchase_contract.dart';
import '../models/subscription_models.dart';
import 'subscription_event.dart';
import 'subscription_state.dart';

class SubscriptionBloc extends Bloc<SubscriptionEvent, SubscriptionState> {
  static const _restoreEventTimeout = Duration(seconds: 12);

  SubscriptionBloc(
    this.repository,
    this.purchaseService,
    this.stripePaymentService,
  )
      : super(const SubscriptionState()) {
    on<SubscriptionStarted>(_load);
    on<RefreshSubscription>(_load);
    on<LoadPlans>(_loadPlans);
    on<PlanSelected>(_selectPlan);
    on<PlanPurchaseRequested>(_purchase);
    on<StripePaymentRequested>(_payWithStripe);
    on<RestorePurchasesRequested>(_restore);
    on<ManageSubscriptionRequested>(_manage);
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
  final StripePaymentService stripePaymentService;
  late final StreamSubscription<List<PurchaseDetails>> _purchaseSubscription;
  List<ProductDetails> _products = [];
  bool _started = false;
  bool _loadInFlight = false;
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
                !state.canUseStripe
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
      final availability = await purchaseService.initialize();
      final stripeAvailability = await stripePaymentService.initialize();
      _products = availability.products;
      _started = true;
      emit(
        state.copyWith(
          status: SubscriptionStatus.ready,
          subscription: subscription,
          selectedPlanId: subscription.isActive ? null : state.selectedPlanId,
          products: {
            for (final product in _products) product.id: product,
          },
          storeAvailable: availability.available,
          availabilityMessage: availability.message,
          stripeAvailable: stripeAvailability.configured,
          walletAvailable: stripeAvailability.walletAvailable,
          errorMessage: availability.message,
          actionMessage: null,
        ),
      );
    } on ApiException catch (error) {
      emit(
        state.copyWith(
          status: SubscriptionStatus.failure,
          errorMessage: error.message,
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
  }

  Future<void> _payWithStripe(
    StripePaymentRequested event,
    Emitter<SubscriptionState> emit,
  ) async {
    if (!_started ||
        _loadInFlight ||
        state.isBusy ||
        state.hasActiveSubscription) {
      return;
    }
    if (!state.stripeAvailable) {
      emit(
        state.copyWith(
          status: SubscriptionStatus.notAvailable,
          actionMessage: 'Card and wallet payments are not configured.',
        ),
      );
      return;
    }

    final plan = _planFor(event.planId);
    if (plan == null) return;

    emit(
      state.copyWith(
        status: SubscriptionStatus.purchasing,
        busyPlanId: plan.id,
        errorMessage: null,
        actionMessage: 'Preparing secure payment…',
      ),
    );

    try {
      final setup = await repository.createStripeSubscription(
        planType: plan.id,
        billingCycle: 'monthly',
      );
      if (setup.subscriptionId.isEmpty) {
        throw const FormatException('The payment session was not created.');
      }

      if (setup.requiresPayment) {
        final clientSecret = setup.clientSecret;
        final intentType = setup.intentType;
        if (clientSecret == null ||
            clientSecret.isEmpty ||
            (intentType != 'setup' && intentType != 'payment')) {
          throw const StripePaymentException(
            'Stripe did not return a valid payment session.',
            configuration: true,
          );
        }
        await stripePaymentService.presentSubscriptionPayment(
          clientSecret: clientSecret,
          intentType: intentType!,
          method: event.method,
        );
      }

      final confirmation = await repository.confirmStripeSubscription(
        setup.subscriptionId,
      );
      if (!confirmation.success) {
        throw ApiException(
          type: ApiErrorType.unknown,
          message: confirmation.message ??
              'Payment could not be completed. Please try again.',
        );
      }

      final subscription = await repository.getSubscription();
      emit(
        state.copyWith(
          status: SubscriptionStatus.ready,
          subscription: subscription,
          busyPlanId: null,
          selectedPlanId: null,
          errorMessage: null,
          actionMessage: 'Payment successful! Your subscription is active.',
        ),
      );
    } on StripeException catch (error) {
      final cancelled = error.error.code == FailureCode.Canceled;
      emit(
        state.copyWith(
          status: cancelled
              ? SubscriptionStatus.cancelled
              : SubscriptionStatus.failure,
          busyPlanId: null,
          errorMessage: cancelled
              ? null
              : 'Payment could not be completed. Please try again.',
          actionMessage: cancelled ? 'Payment was cancelled.' : null,
        ),
      );
    } on StripePaymentException catch (error) {
      emit(
        state.copyWith(
          status: error.configuration
              ? SubscriptionStatus.configurationError
              : SubscriptionStatus.failure,
          busyPlanId: null,
          errorMessage: error.message,
        ),
      );
    } on ApiException catch (error) {
      emit(
        state.copyWith(
          status: error.type == ApiErrorType.unauthorized
              ? SubscriptionStatus.failure
              : SubscriptionStatus.ready,
          busyPlanId: null,
          errorMessage: error.message,
          sessionInvalid: error.type == ApiErrorType.unauthorized,
        ),
      );
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

  Future<void> _handlePurchases(
    PurchaseUpdatesReceived event,
    Emitter<SubscriptionState> emit,
  ) async {
    final purchases = event.purchases.whereType<PurchaseDetails>().toList();
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
          status: SubscriptionStatus.purchasing,
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
                  : item.error?.message ??
                      'Payment failed. Please try again.',
              actionMessage: cancelled ? 'Payment was cancelled.' : null,
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
        await _completePurchases(verifiablePurchases);
        emit(
          state.copyWith(
            status: SubscriptionStatus.ready,
            busyPlanId: null,
            errorMessage: verification.message ??
                "No Subscription Found: We couldn't find an active subscription to restore.",
            actionMessage: null,
          ),
        );
        return;
      }

      await _completePurchases(verifiablePurchases);
      final subscription = await repository.getSubscription();
      emit(
        state.copyWith(
          status: SubscriptionStatus.ready,
          subscription: subscription,
          busyPlanId: null,
          selectedPlanId: null,
          errorMessage: null,
          actionMessage: 'Your previous subscription was restored.',
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
          errorMessage: error.message,
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
        // A failed network request remains unacknowledged. A new explicit
        // restore clears this in-memory dedupe marker and can retry it.
        _finishPurchaseEvent(key);
      }
    }
  }

  Future<PurchaseVerification> _verifyAppleRestoredPurchases(
    List<PurchaseDetails> purchases,
  ) async {
    PurchaseVerification? successfulVerification;
    String? lastMessage;
    for (final purchase in purchases) {
      final plan = _planFor(purchase.productID);
      if (plan == null) continue;
      try {
        final verification = await repository.verifyApplePurchase(
          receiptData:
              purchase.verificationData.serverVerificationData,
          productId: plan.productId,
          transactionId: purchase.purchaseID,
        );
        if (verification.success) {
          successfulVerification ??= verification;
        } else {
          lastMessage = verification.message ?? lastMessage;
        }
      } on ApiException catch (error) {
        if (!_shouldCompleteRejectedPurchase(error.type)) rethrow;
        lastMessage = error.message;
      }
    }
    if (successfulVerification != null) return successfulVerification;
    return PurchaseVerification(
      success: false,
      message: lastMessage,
    );
  }

  Future<void> _handlePurchasedItem(
    PurchaseDetails item,
    Emitter<SubscriptionState> emit,
  ) async {
    final key = _claimPurchaseEvent(item);
    if (key == null) return;
    try {
      final plan = _planFor(item.productID);
      if (plan == null) {
        throw const FormatException('The store returned an unknown plan.');
      }
      final verification = await _verify(item, plan, emit);
      if (!verification.success) {
        await purchaseService.complete(item);
        throw ApiException(
          type: ApiErrorType.unknown,
          message: verification.message ?? 'The purchase could not be verified.',
        );
      }
      await purchaseService.complete(item);
      final subscription = await repository.getSubscription();
      emit(
        state.copyWith(
          status: SubscriptionStatus.ready,
          subscription: subscription,
          busyPlanId: null,
          selectedPlanId: null,
          errorMessage: null,
          actionMessage: 'Your subscription is now active.',
        ),
      );
    } on ApiException catch (error) {
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
          errorMessage: error.message,
          sessionInvalid: error.type == ApiErrorType.unauthorized,
        ),
      );
    } catch (error) {
      emit(
        state.copyWith(
          status: SubscriptionStatus.failure,
          busyPlanId: null,
          errorMessage: _messageFor(error),
        ),
      );
    } finally {
      _finishPurchaseEvent(key);
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
    if (error is ApiException) return error.message;
    if (error is FormatException) return error.message;
    if (error is StripePaymentException) return error.message;
    return 'Unable to complete this subscription action. Please try again.';
  }

  @override
  Future<void> close() async {
    await _purchaseSubscription.cancel();
    return super.close();
  }
}