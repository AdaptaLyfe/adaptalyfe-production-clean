import 'dart:async';

import 'package:adaptalyfe_mobile/core/network/api_client.dart';
import 'package:adaptalyfe_mobile/features/subscription/bloc/subscription_bloc.dart';
import 'package:adaptalyfe_mobile/features/subscription/bloc/subscription_event.dart';
import 'package:adaptalyfe_mobile/features/subscription/data/purchase_service.dart';
import 'package:adaptalyfe_mobile/features/subscription/data/subscription_api.dart';
import 'package:adaptalyfe_mobile/features/subscription/data/subscription_repository.dart';
import 'package:adaptalyfe_mobile/features/subscription/models/subscription_models.dart';
import 'package:adaptalyfe_mobile/features/subscription/presentation/subscription_screen.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:in_app_purchase/in_app_purchase.dart';

void main() {
  setUp(() {
    debugDefaultTargetPlatformOverride = TargetPlatform.android;
  });

  tearDown(() {
    debugDefaultTargetPlatformOverride = null;
  });

  testWidgets('shows all plans during loading and allows selecting a plan',
      (tester) async {
    final subscriptionRequest = Completer<SubscriptionModel>();
    final service = _FakePurchaseService();
    final bloc = _createBloc(
      service,
      _FakeSubscriptionRepository(
        subscriptionLoader: () => subscriptionRequest.future,
      ),
    );
    addTearDown(() async {
      await bloc.close();
      await service.closeStream();
    });

    await tester.pumpWidget(_subscriptionApp(bloc));
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 20));

    expect(
      find.byKey(const ValueKey('subscription-plan-basic')),
      findsOneWidget,
    );
    expect(
      find.byKey(const ValueKey('subscription-plan-premium')),
      findsOneWidget,
    );
    expect(
      find.byKey(const ValueKey('subscription-plan-family')),
      findsOneWidget,
    );
    expect(find.text('\$4.99/month'), findsOneWidget);
    expect(find.text('\$12.99/month'), findsOneWidget);
    expect(find.text('\$24.99/month'), findsOneWidget);
    expect(find.text('Checking trial status…'), findsOneWidget);
    expect(service.catalogQueries, 1);
    final basicCard = find.byKey(const ValueKey('subscription-plan-basic'));
    final basicPurchaseButton = tester.widget<OutlinedButton>(
      find.descendant(of: basicCard, matching: find.byType(OutlinedButton)),
    );
    expect(basicPurchaseButton.onPressed, isNull);

    await tester.ensureVisible(
      find.byKey(const ValueKey('subscription-plan-premium')),
    );
    await tester.tap(find.byKey(const ValueKey('subscription-plan-premium')));
    await tester.pump();

    expect(find.text('Selected'), findsOneWidget);

    subscriptionRequest.complete(_accountTrial);
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 20));
    await tester.pump();
  });

  testWidgets('shows store-provided prices and starts the selected purchase',
      (tester) async {
    final service = _FakePurchaseService();
    final bloc = _createBloc(
      service,
      _FakeSubscriptionRepository(),
    );
    addTearDown(() async {
      await bloc.close();
      await service.closeStream();
    });

    bloc.add(const SubscriptionStarted());
    await bloc.stream.firstWhere(
      (state) => state.status == SubscriptionStatus.ready,
    );
    expect(service.catalogQueries, 1);

    await tester.pumpWidget(_subscriptionApp(bloc));
    await tester.pump();
    await tester.pumpAndSettle();
    expect(service.catalogQueries, 2);

    final premiumCard =
        find.byKey(const ValueKey('subscription-plan-premium'));
    final purchaseButton = find.descendant(
      of: premiumCard,
      matching: find.text('Subscribe via Google Play'),
    );
    expect(find.text('\$12.99/month'), findsOneWidget);
    await tester.ensureVisible(purchaseButton);
    await tester.tap(purchaseButton);
    await tester.pump();

    expect(service.purchasedProductIds, ['adaptalyfe_premium_monthly']);
    expect(
      find.descendant(of: premiumCard, matching: find.text('Setting up…')),
      findsOneWidget,
    );
  });

  testWidgets(
      'shows web USD prices and never labels missing store products as free',
      (tester) async {
    final service = _FakePurchaseService()
      ..productPrices['adaptalyfe_basic_monthly'] = '₹550.00'
      ..unavailableProductIds.addAll({
        'adaptalyfe_premium_monthly',
        'adaptalyfe_family_monthly',
      });
    final bloc = _createBloc(
      service,
      _FakeSubscriptionRepository(),
    );
    addTearDown(() async {
      await bloc.close();
      await service.closeStream();
    });

    await tester.pumpWidget(_subscriptionApp(bloc));
    await tester.pump();
    await tester.pumpAndSettle();

    expect(find.text('\$4.99/month'), findsOneWidget);
    expect(
      find.text('Google Play checkout price: ₹550.00/month'),
      findsOneWidget,
    );
    expect(find.text('\$12.99/month'), findsOneWidget);
    expect(find.text('\$24.99/month'), findsOneWidget);
    expect(find.text('Store price unavailable'), findsNWidgets(2));
    expect(find.text('Free / month'), findsNothing);
    expect(find.text('Unavailable in store'), findsNWidgets(2));
    final premiumButton = tester.widget<FilledButton>(
      find.descendant(
        of: find.byKey(const ValueKey('subscription-plan-premium')),
        matching: find.byType(FilledButton),
      ),
    );
    final familyButton = tester.widget<OutlinedButton>(
      find.descendant(
        of: find.byKey(const ValueKey('subscription-plan-family')),
        matching: find.byType(OutlinedButton),
      ),
    );
    expect(premiumButton.onPressed, isNull);
    expect(familyButton.onPressed, isNull);
  });

  testWidgets('restore button requests a store restore', (tester) async {
    final service = _FakePurchaseService();
    final bloc = _createBloc(
      service,
      _FakeSubscriptionRepository(),
    );
    addTearDown(() async {
      await bloc.close();
      await service.closeStream();
    });

    await tester.pumpWidget(_subscriptionApp(bloc));
    await tester.pump();
    await tester.pumpAndSettle();

    final restoreButton = find.text('Restore Previous Purchase');
    await tester.ensureVisible(restoreButton);
    await tester.tap(restoreButton);
    await tester.pump();

    expect(service.restoreRequests, 1);
  });

  test('Google Play restore verifies the batch and applies its entitlement',
      () async {
    final service = _FakePurchaseService()
      ..restoredPurchases = [
        _purchase(
          status: PurchaseStatus.restored,
          source: 'GooglePlay',
          productId: 'adaptalyfe_premium_monthly',
          token: 'google-purchase-token',
        ),
      ];
    final repository = _FakeSubscriptionRepository(
      googleRestoreVerification: PurchaseVerification(
        success: true,
        subscription: _activeGooglePremium,
      ),
    );
    final bloc = _createBloc(service, repository);
    addTearDown(() async {
      await bloc.close();
      await service.closeStream();
    });

    final ready = bloc.stream.firstWhere(
      (state) => state.status == SubscriptionStatus.ready,
    );
    bloc.add(const SubscriptionStarted());
    await ready;

    final restored = bloc.stream.firstWhere(
      (state) => state.shouldNavigateToDashboard,
    );
    bloc.add(const RestorePurchasesRequested());
    final state = await restored.timeout(const Duration(seconds: 2));

    expect(repository.googleRestoreCalls, 1);
    expect(repository.verifiedPurchaseCalls, 0);
    expect(state.subscription?.planType, 'premium');
    expect(state.hasActiveSubscription, isTrue);
    expect(state.shouldRefreshAuthentication, isTrue);
  });

  test('restore finishes with a no-purchases result when the store is empty',
      () async {
    final service = _FakePurchaseService();
    final bloc = _createBloc(
      service,
      _FakeSubscriptionRepository(),
      restoreTimeout: const Duration(milliseconds: 5),
    );
    addTearDown(() async {
      await bloc.close();
      await service.closeStream();
    });

    final ready = bloc.stream.firstWhere(
      (state) => state.status == SubscriptionStatus.ready,
    );
    bloc.add(const SubscriptionStarted());
    await ready;

    final noPurchases = bloc.stream.firstWhere(
      (state) =>
          state.actionMessage ==
          'The store has not returned a previous purchase yet. If you still have an active subscription, retry restore when the store is available.',
    );
    bloc.add(const RestorePurchasesRequested());
    final state = await noPurchases.timeout(const Duration(seconds: 2));

    expect(state.status, SubscriptionStatus.ready);
    expect(state.purchaseNeedsVerification, isFalse);
    expect(state.purchasePending, isFalse);
  });

  test('a late store restore is still verified after the response timeout',
      () async {
    final service = _FakePurchaseService();
    final repository = _FakeSubscriptionRepository(
      googleRestoreVerification: PurchaseVerification(
        success: true,
        subscription: _activeGooglePremium,
      ),
    );
    final bloc = _createBloc(
      service,
      repository,
      restoreTimeout: const Duration(milliseconds: 5),
    );
    addTearDown(() async {
      await bloc.close();
      await service.closeStream();
    });

    final ready = bloc.stream.firstWhere(
      (state) => state.status == SubscriptionStatus.ready,
    );
    bloc.add(const SubscriptionStarted());
    await ready;

    final noResponse = bloc.stream.firstWhere(
      (state) =>
          state.actionMessage ==
          'The store has not returned a previous purchase yet. If you still have an active subscription, retry restore when the store is available.',
    );
    bloc.add(const RestorePurchasesRequested());
    await noResponse.timeout(const Duration(seconds: 2));

    final restored = bloc.stream.firstWhere(
      (state) => state.shouldNavigateToDashboard,
    );
    service.emitPurchases([
      _purchase(
        status: PurchaseStatus.restored,
        source: 'GooglePlay',
        productId: 'adaptalyfe_premium_monthly',
        token: 'late-google-purchase-token',
      ),
    ]);
    final state = await restored.timeout(const Duration(seconds: 2));

    expect(repository.googleRestoreCalls, 1);
    expect(state.hasActiveSubscription, isTrue);
  });

  test('an expired store purchase does not keep new purchases locked',
      () async {
    final service = _FakePurchaseService();
    final repository = _FakeSubscriptionRepository(
      subscriptionLoader: () async => _expiredGoogleSubscription,
      purchaseVerificationError: const ApiException(
        type: ApiErrorType.network,
        statusCode: 400,
        message: 'Google Play reports that this subscription is not active.',
      ),
    );
    final bloc = _createBloc(service, repository);
    addTearDown(() async {
      await bloc.close();
      await service.closeStream();
    });

    final ready = bloc.stream.firstWhere(
      (state) => state.status == SubscriptionStatus.ready,
    );
    bloc.add(const SubscriptionStarted());
    await ready;

    final settled = bloc.stream.firstWhere(
      (state) =>
          state.actionMessage ==
              'Google Play reports that this subscription is not active.' &&
          !state.purchaseNeedsVerification,
    );
    service.emitPurchases([
      _purchase(
        status: PurchaseStatus.purchased,
        source: 'GooglePlay',
        productId: 'adaptalyfe_basic_monthly',
        token: 'expired-google-token',
      ),
    ]);
    final state = await settled.timeout(const Duration(seconds: 2));

    expect(state.subscription?.grantsAccess, isFalse);
    expect(state.purchasePending, isFalse);
    expect(state.canPurchase, isTrue);
  });

  test('an unclassified verification failure keeps purchase actions blocked',
      () async {
    final service = _FakePurchaseService();
    final bloc = _createBloc(
      service,
      _FakeSubscriptionRepository(),
    );
    addTearDown(() async {
      await bloc.close();
      await service.closeStream();
    });

    final ready = bloc.stream.firstWhere(
      (state) => state.status == SubscriptionStatus.ready,
    );
    bloc.add(const SubscriptionStarted());
    await ready;

    final verificationFailed = bloc.stream.firstWhere(
      (state) =>
          state.status == SubscriptionStatus.failure &&
          state.purchaseNeedsVerification,
    );
    service.emitPurchases([
      _purchase(
        status: PurchaseStatus.purchased,
        source: 'GooglePlay',
        productId: 'adaptalyfe_basic_monthly',
        token: 'unverified-google-token',
      ),
    ]);
    final state = await verificationFailed.timeout(const Duration(seconds: 2));

    expect(state.hasActiveSubscription, isFalse);
    expect(state.purchaseNeedsVerification, isTrue);
    expect(state.canPurchase, isFalse);
  });

  testWidgets('shows the account error without hiding plan cards',
      (tester) async {
    final service = _FakePurchaseService();
    final bloc = _createBloc(
      service,
      _FakeSubscriptionRepository(failSubscriptionLoad: true),
    );
    addTearDown(() async {
      await bloc.close();
      await service.closeStream();
    });

    await tester.pumpWidget(_subscriptionApp(bloc));
    await tester.pump();
    await tester.pumpAndSettle();

    expect(find.text('Subscription service unavailable.'), findsOneWidget);
    expect(
      find.byKey(const ValueKey('subscription-plan-basic')),
      findsOneWidget,
    );
    expect(
      find.byKey(const ValueKey('subscription-plan-premium')),
      findsOneWidget,
    );
    expect(
      find.byKey(const ValueKey('subscription-plan-family')),
      findsOneWidget,
    );
    expect(find.text('\$4.99/month'), findsOneWidget);
  });
}

