import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:in_app_purchase/in_app_purchase.dart';
import 'package:adaptalyfe_mobile/core/network/api_client.dart';
import 'package:adaptalyfe_mobile/features/subscription/bloc/subscription_bloc.dart';
import 'package:adaptalyfe_mobile/features/subscription/bloc/subscription_event.dart';
import 'package:adaptalyfe_mobile/features/subscription/bloc/subscription_state.dart';
import 'package:adaptalyfe_mobile/features/subscription/data/purchase_service.dart';
import 'package:adaptalyfe_mobile/features/subscription/data/subscription_api.dart';
import 'package:adaptalyfe_mobile/features/subscription/data/subscription_repository.dart';
import 'package:adaptalyfe_mobile/features/subscription/models/subscription_models.dart';

SubscriptionModel account(String tier, {bool active = true}) => SubscriptionModel(
  id: 7, planType: active ? tier : 'free', status: active ? 'active' : 'expired',
  billingCycle: 'monthly', subscriptionPlatform: 'google_play',
  currentPeriodEnd: DateTime.now().add(Duration(hours: active ? 1 : -1)),
);

PurchaseDetails transaction(PurchaseStatus status) => PurchaseDetails(
  productID: 'adaptalyfe_premium_monthly', purchaseID: 'test-order',
  transactionDate: 'test-date', status: status,
  verificationData: PurchaseVerificationData(
    localVerificationData: '', serverVerificationData: 'test-only-token', source: 'google_play',
  ),
)..pendingCompletePurchase = true;

class FakeRepository extends SubscriptionRepository {
  FakeRepository(this.saved) : super(SubscriptionApi(ApiClient()));
  SubscriptionModel saved;
  ApiException? verificationError;
  bool restoreActive = true;
  int verifyCalls = 0;

  @override
  Future<SubscriptionModel> getSubscription() async => saved;

  PurchaseVerification verify() {
    verifyCalls++;
    final error = verificationError;
    if (error != null) throw error;
    if (!restoreActive) return const PurchaseVerification(success: false);
    saved = account('premium');
    return PurchaseVerification(success: true, subscription: saved, status: 'active');
  }

  @override
  Future<PurchaseVerification> verifyGooglePurchase({
    required String purchaseToken, required String productId, String? orderId,
  }) async => verify();

  @override
  Future<PurchaseVerification> restoreGooglePurchases(
    List<Map<String, dynamic>> purchases,
  ) async => verify();
}

class FakeStore implements PurchaseService {
  final updates = StreamController<List<PurchaseDetails>>.broadcast();
  int initializeCalls = 0;
  int buyCalls = 0;
  int completeCalls = 0;
  int restoreCalls = 0;
  bool failCompletion = false;
  List<PurchaseDetails> restored = [];

  @override
  Stream<List<PurchaseDetails>> get purchaseStream => updates.stream;
  @override
  Future<PurchaseAvailability> initialize() async {
    initializeCalls++;
    return PurchaseAvailability(available: true, products: [
      ProductDetails(id: 'adaptalyfe_premium_monthly', title: 'Premium',
        description: 'Test', price: '\$12.99', rawPrice: 12.99, currencyCode: 'USD'),
    ]);
  }
  @override
  Future<bool> buy(ProductDetails product) async { buyCalls++; return true; }
  @override
  Future<void> restore() async { restoreCalls++; updates.add(restored); }
  @override
  Future<void> complete(PurchaseDetails purchase) async {
    completeCalls++;
    if (failCompletion) throw StateError('local completion temporarily unavailable');
  }
}

Future<SubscriptionState> nextState(SubscriptionBloc bloc,
    bool Function(SubscriptionState) predicate) =>
  bloc.stream.firstWhere(predicate).timeout(const Duration(seconds: 2));

