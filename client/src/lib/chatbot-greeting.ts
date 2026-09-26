const CHATBOT_GREETING_STORAGE_PREFIX = "adaptalyfe:chatbot:last-greeting-date";
const MAX_DISPLAY_NAME_LENGTH = 60;
const TECHNICAL_USERNAME_PATTERN =
  /^(?:user|userid|account|member|guest|admin|test|demo|unknown)(?:\s*\d*)?$/i;
const UUID_PATTERN =
  /^[\da-f]{8}(?:-[\da-f]{4}){3}-[\da-f]{12}$/i;

// This fallback only covers environments where localStorage is unavailable.
// Normal browser and Capacitor WebView sessions persist through localStorage.
const inMemoryGreetingDates = new Map<string, string>();

export type GreetingPeriod = "morning" | "afternoon" | "evening" | "night";

function isEmailAddress(value: string): boolean {
  return value.includes("@");
}

function looksLikeTechnicalIdentifier(value: string): boolean {
  const compactValue = value.replace(/[\s_.-]/g, "");
  const digitCount = (compactValue.match(/\d/g) || []).length;
  const isLongIdentifier =
    compactValue.length >= 24 &&
    /^\p{L}?\p{N}+$/u.test(compactValue);
  const isDenseIdentifier =
    compactValue.length >= 20 &&
    digitCount >= 6 &&
    digitCount / compactValue.length >= 0.25;

  return (
    UUID_PATTERN.test(value) ||
    TECHNICAL_USERNAME_PATTERN.test(value) ||
    isLongIdentifier ||
    isDenseIdentifier
  );
}

function splitReadableWords(value: string): string[] {
  return value
    // Split conventional camelCase and digit-to-word boundaries without
    // treating stylized casing such as "eTHAN" as separate words.
    .replace(/([\p{Ll}])([\p{Lu}][\p{Ll}])/gu, "$1 $2")
    .replace(/([\p{N}])([\p{Lu}])/gu, "$1 $2")
    .split(/\s+/)
    .filter(Boolean);
}

function formatReadableName(value: string): string | null {
  let cleaned = value.trim();
  if (!cleaned || isEmailAddress(cleaned)) return null;
  if (looksLikeTechnicalIdentifier(cleaned)) return null;

  // Normalize separators before handling suffixes so values such as
  // "Ethan-123!!!" are treated the same as "Ethan-123".
  cleaned = cleaned.replace(/[^\p{L}\p{N}]+/gu, " ").trim();
  // A trailing number sequence is commonly a username suffix. Keep digits
  // elsewhere because they may be meaningful in a real name.
  cleaned = cleaned.replace(/(?:\s*\d+)+$/u, "").trim();
  cleaned = cleaned.replace(/^[\d\s]+/u, "").trim();

  if (
    !cleaned ||
    /^\d+$/u.test(cleaned) ||
    looksLikeTechnicalIdentifier(cleaned)
  ) {
    return null;
  }

  const words = splitReadableWords(cleaned)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");

  if (!words) return null;
  return words.slice(0, MAX_DISPLAY_NAME_LENGTH).trim() || null;
}

/**
 * Returns the safest human-readable name for chatbot messages.
 *
 * A real profile/display name is preferred. Usernames are only used as a
 * fallback and are cleaned so numeric suffixes, separators, emails, and
 * technical identifiers never appear in the greeting.
 */
export function getDisplayName(
  username: unknown,
  profileName?: unknown,
): string | null {
  if (typeof profileName === "string") {
    const formattedProfileName = formatReadableName(profileName);
    if (formattedProfileName) return formattedProfileName;
  }

  if (typeof username !== "string") return null;
  return formatReadableName(username);
}

export function getLocalDateKey(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function getGreetingPeriod(date: Date = new Date()): GreetingPeriod {
  const hour = date.getHours();

  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 21) return "evening";
  return "night";
}

export function getChatbotGreeting(
  name: unknown,
  date: Date = new Date(),
): string {
  const normalizedName =
    typeof name === "string" ? name.trim().replace(/\s+/g, " ") : "";
  const greeting = `Good ${getGreetingPeriod(date)}`;

  return normalizedName
    ? `${greeting}, ${normalizedName} 👋`
    : `${greeting} 👋`;
}

function getStorageKey(userId: number | string): string {
  return `${CHATBOT_GREETING_STORAGE_PREFIX}:${userId}`;
}

/**
 * Claims the greeting for the user's local day.
 *
 * The date is persisted before the message is added to state. This makes
 * repeated open clicks, close/reopen cycles, and page refreshes idempotent.
 */
export function claimDailyChatbotGreeting(
  userId: number | string,
  date: Date = new Date(),
): boolean {
  const storageKey = getStorageKey(userId);
  const dateKey = getLocalDateKey(date);

  try {
    if (window.localStorage.getItem(storageKey) === dateKey) {
      return false;
    }

    window.localStorage.setItem(storageKey, dateKey);
    return true;
  } catch {
    // Keep the feature usable in restricted/private browsing environments.
    // This fallback lasts for the current runtime only because persistent
    // browser storage is unavailable.
    if (inMemoryGreetingDates.get(storageKey) === dateKey) {
      return false;
    }

    inMemoryGreetingDates.set(storageKey, dateKey);
    return true;
  }
}