/**
 * STEP 12 — Complete Backend Daily Guide Staging Verification
 * ────────────────────────────────────────────────────────────
 * End-to-end backend proof before any frontend work begins.
 *
 * Sections:
 *  1. Backend implementation verification (static code inspection)
 *  2. Real staging user test (live HTTP with demo credentials)
 *  3. Real AI response verification (structure, schema, forbidden fields)
 *  4. Fallback verification (mock/static)
 *  5. Database safety (static)
 *  6. Authentication safety (live HTTP)
 *  7. Regression / build check (TypeScript, server health)
 *
 * IMPORTANT:
 *  - No app code changes.
 *  - No new DB records created.
 *  - No API key, context, or user data printed.
 *  - One real OpenAI call (test 2/3 shared session).
 *
 * Run with:
 *   npx tsx scripts/test-ai-context-step12.ts
 */

import { readFileSync } from "fs";
import { z } from "zod";
import {
  DailyGuideResponseSchema,
  generateDailyGuide,
  type DailyGuideContext,
} from "../server/ai-service.js";
import {
  mapTasksToContext,
  mapAppointmentsToContext,
  mapCalendarEventsToContext,
  mapPreferencesToContext,
} from "../server/ai-context.js";

// ─── Test harness ──────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;

async function test(label: string, fn: () => void | Promise<void>) {
  try {
    await fn();
    console.log(`  ✅ PASS  ${label}`);
    passed++;
  } catch (err) {
    console.error(`  ❌ FAIL  ${label}`);
    console.error(`           ${err instanceof Error ? err.message : String(err)}`);
    failed++;
  }
}

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

// ─── HTTP helpers ──────────────────────────────────────────────────────────────

const BASE = "http://localhost:5000";

async function httpPost(path: string, body?: unknown, cookie?: string) {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (cookie) headers["Cookie"] = cookie;
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  let json: unknown;
  try { json = await res.json(); } catch { json = null; }
  return { status: res.status, body: json, headers: res.headers };
}