void main() {
  final originalPlatform = debugDefaultTargetPlatformOverride;
  setUp(() { debugDefaultTargetPlatformOverride = TargetPlatform.iOS; });
  tearDown(() { debugDefaultTargetPlatformOverride = originalPlatform; });

  for (final tier in ['basic', 'premium', 'family']) {
    test('$tier account recovery does not depend on store lookup after reopen/reinstall', () async {
      debugDefaultTargetPlatformOverride = TargetPlatform.android;
      final store = FakeStore();
      final bloc = SubscriptionBloc(repository: FakeRepository(account(tier)), purchaseService: store);
      final ready = nextState(bloc, (state) => state.hasActiveSubscription);
      bloc.add(const SubscriptionStarted());
      final result = await ready;
      expect(result.subscription!.planType, tier);
      expect(result.subscription!.hasPremiumAccess, tier != 'basic');
      expect(result.canPurchase, isFalse);
      expect(store.initializeCalls, 0);
      expect(store.restoreCalls, 0);
      await bloc.close();
      await store.updates.close();
    });
  }

  test('selecting a plan never purchases or grants access', () async {
    final store = FakeStore();
    final bloc = SubscriptionBloc(repository: FakeRepository(account('free', active: false)), purchaseService: store);
    final loaded = nextState(bloc, (state) => state.status == SubscriptionStatus.ready);
    bloc.add(const SubscriptionStarted());
    await loaded;
    final selected = nextState(bloc, (state) => state.selectedPlanId == 'family');
    bloc.add(const PlanSelected('family'));
    final result = await selected;
    expect(result.hasActiveSubscription, isFalse);
    expect(store.buyCalls, 0);
    await bloc.close();
    await store.updates.close();
  });

  test('a temporary verification failure blocks another payment and Restore recovers it', () async {
    final repository = FakeRepository(account('free', active: false))
      ..verificationError = const ApiException(type: ApiErrorType.network, message: 'offline');
    final store = FakeStore()..restored = [transaction(PurchaseStatus.restored)];
    final bloc = SubscriptionBloc(repository: repository, purchaseService: store);
    final loaded = nextState(bloc, (state) => state.status == SubscriptionStatus.ready);
    bloc.add(const SubscriptionStarted());
    await loaded;
    final failed = nextState(bloc, (state) => state.errorMessage != null && state.purchaseNeedsVerification);
    bloc.add(PurchaseUpdatesReceived([transaction(PurchaseStatus.purchased)]));
    expect((await failed).canPurchase, isFalse);
    expect(store.completeCalls, 0);
    repository.verificationError = null;
    final recovered = nextState(bloc, (state) => state.hasActiveSubscription);
    bloc.add(const RestorePurchasesRequested());
    expect((await recovered).subscription!.planType, 'premium');
    expect(repository.saved.grantsAccess, isTrue);
    await bloc.close();
    await store.updates.close();
  });

  test('local completion failure cannot hide a persisted verified entitlement', () async {
    final repository = FakeRepository(account('free', active: false));
    final store = FakeStore()..failCompletion = true;
    final bloc = SubscriptionBloc(repository: repository, purchaseService: store);
    final loaded = nextState(bloc, (state) => state.status == SubscriptionStatus.ready);
    bloc.add(const SubscriptionStarted());
    await loaded;
    final active = nextState(bloc, (state) => state.hasActiveSubscription);
    bloc.add(PurchaseUpdatesReceived([transaction(PurchaseStatus.purchased)]));
    expect((await active).subscription!.planType, 'premium');
    expect(repository.saved.grantsAccess, isTrue);
    await bloc.close();
    await store.updates.close();

    final secondDeviceStore = FakeStore();
    final secondDevice = SubscriptionBloc(repository: repository, purchaseService: secondDeviceStore);
    final recovered = nextState(secondDevice, (state) => state.hasActiveSubscription);
    secondDevice.add(const SubscriptionStarted());
    expect((await recovered).canPurchase, isFalse);
    expect(secondDeviceStore.initializeCalls, 0);
    await secondDevice.close();
    await secondDeviceStore.updates.close();
  });

  test('an expired restored purchase does not grant paid access', () async {
    final repository = FakeRepository(account('free', active: false))..restoreActive = false;
    final store = FakeStore()..restored = [transaction(PurchaseStatus.restored)];
    final bloc = SubscriptionBloc(repository: repository, purchaseService: store);
    final loaded = nextState(bloc, (state) => state.status == SubscriptionStatus.ready);
    bloc.add(const SubscriptionStarted());
    await loaded;
    final expired = nextState(bloc, (state) => state.errorMessage != null);
    bloc.add(const RestorePurchasesRequested());
    final result = await expired;
    expect(result.hasActiveSubscription, isFalse);
    expect(result.purchaseNeedsVerification, isFalse);
    expect(result.canPurchase, isTrue);
    await bloc.close();
    await store.updates.close();
  });
}