import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../auth/bloc/auth_bloc.dart';
import '../../auth/bloc/auth_event.dart';
import '../bloc/rewards_bloc.dart';
import '../bloc/rewards_event.dart';
import '../bloc/rewards_state.dart';
import '../models/reward_models.dart';

class RewardsScreen extends StatelessWidget {
  const RewardsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocConsumer<RewardsBloc, RewardsState>(
      listener: (context, state) {
        if (state.sessionInvalid) {
          context.read<AuthBloc>().add(const CheckAuthentication());
          return;
        }

        final message = state.actionMessage ?? state.errorMessage;
        if (message != null && message.isNotEmpty) {
          ScaffoldMessenger.of(context)
            ..hideCurrentSnackBar()
            ..showSnackBar(
              SnackBar(
                content: Text(message),
                backgroundColor: state.errorMessage != null
                    ? const Color(0xFFB91C1C)
                    : null,
              ),
            );
        }
      },
      builder: (context, state) {
        return DefaultTabController(
          length: 4,
          child: Scaffold(
            appBar: AppBar(
              title: const Text('Rewards & Points'),
              bottom: const TabBar(
                isScrollable: true,
                tabs: [
                  Tab(text: 'Rewards', icon: Icon(Icons.card_giftcard_outlined)),
                  Tab(text: 'Badges', icon: Icon(Icons.emoji_events_outlined)),
                  Tab(text: 'Progress', icon: Icon(Icons.trending_up_rounded)),
                  Tab(text: 'History', icon: Icon(Icons.schedule_rounded)),
                ],
              ),
              actions: [
                IconButton(
                  tooltip: 'Refresh rewards',
                  onPressed: () => context
                      .read<RewardsBloc>()
                      .add(const RefreshRewards()),
                  icon: const Icon(Icons.refresh_rounded),
                ),
              ],
            ),
            body: _RewardsBody(state: state),
          ),
        );
      },
    );
  }
}

class _RewardsBody extends StatelessWidget {
  const _RewardsBody({required this.state});

  final RewardsState state;

  @override
  Widget build(BuildContext context) {
    if (state.isLoading && !state.hasContent) {
      return const _RewardsLoading();
    }

    if (state.status == RewardsStatus.failure && !state.hasContent) {
      return _RewardsError(
        message: state.errorMessage ?? 'Unable to load your rewards.',
        onRetry: () =>
            context.read<RewardsBloc>().add(const RefreshRewards()),
      );
    }

    return Container(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          colors: [
            Color(0xFFEFF6FF),
            Color(0xFFF5F3FF),
            Color(0xFFFFFBEB),
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
      ),
      child: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 12),
            child: _PointsBalanceCard(balance: state.pointsBalance),
          ),
          Expanded(
            child: TabBarView(
              children: [
                _RewardsTab(state: state),
                _BadgesTab(state: state),
                _ProgressTab(state: state),
                _HistoryTab(state: state),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _PointsBalanceCard extends StatelessWidget {
  const _PointsBalanceCard({required this.balance});

  final PointsBalanceModel? balance;

  @override
  Widget build(BuildContext context) {
    final available = balance?.availablePoints ?? 0;
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(17),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF2563EB), Color(0xFF7C3AED)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(18),
        boxShadow: const [
          BoxShadow(
            color: Color(0x202563EB),
            blurRadius: 12,
            offset: Offset(0, 5),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.18),
              borderRadius: BorderRadius.circular(14),
            ),
            child: const Icon(
              Icons.monetization_on_outlined,
              color: Colors.white,
              size: 29,
            ),
          ),
          const SizedBox(width: 13),
          const Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Available Points',
                  style: TextStyle(color: Colors.white70, fontSize: 13),
                ),
                SizedBox(height: 2),
                Text(
                  'Use your points for rewards',
                  style: TextStyle(color: Colors.white, fontSize: 12),
                ),
              ],
            ),
          ),
          Text(
            '$available',
            style: const TextStyle(
              color: Colors.white,
              fontSize: 30,
              fontWeight: FontWeight.w800,
            ),
          ),
        ],
      ),
    );
  }
}

class _RewardsTab extends StatelessWidget {
  const _RewardsTab({required this.state});

  final RewardsState state;