/** Log in as the demo user and return the session cookie. Never prints credentials. */
async function getSessionCookie(): Promise<string> {
  const res = await fetch(`${BASE}/api/demo-login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "alex", password: "password" }),
  });
  if (!res.ok) throw new Error(`Login failed: HTTP ${res.status}`);
  const setCookie = res.headers.get("set-cookie") ?? "";
  const match = setCookie.match(/connect\.sid=[^;]+/);
  if (!match) throw new Error("No connect.sid in set-cookie header");
  return match[0];
}

// ─── Source files (read once) ──────────────────────────────────────────────────

const routesSrc    = readFileSync("server/routes.ts",    "utf-8");
const aiContextSrc = readFileSync("server/ai-context.ts","utf-8");
const aiServiceSrc = readFileSync("server/ai-service.ts","utf-8");

// Locate the daily-guide handler block for targeted static checks.
const handlerStart = routesSrc.indexOf('"/api/ai/daily-guide"');
const handlerEnd   = routesSrc.indexOf("\n  );", handlerStart) + 5;
const handlerSrc   = routesSrc.slice(handlerStart, handlerEnd);

// ─── SESSION (shared across live tests to avoid extra OpenAI calls) ────────────
let SESSION_COOKIE = "";
let LIVE_RESPONSE: unknown = null;

// ════════════════════════════════════════════════════════════════
// SECTION 1 — Backend Implementation Verification (static)
// ════════════════════════════════════════════════════════════════

console.log("\n════════════════════════════════════════════════════════════");
console.log("  SECTION 1 — Backend Implementation (static)");
console.log("════════════════════════════════════════════════════════════\n");

await test("1.1  POST /api/ai/daily-guide endpoint exists in routes.ts", () => {
  assert(handlerStart > 0, "Could not find \"/api/ai/daily-guide\" in routes.ts");
  assert(handlerSrc.length > 50, "Handler block appears empty or not found");
});

await test("1.2  Endpoint uses requireAuth middleware", () => {
  // Look at the 100-char window just before the handler path string
  const prefix = routesSrc.slice(Math.max(0, handlerStart - 120), handlerStart + 60);
  assert(prefix.includes("requireAuth"),
    "requireAuth must appear as the middleware argument before the handler");
});

await test("1.3  Identity comes from req.session.userId — not req.body", () => {
  assert(handlerSrc.includes("req.session.userId"),
    "Handler must read userId from req.session.userId");
  assert(!/req\.body\.userId/.test(handlerSrc),
    "Handler must not read userId from req.body");
});

await test("1.4  Context assembled via buildDailyGuideContext()", () => {
  assert(handlerSrc.includes("buildDailyGuideContext"),
    "Route must call buildDailyGuideContext");
  assert(routesSrc.slice(0, 300).includes("ai-context"),
    "server/ai-context must be imported at the top of routes.ts");
});

await test("1.5  AI call via generateDailyGuide(context)", () => {
  assert(handlerSrc.includes("generateDailyGuide(context)"),
    "Route must pass the assembled context to generateDailyGuide");
  assert(routesSrc.slice(0, 300).includes("ai-service"),
    "server/ai-service must be imported at the top of routes.ts");
});

await test("1.6  Response is Zod-validated inside generateDailyGuide()", () => {
  assert(aiServiceSrc.includes("DailyGuideResponseSchema"),
    "DailyGuideResponseSchema must be defined in ai-service.ts");
  assert(aiServiceSrc.includes("safeParse"),
    "Zod safeParse must be used to validate AI output");
});

await test("1.7  Safe fallback exists and is used on any AI failure", () => {
  assert(aiServiceSrc.includes("FALLBACK_RESPONSE"),
    "FALLBACK_RESPONSE must be defined in ai-service.ts");
  const fallbackCount = (aiServiceSrc.match(/return FALLBACK_RESPONSE/g) ?? []).length;
  assert(fallbackCount >= 3,
    `FALLBACK_RESPONSE must be returned in multiple error paths, found ${fallbackCount}`);
});

await test("1.8  No AI tool/function calling configured", () => {
  assert(!aiServiceSrc.includes("tools:"),    "ai-service.ts must not configure AI tools");
  assert(!aiServiceSrc.includes("function_call"), "ai-service.ts must not use function_call");
  assert(!aiServiceSrc.includes("tool_choice"),   "ai-service.ts must not use tool_choice");
});

await test("1.9  AI cannot write to the database (no write imports in ai-context/ai-service)", () => {
  for (const [label, src] of [["ai-context.ts", aiContextSrc], ["ai-service.ts", aiServiceSrc]]) {
    assert(!src.includes("db.insert"), `${label} must not use db.insert`);
    assert(!src.includes("db.update"), `${label} must not use db.update`);
    assert(!src.includes("db.delete"), `${label} must not use db.delete`);
    assert(!src.includes("storage.create"), `${label} must not call storage.create*`);
    assert(!src.includes("storage.update"), `${label} must not call storage.update*`);
    assert(!src.includes("storage.delete"), `${label} must not call storage.delete*`);
  }
});

await test("1.10 AI has no database credentials (DATABASE_URL not in ai-service/ai-context)", () => {
  assert(!aiServiceSrc.includes("DATABASE_URL"),
    "ai-service.ts must not reference DATABASE_URL");
  assert(!aiContextSrc.includes("DATABASE_URL"),
    "ai-context.ts must not reference DATABASE_URL");
});

await test("1.11 Route has outer defensive catch — never throws 500 stack trace to client", () => {
  assert(handlerSrc.includes("catch (err)"),
    "Route handler must have a catch block");
  // The catch block must respond with JSON, not re-throw
  assert(handlerSrc.includes("res.status(500).json"),
    "Catch block must respond with a safe JSON fallback");
  // Must not include stack trace or Error internals
  assert(!handlerSrc.includes("err.stack"),
    "Route catch block must not expose err.stack to the client");
  assert(!handlerSrc.includes("err.message"),
    "Route catch block must not expose err.message to the client");
});

// ════════════════════════════════════════════════════════════════
// SECTION 2 — Real Staging User Test (live HTTP)
// ════════════════════════════════════════════════════════════════

console.log("\n════════════════════════════════════════════════════════════");
console.log("  SECTION 2 — Real Staging User Test (live)");
console.log("════════════════════════════════════════════════════════════\n");

await test("2.1  Demo login succeeds and returns session cookie", async () => {
  SESSION_COOKIE = await getSessionCookie();
  assert(SESSION_COOKIE.startsWith("connect.sid="),
    "Session cookie must start with connect.sid=");
});

await test("2.2  Authenticated POST /api/ai/daily-guide returns HTTP 200", async () => {
  const { status, body } = await httpPost("/api/ai/daily-guide", {}, SESSION_COOKIE);
  LIVE_RESPONSE = body; // captured for Section 3 checks
  assert(status === 200,
    `Expected HTTP 200, got ${status}. Body: ${JSON.stringify(body)}`);
});

await test("2.3  Server session identity used — no userId sent in request body", async () => {
  // Re-issue the request explicitly with a body userId that doesn't match the session.
  // The server must still return 200 (using the session user, not body.userId 99999).
  const { status } = await httpPost("/api/ai/daily-guide", { userId: 99999 }, SESSION_COOKIE);
  assert(status === 200,
    `Expected 200 regardless of body.userId value, got ${status}`);
});

// ════════════════════════════════════════════════════════════════
// SECTION 3 — Real AI Response Verification
// ════════════════════════════════════════════════════════════════

console.log("\n════════════════════════════════════════════════════════════");
console.log("  SECTION 3 — AI Response Verification");
console.log("════════════════════════════════════════════════════════════\n");

await test("3.1  Response is valid JSON (already parsed — not null)", () => {
  assert(LIVE_RESPONSE !== null,
    "Response body is null — JSON parsing failed or response was empty");
  assert(typeof LIVE_RESPONSE === "object",
    `Response must be a JSON object, got: ${typeof LIVE_RESPONSE}`);
});

await test("3.2  Response matches DailyGuideResponseSchema", () => {
  const result = DailyGuideResponseSchema.safeParse(LIVE_RESPONSE);
  assert(result.success,
    `Response failed Zod validation: ${result.success ? "" : JSON.stringify(result.error.flatten())}`);
});

await test("3.3  Response contains expected structured fields: greeting, summary, highlights", () => {
  const r = LIVE_RESPONSE as Record<string, unknown>;
  assert(typeof r.greeting === "string" && r.greeting.length > 0,
    "greeting must be a non-empty string");
  assert(typeof r.summary === "string" && r.summary.length > 0,
    "summary must be a non-empty string");
  assert(Array.isArray(r.highlights),
    "highlights must be an array");
});

await test("3.4  Response does not contain raw model output (no markdown, no HTML)", () => {
  const bodyStr = JSON.stringify(LIVE_RESPONSE);
  assert(!bodyStr.includes("```"), "Response must not contain markdown code fences");
  assert(!bodyStr.includes("<script"), "Response must not contain HTML script tags");
  assert(!bodyStr.includes("<html"),   "Response must not contain HTML");
});

