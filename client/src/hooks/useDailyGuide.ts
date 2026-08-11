/**
 * useDailyGuide — React Query hook for the Adaptalyfe Guide Daily Guide
 *
 * Calls POST /api/ai/daily-guide.
 * The backend determines the authenticated user from its server-side session.
 *
 * Caching:
 *  15-minute stale window — prevents repeated OpenAI calls on re-renders,
 *  remounts, and tab focus switches. The guide content is meaningful for
 *  the duration of a typical dashboard session.
 *
 * Security:
 *  - No provider API keys or database credentials in this file.
 *  - No user identity is sent in the request body; the backend reads it
 *    exclusively from the authenticated server-side session.
 *  - Authentication handled automatically by the existing apiRequest helper
 *    (sends session cookie + Authorization header from localStorage if set).
 */

import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

// ─── Response types (mirror server/ai-service.ts DailyGuideResponseSchema) ────

export interface DailyGuideHighlight {
  type: "task" | "appointment" | "calendar";
  title: string;
  /** Optional display time, e.g. "9:00 AM" */
  time?: string;
  priority?: "low" | "normal" | "high";
}

export interface DailyGuideNextAction {
  title: string;
  reason?: string;
  source?: "task" | "appointment" | "calendar";
}

export interface DailyGuideResponse {
  greeting: string;
  summary: string;
  highlights: DailyGuideHighlight[];
  nextAction?: DailyGuideNextAction;
}

// ─── Cache configuration ───────────────────────────────────────────────────────

/** 15 minutes: guide is meaningful for a full morning/afternoon session. */
const STALE_TIME_MS = 15 * 60 * 1000;

/** 20 minutes: keep cached data available slightly after it goes stale. */
const GC_TIME_MS = 20 * 60 * 1000;

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useDailyGuide() {
  return useQuery<DailyGuideResponse>({
    queryKey: ["/api/ai/daily-guide"],

    queryFn: async () => {
      // POST with no body — backend reads identity from the server-side session.
      // No identity passed here. No provider keys in this file.
      const res = await apiRequest("POST", "/api/ai/daily-guide");
      return res.json() as Promise<DailyGuideResponse>;
    },

    staleTime: STALE_TIME_MS,
    gcTime: GC_TIME_MS,

    // Don't retry — the backend always returns a safe fallback on AI errors.
    // A 401/network failure is a genuine problem the user should see as a
    // friendly unavailable state, not a silent retry loop.
    retry: false,

    // Prevent re-calls on window focus — the guide is informational, not live data.
    refetchOnWindowFocus: false,
  });
}
