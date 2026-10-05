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
    addTearDown(bloc.close);

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
    expect(find.text('\$4.99 / month'), findsOneWidget);
    expect(find.text('\$12.99 / month'), findsOneWidget);
    expect(find.text('\$24.99 / month'), findsOneWidget);
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
    addTearDown(bloc.close);

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
    expect(find.text('\$12.99 / month'), findsOneWidget);
    await tester.ensureVisible(purchaseButton);
    await tester.tap(purchaseButton);
    await tester.pump();

    expect(service.purchasedProductIds, ['adaptalyfe_premium_monthly']);
    expect(
      find.descendant(of: premiumCard, matching: find.text('Setting up…')),
      findsOneWidget,
    );
  });

  testWidgets('restore button requests a store restore', (tester) async {
    final service = _FakePurchaseService();
    final bloc = _createBloc(
      service,
      _FakeSubscriptionRepository(),
    );
    addTearDown(bloc.close);

    await tester.pumpWidget(_subscriptionApp(bloc));
    await tester.pump();
    await tester.pumpAndSettle();

    final restoreButton = find.text('Restore Previous Purchase');
    await tester.ensureVisible(restoreButton);
    await tester.tap(restoreButton);
    await tester.pump();

    expect(service.restoreRequests, 1);
  });

  testWidgets('shows the account error without hiding plan cards',
      (tester) async {
    final service = _FakePurchaseService();
    final bloc = _createBloc(
      service,
      _FakeSubscriptionRepository(failSubscriptionLoad: true),
    );
    addTearDown(bloc.close);

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
    expect(find.text('\$4.99 / month'), findsOneWidget);
  });
}

SubscriptionBloc _createBloc(
  _FakePurchaseService service,
  _FakeSubscriptionRepository repository,
) {
  return SubscriptionBloc(repository, service);
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

class _FakeSubscriptionRepository extends SubscriptionRepository {
  _FakeSubscriptionRepository({
    this.subscriptionLoader,
    this.failSubscriptionLoad = false,
  }) : super(SubscriptionApi(ApiClient()));

  final Future<SubscriptionModel> Function()? subscriptionLoader;
  final bool failSubscriptionLoad;

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
    return const PurchaseVerification(
      success: false,
      message: 'Verification is not used by this screen test.',
    );
  }
}

class _FakePurchaseService extends PurchaseService {
  _FakePurchaseService() : super();

  final List<String> purchasedProductIds = [];
  int restoreRequests = 0;
  int catalogQueries = 0;

  @override
  Stream<List<PurchaseDetails>> get purchaseStream =>
      Stream<List<PurchaseDetails>>.empty();

  @override
  Future<bool> isAvailable() async => true;

  @override
  Future<StoreProductCatalog> loadSubscriptionProducts() async {
    catalogQueries++;
    return StoreProductCatalog(
      products: {
        'adaptalyfe_basic_monthly': _product('adaptalyfe_basic_monthly', '\$4.99'),
        'adaptalyfe_premium_monthly':
            _product('adaptalyfe_premium_monthly', '\$12.99'),
        'adaptalyfe_family_monthly':
            _product('adaptalyfe_family_monthly', '\$24.99'),
      },
      notFoundProductIds: const {},
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
  }
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