  @override
  Widget build(BuildContext context) {
    return RefreshIndicator(
      onRefresh: () => _refresh(context),
      child: ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.fromLTRB(16, 4, 16, 32),
        children: [
          if (state.isLoading) const LinearProgressIndicator(),
          if (state.isLoading) const SizedBox(height: 12),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Expanded(
                child: Text(
                  'Available Rewards',
                  style: TextStyle(
                    color: Color(0xFF111827),
                    fontSize: 22,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
              FilledButton.icon(
                onPressed: () => _showRewardEditor(context),
                icon: const Icon(Icons.add_rounded),
                label: const Text('Create'),
              ),
            ],
          ),
          const SizedBox(height: 5),
          const Text(
            'Earn points and redeem rewards created for you.',
            style: TextStyle(color: Color(0xFF6B7280), fontSize: 14),
          ),
          const SizedBox(height: 14),
          if (state.rewards.isEmpty)
            const _EmptyRewardsCard()
          else
            ...state.rewards.map(
              (reward) => Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: _RewardCard(
                  reward: reward,
                  availablePoints: state.pointsBalance?.availablePoints ?? 0,
                  busyKey: state.busyKey,
                ),
              ),
            ),
        ],
      ),
    );
  }

  Future<void> _refresh(BuildContext context) async {
    final bloc = context.read<RewardsBloc>();
    final completion = bloc.stream.firstWhere(
      (nextState) =>
          (nextState.status == RewardsStatus.loaded ||
              nextState.status == RewardsStatus.failure) &&
          nextState.busyKey == null,
    );
    bloc.add(const RefreshRewards());
    await completion;
  }
}

class _RewardCard extends StatelessWidget {
  const _RewardCard({
    required this.reward,
    required this.availablePoints,
    required this.busyKey,
  });

  final RewardModel reward;
  final int availablePoints;
  final String? busyKey;

