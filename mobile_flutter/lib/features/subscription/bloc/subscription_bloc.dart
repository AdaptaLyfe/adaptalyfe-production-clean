import 'dart:async';

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
    on<RefreshSubscription>(_load);
    on<LoadPlans>(_loadPlans);
    on<PlanPurchaseRequested>(_purchase);
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
  late final StreamSubscription<List<PurchaseDetails>> _purchaseSubscription;
  List<ProductDetails> _products = [];
  bool _started = false;
  bool _loadInFlight = false;

  void _loadPlans(
    LoadPlans event,
    Emitter<SubscriptionState> emit,
  ) {
    emit(state.copyWith(plans: subscriptionPlans));
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
      _products = availability.products;
      _started = true;
      emit(
        state.copyWith(
          status: SubscriptionStatus.ready,
          subscription: subscription,
          products: {
            for (final product in _products) product.id: product,
          },
          storeAvailable: availability.available,
          errorMessage: availability.notFoundIds.isEmpty
              ? null
              : 'Some plans are not available in this store yet.',
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

  Future<void> _purchase(
    PlanPurchaseRequested event,
    Emitter<SubscriptionState> emit,
  ) async {
    if (!_started || _loadInFlight || state.isBusy || state.hasActiveSubscription) {
      return;
    }
    final plan = _planFor(event.planId);
    if (plan == null) return;
    final product = _productFor(plan.productId);
    if (product == null) {
      emit(state.copyWith(
        status: SubscriptionStatus.ready,
        errorMessage: 'This plan is not available in the current store.',
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
    emit(
      state.copyWith(
        status: SubscriptionStatus.restoring,
        errorMessage: null,
        actionMessage: 'Checking the store for previous purchases…',
      ),
    );
    try {
      await purchaseService.restore();
      // The store emits restored purchases through purchaseStream, but it
      // emits nothing when the store account has no matching purchase. Do not
      // leave the screen indefinitely in the restoring state in that case.
      if (state.status == SubscriptionStatus.restoring) {
        emit(
          state.copyWith(
            status: SubscriptionStatus.ready,
            actionMessage: 'No previous subscription was found on this store account.',
          ),
        );
      }
    } catch (error) {
      emit(
        state.copyWith(
          status: SubscriptionStatus.failure,
          errorMessage: _messageFor(error),
        ),
      );
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
    for (final item in event.purchases) {
      if (item is! PurchaseDetails) continue;
      if (item.status == PurchaseStatus.pending) {
        emit(state.copyWith(
          status: SubscriptionStatus.purchasing,
          actionMessage: 'Waiting for the store to finish…',
        ));
        continue;
      }
      if (item.status == PurchaseStatus.error) {
        await purchaseService.complete(item);
        final message = item.error?.message ?? 'The purchase could not be completed.';
        emit(
          state.copyWith(
            status: SubscriptionStatus.failure,
            busyPlanId: null,
            errorMessage: message,
          ),
        );
        continue;
      }
      if (item.status != PurchaseStatus.purchased &&
          item.status != PurchaseStatus.restored) {
        await purchaseService.complete(item);
        continue;
      }

      try {
        final plan = _planFor(item.productID);
        if (plan == null) {
          throw const FormatException('The store returned an unknown plan.');
        }
        final verification = await _verify(item, plan, emit);
        await purchaseService.complete(item);
        if (!verification.success) {
          throw ApiException(
            type: ApiErrorType.unknown,
            message: item.status == PurchaseStatus.restored
                ? "No Subscription Found: We couldn't find an active subscription to restore."
                : verification.message ?? 'The purchase could not be verified.',
          );
        }
        final subscription = await repository.getSubscription();
        emit(
          state.copyWith(
            status: SubscriptionStatus.ready,
            subscription: subscription,
            busyPlanId: null,
            errorMessage: null,
            actionMessage: item.status == PurchaseStatus.restored
                ? 'Your previous subscription was restored.'
                : 'Your subscription is now active.',
          ),
        );
      } on ApiException catch (error) {
        await purchaseService.complete(item);
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
        await purchaseService.complete(item);
        emit(
          state.copyWith(
            status: SubscriptionStatus.failure,
            busyPlanId: null,
            errorMessage: _messageFor(error),
          ),
        );
      }
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
    final isApple = source.contains('app_store') || source.contains('ios');
    if (isApple) {
      return repository.verifyApplePurchase(
        receiptData: serverData,
        productId: plan.productId,
        transactionId: purchase.purchaseID,
      );
    }
    return repository.verifyGooglePurchase(
      purchaseToken: serverData,
      productId: plan.productId,
      orderId: purchase.purchaseID,
    );
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
    return 'Unable to complete this subscription action. Please try again.';
  }

  @override
  Future<void> close() async {
    await _purchaseSubscription.cancel();
    return super.close();
  }
}