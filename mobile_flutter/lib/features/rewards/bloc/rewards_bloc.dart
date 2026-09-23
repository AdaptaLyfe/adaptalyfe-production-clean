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

    final available = state.pointsBalance?.availablePoints ?? 0;
    if (available < event.reward.pointsRequired) {
      emit(
        state.copyWith(
          errorMessage:
              'You need ${event.reward.pointsRequired} points but only have $available.',
          actionMessage: null,
        ),
      );
      _redeemingRewardIds.remove(event.reward.id);
      return;
    }

    final maxRedemptions = event.reward.maxRedemptions;
    if (maxRedemptions != null &&
        event.reward.currentRedemptions >= maxRedemptions) {
      emit(
        state.copyWith(
          errorMessage: 'This reward has reached its maximum redemptions.',
          actionMessage: null,
        ),
      );
      _redeemingRewardIds.remove(event.reward.id);
      return;
    }

    emit(
      state.copyWith(
        busyKey: redeemKey,
        errorMessage: null,
        actionMessage: null,
      ),
    );
    try {
      await repository.redeemReward(
        rewardId: event.reward.id,
        pointsSpent: event.reward.pointsRequired,
      );
      await _reloadAfterRedemption(emit);
      emit(
        state.copyWith(
          busyKey: null,
          actionMessage:
              'Reward redeemed! Waiting for caregiver approval.',
          errorMessage: null,
          sessionInvalid: false,
        ),
      );
    } on ApiException catch (error) {
      _emitActionFailure(emit, error, redeemKey);
    } catch (error) {
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

  Future<void> _reloadAfterRedemption(
    Emitter<RewardsState> emit,
  ) async {
    final results = await Future.wait<Object>([
      repository.getRewards(),
      repository.getPointsBalance(),
      repository.getPointsTransactions(),
    ]);
    emit(
      state.copyWith(
        status: RewardsStatus.loaded,
        rewards: results[0] as List<RewardModel>,
        pointsBalance: results[1] as PointsBalanceModel,
        transactions: results[2] as List<PointsTransactionModel>,
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