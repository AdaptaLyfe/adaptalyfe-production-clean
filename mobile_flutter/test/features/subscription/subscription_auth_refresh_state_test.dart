import 'package:flutter_test/flutter_test.dart';

import 'package:adaptalyfe_mobile/features/subscription/bloc/subscription_state.dart';

void main() {
  test('subscription state exposes a clearable auth refresh request', () {
    const initial = SubscriptionState();
    expect(initial.shouldRefreshAuthentication, isFalse);

    final pending = initial.copyWith(shouldRefreshAuthentication: true);
    expect(pending.shouldRefreshAuthentication, isTrue);

    final handled = pending.copyWith(shouldRefreshAuthentication: false);
    expect(handled.shouldRefreshAuthentication, isFalse);
  });
}