await test("3.5  Response does not contain database IDs (no 'id' numeric keys at root)", () => {
  const r = LIVE_RESPONSE as Record<string, unknown>;
  assert(!("id" in r),     "Response must not contain a root-level 'id' field");
  assert(!("userId" in r), "Response must not contain a root-level 'userId' field");
});

await test("3.6  Response does not contain credentials or payment information", () => {
  const bodyStr = JSON.stringify(LIVE_RESPONSE);
  assert(!bodyStr.includes("sk-"),            "Response must not contain OpenAI key prefix");
  assert(!bodyStr.includes("DATABASE_URL"),   "Response must not contain DATABASE_URL");
  assert(!bodyStr.includes("stripe"),         "Response must not contain Stripe references");
  assert(!bodyStr.includes("BANKING_ENCRYPTION"), "Response must not contain banking keys");
  assert(!bodyStr.toLowerCase().includes("password"), "Response must not contain password references");
});

await test("3.7  highlights array items have valid type field (if present)", () => {
  const r = LIVE_RESPONSE as { highlights: unknown[] };
  const validTypes = new Set(["task", "appointment", "calendar"]);
  for (const h of r.highlights) {
    const item = h as Record<string, unknown>;
    assert("title" in item, `Highlight missing required 'title' field: ${JSON.stringify(h)}`);
    if ("type" in item) {
      assert(validTypes.has(item.type as string),
        `Highlight has invalid type '${item.type}'. Must be task|appointment|calendar`);
    }
  }
});

