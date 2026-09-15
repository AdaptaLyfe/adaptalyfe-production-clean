export const skillLevelRangeError = "Current level cannot be greater than target level.";

export function isValidSkillLevelRange(
  currentLevel: number,
  targetLevel: number,
): boolean {
  return currentLevel <= targetLevel;
}