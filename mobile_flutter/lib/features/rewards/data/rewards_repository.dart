import '../models/reward_models.dart';
import 'rewards_api.dart';

class RewardsRepository {
  const RewardsRepository(this.api);

  final RewardsApi api;

  Future<List<RewardModel>> getRewards() => api.getRewards();

  Future<PointsBalanceModel> getPointsBalance() => api.getPointsBalance();

  Future<List<PointsTransactionModel>> getPointsTransactions() =>
      api.getPointsTransactions();

  Future<List<AchievementBadgeModel>> getAchievements() =>
      api.getAchievements();

  Future<RewardModel> createReward(RewardInput input) =>
      api.createReward(input);

  Future<RewardModel> updateReward(int id, RewardInput input) =>
      api.updateReward(id, input);

  Future<void> deleteReward(int id) => api.deleteReward(id);

  Future<void> redeemReward({
    required int rewardId,
    required int pointsSpent,
  }) =>
      api.redeemReward(rewardId: rewardId, pointsSpent: pointsSpent);
}