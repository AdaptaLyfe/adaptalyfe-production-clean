export type RewardBadgeStats = {
  lifetimeEarned: number;
  rewardsRedeemed: number;
  completedMilestones: number;
};

export type RewardBadgeDefinition = {
  type: string;
  title: string;
  description: string;
  requirement: string;
  iconName: string;
  category: string;
  target: number;
  points: number;
  getProgress: (stats: RewardBadgeStats) => number;
};

export type RewardBadgeEvaluation = RewardBadgeDefinition & {
  progress: number;
  isEarned: boolean;
};

export type RewardBadgeView = {
  id: number;
  userId: number;
  achievementType: string;
  title: string;
  description: string;
  iconName: string;
  category: string;
  points: number;
  level: number;
  earnedAt: Date | null;
  isEarned: boolean;
  progress: number;
  target: number;
  requirement: string;
};

export const rewardBadgeDefinitions: readonly RewardBadgeDefinition[] = [
  {
    type: "first_reward",
    title: "First Reward",
    description: "You redeemed your first reward.",
    requirement: "Redeem 1 reward.",
    iconName: "redeem",
    category: "rewards",
    target: 1,
    points: 0,
    getProgress: (stats) => stats.rewardsRedeemed,
  },
  {
    type: "reward_collector",
    title: "Reward Collector",
    description: "You are building a collection of redeemed rewards.",
    requirement: "Redeem 5 rewards.",
    iconName: "collections",
    category: "rewards",
    target: 5,
    points: 0,
    getProgress: (stats) => stats.rewardsRedeemed,
  },
  {
    type: "point_starter",
    title: "Point Starter",
    description: "You reached your first points milestone.",
    requirement: "Earn 100 reward points.",
    iconName: "stars",
    category: "points",
    target: 100,
    points: 0,
    getProgress: (stats) => stats.lifetimeEarned,
  },
  {
    type: "point_master",
    title: "Point Master",
    description: "You reached an advanced points milestone.",
    requirement: "Earn 500 reward points.",
    iconName: "military_tech",
    category: "points",
    target: 500,
    points: 0,
    getProgress: (stats) => stats.lifetimeEarned,
  },
  {
    type: "milestone_achiever",
    title: "Milestone Achiever",
    description: "You completed a skill milestone.",
    requirement: "Complete 1 skill milestone.",
    iconName: "flag",
    category: "milestones",
    target: 1,
    points: 0,
    getProgress: (stats) => stats.completedMilestones,
  },
];

export function evaluateRewardBadges(
  stats: RewardBadgeStats,
): RewardBadgeEvaluation[] {
  return rewardBadgeDefinitions.map((definition) => {
    const progress = Math.max(0, definition.getProgress(stats));
    return {
      ...definition,
      progress,
      isEarned: progress >= definition.target,
    };
  });
}

export function countCompletedMilestones(value: unknown): number {
  if (!Array.isArray(value)) return 0;
  return value.filter((milestone) => {
    if (!milestone || typeof milestone !== "object") return false;
    return (milestone as { isCompleted?: unknown }).isCompleted === true;
  }).length;
}