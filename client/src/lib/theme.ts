import { useEffect, useState } from "react";

/**
 * App-wide light / dark theme.
 *  - Preference is "light" | "dark" | "auto" (auto follows the device setting).
 *  - Stored in localStorage ("adaptalyfe-theme"); the legacy "darkMode" key is kept in sync.
 *  - Applied by toggling the `dark` class on <html> (tailwind darkMode: "class").
 */
export type ThemePref = "light" | "dark" | "auto";
export type ResolvedTheme = "light" | "dark";

const STORAGE_KEY = "adaptalyfe-theme";
const EVENT = "adaptalyfe-theme-change";

function systemPrefersDark(): boolean {
  try {
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  } catch {
    return false;
  }
}

export function getThemePref(): ThemePref {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === "light" || v === "dark" || v === "auto") return v;
    if (localStorage.getItem("darkMode") === "true") return "dark";
  } catch {
    // storage unavailable
  }
  return "light";
}

export function resolveTheme(pref: ThemePref): ResolvedTheme {
  return pref === "auto" ? (systemPrefersDark() ? "dark" : "light") : pref;
}

function paint(pref: ThemePref) {
  const resolved = resolveTheme(pref);
  const root = document.documentElement;
  root.classList.toggle("dark", resolved === "dark");
  root.style.colorScheme = resolved;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", resolved === "dark" ? "#0b1120" : "#f4f7fb");
}

export function setThemePref(pref: ThemePref) {
  try {
    localStorage.setItem(STORAGE_KEY, pref);
    localStorage.setItem("darkMode", String(resolveTheme(pref) === "dark"));
  } catch {
    // storage unavailable — still apply for this session
  }
  paint(pref);
  window.dispatchEvent(new CustomEvent(EVENT, { detail: pref }));
}

/** Call once before React renders. */
export function initTheme() {
  paint(getThemePref());
  try {
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
      if (getThemePref() === "auto") {
        paint("auto");
        window.dispatchEvent(new CustomEvent(EVENT, { detail: "auto" }));
      }
    });
  } catch {
    // older browsers
  }
}

export function useTheme() {
  const [pref, setPref] = useState<ThemePref>(() => getThemePref());

  useEffect(() => {
    const onChange = () => setPref(getThemePref());
    window.addEventListener(EVENT, onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener(EVENT, onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);

  const resolved = resolveTheme(pref);
  return {
    pref,
    resolved,
    setTheme: setThemePref,
    toggle: () => setThemePref(resolved === "dark" ? "light" : "dark"),
  };
}
