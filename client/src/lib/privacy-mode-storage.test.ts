import assert from "node:assert/strict";
import test from "node:test";
import {
  LEGACY_SETTINGS_STORAGE_KEY,
  PRIVACY_MODE_STORAGE_KEY,
  readPrivacyModeFromStorage,
  writePrivacyModeToStorage,
} from "./privacy-mode-storage";
import type { PrivacyModeStorage } from "./privacy-mode-storage";

class MemoryStorage implements PrivacyModeStorage {
  private values = new Map<string, string>();

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }
}

test("reads the saved setting from older Adaptalyfe preferences", () => {
  const storage = new MemoryStorage();
  storage.setItem(
    LEGACY_SETTINGS_STORAGE_KEY,
    JSON.stringify({ privacyMode: true, theme: "light" }),
  );

  assert.equal(readPrivacyModeFromStorage(storage), true);
});

test("the dedicated preference takes precedence over the legacy value", () => {
  const storage = new MemoryStorage();
  storage.setItem(
    LEGACY_SETTINGS_STORAGE_KEY,
    JSON.stringify({ privacyMode: true }),
  );
  storage.setItem(PRIVACY_MODE_STORAGE_KEY, "false");

  assert.equal(readPrivacyModeFromStorage(storage), false);
});

test("saving the preference preserves other saved settings", () => {
  const storage = new MemoryStorage();
  storage.setItem(
    LEGACY_SETTINGS_STORAGE_KEY,
    JSON.stringify({ theme: "dark", notifications: true }),
  );

  assert.equal(writePrivacyModeToStorage(storage, true), true);
  assert.equal(storage.getItem(PRIVACY_MODE_STORAGE_KEY), "true");
  assert.deepEqual(JSON.parse(storage.getItem(LEGACY_SETTINGS_STORAGE_KEY)!), {
    theme: "dark",
    notifications: true,
    privacyMode: true,
  });
});

test("a malformed legacy setting does not prevent saving the dedicated preference", () => {
  const storage = new MemoryStorage();
  storage.setItem(LEGACY_SETTINGS_STORAGE_KEY, "{broken");

  assert.equal(writePrivacyModeToStorage(storage, true), true);
  assert.equal(readPrivacyModeFromStorage(storage), true);
  assert.equal(storage.getItem(LEGACY_SETTINGS_STORAGE_KEY), "{broken");
});