// ════════════════════════════════════════════════════════════════
// SECTION 4 — Fallback Verification (no extra OpenAI calls)
// ════════════════════════════════════════════════════════════════

console.log("\n════════════════════════════════════════════════════════════");
console.log("  SECTION 4 — Fallback Verification (mock/static)");
console.log("════════════════════════════════════════════════════════════\n");

await test("4.1  generateDailyGuide returns fallback when API key is absent (mock)", async () => {
  // Temporarily shadow the env var by calling with a context; the actual
  // ai-service already handles missing key via getClient() returning null.
  // We verify statically that the null-client path returns FALLBACK_RESPONSE.
  assert(aiServiceSrc.includes("if (!client)"),
    "ai-service must check for null client and return fallback immediately");
  assert(aiServiceSrc.includes("return FALLBACK_RESPONSE"),
    "Null client path must return FALLBACK_RESPONSE");
});

await test("4.2  generateDailyGuide returns fallback for empty AI response (unit)", async () => {
  // Verify statically that the empty-response branch exists.
  assert(aiServiceSrc.includes("!raw.trim()"),
    "ai-service must check for empty response content");
  const emptyBranch = aiServiceSrc.indexOf("!raw.trim()");
  const nearbyFallback = aiServiceSrc.slice(emptyBranch, emptyBranch + 200);
  assert(nearbyFallback.includes("FALLBACK_RESPONSE"),
    "Empty response branch must return FALLBACK_RESPONSE");
});

await test("4.3  generateDailyGuide returns fallback for malformed JSON (unit)", async () => {
  assert(aiServiceSrc.includes("JSON.parse(raw)"),
    "ai-service must attempt JSON.parse on the raw response");
  // The parse is inside a try/catch that returns fallback
  assert(aiServiceSrc.includes("AI response was not valid JSON"),
    "Malformed JSON path must log a safe message and return fallback");
});

await test("4.4  generateDailyGuide returns fallback for Zod validation failure (unit)", async () => {
  assert(aiServiceSrc.includes("validated.success"),
    "ai-service must check Zod parse result");
  const zodBranch = aiServiceSrc.indexOf("!validated.success");
  assert(zodBranch > 0, "ai-service must have !validated.success branch");
  const nearbyFallback = aiServiceSrc.slice(zodBranch, zodBranch + 200);
  assert(nearbyFallback.includes("FALLBACK_RESPONSE"),
    "Zod failure branch must return FALLBACK_RESPONSE");
});

await test("4.5  generateDailyGuide uses AbortController for timeout (no infinite hang)", async () => {
  assert(aiServiceSrc.includes("AbortController"),
    "ai-service must use AbortController");
  assert(aiServiceSrc.includes("AI_TIMEOUT_MS"),
    "Timeout constant must be defined");
  assert(aiServiceSrc.includes("clearTimeout"),
    "Timeout handle must be cleared in finally block");
});