SubscriptionBloc _createBloc(
  _FakePurchaseService service,
  _FakeSubscriptionRepository repository, {
  Duration restoreTimeout = const Duration(seconds: 10),
}) {
  return SubscriptionBloc(
    repository,
    service,
    restoreTimeout: restoreTimeout,
  );
}

Widget _subscriptionApp(SubscriptionBloc bloc) {
  return MaterialApp(
    home: BlocProvider<SubscriptionBloc>.value(
      value: bloc,
      child: const SubscriptionScreen(),
    ),
  );
}

const _accountTrial = SubscriptionModel(
  id: 1,
  planType: 'basic',
  status: 'trialing',
  billingCycle: 'monthly',
  isAccountTrial: true,
  trialDaysLeft: 4,
);

final _activeGooglePremium = SubscriptionModel(
  id: 2,
  planType: 'premium',
  status: 'active',
  billingCycle: 'monthly',
  subscriptionPlatform: 'google_play',
  currentPeriodEnd: DateTime.now().add(const Duration(days: 30)),
);

final _expiredGoogleSubscription = SubscriptionModel(
  id: 3,
  planType: 'basic',
  status: 'expired',
  billingCycle: 'monthly',
  subscriptionPlatform: 'google_play',
  currentPeriodEnd: DateTime.utc(2020),
);

