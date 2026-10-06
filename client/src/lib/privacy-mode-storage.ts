export const PRIVACY_MODE_STORAGE_KEY = "adaptalyfe-privacy-mode";
export const LEGACY_SETTINGS_STORAGE_KEY = "user-settings";

export interface PrivacyModeStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export function readPrivacyModeFromStorage(
  storage: PrivacyModeStorage | null,
): boolean {
  if (!storage) return false;

  try {
    const savedPreference = storage.getItem(PRIVACY_MODE_STORAGE_KEY);
    if (savedPreference === "true") return true;
    if (savedPreference === "false") return false;

    const legacySettings = storage.getItem(LEGACY_SETTINGS_STORAGE_KEY);
    if (!legacySettings) return false;

    const parsed: unknown = JSON.parse(legacySettings);
    return isRecord(parsed) && parsed.privacyMode === true;
  } catch {
    return false;
  }
}

export function writePrivacyModeToStorage(
  storage: PrivacyModeStorage | null,
  enabled: boolean,
): boolean {
  if (!storage) return false;

  try {
    storage.setItem(PRIVACY_MODE_STORAGE_KEY, String(enabled));

    const existingSettings = storage.getItem(LEGACY_SETTINGS_STORAGE_KEY);
    if (existingSettings === null) {
      storage.setItem(
        LEGACY_SETTINGS_STORAGE_KEY,
        JSON.stringify({ privacyMode: enabled }),
      );
    } else {
      try {
        const parsed: unknown = JSON.parse(existingSettings);
        if (isRecord(parsed)) {
          storage.setItem(
            LEGACY_SETTINGS_STORAGE_KEY,
            JSON.stringify({ ...parsed, privacyMode: enabled }),
          );
        }
      } catch {
        // The dedicated preference remains authoritative if old settings are malformed.
      }
    }

    return true;
  } catch {
    return false;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
