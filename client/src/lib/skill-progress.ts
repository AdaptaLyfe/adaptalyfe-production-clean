export interface SkillProgressState {
  currentLevel: number;
  targetLevel: number;
  percentage: number;
  isCompleted: boolean;
  isInProgress: boolean;
}

export function getSkillProgressState(
  currentLevel?: number | null,
  targetLevel?: number | null,
): SkillProgressState {
  const current = currentLevel ?? 1;
  const target = targetLevel ?? 5;
  const percentage = Math.min((current / target) * 100, 100);
  const isCompleted = current >= target;

  return {
    currentLevel: current,
    targetLevel: target,
    percentage,
    isCompleted,
    isInProgress: !isCompleted,
  };
}