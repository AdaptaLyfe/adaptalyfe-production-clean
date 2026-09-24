import 'package:adaptalyfe_mobile/features/rewards/data/rewards_api.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('reward badge response parsing', () {
    test('parses every valid badge entry', () {
      final badges = parseRewardBadgesResponse([
        {
          'achievementType': 'first_reward',
          'title': 'First Reward',
          'isEarned': true,
          'progress': 1,
          'target': 1,
        },
        {
          'achievementType': 'point_starter',
          'title': 'Point Starter',
          'isEarned': false,
          'progress': 25,
          'target': 100,
        },
      ]);

      expect(badges, hasLength(2));
      expect(badges.map((badge) => badge.type), [
        'first_reward',
        'point_starter',
      ]);
    });

    test('rejects malformed entries instead of silently dropping them', () {
      expect(
        () => parseRewardBadgesResponse([
          {
            'achievementType': 'first_reward',
            'title': 'First Reward',
          },
          'invalid entry',
        ]),
        throwsFormatException,
      );
    });

    test('rejects entries without badge identity', () {
      expect(
        () => parseRewardBadgesResponse([
          {'description': 'No badge identity'},
        ]),
        throwsFormatException,
      );
    });
  });
}