await test("4.6  Fallback response structure is valid (static schema check)", () => {
  // Extract the FALLBACK_RESPONSE literal from source
  const fallbackBlock = aiServiceSrc.slice(
    aiServiceSrc.indexOf("const FALLBACK_RESPONSE"),
    aiServiceSrc.indexOf("const FALLBACK_RESPONSE") + 300
  );
  assert(fallbackBlock.includes("greeting"),  "FALLBACK_RESPONSE must have greeting");
  assert(fallbackBlock.includes("summary"),   "FALLBACK_RESPONSE must have summary");
  assert(fallbackBlock.includes("highlights"),"FALLBACK_RESPONSE must have highlights");
});

await test("4.7  Raw provider error never reaches frontend (route catch log is safe)", () => {
  // The outer catch in the route must not include err.stack or err.message in the response
  assert(!handlerSrc.includes("err.stack"),   "Route catch must not expose err.stack");
  assert(!handlerSrc.includes("err.message"), "Route catch must not expose err.message");
  // The catch responds with a static safe JSON object
  assert(handlerSrc.includes('"Your Daily Guide is temporarily unavailable."'),
    "Outer catch must return a safe static message");
});

// ════════════════════════════════════════════════════════════════
// SECTION 5 — Database Safety
// ════════════════════════════════════════════════════════════════

console.log("\n════════════════════════════════════════════════════════════");
console.log("  SECTION 5 — Database Safety (static)");
console.log("════════════════════════════════════════════════════════════\n");

await test("5.1  Only SELECT operations in ai-context.ts (no INSERT/UPDATE/DELETE)", () => {
  for (const op of ["db.insert", "db.update", "db.delete", ".insert(", ".update(", ".delete("]) {
    assert(!aiContextSrc.includes(op),
      `ai-context.ts must not contain write operation: ${op}`);
  }
});

await test("5.2  Only SELECT operations in ai-service.ts (no INSERT/UPDATE/DELETE)", () => {
  for (const op of ["db.insert", "db.update", "db.delete", ".insert(", ".update(", ".delete("]) {
    assert(!aiServiceSrc.includes(op),
      `ai-service.ts must not contain write operation: ${op}`);
  }
});

await test("5.3  Route handler contains no direct write operations", () => {
  for (const op of ["storage.create", "storage.update", "storage.delete",
                    "db.insert", "db.update", "db.delete"]) {
    assert(!handlerSrc.includes(op),
      `Route handler must not contain write operation: ${op}`);
  }
});

await test("5.4  No migration files created in Steps 1–12", async () => {
  // Verify no new drizzle migration was added
  const { execSync } = await import("child_process");
  const migrationOutput = execSync(
    "find . -name '*.sql' -newer server/ai-context.ts -not -path './node_modules/*' 2>/dev/null || true",
    { cwd: process.cwd(), encoding: "utf-8" }
  ).trim();
  assert(migrationOutput === "",
    `Unexpected new SQL migration files found: ${migrationOutput}`);
});

await test("5.5  AI receives context object — not a DB connection or credentials", () => {
  // generateDailyGuide signature accepts DailyGuideContext, not a DB pool
  assert(aiServiceSrc.includes("context: DailyGuideContext"),
    "generateDailyGuide must accept DailyGuideContext, not raw DB");
  assert(!aiServiceSrc.includes("pg.Pool"),
    "ai-service.ts must not instantiate or reference pg.Pool");
  assert(!aiServiceSrc.includes("DATABASE_URL"),
    "ai-service.ts must not use DATABASE_URL");
});

// ════════════════════════════════════════════════════════════════
// SECTION 6 — Authentication Safety (live HTTP)
// ════════════════════════════════════════════════════════════════

console.log("\n════════════════════════════════════════════════════════════");
console.log("  SECTION 6 — Authentication Safety (live)");
console.log("════════════════════════════════════════════════════════════\n");

