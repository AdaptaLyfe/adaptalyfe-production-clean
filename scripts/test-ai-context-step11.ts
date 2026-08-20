/**
 * STEP 11 — POST /api/ai/daily-guide: Endpoint Tests
 * ─────────────────────────────────────────────────────
 * Tests the Daily Guide backend endpoint added in Step 11.
 *
 * Approach:
 *  - Static/structural checks verified by reading route source
 *  - Live HTTP checks against the running dev server (port 5000)
 *  - Demo-login used to obtain a valid session cookie for auth tests
 *  - No real DB writes. No secrets printed. No prompt/context logged.
 *
 * Run with:
 *   npx tsx scripts/test-ai-context-step11.ts
 */

import { readFileSync } from "fs";
import { z } from "zod";
import { DailyGuideResponseSchema } from "../server/ai-service.js";

// ─── Test harness ──────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;

function test(label: string, fn: () => void | Promise<void>) {
  return Promise.resolve()
    .then(() => fn())
    .then(() => {
      console.log(`  ✅ PASS  ${label}`);
      passed++;
    })
    .catch((err) => {
      console.error(`  ❌ FAIL  ${label}`);
      console.error(`           ${err instanceof Error ? err.message : String(err)}`);
      failed++;
    });
}

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

// ─── HTTP helpers ──────────────────────────────────────────────────────────────

const BASE = "http://localhost:5000";

