const CHATBOT_GREETING_STORAGE_PREFIX = "adaptalyfe:chatbot:last-greeting-date";

// This fallback only covers environments where localStorage is unavailable.
// Normal browser and Capacitor WebView sessions persist through localStorage.
const inMemoryGreetingDates = new Map<string, string>();

export type GreetingPeriod = "Morning" | "Afternoon" | "Evening" | "Night";

export function getLocalDateKey(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function getGreetingPeriod(date: Date = new Date()): GreetingPeriod {
  const hour = date.getHours();

  if (hour >= 5 && hour < 12) return "Morning";
  if (hour >= 12 && hour < 17) return "Afternoon";
  if (hour >= 17 && hour < 21) return "Evening";
  return "Night";
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