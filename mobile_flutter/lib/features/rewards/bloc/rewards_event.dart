import 'package:equatable/equatable.dart';

import '../models/reward_models.dart';

sealed class RewardsEvent extends Equatable {
  const RewardsEvent();

  @override
  List<Object?> get props => [];
}

final class RewardsStarted extends RewardsEvent {
  const RewardsStarted();
}

final class RefreshRewards extends RewardsEvent {
  const RefreshRewards();
}

final class CreateReward extends RewardsEvent {
  const CreateReward(this.input);

  final RewardInput input;

  @override
  List<Object?> get props => [input];
}

final class UpdateReward extends RewardsEvent {
  const UpdateReward({
    required this.rewardId,
    required this.input,
  });

  final int rewardId;
  final RewardInput input;

  @override
  List<Object?> get props => [rewardId, input];
}

final class DeleteReward extends RewardsEvent {
  const DeleteReward(this.rewardId);

  final int rewardId;

  @override
  List<Object?> get props => [rewardId];
}

final class RedeemReward extends RewardsEvent {
  const RedeemReward(this.reward);

  final RewardModel reward;

  @override
  List<Object?> get props => [reward];
}