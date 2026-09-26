import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../core/network/api_client.dart';
import '../data/rewards_repository.dart';
import '../models/reward_models.dart';
import 'rewards_event.dart';
import 'rewards_state.dart';

class RewardsBloc extends Bloc<RewardsEvent, RewardsState> {
  RewardsBloc(this.repository) : super(const RewardsState()) {
    on<RewardsStarted>(_loadRewards);
    on<RefreshRewards>(_loadRewards);
    on<CreateReward>(_createReward);
    on<UpdateReward>(_updateReward);
    on<DeleteReward>(_deleteReward);
    on<RedeemReward>(_redeemReward);
  }

  final RewardsRepository repository;
  final Set<int> _redeemingRewardIds = <int>{};

  Future<void> _loadRewards(
    RewardsEvent event,
    Emitter<RewardsState> emit,
  ) async {
    emit(
      state.copyWith(
        status: RewardsStatus.loading,
        errorMessage: null,
        actionMessage: null,
        sessionInvalid: false,
      ),
    );

    try {
      final results = await Future.wait<Object>([
        repository.getRewards(),
        repository.getPointsBalance(),
        repository.getPointsTransactions(),
        repository.getAchievements(),
      ]);
      emit(
        state.copyWith(
          status: RewardsStatus.loaded,
          rewards: results[0] as List<RewardModel>,
          pointsBalance: results[1] as PointsBalanceModel,
          transactions: results[2] as List<PointsTransactionModel>,
          achievements: results[3] as List<AchievementBadgeModel>,
          busyKey: null,
          errorMessage: null,
          actionMessage: null,
        ),
      );
    } on ApiException catch (error) {
      _emitLoadFailure(emit, error);
    } catch (error) {
      _emitLoadFailure(
        emit,
        error,
        fallback: 'Unable to load your rewards. Please try again.',
      );
    }
  }

  Future<void> _createReward(
    CreateReward event,
    Emitter<RewardsState> emit,
  ) async {
    emit(
      state.copyWith(
        busyKey: 'create',
        errorMessage: null,
        actionMessage: null,
      ),
    );
    try {
      final reward = await repository.createReward(event.input);
      emit(
        state.copyWith(
          status: RewardsStatus.loaded,
          rewards: [...state.rewards, reward],
          busyKey: null,
          actionMessage: 'Reward created successfully.',
          errorMessage: null,
          sessionInvalid: false,
        ),
      );
    } on ApiException catch (error) {
      _emitActionFailure(emit, error, 'create');
    } catch (error) {
      _emitActionFailure(
        emit,
        error,
        'create',
        fallback: 'Unable to create this reward.',
      );
    }
  }

  Future<void> _updateReward(
    UpdateReward event,
    Emitter<RewardsState> emit,
  ) async {
    emit(
      state.copyWith(
        busyKey: 'reward-${event.rewardId}',
        errorMessage: null,
        actionMessage: null,
      ),
    );
    try {
      final reward =
          await repository.updateReward(event.rewardId, event.input);
      emit(
        state.copyWith(
          status: RewardsStatus.loaded,
          rewards: state.rewards
              .map((item) => item.id == reward.id ? reward : item)
              .toList(),
          busyKey: null,
          actionMessage: 'Reward updated successfully.',
          errorMessage: null,
          sessionInvalid: false,
        ),
      );
    } on ApiException catch (error) {
      _emitActionFailure(emit, error, 'reward-${event.rewardId}');
    } catch (error) {
      _emitActionFailure(
        emit,
        error,
        'reward-${event.rewardId}',
        fallback: 'Unable to update this reward.',
      );
    }
  }

  Future<void> _deleteReward(
    DeleteReward event,
    Emitter<RewardsState> emit,
  ) async {
    emit(
      state.copyWith(
        busyKey: 'reward-${event.rewardId}',
        errorMessage: null,
        actionMessage: null,
      ),
    );
    try {
      await repository.deleteReward(event.rewardId);
      emit(
        state.copyWith(
          rewards: state.rewards
              .where((reward) => reward.id != event.rewardId)
              .toList(),
          busyKey: null,
          actionMessage: 'Reward deleted successfully.',
          errorMessage: null,
          sessionInvalid: false,
        ),
      );
    } on ApiException catch (error) {
      _emitActionFailure(emit, error, 'reward-${event.rewardId}');
    } catch (error) {
      _emitActionFailure(
        emit,
        error,
        'reward-${event.rewardId}',
        fallback: 'Unable to delete this reward.',
      );
    }
  }

