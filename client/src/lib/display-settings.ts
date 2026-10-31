/**
 * Display settings kept on this device: text size and high contrast.
 * Saved in localStorage ("adaptalyfe-display") and applied to <html> before
 * React renders, so they stay after a reload.
 */
export type TextSize = "small" | "default" | "large" | "x-large";

export interface DisplaySettings {
  textSize: TextSize;
  highContrast: boolean;
}

const STORAGE_KEY = "adaptalyfe-display";
export const DEFAULT_DISPLAY_SETTINGS: DisplaySettings = { textSize: "default", highContrast: false };

const ROOT_FONT_SIZE: Record<TextSize, string | null> = {
  small: "14px",
  default: null, // keep the app's built-in responsive size
  large: "18px",
  "x-large": "20px",
};

export function getDisplaySettings(): DisplaySettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_DISPLAY_SETTINGS };
    const parsed = JSON.parse(raw);
    const textSize: TextSize = ["small", "default", "large", "x-large"].includes(parsed?.textSize)
      ? parsed.textSize
      : "default";
    return { textSize, highContrast: parsed?.highContrast === true };
  } catch {
    return { ...DEFAULT_DISPLAY_SETTINGS };
  }
}

export function applyDisplaySettings(settings: DisplaySettings) {
  const root = document.documentElement;
  const size = ROOT_FONT_SIZE[settings.textSize];
  if (size) root.style.fontSize = size;
  else root.style.removeProperty("font-size");
  root.classList.toggle("high-contrast", settings.highContrast);
}

/** Saves and applies. Returns false if this browser could not save (it still applies for now). */
export function setDisplaySettings(settings: DisplaySettings): boolean {
  applyDisplaySettings(settings);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    return true;
  } catch {
    return false;
  }
}

/** Call once before React renders. */
export function initDisplaySettings() {
  try {
    applyDisplaySettings(getDisplaySettings());
  } catch {
    // never block the app from starting
  }
}
