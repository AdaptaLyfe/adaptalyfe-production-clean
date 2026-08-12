/**
 * Adaptalyfe Guide — AI Service (Phase 1, Step 1)
 *
 * Responsibilities:
 *  - Wraps the OpenAI client; reads API key from environment only
 *  - Accepts a pre-sanitized DailyGuideContext (no database access here)
 *  - Requests structured JSON output
 *  - Validates the response against a Zod schema before returning
 *  - Always returns a safe fallback — never throws to the caller
 *
 * This file has NO database imports, NO route imports, NO user data.
 * It is not connected to any endpoint in this step.
 */

import OpenAI from "openai";
import { z } from "zod";

// ─── Response schema ──────────────────────────────────────────────────────────

export const DailyGuideHighlightSchema = z.object({
  type: z.enum(["task", "appointment", "calendar"]),
  title: z.string().max(200),
  time: z.string().max(50).optional(),
  priority: z.enum(["low", "normal", "high"]).optional(),
});

export const DailyGuideNextActionSchema = z.object({
  title: z.string().max(200),
  reason: z.string().max(300).optional(),
  // AI sometimes returns "none" as a literal — strip it so it becomes undefined
  source: z
    .enum(["task", "appointment", "calendar", "none"])
    .optional()
    .transform((v) => (v === "none" ? undefined : v)),
});

export const DailyGuideResponseSchema = z.object({
  greeting: z.string().max(200),
  summary: z.string().max(500),
  highlights: z.array(DailyGuideHighlightSchema).max(5),
  nextAction: DailyGuideNextActionSchema.optional(),
});

export type DailyGuideHighlight = z.infer<typeof DailyGuideHighlightSchema>;
export type DailyGuideNextAction = z.infer<typeof DailyGuideNextActionSchema>;
export type DailyGuideResponse = z.infer<typeof DailyGuideResponseSchema>;

// ─── Context shape (expanded in later steps as data sources are added) ────────

export interface DailyGuideContext {
  /** Safe display name — never raw username or email */
  userName: string;
  /** YYYY-MM-DD */
  date: string;
  /** HH:MM (24-hour) */
  time: string;
  /** IANA timezone string, e.g. "America/New_York" */
  timezone?: string;

  // Populated from Step 5 onward
  tasks?: Array<{
    title: string;
    description?: string;
    scheduledTime?: string;
    isCompleted: boolean;
    category?: string;
  }>;

  // Populated from Step 7 onward
  appointments?: Array<{
    title: string;
    appointmentDate: string;
    provider?: string;
    location?: string;
  }>;

  // Populated from Step 8 onward
  calendarEvents?: Array<{
    title: string;
    /** ISO string: "YYYY-MM-DDTHH:MM:SS.sssZ" */
    startDate: string;
    /** ISO string, omitted for open-ended or point-in-time events */
    endDate?: string;
    /** true if the event occupies the full day with no specific time */
    allDay: boolean;
    category: string;
    location?: string;
    description?: string;
  }>;

  // Populated from Step 9 onward
  preferences?: {
    /**
     * Structured behavioral preference fields from behavior_patterns JSONB.
     * All string enum-like values set by the user in the personalization engine.
     * Never contains raw user text, medical, financial, or auth data.
     */
    /** When the user prefers to do tasks: "morning" | "afternoon" | "evening" */
    preferredTaskTime?: string;
    /** How the user prefers to be reminded: e.g. "gentle" | "firm" */
    reminderStyle?: string;
    /** User's motivation level: e.g. "low" | "medium" | "high" */
    motivationLevel?: string;
    /** Preferred task complexity: "simple" | "moderate" | "detailed" */
    complexityPreference?: string;
    /** Level of guidance the user prefers */
    supportLevel?: string;
  };
}

// ─── Fallback ─────────────────────────────────────────────────────────────────

const FALLBACK_RESPONSE: DailyGuideResponse = {
  greeting: "Hello",
  summary: "Your Daily Guide is temporarily unavailable.",
  highlights: [],
  nextAction: undefined,
};

// ─── Constants ────────────────────────────────────────────────────────────────

const AI_TIMEOUT_MS = 10_000; // 10 s — never block the dashboard longer than this
const AI_MODEL = "gpt-4o-mini"; // cheap, fast, sufficient for daily summary
const AI_MAX_TOKENS = 600;
const AI_TEMPERATURE = 0.4; // low variance — consistent, practical output

// ─── Client (lazy singleton) ──────────────────────────────────────────────────

let _client: OpenAI | null = null;

function getClient(): OpenAI | null {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.warn("[ai-service] OPENAI_API_KEY not set — Daily Guide disabled");
    return null;
  }
  if (!_client) {
    _client = new OpenAI({ apiKey });
  }
  return _client;
}

