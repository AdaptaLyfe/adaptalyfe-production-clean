import 'dart:async';

import 'package:adaptalyfe_mobile/features/rewards/data/rewards_api.dart';
import 'package:adaptalyfe_mobile/features/rewards/bloc/rewards_bloc.dart';
import 'package:adaptalyfe_mobile/features/rewards/bloc/rewards_event.dart';
import 'package:adaptalyfe_mobile/features/rewards/data/rewards_repository.dart';
import 'package:adaptalyfe_mobile/features/rewards/bloc/rewards_state.dart';
import 'package:adaptalyfe_mobile/features/rewards/models/reward_models.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('RewardsBloc redemption', () {
    test('uses the latest reward count instead of the tapped card snapshot',
        () async {
      final staleReward = _reward(maximum: 5, current: 1);
      final repository = _FakeRewardsRepository(
        rewards: [_reward(maximum: 2, current: 2)],
        balance: _balance(),
      );
      final bloc = RewardsBloc(repository);
      final rejected = bloc.stream.firstWhere(
        (state) =>
            state.errorMessage ==
            'This reward has reached its maximum redemptions.',
      );

      bloc.add(RedeemReward(staleReward));
      final state = await rejected;

      expect(repository.redemptionCalls, 0);
      expect(state.rewards.single.currentRedemptions, 2);
      expect(state.rewards.single.remainingRedemptions, 0);
      expect(state.busyKey, isNull);
      await bloc.close();
    });

    test('refreshes the count after a server-side concurrent-limit rejection',
        () async {
      final reward = _reward(maximum: 2, current: 1);
      final repository = _FakeRewardsRepository(
        rewards: [reward],
        balance: _balance(),
        rejectAtLimit: true,
      );
      final bloc = RewardsBloc(repository);
      final rejected = bloc.stream.firstWhere(
        (state) =>
            state.errorMessage ==
            'This reward has reached its maximum redemptions.',
      );

      bloc.add(RedeemReward(reward));
      final state = await rejected;

      expect(repository.redemptionCalls, 1);
      expect(state.rewards.single.currentRedemptions, 2);
      expect(state.rewards.single.remainingRedemptions, 0);
      expect(state.busyKey, isNull);
      await bloc.close();
    });

    test('ignores a second same-reward request while redemption is in flight',
        () async {
      final reward = _reward(maximum: 3, current: 0);
      final gate = Completer<void>();
      final repository = _FakeRewardsRepository(
        rewards: [reward],
        balance: _balance(),
        redemptionGate: gate,
      );
      final bloc = RewardsBloc(repository);
      final redeemed = bloc.stream.firstWhere(
        (state) => state.actionMessage?.startsWith('Reward redeemed!') == true,
      );

      bloc
        ..add(RedeemReward(reward))
        ..add(RedeemReward(reward));

      await repository.redemptionStarted.future.timeout(
        const Duration(seconds: 2),
      );
      await Future<void>.delayed(Duration.zero);
      expect(repository.redemptionCalls, 1);

      gate.complete();
      final state = await redeemed;
      expect(repository.redemptionCalls, 1);
      expect(state.rewards.single.currentRedemptions, 1);
      expect(state.rewards.single.remainingRedemptions, 2);
      expect(state.pointsBalance?.availablePoints, 90);
      await bloc.close();
    });

    test('loads the newly earned badges after a successful redemption',
        () async {
      final reward = _reward(maximum: 3, current: 0);
      final earnedBadge = _badge(
        type: 'first_reward',
        title: 'First Reward',
        isEarned: true,
        progress: 1,
        target: 1,
      );
      final repository = _FakeRewardsRepository(
        rewards: [reward],
        balance: _balance(),
        achievements: [earnedBadge],
      );
      final bloc = RewardsBloc(repository);
      final refreshed = bloc.stream.firstWhere(
        (state) =>
            state.achievements.contains(earnedBadge) && state.busyKey == null,
      );

      bloc.add(RedeemReward(reward));
      final state = await refreshed;

      expect(state.achievements.single.badgeStatus, AchievementBadgeStatus.earned);
      expect(repository.achievementFetchCalls, 1);
      await bloc.close();
    });

    test('surfaces a badge response parsing failure', () async {
      final repository = _FakeRewardsRepository(
        rewards: [_reward(maximum: 3, current: 0)],
        balance: _balance(),
        badgeError: const FormatException('Invalid reward badge entry'),
      );
      final bloc = RewardsBloc(repository);
      final failed = bloc.stream.firstWhere(
        (state) => state.status == RewardsStatus.failure,
      );

      bloc.add(const RewardsStarted());
      final state = await failed;

      expect(state.errorMessage, 'Invalid reward badge entry');
      expect(state.achievements, isEmpty);
      await bloc.close();
    });
  });
}