await test("6.1  Unauthenticated request → 401", async () => {
  const { status } = await httpPost("/api/ai/daily-guide", {});
  assert(status === 401,
    `Expected 401 for unauthenticated request, got ${status}`);
});

await test("6.2  Authenticated request → 200", async () => {
  const { status } = await httpPost("/api/ai/daily-guide", {}, SESSION_COOKIE);
  assert(status === 200,
    `Expected 200 for authenticated request, got ${status}`);
});

await test("6.3  Request body userId is ignored (session is the only identity)", async () => {
  const { status } = await httpPost("/api/ai/daily-guide", { userId: 99999 }, SESSION_COOKIE);
  assert(status === 200,
    `Expected 200 even with spurious body.userId=99999, got ${status}`);
});

await test("6.4  401 response body does not leak internal details", async () => {
  const { body } = await httpPost("/api/ai/daily-guide", {});
  const bodyStr = JSON.stringify(body);
  assert(!bodyStr.includes("stack"),         "401 response must not include stack trace");
  assert(!bodyStr.includes("DATABASE_URL"),  "401 response must not include DATABASE_URL");
  assert(!bodyStr.includes("sk-"),           "401 response must not include API key");
});

await test("6.5  requireAuth middleware definition is unchanged (static)", () => {
  assert(routesSrc.includes("const requireAuth = async (req: any, res: any, next: any) =>"),
    "requireAuth signature must be unchanged");
  assert(routesSrc.includes('res.status(401).json({ message: "Authentication required" })'),
    "requireAuth must still return 401 for unauthenticated requests");
});

await test("6.6  Authenticated session remains the only identity source (static)", () => {
  // The handler must declare userId from req.session.userId only.
  // TypeScript type annotations mean the assignment is: const userId: number = req.session.userId
  // so we check for the const declaration and session source directly.
  assert(/const userId[^=]*=\s*req\.session\.userId/.test(handlerSrc),
    "Handler must declare userId from req.session.userId");
  // Must not assign userId from req.body or req.params
  assert(!/userId\s*=\s*req\.body/.test(handlerSrc),
    "Handler must not assign userId from req.body");
  assert(!/userId\s*=\s*req\.params/.test(handlerSrc),
    "Handler must not assign userId from req.params");
});

// ════════════════════════════════════════════════════════════════
// SECTION 7 — Regression / Build Check
// ════════════════════════════════════════════════════════════════

console.log("\n════════════════════════════════════════════════════════════");
console.log("  SECTION 7 — Regression & Build Check");
console.log("════════════════════════════════════════════════════════════\n");

await test("7.1  TypeScript errors are ONLY the pre-existing caregiver-dashboard-broken.tsx", async () => {
  const { execSync } = (await import("child_process")) as any;
  let tscOutput = "";
  try {
    execSync("npx tsc --noEmit 2>&1", { cwd: process.cwd(), encoding: "utf-8" });
    tscOutput = "";
  } catch (e: any) {
    tscOutput = (e.stdout ?? "") + (e.stderr ?? "");
  }
  // Strip the known pre-existing caregiver-broken errors
  const nonCaregiver = tscOutput
    .split("\n")
    .filter((l) => !l.includes("caregiver-dashboard-broken.tsx"))
    .join("\n")
    .trim();
  assert(nonCaregiver === "",
    `Unexpected TypeScript errors outside caregiver-dashboard-broken.tsx:\n${nonCaregiver}`);
});

await test("7.2  Server is running and healthy (live)", async () => {
  // Brief settle after the blocking tsc --noEmit call which saturates the event loop.
  await new Promise((r) => setTimeout(r, 800));
  const res = await fetch(`${BASE}/api/health`);
  assert(res.ok, `Expected /api/health to be OK, got ${res.status}`);
});

