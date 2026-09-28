import 'package:equatable/equatable.dart';

import '../models/reward_models.dart';

enum RewardsStatus {
  initial,
  loading,
  loaded,
  failure,
}

class RewardsState extends Equatable {
  const RewardsState({
    this.status = RewardsStatus.initial,
    this.rewards = const [],
    this.achievements = const [],
    this.pointsBalance,
    this.transactions = const [],
    this.busyKey,
    this.errorMessage,
    this.badgeErrorMessage,
    this.actionMessage,
    this.sessionInvalid = false,
  });

  final RewardsStatus status;
  final List<RewardModel> rewards;
  final List<AchievementBadgeModel> achievements;
  final PointsBalanceModel? pointsBalance;
  final List<PointsTransactionModel> transactions;
  final String? busyKey;
  final String? errorMessage;
  final String? badgeErrorMessage;
  final String? actionMessage;
  final bool sessionInvalid;

  bool get isLoading => status == RewardsStatus.loading;
  bool get hasContent =>
      rewards.isNotEmpty ||
      achievements.isNotEmpty ||
      pointsBalance != null ||
      transactions.isNotEmpty;

  int get longestAchievementPoints => achievements.fold<int>(
        0,
        (current, achievement) =>
            achievement.points > current ? achievement.points : current,
      );

  RewardsState copyWith({
    RewardsStatus? status,
    List<RewardModel>? rewards,
    List<AchievementBadgeModel>? achievements,
    Object? pointsBalance = _notSet,
    List<PointsTransactionModel>? transactions,
    Object? busyKey = _notSet,
    Object? errorMessage = _notSet,
    Object? badgeErrorMessage = _notSet,
    Object? actionMessage = _notSet,
    bool? sessionInvalid,
  }) {
    return RewardsState(
      status: status ?? this.status,
      rewards: rewards ?? this.rewards,
      achievements: achievements ?? this.achievements,
      pointsBalance: identical(pointsBalance, _notSet)
          ? this.pointsBalance
          : pointsBalance as PointsBalanceModel?,
      transactions: transactions ?? this.transactions,
      busyKey: identical(busyKey, _notSet) ? this.busyKey : busyKey as String?,
      errorMessage: identical(errorMessage, _notSet)
          ? this.errorMessage
          : errorMessage as String?,
      badgeErrorMessage: identical(badgeErrorMessage, _notSet)
          ? this.badgeErrorMessage
          : badgeErrorMessage as String?,
      actionMessage: identical(actionMessage, _notSet)
          ? this.actionMessage
          : actionMessage as String?,
      sessionInvalid: sessionInvalid ?? this.sessionInvalid,
    );
  }

  @override
  List<Object?> get props => [
        status,
        rewards,
        achievements,
        pointsBalance,
        transactions,
        busyKey,
        errorMessage,
        badgeErrorMessage,
        actionMessage,
        sessionInvalid,
      ];
}

const _notSet = Object();