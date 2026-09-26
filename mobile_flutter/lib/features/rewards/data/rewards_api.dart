import '../../../core/network/api_client.dart';
import '../models/reward_models.dart';

class RewardsApi {
  const RewardsApi(this.client);

  final ApiClient client;

  Future<List<RewardModel>> getRewards() =>
      _getList('/api/rewards', RewardModel.fromJson);

  Future<PointsBalanceModel> getPointsBalance() async {
    final response = await client.get<dynamic>('/api/points/balance');
    return _parseItem(response.data, PointsBalanceModel.fromJson);
  }

  Future<List<PointsTransactionModel>> getPointsTransactions() =>
      _getList('/api/points/transactions', PointsTransactionModel.fromJson);

  Future<List<AchievementBadgeModel>> getAchievements() async {
    final response = await client.get<dynamic>('/api/rewards/badges');
    return parseRewardBadgesResponse(response.data);
  }

  Future<RewardModel> createReward(RewardInput input) =>
      _post('/api/rewards', input.toJson(), RewardModel.fromJson);

  Future<RewardModel> updateReward(int id, RewardInput input) =>
      _patch('/api/rewards/$id', input.toJson(), RewardModel.fromJson);

  Future<void> deleteReward(int id) async {
    await client.delete<dynamic>('/api/rewards/$id');
  }

  Future<void> redeemReward({required int rewardId}) async {
    await client.post<dynamic>(
      '/api/rewards/redeem',
      data: {'rewardId': rewardId},
    );
  }

  Future<List<T>> _getList<T>(
    String path,
    T Function(Map<String, dynamic>) fromJson,
  ) async {
    final response = await client.get<dynamic>(path);
    if (response.data is! List) {
      throw const FormatException('Invalid rewards collection response');
    }
    return (response.data as List)
        .whereType<Map>()
        .map((item) => fromJson(Map<String, dynamic>.from(item)))
        .toList();
  }

  Future<T> _post<T>(
    String path,
    Map<String, dynamic> data,
    T Function(Map<String, dynamic>) fromJson,
  ) async {
    final response = await client.post<dynamic>(path, data: data);
    return _parseItem(response.data, fromJson);
  }

  Future<T> _patch<T>(
    String path,
    Map<String, dynamic> data,
    T Function(Map<String, dynamic>) fromJson,
  ) async {
    final response = await client.patch<dynamic>(path, data: data);
    return _parseItem(response.data, fromJson);
  }

  T _parseItem<T>(
    Object? data,
    T Function(Map<String, dynamic>) fromJson,
  ) {
    if (data is! Map) {
      throw const FormatException('Invalid reward response');
    }
    return fromJson(Map<String, dynamic>.from(data));
  }
}

List<AchievementBadgeModel> parseRewardBadgesResponse(Object? data) {
  if (data is! List) {
    throw const FormatException('Invalid rewards badges response');
  }

  final badges = <AchievementBadgeModel>[];
  for (final item in data) {
    if (item is! Map) {
      throw const FormatException('Invalid reward badge entry');
    }
    final badge = AchievementBadgeModel.fromJson(
      Map<String, dynamic>.from(item),
    );
    if (badge.type.isEmpty || badge.title.isEmpty) {
      throw const FormatException('Reward badge is missing its identity');
    }
    badges.add(badge);
  }
  return badges;
}