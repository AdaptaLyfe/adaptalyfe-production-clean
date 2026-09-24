import 'package:adaptalyfe_mobile/features/rewards/models/reward_models.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('AchievementBadgeModel status', () {
    test('reports earned when the backend records the award', () {
      final badge = _badge(isEarned: true, progress: 1);

      expect(badge.badgeStatus, AchievementBadgeStatus.earned);
    });

    test('reports in progress when a locked badge has progress', () {
      final badge = _badge(isEarned: false, progress: 3);

      expect(badge.badgeStatus, AchievementBadgeStatus.inProgress);
    });

    test('reports locked at zero progress', () {
      final badge = _badge(isEarned: false, progress: 0);

      expect(badge.badgeStatus, AchievementBadgeStatus.locked);
    });
  });
}

AchievementBadgeModel _badge({
  required bool isEarned,
  required int progress,
}) =>
    AchievementBadgeModel(
      id: -1,
      userId: 7,
      type: 'reward_collector',
      title: 'Reward Collector',
      description: 'Redeem rewards.',
      iconName: 'collections',
      category: 'rewards',
      points: 0,
      level: 1,
      earnedAt: null,
      isEarned: isEarned,
      progress: progress,
      target: 5,
      requirement: 'Redeem 5 rewards.',
    );