class _FakeSubscriptionRepository extends SubscriptionRepository {
  _FakeSubscriptionRepository({
    this.subscriptionLoader,
    this.failSubscriptionLoad = false,
    this.purchaseVerification,
    this.purchaseVerificationError,
    this.googleRestoreVerification,
  }) : super(SubscriptionApi(ApiClient()));

  final Future<SubscriptionModel> Function()? subscriptionLoader;
  final bool failSubscriptionLoad;
  final PurchaseVerification? purchaseVerification;
  final ApiException? purchaseVerificationError;
  final PurchaseVerification? googleRestoreVerification;
  int verifiedPurchaseCalls = 0;
  int googleRestoreCalls = 0;

  @override
  Future<SubscriptionModel> getSubscription() async {
    if (failSubscriptionLoad) {
      throw const ApiException(
        type: ApiErrorType.network,
        message: 'Subscription service unavailable.',
      );
    }
    final loader = subscriptionLoader;
    if (loader != null) return await loader();
    return _accountTrial;
  }

  @override
  Future<PurchaseVerification> verifyPurchase(PurchaseDetails purchase) async {
    verifiedPurchaseCalls++;
    if (purchaseVerificationError != null) {
      throw purchaseVerificationError!;
    }
    return purchaseVerification ??
        const PurchaseVerification(
          success: false,
          message: 'Verification is not used by this screen test.',
        );
  }