  @override
  Widget build(BuildContext context) {
    final canAfford = availablePoints >= reward.pointsRequired;
    final isBusy = busyKey == 'reward-${reward.id}' ||
        busyKey == 'redeem-${reward.id}';
    final rewardColor = _colorFromHex(reward.color);

    return Card(
      color: Colors.white,
      elevation: canAfford ? 2 : 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: BorderSide(
          color: canAfford ? const Color(0xFFBBF7D0) : const Color(0xFFE5E7EB),
          width: canAfford ? 1.5 : 1,
        ),
      ),
      child: Padding(
        padding: const EdgeInsets.fromLTRB(15, 15, 10, 15),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  width: 44,
                  height: 44,
                  decoration: BoxDecoration(
                    color: rewardColor.withOpacity(0.12),
                    borderRadius: BorderRadius.circular(13),
                  ),
                  child: Icon(
                    _iconForReward(reward.iconName, reward.category),
                    color: rewardColor,
                    size: 24,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        reward.title,
                        style: const TextStyle(
                          color: Color(0xFF111827),
                          fontSize: 17,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      const SizedBox(height: 5),
                      Wrap(
                        spacing: 7,
                        runSpacing: 5,
                        children: [
                          _RewardTag(
                            text: _displayLabel(reward.category),
                            color: rewardColor.withOpacity(0.12),
                            textColor: rewardColor,
                          ),
                          _RewardTag(
                            text: _displayLabel(reward.rewardType),
                            color: const Color(0xFFF3F4F6),
                            textColor: const Color(0xFF6B7280),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                PopupMenuButton<String>(
                  tooltip: 'Reward actions',
                  onSelected: (action) =>
                      _handleAction(context, reward, action),
                  itemBuilder: (context) => const [
                    PopupMenuItem(value: 'edit', child: Text('Edit')),
                    PopupMenuItem(value: 'delete', child: Text('Delete')),
                  ],
                ),
              ],
            ),
            const SizedBox(height: 12),
            Text(
              reward.description,
              style: const TextStyle(
                color: Color(0xFF4B5563),
                fontSize: 14,
                height: 1.35,
              ),
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                const Icon(
                  Icons.monetization_on_outlined,
                  color: Color(0xFFF59E0B),
                  size: 19,
                ),
                const SizedBox(width: 5),
                Text(
                  '${reward.pointsRequired} points',
                  style: const TextStyle(
                    color: Color(0xFF111827),
                    fontWeight: FontWeight.w700,
                  ),
                ),
                if (reward.value?.trim().isNotEmpty == true) ...[
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      'Value: ${reward.value}',
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        color: Color(0xFF6B7280),
                        fontSize: 13,
                      ),
                    ),
                  ),
                ] else
                  const Spacer(),
                if (!canAfford)
                  const Text(
                    'Not enough points',
                    style: TextStyle(
                      color: Color(0xFF9CA3AF),
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 12),
            SizedBox(
              width: double.infinity,
              child: FilledButton(
                onPressed: !canAfford || isBusy
                    ? null
                    : () => _confirmRedeem(context, reward),
                style: FilledButton.styleFrom(
                  backgroundColor:
                      canAfford ? const Color(0xFF2563EB) : const Color(0xFFE5E7EB),
                  foregroundColor:
                      canAfford ? Colors.white : const Color(0xFF6B7280),
                ),
                child: isBusy && busyKey == 'redeem-${reward.id}'
                    ? const SizedBox(
                        height: 18,
                        width: 18,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : Text(canAfford ? 'Redeem' : 'Not enough points'),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _handleAction(
    BuildContext context,
    RewardModel reward,
    String action,
  ) async {
    if (action == 'edit') {
      await _showRewardEditor(context, reward: reward);
      return;
    }
    await _confirmDelete(context, reward);
  }
}

class _BadgesTab extends StatelessWidget {
  const _BadgesTab({required this.state});

  final RewardsState state;

  @override
  Widget build(BuildContext context) {
    return RefreshIndicator(
      onRefresh: () => _refresh(context),
      child: ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.fromLTRB(16, 4, 16, 32),
        children: [
          if (state.isLoading) const LinearProgressIndicator(),
          if (state.isLoading) const SizedBox(height: 12),
          const Text(
            'Badges & Achievements',
            style: TextStyle(
              color: Color(0xFF111827),
              fontSize: 22,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 5),
          const Text(
            'Celebrate the achievements recorded by Adaptalyfe.',
            style: TextStyle(color: Color(0xFF6B7280), fontSize: 14),
          ),
          const SizedBox(height: 14),
          if (state.achievements.isEmpty)
            const _EmptyBadgeCard()
          else
            ...state.achievements.map(
              (achievement) => Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: _AchievementCard(achievement: achievement),
              ),
            ),
        ],
      ),
    );
  }

  Future<void> _refresh(BuildContext context) async {
    final bloc = context.read<RewardsBloc>();
    final completion = bloc.stream.firstWhere(
      (nextState) =>
          (nextState.status == RewardsStatus.loaded ||
              nextState.status == RewardsStatus.failure) &&
          nextState.busyKey == null,
    );
    bloc.add(const RefreshRewards());
    await completion;
  }
}

class _AchievementCard extends StatelessWidget {
  const _AchievementCard({required this.achievement});

  final AchievementBadgeModel achievement;

  @override
  Widget build(BuildContext context) {
    return Card(
      color: const Color(0xFFFFFBEB),
      elevation: 1,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: const BorderSide(color: Color(0xFFFDE68A)),
      ),
      child: Padding(
        padding: const EdgeInsets.all(15),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: 46,
              height: 46,
              decoration: BoxDecoration(
                color: const Color(0xFFF59E0B),
                borderRadius: BorderRadius.circular(14),
              ),
              child: Icon(
                _iconForAchievement(achievement.iconName),
                color: Colors.white,
                size: 25,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(
                        child: Text(
                          achievement.title,
                          style: const TextStyle(
                            color: Color(0xFF78350F),
                            fontSize: 16,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                      if (achievement.points > 0)
                        _RewardTag(
                          text: '+${achievement.points}',
                          color: const Color(0xFFFEF3C7),
                          textColor: const Color(0xFF92400E),
                        ),
                    ],
                  ),
                  const SizedBox(height: 5),
                  Text(
                    achievement.description,
                    style: const TextStyle(
                      color: Color(0xFF92400E),
                      fontSize: 13,
                      height: 1.35,
                    ),
                  ),
                  const SizedBox(height: 9),
                  Wrap(
                    spacing: 8,
                    runSpacing: 5,
                    children: [
                      _RewardTag(
                        text: _displayLabel(achievement.category),
                        color: const Color(0xFFFEF3C7),
                        textColor: const Color(0xFF92400E),
                      ),
                      if (achievement.level > 0)
                        _RewardTag(
                          text: 'Level ${achievement.level}',
                          color: Colors.white,
                          textColor: const Color(0xFF92400E),
                        ),
                      if (achievement.earnedAt != null)
                        _RewardTag(
                          text: _formatDate(achievement.earnedAt!),
                          color: Colors.white,
                          textColor: const Color(0xFF92400E),
                        ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ProgressTab extends StatelessWidget {
  const _ProgressTab({required this.state});

  final RewardsState state;

  @override
  Widget build(BuildContext context) {
    final balance = state.pointsBalance;
    final totalEarned = balance?.totalEarned ?? 0;
    // This mirrors the existing Rewards page calculation exactly.
    final milestoneProgress = totalEarned % 100;
    final pointsToGo = 100 - milestoneProgress;

    return RefreshIndicator(
      onRefresh: () => _refresh(context),
      child: ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.fromLTRB(16, 4, 16, 32),
        children: [
          if (state.isLoading) const LinearProgressIndicator(),
          if (state.isLoading) const SizedBox(height: 12),
          const Text(
            'My Progress',
            style: TextStyle(
              color: Color(0xFF111827),
              fontSize: 22,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 5),
          const Text(
            'See how your points are building over time.',
            style: TextStyle(color: Color(0xFF6B7280), fontSize: 14),
          ),
          const SizedBox(height: 14),
          Row(
            children: [
              Expanded(
                child: _ProgressStatCard(
                  icon: Icons.trending_up_rounded,
                  label: 'Total Earned',
                  value: '${balance?.totalEarned ?? 0}',
                  color: const Color(0xFF2563EB),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: _ProgressStatCard(
                  icon: Icons.shopping_bag_outlined,
                  label: 'Total Spent',
                  value: '${balance?.totalSpent ?? 0}',
                  color: const Color(0xFF7C3AED),
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          _ProgressStatCard(
            icon: Icons.account_balance_wallet_outlined,
            label: 'Available',
            value: '${balance?.availablePoints ?? 0}',
            color: const Color(0xFF16A34A),
            wide: true,
          ),
          const SizedBox(height: 14),
          Card(
            color: Colors.white,
            elevation: 1,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(16),
            ),
            child: Padding(
              padding: const EdgeInsets.all(17),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Row(
                    children: [
                      Icon(Icons.flag_outlined, color: Color(0xFF2563EB)),
                      SizedBox(width: 9),
                      Text(
                        'Next Milestone',
                        style: TextStyle(
                          color: Color(0xFF111827),
                          fontSize: 17,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 18),
                  const Center(
                    child: Column(
                      children: [
                        Text(
                          '100 Points',
                          style: TextStyle(
                            color: Color(0xFF111827),
                            fontSize: 25,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                        SizedBox(height: 3),
                        Text(
                          'Special Achievement Badge',
                          style: TextStyle(color: Color(0xFF6B7280)),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),
                  ClipRRect(
                    borderRadius: BorderRadius.all(Radius.circular(99)),
                    child: LinearProgressIndicator(
                      value: milestoneProgress / 100,
                      minHeight: 9,
                      backgroundColor: Color(0xFFE5E7EB),
                      valueColor:
                          AlwaysStoppedAnimation<Color>(Color(0xFFF59E0B)),
                    ),
                  ),
                  const SizedBox(height: 9),
                  Center(
                    child: Text(
                      '$pointsToGo points to go!',
                      style: const TextStyle(
                        color: Color(0xFF6B7280),
                        fontSize: 13,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _refresh(BuildContext context) async {
    final bloc = context.read<RewardsBloc>();
    final completion = bloc.stream.firstWhere(
      (nextState) =>
          (nextState.status == RewardsStatus.loaded ||
              nextState.status == RewardsStatus.failure) &&
          nextState.busyKey == null,
    );
    bloc.add(const RefreshRewards());
    await completion;
  }
}

class _ProgressStatCard extends StatelessWidget {
  const _ProgressStatCard({
    required this.icon,
    required this.label,
    required this.value,
    required this.color,
    this.wide = false,
  });

  final IconData icon;
  final String label;
  final String value;
  final Color color;
  final bool wide;

  @override
  Widget build(BuildContext context) {
    return Card(
      color: Colors.white,
      elevation: 1,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15)),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Row(
          children: [
            Container(
              width: 38,
              height: 38,
              decoration: BoxDecoration(
                color: color.withOpacity(0.11),
                borderRadius: BorderRadius.circular(11),
              ),
              child: Icon(icon, color: color, size: 21),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    label,
                    maxLines: wide ? 1 : 2,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      color: Color(0xFF6B7280),
                      fontSize: 12,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    value,
                    style: TextStyle(
                      color: color,
                      fontSize: 20,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _HistoryTab extends StatelessWidget {
  const _HistoryTab({required this.state});

  final RewardsState state;

  @override
  Widget build(BuildContext context) {
    return RefreshIndicator(
      onRefresh: () => _refresh(context),
      child: ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.fromLTRB(16, 4, 16, 32),
        children: [
          if (state.isLoading) const LinearProgressIndicator(),
          if (state.isLoading) const SizedBox(height: 12),
          const Text(
            'Point History',
            style: TextStyle(
              color: Color(0xFF111827),
              fontSize: 22,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 5),
          const Text(
            'Review how points have been earned and spent.',
            style: TextStyle(color: Color(0xFF6B7280), fontSize: 14),
          ),
          const SizedBox(height: 14),
          if (state.transactions.isEmpty)
            const _EmptyHistoryCard()
          else
            ...state.transactions.map(
              (transaction) => Padding(
                padding: const EdgeInsets.only(bottom: 9),
                child: _TransactionCard(transaction: transaction),
              ),
            ),
        ],
      ),
    );
  }

  Future<void> _refresh(BuildContext context) async {
    final bloc = context.read<RewardsBloc>();
    final completion = bloc.stream.firstWhere(
      (nextState) =>
          (nextState.status == RewardsStatus.loaded ||
              nextState.status == RewardsStatus.failure) &&
          nextState.busyKey == null,
    );
    bloc.add(const RefreshRewards());
    await completion;
  }
}

class _TransactionCard extends StatelessWidget {
  const _TransactionCard({required this.transaction});

  final PointsTransactionModel transaction;

  @override
  Widget build(BuildContext context) {
    final isEarned = transaction.points > 0;
    final color = isEarned ? const Color(0xFF16A34A) : const Color(0xFFDC2626);
    return Card(
      color: Colors.white,
      elevation: 1,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Row(
          children: [
            Container(
              width: 38,
              height: 38,
              decoration: BoxDecoration(
                color: color.withOpacity(0.11),
                borderRadius: BorderRadius.circular(11),
              ),
              child: Icon(
                isEarned
                    ? Icons.arrow_downward_rounded
                    : Icons.arrow_upward_rounded,
                color: color,
                size: 21,
              ),
            ),
            const SizedBox(width: 11),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    transaction.description,
                    style: const TextStyle(
                      color: Color(0xFF111827),
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    '${transaction.createdAt == null ? 'Date unavailable' : _formatDate(transaction.createdAt!)}'
                    ' • Source: ${transaction.source}',
                    style: const TextStyle(
                      color: Color(0xFF6B7280),
                      fontSize: 12,
                    ),
                  ),
                ],
              ),
            ),
            Text(
              '${isEarned ? '+' : ''}${transaction.points}',
              style: TextStyle(
                color: color,
                fontSize: 18,
                fontWeight: FontWeight.w800,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _EmptyRewardsCard extends StatelessWidget {
  const _EmptyRewardsCard();

  @override
  Widget build(BuildContext context) {
    return const _EmptyCard(
      icon: Icons.card_giftcard_outlined,
      title: 'No rewards available yet',
      message: 'Ask your caregiver to create some exciting rewards for you!',
    );
  }
}

class _EmptyBadgeCard extends StatelessWidget {
  const _EmptyBadgeCard();

  @override
  Widget build(BuildContext context) {
    return const _EmptyCard(
      icon: Icons.emoji_events_outlined,
      title: 'No badges yet',
      message: 'Keep using Adaptalyfe to unlock achievements.',
    );
  }
}

class _EmptyHistoryCard extends StatelessWidget {
  const _EmptyHistoryCard();

  @override
  Widget build(BuildContext context) {
    return const _EmptyCard(
      icon: Icons.schedule_rounded,
      title: 'No point history yet',
      message: 'Start completing tasks to earn your first points!',
    );
  }
}

class _EmptyCard extends StatelessWidget {
  const _EmptyCard({
    required this.icon,
    required this.title,
    required this.message,
  });

  final IconData icon;
  final String title;
  final String message;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.85),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE5E7EB)),
      ),
      child: Column(
        children: [
          Icon(icon, size: 44, color: const Color(0xFF9CA3AF)),
          const SizedBox(height: 12),
          Text(
            title,
            textAlign: TextAlign.center,
            style: const TextStyle(
              color: Color(0xFF374151),
              fontSize: 16,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 5),
          Text(
            message,
            textAlign: TextAlign.center,
            style: const TextStyle(color: Color(0xFF6B7280), fontSize: 13),
          ),
        ],
      ),
    );
  }
}

class _RewardTag extends StatelessWidget {
  const _RewardTag({
    required this.text,
    required this.color,
    required this.textColor,
  });

  final String text;
  final Color color;
  final Color textColor;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 5),
      decoration: BoxDecoration(
        color: color,
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        text,
        style: TextStyle(
          color: textColor,
          fontSize: 11,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }
}

class _RewardsLoading extends StatelessWidget {
  const _RewardsLoading();

  @override
  Widget build(BuildContext context) {
    return const Center(child: CircularProgressIndicator());
  }
}

class _RewardsError extends StatelessWidget {
  const _RewardsError({required this.message, required this.onRetry});

  final String message;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(
              Icons.cloud_off_rounded,
              size: 48,
              color: Color(0xFF9CA3AF),
            ),
            const SizedBox(height: 12),
            const Text(
              'Rewards are unavailable',
              style: TextStyle(
                color: Color(0xFF111827),
                fontSize: 18,
                fontWeight: FontWeight.w700,
              ),
            ),
            const SizedBox(height: 6),
            Text(
              message,
              textAlign: TextAlign.center,
              style: const TextStyle(color: Color(0xFF6B7280)),
            ),
            const SizedBox(height: 16),
            FilledButton.icon(
              onPressed: onRetry,
              icon: const Icon(Icons.refresh_rounded),
              label: const Text('Try again'),
            ),
          ],
        ),
      ),
    );
  }
}

Future<void> _showRewardEditor(
  BuildContext context, {
  RewardModel? reward,
}) async {
  final input = await showDialog<RewardInput>(
    context: context,
    builder: (_) => _RewardDialog(reward: reward),
  );
  if (!context.mounted || input == null) return;
  final bloc = context.read<RewardsBloc>();
  if (reward == null) {
    bloc.add(CreateReward(input));
  } else {
    bloc.add(UpdateReward(rewardId: reward.id, input: input));
  }
}

Future<void> _confirmRedeem(
  BuildContext context,
  RewardModel reward,
) async {
  final balance = context.read<RewardsBloc>().state.pointsBalance;
  final available = balance?.availablePoints ?? 0;
  if (available < reward.pointsRequired) {
    _showMessage(
      context,
      'You need ${reward.pointsRequired} points but only have $available.',
    );
    return;
  }

  final confirmed = await showDialog<bool>(
    context: context,
    builder: (dialogContext) => AlertDialog(
      title: const Text('Confirm Reward Redemption'),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            reward.title,
            style: const TextStyle(
              color: Color(0xFF111827),
              fontSize: 17,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 7),
          Text(
            reward.description,
            style: const TextStyle(color: Color(0xFF6B7280), height: 1.35),
          ),
          const SizedBox(height: 14),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: const Color(0xFFFFFBEB),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Text(
              'Cost: ${reward.pointsRequired} points\n'
              'Your balance after: ${available - reward.pointsRequired} points',
              style: const TextStyle(
                color: Color(0xFF92400E),
                fontSize: 13,
                height: 1.5,
              ),
            ),
          ),
        ],
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(dialogContext, false),
          child: const Text('Cancel'),
        ),
        FilledButton(
          onPressed: () => Navigator.pop(dialogContext, true),
          child: const Text('Confirm Redemption'),
        ),
      ],
    ),
  );
  if (confirmed == true && context.mounted) {
    context.read<RewardsBloc>().add(RedeemReward(reward));
  }
}

Future<void> _confirmDelete(
  BuildContext context,
  RewardModel reward,
) async {
  final confirmed = await showDialog<bool>(
    context: context,
    builder: (dialogContext) => AlertDialog(
      title: const Text('Delete reward?'),
      content: Text('This will remove "${reward.title}" from your rewards.'),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(dialogContext, false),
          child: const Text('Cancel'),
        ),
        FilledButton(
          style: FilledButton.styleFrom(
            backgroundColor: const Color(0xFFB91C1C),
          ),
          onPressed: () => Navigator.pop(dialogContext, true),
          child: const Text('Delete'),
        ),
      ],
    ),
  );
  if (confirmed == true && context.mounted) {
    context.read<RewardsBloc>().add(DeleteReward(reward.id));
  }
}

void _showMessage(BuildContext context, String message) {
  ScaffoldMessenger.of(context)
    ..hideCurrentSnackBar()
    ..showSnackBar(SnackBar(content: Text(message)));
}

class _RewardDialog extends StatefulWidget {
  const _RewardDialog({this.reward});

  final RewardModel? reward;

  @override
  State<_RewardDialog> createState() => _RewardDialogState();
}

class _RewardDialogState extends State<_RewardDialog> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _titleController;
  late final TextEditingController _descriptionController;
  late final TextEditingController _pointsController;
  late final TextEditingController _valueController;
  late final TextEditingController _maxRedemptionsController;
  late String _category;
  late String _rewardType;

  static const _categories = [
    ('privilege', 'Privilege'),
    ('item', 'Item/Purchase'),
    ('activity', 'Activity/Experience'),
    ('money', 'Money/Allowance'),
    ('special', 'Special Treat'),
  ];

  static const _types = [
    ('immediate', 'Immediate'),
    ('delayed', 'Delayed'),
    ('recurring', 'Recurring'),
  ];

  @override
  void initState() {
    super.initState();
    final reward = widget.reward;
    _titleController = TextEditingController(text: reward?.title);
    _descriptionController = TextEditingController(text: reward?.description);
    _pointsController = TextEditingController(
      text: '${reward?.pointsRequired ?? 10}',
    );
    _valueController = TextEditingController(text: reward?.value);
    _maxRedemptionsController = TextEditingController(
      text: reward?.maxRedemptions?.toString(),
    );
    _category = reward?.category ?? 'privilege';
    _rewardType = reward?.rewardType ?? 'immediate';
  }

  @override
  void dispose() {
    _titleController.dispose();
    _descriptionController.dispose();
    _pointsController.dispose();
    _valueController.dispose();
    _maxRedemptionsController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isEditing = widget.reward != null;
    return AlertDialog(
      title: Text(isEditing ? 'Edit Reward' : 'Create New Reward'),
      content: Form(
        key: _formKey,
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              _field(
                controller: _titleController,
                label: 'Reward Title',
                hintText: 'Extra screen time',
                validator: (value) => value == null || value.trim().isEmpty
                    ? 'Title is required'
                    : null,
              ),
              _field(
                controller: _descriptionController,
                label: 'Description',
                hintText: '30 minutes of extra screen time on weekends',
                maxLines: 3,
                validator: (value) => value == null || value.trim().isEmpty
                    ? 'Description is required'
                    : null,
              ),
              _field(
                controller: _pointsController,
                label: 'Points Required',
                keyboardType: TextInputType.number,
                validator: (value) {
                  final points = int.tryParse(value?.trim() ?? '');
                  if (points == null || points < 1) {
                    return 'Points must be at least 1';
                  }
                  return null;
                },
              ),
              _selectField(
                label: 'Category',
                value: _category,
                items: _categories,
                onChanged: (value) => setState(() => _category = value),
              ),
              _selectField(
                label: 'Type',
                value: _rewardType,
                items: _types,
                onChanged: (value) => setState(() => _rewardType = value),
              ),
              _field(
                controller: _valueController,
                label: 'Value (optional)',
                hintText: r'$10 or 30 minutes',
              ),
              _field(
                controller: _maxRedemptionsController,
                label: 'Maximum Redemptions (optional)',
                keyboardType: TextInputType.number,
                validator: (value) {
                  if (value == null || value.trim().isEmpty) return null;
                  final max = int.tryParse(value.trim());
                  if (max == null || max < 1) {
                    return 'Enter a positive whole number';
                  }
                  return null;
                },
              ),
            ],
          ),
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context),
          child: const Text('Cancel'),
        ),
        FilledButton(
          onPressed: _save,
          child: Text(isEditing ? 'Update Reward' : 'Create Reward'),
        ),
      ],
    );
  }

  Widget _field({
    required TextEditingController controller,
    required String label,
    String? hintText,
    TextInputType? keyboardType,
    int maxLines = 1,
    String? Function(String?)? validator,
  }) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: TextFormField(
        controller: controller,
        keyboardType: keyboardType,
        maxLines: maxLines,
        validator: validator,
        decoration: InputDecoration(
          labelText: label,
          hintText: hintText,
          border: const OutlineInputBorder(),
        ),
      ),
    );
  }

  Widget _selectField({
    required String label,
    required String value,
    required List<(String, String)> items,
    required ValueChanged<String> onChanged,
  }) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: DropdownButtonFormField<String>(
        value: value,
        decoration: InputDecoration(
          labelText: label,
          border: const OutlineInputBorder(),
        ),
        items: items
            .map(
              (item) => DropdownMenuItem<String>(
                value: item.$1,
                child: Text(item.$2),
              ),
            )
            .toList(),
        onChanged: (nextValue) {
          if (nextValue != null) onChanged(nextValue);
        },
      ),
    );
  }

  void _save() {
    if (!(_formKey.currentState?.validate() ?? false)) return;
    final input = RewardInput(
      title: _titleController.text,
      description: _descriptionController.text,
      pointsRequired: int.parse(_pointsController.text.trim()),
      category: _category,
      rewardType: _rewardType,
      value: _valueController.text,
      maxRedemptions: _maxRedemptionsController.text.trim().isEmpty
          ? null
          : int.parse(_maxRedemptionsController.text.trim()),
      iconName: widget.reward?.iconName ?? 'gift',
      color: widget.reward?.color ?? '#3b82f6',
    );
    Navigator.pop(context, input);
  }
}

String _displayLabel(String value) {
  return value
      .split(RegExp(r'[_-]'))
      .where((part) => part.isNotEmpty)
      .map(
        (part) => '${part[0].toUpperCase()}${part.substring(1).toLowerCase()}',
      )
      .join(' ');
}

String _formatDate(DateTime date) {
  final local = date.toLocal();
  return '${local.month}/${local.day}/${local.year}';
}

Color _colorFromHex(String value) {
  final normalized = value.replaceFirst('#', '').trim();
  final hex = normalized.length == 6 ? 'FF$normalized' : normalized;
  final parsed = int.tryParse(hex, radix: 16);
  return parsed == null ? const Color(0xFF3B82F6) : Color(parsed);
}

IconData _iconForReward(String iconName, String category) {
  return switch (iconName.toLowerCase()) {
    'star' => Icons.star_rounded,
    'shopping-bag' || 'shopping_bag' => Icons.shopping_bag_outlined,
    'map-pin' || 'map_pin' => Icons.map_outlined,
    'dollar-sign' || 'dollar_sign' => Icons.attach_money_rounded,
    'heart' => Icons.favorite_outline_rounded,
    'trophy' => Icons.emoji_events_outlined,
    _ => switch (category) {
        'item' => Icons.shopping_bag_outlined,
        'activity' => Icons.map_outlined,
        'money' => Icons.attach_money_rounded,
        'special' => Icons.favorite_outline_rounded,
        _ => Icons.card_giftcard_outlined,
      },
  };
}

IconData _iconForAchievement(String iconName) {
  return switch (iconName.toLowerCase()) {
    'trophy' => Icons.emoji_events_rounded,
    'star' => Icons.star_rounded,
    'zap' => Icons.bolt_rounded,
    'target' => Icons.track_changes_rounded,
    'calendar' => Icons.calendar_month_rounded,
    'heart' => Icons.favorite_rounded,
    'dollar' => Icons.attach_money_rounded,
    'medal' => Icons.military_tech_rounded,
    'award' => Icons.workspace_premium_rounded,
    'crown' => Icons.workspace_premium_rounded,
    'flame' => Icons.local_fire_department_rounded,
    'trending' => Icons.trending_up_rounded,
    'check' => Icons.check_circle_rounded,
    _ => Icons.emoji_events_rounded,
  };
}