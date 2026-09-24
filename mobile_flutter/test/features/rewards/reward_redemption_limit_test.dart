import 'package:adaptalyfe_mobile/features/rewards/models/reward_models.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('RewardRedemptionLimit', () {
    test('treats a null maximum as unlimited', () {
      expect(
        RewardRedemptionLimit.hasReached(maximum: null, current: 100),
        isFalse,
      );
      expect(
        RewardRedemptionLimit.remaining(maximum: null, current: 100),
        isNull,
      );
    });

    test('allows the first redemption for a maximum of one', () {
      expect(
        RewardRedemptionLimit.hasReached(maximum: 1, current: 0),
        isFalse,
      );
      expect(
        RewardRedemptionLimit.hasReached(maximum: 1, current: 1),
        isTrue,
      );
    });

    test('blocks redemption at and above the configured maximum', () {
      for (final count in [0, 1, 2]) {
        expect(
          RewardRedemptionLimit.hasReached(maximum: 3, current: count),
          isFalse,
        );
      }
      expect(
        RewardRedemptionLimit.hasReached(maximum: 3, current: 3),
        isTrue,
      );
      expect(
        RewardRedemptionLimit.hasReached(maximum: 3, current: 4),
        isTrue,
      );
    });

    test('reports zero remaining without returning a negative count', () {
      expect(
        RewardRedemptionLimit.remaining(maximum: 3, current: 2),
        1,
      );
      expect(
        RewardRedemptionLimit.remaining(maximum: 3, current: 3),
        0,
      );
      expect(
        RewardRedemptionLimit.remaining(maximum: 3, current: 4),
        0,
      );
    });
  });
}
