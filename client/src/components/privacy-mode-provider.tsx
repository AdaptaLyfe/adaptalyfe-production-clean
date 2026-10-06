import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import type { ReactNode } from "react";
import {
  LEGACY_SETTINGS_STORAGE_KEY,
  PRIVACY_MODE_STORAGE_KEY,
  readPrivacyModeFromStorage,
  writePrivacyModeToStorage,
} from "@/lib/privacy-mode-storage";

interface PrivacyModeContextValue {
  enabled: boolean;
  setEnabled: (enabled: boolean) => boolean;
}

const PrivacyModeContext = createContext<PrivacyModeContextValue | null>(null);

interface PrivacyModeProviderProps {
  children: ReactNode;
  initialEnabled?: boolean;
}

export function primePrivacyModeAttribute(): boolean {
  const enabled = readPrivacyModeFromStorage(getBrowserStorage());
  applyPrivacyModeAttribute(enabled);
  return enabled;
}

export function PrivacyModeProvider({
  children,
  initialEnabled,
}: PrivacyModeProviderProps) {
  const [enabled, setEnabledState] = useState(
    () => initialEnabled ?? readPrivacyModeFromStorage(getBrowserStorage()),
  );

  const setEnabled = useCallback((nextEnabled: boolean) => {
    setEnabledState(nextEnabled);
    applyPrivacyModeAttribute(nextEnabled);
    return writePrivacyModeToStorage(getBrowserStorage(), nextEnabled);
  }, []);

  useEffect(() => {
    applyPrivacyModeAttribute(enabled);
  }, [enabled]);

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (
        event.key !== PRIVACY_MODE_STORAGE_KEY &&
        event.key !== LEGACY_SETTINGS_STORAGE_KEY
      ) {
        return;
      }

      const nextEnabled = readPrivacyModeFromStorage(getBrowserStorage());
      setEnabledState(nextEnabled);
      applyPrivacyModeAttribute(nextEnabled);
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  return (
    <PrivacyModeContext.Provider value={{ enabled, setEnabled }}>
      {children}
    </PrivacyModeContext.Provider>
  );
}

export function usePrivacyMode(): PrivacyModeContextValue {
  const context = useContext(PrivacyModeContext);
  if (!context) {
    throw new Error("usePrivacyMode must be used within PrivacyModeProvider.");
  }
  return context;
}

function getBrowserStorage(): Storage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

function applyPrivacyModeAttribute(enabled: boolean): void {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.privacyMode = String(enabled);
}