class _FakeRewardsRepository implements RewardsRepository {
  _FakeRewardsRepository({
    required this.rewards,
    required this.balance,
    this.achievements = const [],
    this.redemptionGate,
    this.rejectAtLimit = false,
    this.badgeError,
  });

  final List<RewardModel> rewards;
  PointsBalanceModel balance;
  final List<AchievementBadgeModel> achievements;
  final Completer<void>? redemptionGate;
  final bool rejectAtLimit;
  final Object? badgeError;
  final Completer<void> redemptionStarted = Completer<void>();
  int redemptionCalls = 0;
  int achievementFetchCalls = 0;

  @override
  RewardsApi get api => throw UnimplementedError();

  @override
  Future<List<RewardModel>> getRewards() async =>
      List<RewardModel>.unmodifiable(rewards);

  @override
  Future<PointsBalanceModel> getPointsBalance() async => balance;

  @override
  Future<List<PointsTransactionModel>> getPointsTransactions() async => [];

  @override
  Future<List<AchievementBadgeModel>> getAchievements() async {
    achievementFetchCalls++;
    if (badgeError != null) throw badgeError!;
    return achievements;
  }

  @override
  Future<RewardModel> createReward(RewardInput input) =>
      throw UnimplementedError();

  @override
  Future<RewardModel> updateReward(int id, RewardInput input) =>
      throw UnimplementedError();

  @override
  Future<void> deleteReward(int id) => throw UnimplementedError();

  @override
  Future<void> redeemReward({required int rewardId}) async {
    redemptionCalls++;
    if (!redemptionStarted.isCompleted) redemptionStarted.complete();
    await redemptionGate?.future;

    final index = rewards.indexWhere((reward) => reward.id == rewardId);
    if (index < 0) throw StateError('Reward not found');
    final reward = rewards[index];
    if (rejectAtLimit) {
      rewards[index] = reward.withCurrentRedemptions(
        reward.maxRedemptions ?? reward.currentRedemptions + 1,
      );
      throw const FormatException(
        'This reward has reached its maximum redemptions.',
      );
    }
    rewards[index] = reward.withCurrentRedemptions(
      reward.currentRedemptions + 1,
    );
    balance = balance.afterRedemption(
      reward.pointsRequired,
      DateTime.now(),
    );
  }
}

RewardModel _reward({
  required int maximum,
  required int current,
}) =>
    RewardModel(
      id: 42,
      userId: 7,
      caregiverId: 7,
      title: 'Movie night',
      description: 'Choose a movie.',
      pointsRequired: 10,
      category: 'activity',
      rewardType: 'immediate',
      value: null,
      isActive: true,
      maxRedemptions: maximum,
      currentRedemptions: current,
      expiresAt: null,
      iconName: 'gift',
      color: '#3b82f6',
      createdAt: null,
      updatedAt: null,
    );

PointsBalanceModel _balance() => const PointsBalanceModel(
      userId: 7,
      totalPoints: 100,
      availablePoints: 100,
      lifetimeEarned: 100,
      lifetimeSpent: 0,
      updatedAt: null,
    );

AchievementBadgeModel _badge({
  required String type,
  required String title,
  required bool isEarned,
  required int progress,
  required int target,
}) =>
    AchievementBadgeModel(
      id: -1,
      userId: 7,
      type: type,
      title: title,
      description: 'Badge description.',
      iconName: 'trophy',
      category: 'rewards',
      points: 0,
      level: 1,
      earnedAt: null,
      isEarned: isEarned,
      progress: progress,
      target: target,
      requirement: 'Complete the requirement.',
    );