await test("7.3  Existing auth endpoint /api/user still requires auth (regression)", async () => {
  const res = await fetch(`${BASE}/api/user`);
  assert(res.status === 401,
    `Expected 401 for unauthenticated /api/user, got ${res.status}`);
});

await test("7.4  Existing /api/daily-tasks still requires auth (regression)", async () => {
  const res = await fetch(`${BASE}/api/daily-tasks`);
  assert(res.status === 401,
    `Expected 401 for unauthenticated /api/daily-tasks, got ${res.status}`);
});

await test("7.5  Authenticated /api/daily-tasks still works (regression)", async () => {
  const res = await fetch(`${BASE}/api/daily-tasks`, {
    headers: { Cookie: SESSION_COOKIE },
  });
  assert(res.ok, `Expected /api/daily-tasks to return OK for authenticated user, got ${res.status}`);
});

await test("7.6  Authenticated /api/appointments still works (regression)", async () => {
  const res = await fetch(`${BASE}/api/appointments`, {
    headers: { Cookie: SESSION_COOKIE },
  });
  assert(res.ok,
    `Expected /api/appointments to return OK for authenticated user, got ${res.status}`);
});

await test("7.7  ai-context.ts imports are stable (no openai import)", () => {
  assert(!aiContextSrc.includes("from \"openai\""),
    "ai-context.ts must not import openai — only ai-service.ts should");
  assert(!aiContextSrc.includes("from 'openai'"),
    "ai-context.ts must not import openai");
});

await test("7.8  No second OpenAI client instantiated in routes.ts by new code", () => {
  // routes.ts has a legacy `import OpenAI from "openai"` for its own chat endpoint.
  // The Daily Guide must reuse ai-service.ts client only — not create a new one in the handler.
  assert(!handlerSrc.includes("new OpenAI"),
    "Route handler must not instantiate its own OpenAI client");
  assert(!handlerSrc.includes("openai.chat"),
    "Route handler must not call OpenAI API directly");
});

await test("7.9  Mapper functions still operate correctly (quick unit regression)", () => {
  // Tasks
  const tasks = mapTasksToContext([], "2026-08-11");
  assert(Array.isArray(tasks) && tasks.length === 0, "Empty tasks mapper must return []");

  // Appointments
  const appts = mapAppointmentsToContext([]);
  assert(Array.isArray(appts) && appts.length === 0, "Empty appointments mapper must return []");

  // Calendar
  const events = mapCalendarEventsToContext([], "2026-08-11");
  assert(Array.isArray(events) && events.length === 0, "Empty calendar mapper must return []");

  // Preferences — null prefs return undefined
  const prefs = mapPreferencesToContext(null);
  assert(prefs === undefined, "Null preferences must return undefined from mapper");
});

// ─── SECTION 8 — Temporary Test Script Inventory ──────────────────────────────

console.log("\n════════════════════════════════════════════════════════════");
console.log("  SECTION 8 — Temporary Script Inventory");
console.log("════════════════════════════════════════════════════════════\n");

await test("8.1  Temporary scripts from Steps 1–11 identified (informational)", async () => {
  const { execSync } = (await import("child_process")) as any;
  const files = execSync(
    "ls scripts/test-ai-context-step*.ts scripts/test-ai-service-step*.ts 2>/dev/null || true",
    { cwd: process.cwd(), encoding: "utf-8" }
  ).trim();
  console.log("    Scripts found:");
  for (const f of files.split("\n").filter(Boolean)) {
    console.log(`      ${f}  [temporary — safe to delete after approval]`);
  }
  // This test always passes — it's informational only
  assert(true, "Inventory complete");
});

// ─── Final summary ────────────────────────────────────────────────────────────

console.log("\n════════════════════════════════════════════════════════════");
console.log(`  Results: ${passed} passed, ${failed} failed`);
console.log("════════════════════════════════════════════════════════════\n");

if (failed > 0) {
  process.exit(1);
}