  @override
  Future<PurchaseVerification> restoreGooglePurchases(
    List<PurchaseDetails> purchases,
  ) async {
    googleRestoreCalls++;
    return googleRestoreVerification ??
        const PurchaseVerification(
          success: false,
          message: 'No purchase to restore.',
        );
  }
}

class _FakePurchaseService extends PurchaseService {
  _FakePurchaseService() : super();

  final Map<String, String> productPrices = {
    'adaptalyfe_basic_monthly': '\$4.99',
    'adaptalyfe_premium_monthly': '\$12.99',
    'adaptalyfe_family_monthly': '\$24.99',
  };
  final Set<String> unavailableProductIds = {};
  final List<String> purchasedProductIds = [];
  final StreamController<List<PurchaseDetails>> _purchaseController =
      StreamController<List<PurchaseDetails>>.broadcast();
  int restoreRequests = 0;
  int catalogQueries = 0;
  List<PurchaseDetails> restoredPurchases = const [];

  @override
  Stream<List<PurchaseDetails>> get purchaseStream =>
      _purchaseController.stream;

  @override
  Future<bool> isAvailable() async => true;

  @override
  Future<StoreProductCatalog> loadSubscriptionProducts() async {
    catalogQueries++;
    final products = <String, ProductDetails>{};
    for (final entry in productPrices.entries) {
      if (!unavailableProductIds.contains(entry.key)) {
        products[entry.key] = _product(entry.key, entry.value);
      }
    }
    return StoreProductCatalog(
      products: products,
      notFoundProductIds: unavailableProductIds,
    );
  }

  @override
  Future<bool> buySubscription(ProductDetails product) async {
    purchasedProductIds.add(product.id);
    return true;
  }

  @override
  Future<void> restorePurchases() async {
    restoreRequests++;
    if (restoredPurchases.isNotEmpty) {
      _purchaseController.add(restoredPurchases);
    }
  }

  @override
  Future<void> completePurchase(PurchaseDetails purchase) async {}

  void emitPurchases(List<PurchaseDetails> purchases) {
    _purchaseController.add(purchases);
  }

  Future<void> closeStream() => _purchaseController.close();
}

PurchaseDetails _purchase({
  required PurchaseStatus status,
  required String source,
  required String productId,
  required String token,
}) {
  return PurchaseDetails(
    purchaseID: 'store-order-123',
    productID: productId,
    verificationData: PurchaseVerificationData(
      localVerificationData: token,
      serverVerificationData: token,
      source: source,
    ),
    transactionDate: DateTime.now().millisecondsSinceEpoch.toString(),
    status: status,
  );
}

ProductDetails _product(String id, String price) {
  return ProductDetails(
    id: id,
    title: id,
    description: id,
    price: price,
    rawPrice: double.parse(price.replaceAll(RegExp(r'[^0-9.]'), '')),
    currencyCode: 'USD',
    currencySymbol: '\$',
  );
}
