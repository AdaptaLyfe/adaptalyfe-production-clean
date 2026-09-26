const categoryLabels: Record<string, string> = {
  personal_care: "Personal Care",
};

export function formatCategoryLabel(value: string): string {
  const normalized = value.trim();
  if (!normalized) return "";

  const mapped = categoryLabels[normalized.toLowerCase()];
  if (mapped) return mapped;

  return normalized
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\p{L}/gu, (letter) => letter.toUpperCase());
}