  Future<void> _redeemReward(
    RedeemReward event,
    Emitter<RewardsState> emit,
  ) async {
    final redeemKey = 'redeem-${event.reward.id}';
    if (!_redeemingRewardIds.add(event.reward.id)) return;

    emit(
      state.copyWith(
        busyKey: redeemKey,
        errorMessage: null,
        actionMessage: null,
      ),
    );

    var redemptionSubmitted = false;
    try {
      final latestData = await Future.wait<Object>([
        repository.getRewards(),
        repository.getPointsBalance(),
      ]);
      final latestRewards = latestData[0] as List<RewardModel>;
      final latestBalance = latestData[1] as PointsBalanceModel;
      RewardModel? latestReward;
      for (final reward in latestRewards) {
        if (reward.id == event.reward.id) {
          latestReward = reward;
          break;
        }
      }
      final rewardToRedeem = latestReward;

      emit(
        state.copyWith(
          status: RewardsStatus.loaded,
          rewards: latestRewards,
          pointsBalance: latestBalance,
          busyKey: redeemKey,
          errorMessage: null,
          actionMessage: null,
        ),
      );

      if (rewardToRedeem == null) {
        emit(
          state.copyWith(
            busyKey: null,
            errorMessage: 'This reward is no longer available.',
          ),
        );
        return;
      }

      if (latestBalance.availablePoints < rewardToRedeem.pointsRequired) {
        emit(
          state.copyWith(
            busyKey: null,
            errorMessage:
                'You need ${rewardToRedeem.pointsRequired} points but only have ${latestBalance.availablePoints}.',
          ),
        );
        return;
      }

      if (rewardToRedeem.hasReachedRedemptionLimit) {
        emit(
          state.copyWith(
            busyKey: null,
            errorMessage: 'This reward has reached its maximum redemptions.',
          ),
        );
        return;
      }

      redemptionSubmitted = true;
      await repository.redeemReward(
        rewardId: rewardToRedeem.id,
      );

      final redeemedAt = DateTime.now();
      final optimisticallyUpdatedRewards = latestRewards
          .map(
            (reward) => reward.id == rewardToRedeem.id
                ? reward.withCurrentRedemptions(
                    reward.currentRedemptions + 1,
                  )
                : reward,
          )
          .toList(growable: false);
      emit(
        state.copyWith(
          status: RewardsStatus.loaded,
          rewards: optimisticallyUpdatedRewards,
          pointsBalance: latestBalance.afterRedemption(
            rewardToRedeem.pointsRequired,
            redeemedAt,
          ),
          busyKey: null,
          actionMessage:
              'Reward redeemed! Waiting for caregiver approval.',
          errorMessage: null,
          sessionInvalid: false,
        ),
      );

      try {
        await _reloadAfterRedemption(emit);
      } catch (_) {
        emit(
          state.copyWith(
            busyKey: null,
            actionMessage:
                'Reward redeemed. Pull to refresh to update redemption history.',
            errorMessage: null,
          ),
        );
      }
    } on ApiException catch (error) {
      if (redemptionSubmitted) {
        await _refreshAfterRedemptionFailure(emit);
      }
      _emitActionFailure(emit, error, redeemKey);
    } catch (error) {
      if (redemptionSubmitted) {
        await _refreshAfterRedemptionFailure(emit);
      }
      _emitActionFailure(
        emit,
        error,
        redeemKey,
        fallback: 'Unable to redeem this reward.',
      );
    } finally {
      _redeemingRewardIds.remove(event.reward.id);
    }
  }

  Future<void> _refreshAfterRedemptionFailure(
    Emitter<RewardsState> emit,
  ) async {
    try {
      final latestData = await Future.wait<Object>([
        repository.getRewards(),
        repository.getPointsBalance(),
      ]);
      emit(
        state.copyWith(
          status: RewardsStatus.loaded,
          rewards: latestData[0] as List<RewardModel>,
          pointsBalance: latestData[1] as PointsBalanceModel,
          busyKey: null,
          actionMessage: null,
        ),
      );
    } catch (_) {
      // Preserve the redemption error while leaving stale eligibility visible
      // only if the follow-up refresh itself is unavailable.
    }
  }

  Future<void> _reloadAfterRedemption(
    Emitter<RewardsState> emit,
  ) async {
    final results = await Future.wait<Object>([
      repository.getRewards(),
      repository.getPointsBalance(),
      repository.getPointsTransactions(),
      repository.getAchievements(),
    ]);
    emit(
      state.copyWith(
        status: RewardsStatus.loaded,
        rewards: results[0] as List<RewardModel>,
        pointsBalance: results[1] as PointsBalanceModel,
        transactions: results[2] as List<PointsTransactionModel>,
        achievements: results[3] as List<AchievementBadgeModel>,
      ),
    );
  }

  void _emitLoadFailure(
    Emitter<RewardsState> emit,
    Object error, {
    String? fallback,
  }) {
    final apiError = error is ApiException ? error : null;
    emit(
      state.copyWith(
        status: RewardsStatus.failure,
        busyKey: null,
        errorMessage: apiError?.message ??
            (error is FormatException ? error.message : fallback),
        sessionInvalid: apiError?.type == ApiErrorType.unauthorized,
      ),
    );
  }

  void _emitActionFailure(
    Emitter<RewardsState> emit,
    Object error,
    String busyKey, {
    String? fallback,
  }) {
    final apiError = error is ApiException ? error : null;
    emit(
      state.copyWith(
        status: state.hasContent ? RewardsStatus.loaded : RewardsStatus.failure,
        busyKey: null,
        errorMessage: apiError?.message ??
            (error is FormatException ? error.message : fallback),
        sessionInvalid: apiError?.type == ApiErrorType.unauthorized,
      ),
    );
  }
}