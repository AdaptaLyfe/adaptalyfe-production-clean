export const COUNTED_REWARD_REDEMPTION_STATUSES = [
  "pending",
  "approved",
  "completed",
] as const;

export function hasReachedRewardRedemptionLimit(
  maxRedemptions: number | null,
  currentRedemptions: number,
): boolean {
  return maxRedemptions !== null && currentRedemptions >= maxRedemptions;
}