// ─── Prompts ──────────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are Adaptalyfe Guide, a warm and encouraging daily assistant that helps people with independent living skills.
You receive structured, safe information about a user's current day and return a brief personalized daily summary.

Adjust your tone and focus based on the current time of day:
- Morning (before 12:00): Focus on what lies ahead — tasks to tackle, appointments coming up, and motivation to start the day well.
- Afternoon (12:00–17:00): Check in on progress — what's been done, what still needs attention, and encouragement to keep going.
- Evening (17:00–21:00): Reflect on the day — celebrate what was accomplished, note anything still needed, and help the user wind down.
- Night (21:00+): Keep it brief and calm — a gentle recap and any important reminders for tomorrow.

Rules:
- Respond ONLY with a single valid JSON object matching the schema given.
- Never generate HTML, Markdown, or JavaScript in your response values.
- All text values must be plain strings, brief, friendly, and encouraging.
- Use the user's name in the greeting (e.g. "Good morning, Rachel!" or "Hey Alex!").
- Focus only on the information provided — do not invent events or tasks.
- If there is nothing scheduled, say so warmly and encourage the user.
- Keep the summary to 1–2 sentences that feel like a natural spoken briefing.`;

function buildUserPrompt(context: DailyGuideContext): string {
  return `Generate a Daily Guide summary for ${context.userName}.

Current date: ${context.date}
Current time: ${context.time}${context.timezone ? ` (${context.timezone})` : ""}

Data for today:
${JSON.stringify(context, null, 2)}

Return a JSON object with exactly:
{
  "greeting": "personalized greeting using their name",
  "summary": "1-2 sentence overview of their day",
  "highlights": [
    { "type": "task"|"appointment"|"calendar", "title": "...", "time": "optional", "priority": "low"|"normal"|"high" }
  ],
  "nextAction": { "title": "...", "reason": "optional", "source": "task"|"appointment"|"calendar" }
}

highlights: up to 5 items, most important first.
nextAction: the single most time-sensitive or important thing right now (omit if nothing urgent).`;
}

// ─── Main export ──────────────────────────────────────────────────────────────

/**
 * generateDailyGuide
 *
 * Accepts a pre-sanitized context object (built by ai-context.ts, not here).
 * Returns a validated DailyGuideResponse, or the FALLBACK_RESPONSE on any error.
 * Never throws.
 */
export async function generateDailyGuide(
  context: DailyGuideContext
): Promise<DailyGuideResponse> {
  const client = getClient();

  // API key not configured — return fallback silently
  if (!client) {
    console.warn("[ai-service] OPENAI_API_KEY not configured — returning fallback. Set this environment variable to enable the Daily Guide.");
    return FALLBACK_RESPONSE;
  }

  const controller = new AbortController();
  const timeoutHandle = setTimeout(() => {
    controller.abort();
  }, AI_TIMEOUT_MS);

  try {
    const completion = await client.chat.completions.create(
      {
        model: AI_MODEL,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: buildUserPrompt(context) },
        ],
        response_format: { type: "json_object" },
        max_tokens: AI_MAX_TOKENS,
        temperature: AI_TEMPERATURE,
      },
      { signal: controller.signal }
    );

    const raw = completion.choices[0]?.message?.content ?? "";

    if (!raw.trim()) {
      console.warn("[ai-service] Received empty response from AI provider");
      return FALLBACK_RESPONSE;
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      console.warn("[ai-service] AI response was not valid JSON");
      return FALLBACK_RESPONSE;
    }

    const validated = DailyGuideResponseSchema.safeParse(parsed);
    if (!validated.success) {
      console.warn(
        "[ai-service] AI response failed schema validation:",
        validated.error.flatten()
      );
      return FALLBACK_RESPONSE;
    }

    return validated.data;
  } catch (err: unknown) {
    const isAbort =
      err instanceof Error &&
      (err.name === "AbortError" || err.message.includes("abort"));

    if (isAbort) {
      console.warn("[ai-service] AI request timed out after", AI_TIMEOUT_MS, "ms");
    } else {
      console.error(
        "[ai-service] AI provider error:",
        err instanceof Error ? err.message : String(err)
      );
    }
    return FALLBACK_RESPONSE;
  } finally {
    clearTimeout(timeoutHandle);
  }
}

// ─── Diagnostics (for Step 2 testing) ────────────────────────────────────────

/**
 * isAiConfigured
 * Returns true if the OPENAI_API_KEY environment variable is present.
 * Safe to call at startup for configuration logging.
 */
export function isAiConfigured(): boolean {
  return Boolean(process.env.OPENAI_API_KEY);
}