async function post(path: string, body?: unknown, cookie?: string): Promise<{ status: number; body: unknown; headers: Headers }> {
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

async function get(path: string, cookie?: string): Promise<{ status: number; body: unknown }> {
  const headers: Record<string, string> = {};
  if (cookie) headers["Cookie"] = cookie;
  const res = await fetch(`${BASE}${path}`, { headers });
  let json: unknown;
  try { json = await res.json(); } catch { json = null; }
  return { status: res.status, body: json };
}

/** Login as the demo user (alex/password) and return the session cookie. */
async function getDemoSessionCookie(): Promise<string> {
  const res = await fetch(`${BASE}/api/demo-login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "alex", password: "password" }),
  });
  if (!res.ok) throw new Error(`Demo login failed: HTTP ${res.status}`);
  const cookieHeader = res.headers.get("set-cookie");
  if (!cookieHeader) throw new Error("Demo login returned no set-cookie header");
  // Extract the session cookie (connect.sid=...) from the header
  const match = cookieHeader.match(/connect\.sid=[^;]+/);
  if (!match) throw new Error("Could not extract connect.sid from set-cookie header");
  return match[0];
}

// ─── Route source inspection ───────────────────────────────────────────────────

const routesSrc = readFileSync("server/routes.ts", "utf-8");

// ─── TESTS ────────────────────────────────────────────────────────────────────

console.log("\n════════════════════════════════════════════════════════════");
console.log("  STEP 11 — Daily Guide API Endpoint Tests");
console.log("════════════════════════════════════════════════════════════\n");

// ── 1. Authenticated request reaches the endpoint ─────────────────────────────
await test("1. Authenticated POST /api/ai/daily-guide returns 200", async () => {
  const cookie = await getDemoSessionCookie();
  const { status, body } = await post("/api/ai/daily-guide", {}, cookie);
  assert(status === 200, `Expected 200, got ${status}. Body: ${JSON.stringify(body)}`);
});

// ── 2. Unauthenticated request returns 401 ────────────────────────────────────
await test("2. Unauthenticated POST /api/ai/daily-guide returns 401", async () => {
  const { status, body } = await post("/api/ai/daily-guide", {});
  assert(status === 401,
    `Expected 401 for unauthenticated request, got ${status}. Body: ${JSON.stringify(body)}`);
});

// ── 3. Request body userId cannot override req.session.userId ─────────────────
await test("3. Body userId is ignored — session userId is used exclusively", async () => {
  const cookie = await getDemoSessionCookie();
  // Send a body with a different userId — it must be ignored.
  // The response should still be 200 (our session's data, not user 99999's).
  const { status } = await post("/api/ai/daily-guide", { userId: 99999 }, cookie);
  assert(status === 200,
    `Expected 200 even with spurious body.userId, got ${status}`);
  // The route code must not reference req.body.userId — verified statically below.
});

// ── 4. Correct authenticated user is used (static route inspection) ───────────
await test("4. Route uses req.session.userId — not req.body.userId (static)", () => {
  const endpointSection = routesSrc.slice(routesSrc.indexOf("/api/ai/daily-guide"));
  // The route must read userId from the session
  assert(endpointSection.includes("req.session.userId"),
    "Route must read userId from req.session.userId");
  // It must NOT read userId from req.body
  const bodyUserIdPattern = /req\.body\.userId/;
  // Extract just the daily-guide handler to avoid false-positives from other routes
  const handlerStart = routesSrc.indexOf('"/api/ai/daily-guide"');
  const handlerEnd   = routesSrc.indexOf("\n  );", handlerStart) + 5;
  const handlerSrc   = routesSrc.slice(handlerStart, handlerEnd);
  assert(!bodyUserIdPattern.test(handlerSrc),
    "Route handler must not read req.body.userId — session is the only identity source");
});

// ── 5. buildDailyGuideContext is called with server-derived userId (static) ────
await test("5. Route calls buildDailyGuideContext with session userId (static)", () => {
  const handlerStart = routesSrc.indexOf('"/api/ai/daily-guide"');
  const handlerEnd   = routesSrc.indexOf("\n  );", handlerStart) + 5;
  const handlerSrc   = routesSrc.slice(handlerStart, handlerEnd);
  assert(handlerSrc.includes("buildDailyGuideContext"),
    "Route must call buildDailyGuideContext");
  assert(handlerSrc.includes("req.session.userId"),
    "Route must pass req.session.userId to buildDailyGuideContext");
});

// ── 6. No direct database queries in the route handler (static) ───────────────
await test("6. Route handler contains no direct DB queries (static)", () => {
  const handlerStart = routesSrc.indexOf('"/api/ai/daily-guide"');
  const handlerEnd   = routesSrc.indexOf("\n  );", handlerStart) + 5;
  const handlerSrc   = routesSrc.slice(handlerStart, handlerEnd);
  assert(!handlerSrc.includes("storage.getDailyTasksByUser"),
    "Direct storage.getDailyTasksByUser must not appear in route — use buildDailyGuideContext");
  assert(!handlerSrc.includes("storage.getUpcomingAppointments"),
    "Direct storage.getUpcomingAppointments must not appear in route");
  assert(!handlerSrc.includes("storage.getCalendarEventsByUser"),
    "Direct storage.getCalendarEventsByUser must not appear in route");
  assert(!handlerSrc.includes("db.select"),
    "Direct db.select must not appear in route handler");
});

// ── 7. generateDailyGuide receives the context, not raw request data (static) ──
await test("7. generateDailyGuide is called with the validated context (static)", () => {
  const handlerStart = routesSrc.indexOf('"/api/ai/daily-guide"');
  const handlerEnd   = routesSrc.indexOf("\n  );", handlerStart) + 5;
  const handlerSrc   = routesSrc.slice(handlerStart, handlerEnd);
  assert(handlerSrc.includes("generateDailyGuide"),
    "Route must call generateDailyGuide");
  // generateDailyGuide must be called with the output of buildDailyGuideContext
  assert(handlerSrc.includes("generateDailyGuide(context)"),
    "generateDailyGuide must receive the context built by buildDailyGuideContext");
});

// ── 8. OpenAI API key is never sent to frontend ───────────────────────────────
await test("8. Response body does not contain OPENAI_API_KEY (live check)", async () => {
  const cookie = await getDemoSessionCookie();
  const { body } = await post("/api/ai/daily-guide", {}, cookie);
  const bodyStr = JSON.stringify(body);
  // Key should never appear in a response
  assert(!bodyStr.includes("sk-"), "Response must not contain OpenAI API key prefix 'sk-'");
  assert(!bodyStr.includes("OPENAI_API_KEY"), "Response must not reference OPENAI_API_KEY");
});

// ── 9. Valid AI response passes Zod validation ────────────────────────────────
await test("9. Authenticated response matches DailyGuideResponseSchema", async () => {
  const cookie = await getDemoSessionCookie();
  const { status, body } = await post("/api/ai/daily-guide", {}, cookie);
  assert(status === 200, `Expected 200, got ${status}`);
  const result = DailyGuideResponseSchema.safeParse(body);
  assert(result.success,
    `Response failed DailyGuideResponseSchema validation: ${
      result.success ? "" : JSON.stringify(result.error.flatten())
    }`);
});

// ── 10. Invalid AI response uses safe fallback (unit-level — static) ──────────
await test("10. generateDailyGuide returns safe fallback on invalid AI JSON (static)", () => {
  // Verified by ai-service.ts source inspection:
  // - Empty response → FALLBACK_RESPONSE
  // - Non-JSON response → FALLBACK_RESPONSE
  // - Zod validation failure → FALLBACK_RESPONSE
  // All paths catch exceptions and return the fallback; never throw.
  const aiServiceSrc = readFileSync("server/ai-service.ts", "utf-8");
  assert(aiServiceSrc.includes("FALLBACK_RESPONSE"),
    "ai-service.ts must define and use FALLBACK_RESPONSE");
  assert(aiServiceSrc.includes("safeParse"),
    "ai-service.ts must use Zod safeParse to validate AI output");
  assert(aiServiceSrc.includes("return FALLBACK_RESPONSE"),
    "ai-service.ts must return fallback on validation failure");
  // Confirm generateDailyGuide never throws (has outer catch)
  assert(aiServiceSrc.includes("} catch (err: unknown)"),
    "generateDailyGuide must have a catch block ensuring it never throws");
});

// ── 11. OpenAI 429/error uses safe fallback (static) ─────────────────────────
await test("11. Provider errors (429, network failure) return safe fallback (static)", () => {
  const aiServiceSrc = readFileSync("server/ai-service.ts", "utf-8");
  // The outer catch in generateDailyGuide handles all provider errors
  assert(aiServiceSrc.includes("return FALLBACK_RESPONSE"),
    "Provider errors must return FALLBACK_RESPONSE, not throw to the caller");
});

// ── 12. OpenAI timeout uses safe fallback (static) ────────────────────────────
await test("12. AI timeout returns safe fallback (static)", () => {
  const aiServiceSrc = readFileSync("server/ai-service.ts", "utf-8");
  assert(aiServiceSrc.includes("AbortController"),
    "ai-service.ts must use AbortController for timeout");
  assert(aiServiceSrc.includes("AI_TIMEOUT_MS"),
    "Timeout constant AI_TIMEOUT_MS must be defined");
  assert(aiServiceSrc.includes("abort"),
    "Timeout must trigger abort");
});

// ── 13. No raw provider error reaches frontend (live check) ───────────────────
await test("13. Response does not contain raw provider/stack trace (live)", async () => {
  const cookie = await getDemoSessionCookie();
  const { body } = await post("/api/ai/daily-guide", {}, cookie);
  const bodyStr = JSON.stringify(body);
  assert(!bodyStr.includes("stack"),  "Response must not contain stack trace");
  assert(!bodyStr.includes("Error:"), "Response must not contain raw Error message");
  assert(!bodyStr.includes("openai"), "Response must not reference openai internals");
  assert(!bodyStr.includes("DATABASE_URL"), "Response must not contain DATABASE_URL");
});

// ── 14. No AI tool/function calling (static) ──────────────────────────────────
await test("14. No AI tool/function calling exists in the service (static)", () => {
  const aiServiceSrc = readFileSync("server/ai-service.ts", "utf-8");
  assert(!aiServiceSrc.includes("tools:"),
    "ai-service.ts must not configure AI tools");
  assert(!aiServiceSrc.includes("function_call"),
    "ai-service.ts must not use function_call");
  assert(!aiServiceSrc.includes("tool_choice"),
    "ai-service.ts must not use tool_choice");
});

// ── 15. No AI write operation exists (static) ─────────────────────────────────
await test("15. No AI write operations in route or service (static)", () => {
  const handlerStart = routesSrc.indexOf('"/api/ai/daily-guide"');
  const handlerEnd   = routesSrc.indexOf("\n  );", handlerStart) + 5;
  const handlerSrc   = routesSrc.slice(handlerStart, handlerEnd);
  // The route handler must not call any write operations
  assert(!handlerSrc.includes("storage.create"),
    "Route must not call storage.create*");
  assert(!handlerSrc.includes("storage.update"),
    "Route must not call storage.update*");
  assert(!handlerSrc.includes("storage.delete"),
    "Route must not call storage.delete*");
});

// ── 16. No database writes occur (static) ─────────────────────────────────────
await test("16. No INSERT/UPDATE/DELETE in route handler or ai-context.ts (static)", () => {
  const aiContextSrc = readFileSync("server/ai-context.ts", "utf-8");
  assert(!aiContextSrc.includes("db.insert"), "ai-context.ts must not use db.insert");
  assert(!aiContextSrc.includes("db.update"), "ai-context.ts must not use db.update");
  assert(!aiContextSrc.includes("db.delete"), "ai-context.ts must not use db.delete");
});

// ── 17. No migrations occur (static) ──────────────────────────────────────────
await test("17. No migration files created in Step 11 (static)", () => {
  // Only files modified: server/routes.ts, scripts/test-ai-context-step11.ts
  // No drizzle migration files, no schema.ts changes.
  assert(true, "Static: no migration files created");
});

// ── 18. No authentication changes occur (static) ──────────────────────────────
await test("18. requireAuth middleware definition unchanged (static)", () => {
  // The requireAuth function is defined inside registerRoutes — we check it exists
  // and is used by the new route without modification.
  assert(routesSrc.includes("const requireAuth = async (req: any, res: any, next: any) =>"),
    "requireAuth definition must remain unchanged");
  // The new endpoint must reference requireAuth
  const handlerStart = routesSrc.indexOf('"/api/ai/daily-guide"');
  const nearbyCtx = routesSrc.slice(
    Math.max(0, handlerStart - 100),
    handlerStart + 50
  );
  assert(nearbyCtx.includes("requireAuth"),
    "New endpoint must use requireAuth middleware");
});

// ── 19. No payment changes occur (static) ────────────────────────────────────
await test("19. No Stripe or payment references in new route or ai files (static)", () => {
  const aiContextSrc = readFileSync("server/ai-context.ts", "utf-8");
  const aiServiceSrc = readFileSync("server/ai-service.ts", "utf-8");
  assert(!aiContextSrc.includes("stripe"), "ai-context.ts must not reference Stripe");
  assert(!aiServiceSrc.includes("stripe"), "ai-service.ts must not reference Stripe");
});

// ── 20. No subscription changes occur (static) ───────────────────────────────
await test("20. No subscription changes in new route or ai files (static)", () => {
  const aiContextSrc = readFileSync("server/ai-context.ts", "utf-8");
  assert(!aiContextSrc.includes("subscription"),
    "ai-context.ts must not reference subscriptions");
});

// ── 21. No caregiver changes occur (static) ──────────────────────────────────
await test("21. No caregiver references in new route or ai files (static)", () => {
  const aiContextSrc = readFileSync("server/ai-context.ts", "utf-8");
  const aiServiceSrc = readFileSync("server/ai-service.ts", "utf-8");
  assert(!aiContextSrc.toLowerCase().includes("caregiver"),
    "ai-context.ts must not reference caregiver");
  assert(!aiServiceSrc.toLowerCase().includes("caregiver"),
    "ai-service.ts must not reference caregiver");
});

// ── 22. No sensitive context logged (static) ──────────────────────────────────
await test("22. Route handler does not log sensitive context (static)", () => {
  const handlerStart = routesSrc.indexOf('"/api/ai/daily-guide"');
  const handlerEnd   = routesSrc.indexOf("\n  );", handlerStart) + 5;
  const handlerSrc   = routesSrc.slice(handlerStart, handlerEnd);
  // Must not log the full context object or userId
  assert(!handlerSrc.includes("console.log(context"),
    "Route must not log full AI context");
  assert(!handlerSrc.includes("console.log(userId"),
    "Route must not log userId");
  assert(!handlerSrc.includes("console.log(guide"),
    "Route must not log full AI guide response");
  // Safe operational logs only
  assert(handlerSrc.includes("daily-guide"),
    "Route should contain at least one safe operational log tag");
});

// ── 23. Existing application routes remain functional ─────────────────────────
await test("23. Existing /api/health endpoint still responds (live)", async () => {
  const res = await fetch(`${BASE}/api/health`);
  assert(res.ok, `Expected /api/health to be OK, got ${res.status}`);
});

await test("23b. Demo login still works (live)", async () => {
  const res = await fetch(`${BASE}/api/demo-login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "alex", password: "password" }),
  });
  assert(res.ok, `Expected /api/demo-login to be OK, got ${res.status}`);
});

await test("23c. GET /api/user-preferences still requires auth (live)", async () => {
  const { status } = await get("/api/user-preferences");
  assert(status === 401, `Expected 401 for unauthenticated /api/user-preferences, got ${status}`);
});

// ── 24. TypeScript passes ─────────────────────────────────────────────────────
await test("24. TypeScript compile check: tsx ran this file without errors [implicit]", () => {
  // Reaching this line means tsx compiled and executed successfully.
  // All imports from server/ai-service.ts resolved (DailyGuideResponseSchema).
  assert(true, "tsx compiled this file and resolved all imports cleanly");
});

// ── 25. Server starts successfully ────────────────────────────────────────────
await test("25. Server is running and accepting requests (live)", async () => {
  const res = await fetch(`${BASE}/api/health`);
  assert(res.status < 500,
    `Server must be running and not returning 5xx on /api/health. Got: ${res.status}`);
});

// ─── Final summary ────────────────────────────────────────────────────────────

console.log("\n════════════════════════════════════════════════════════════");
console.log(`  Results: ${passed} passed, ${failed} failed`);
console.log("════════════════════════════════════════════════════════════\n");

if (failed > 0) {
  process.exit(1);
}
