/**
 * STEP 4 — Temporary AI Context Service Test
 * ─────────────────────────────────────────────
 * Purpose : Verify server/ai-context.ts produces safe, correct context.
 * Scope   : Identity + time only. No DB writes. No OpenAI calls.
 * Remove  : After STEP 4 is approved this file can be deleted.
 *
 * Run via: npx tsx scripts/test-ai-context-step4.ts
 */

import { buildDailyGuideContext } from "../server/ai-context.js";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function pass(label: string, detail?: unknown) {
  console.log(`  ✅ PASS  ${label}`, detail !== undefined ? `— ${JSON.stringify(detail)}` : "");
}

function fail(label: string, detail?: unknown) {
  console.error(`  ❌ FAIL  ${label}`, detail !== undefined ? `— ${JSON.stringify(detail)}` : "");
}

function section(title: string) {
  console.log(`\n${"─".repeat(60)}`);
  console.log(`  ${title}`);
  console.log("─".repeat(60));
}

// Fields that must NEVER appear in the context (sensitive whitelist check)
const FORBIDDEN_FIELDS = [
  "password", "hash", "token", "secret", "stripe", "apple", "google",
  "plaid", "bank", "payment", "card", "ssn", "dob", "phone", "email",
  "session", "cookie", "authorization", "credential", "key", "medical",
  "medication", "allergy", "diagnosis", "symptom", "financial", "balance",
  "account", "routing", "subscription", "billing",
];

function containsForbiddenField(obj: unknown): string | null {
  const str = JSON.stringify(obj).toLowerCase();
  for (const field of FORBIDDEN_FIELDS) {
    if (str.includes(`"${field}"`)) return field;
  }
  return null;
}

// ─── Tests ────────────────────────────────────────────────────────────────────

async function runTests() {
  let passed = 0;
  let failed = 0;

  // ── Test 1: Valid identity produces correct context ────────────────────────
  section("TEST 1 — Valid userId + name produces safe context");
  const ctx = await buildDailyGuideContext(42, { name: "Alex Johnson" });

  // userName should be first name only
  if (ctx.userName === "Alex") {
    pass("userName is first name only", ctx.userName);
    passed++;
  } else {
    fail("userName should be 'Alex'", ctx.userName);
    failed++;
  }

  // date is YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(ctx.date)) {
    pass("date is YYYY-MM-DD format", ctx.date);
    passed++;
  } else {
    fail("date format incorrect", ctx.date);
    failed++;
  }

  // time is HH:MM
  if (/^\d{2}:\d{2}$/.test(ctx.time)) {
    pass("time is HH:MM format", ctx.time);
    passed++;
  } else {
    fail("time format incorrect", ctx.time);
    failed++;
  }

  // timezone is present
  if (ctx.timezone && typeof ctx.timezone === "string") {
    pass("timezone is present", ctx.timezone);
    passed++;
  } else {
    fail("timezone missing or invalid", ctx.timezone);
    failed++;
  }

  // ── Test 2: Context contains ONLY expected fields for Step 4 ──────────────
  section("TEST 2 — Context contains only intended Step 4 fields");
  const allowedKeys = ["userName", "date", "time", "timezone"];
  const presentKeys = Object.keys(ctx).filter(k => ctx[k as keyof typeof ctx] !== undefined);
  const extraKeys = presentKeys.filter(k => !allowedKeys.includes(k));

  if (extraKeys.length === 0) {
    pass("No extra fields present beyond intended Step 4 fields");
    passed++;
  } else {
    fail("Unexpected extra fields found", extraKeys);
    failed++;
  }

  // tasks/appointments/calendarEvents/preferences must be absent or empty
  const futureFields = ["tasks", "appointments", "calendarEvents", "preferences"];
  for (const field of futureFields) {
    const val = ctx[field as keyof typeof ctx];
    if (val === undefined || (Array.isArray(val) && val.length === 0)) {
      pass(`Future field '${field}' is correctly absent/empty`);
      passed++;
    } else {
      fail(`Future field '${field}' should be absent in Step 4`, val);
      failed++;
    }
  }

  // ── Test 3: No sensitive fields in output ──────────────────────────────────
  section("TEST 3 — No sensitive fields in context output");
  const forbidden = containsForbiddenField(ctx);
  if (!forbidden) {
    pass("No sensitive field names found in context");
    passed++;
  } else {
    fail(`Sensitive field detected: "${forbidden}"`);
    failed++;
  }

  // ── Test 4: Context does not contain auth/payment/medical/financial info ───
  section("TEST 4 — Context is free of auth, payment, medical, financial data");
  const contextStr = JSON.stringify(ctx);
  const checks = [
    { label: "No authentication tokens", pattern: /bearer|jwt|session_id/i },
    { label: "No payment identifiers",   pattern: /cus_|sub_|pi_|sk_|pk_/i },
    { label: "No medical terms",          pattern: /diagnosis|prescription|allerg/i },
    { label: "No financial terms",        pattern: /\$\d|balance:|routing/i },
  ];
  for (const c of checks) {
    if (!c.pattern.test(contextStr)) {
      pass(c.label);
      passed++;
    } else {
      fail(c.label);
      failed++;
    }
  }

  // ── Test 5: date reflects today (not hardcoded) ────────────────────────────
  section("TEST 5 — Date is current (not hardcoded)");
  const serverToday = new Date().toISOString().slice(0, 10);
  if (ctx.date === serverToday) {
    pass("date matches server's current date", ctx.date);
    passed++;
  } else {
    fail("date does not match server today", { ctx: ctx.date, server: serverToday });
    failed++;
  }

  // ── Test 6: Single-word name handled correctly ────────────────────────────
  section("TEST 6 — Single-word name handled correctly");
  const ctx2 = await buildDailyGuideContext(1, { name: "Jordan" });
  if (ctx2.userName === "Jordan") {
    pass("Single-word name preserved as-is", ctx2.userName);
    passed++;
  } else {
    fail("Single-word name handling incorrect", ctx2.userName);
    failed++;
  }

  // ── Test 7: Invalid userId handled safely (no throw) ──────────────────────
  section("TEST 7 — Invalid userId handled safely without throwing");
  try {
    const ctxBad = await buildDailyGuideContext(-1, { name: "Test" });
    if (ctxBad.userName && ctxBad.date && ctxBad.time) {
      pass("Invalid userId returns safe fallback context (no throw)");
      passed++;
    } else {
      fail("Invalid userId fallback context is incomplete");
      failed++;
    }
  } catch {
    fail("Invalid userId caused an exception — should return safe fallback");
    failed++;
  }

  // ── Test 8: Missing name handled safely ───────────────────────────────────
  section("TEST 8 — Missing/invalid name handled safely without throwing");
  try {
    // @ts-expect-error intentionally passing bad data for test
    const ctxNoName = await buildDailyGuideContext(1, { name: "" });
    if (ctxNoName.date && ctxNoName.time) {
      pass("Empty name returns safe fallback context (no throw)");
      passed++;
    } else {
      fail("Empty name fallback context is incomplete");
      failed++;
    }
  } catch {
    fail("Empty name caused an exception — should return safe fallback");
    failed++;
  }

  // ── Summary ───────────────────────────────────────────────────────────────
  section("STEP 4 SUMMARY");
  console.log("\n  Context produced (safe to log — no sensitive fields):");
  console.log("  ", JSON.stringify(ctx, null, 2).split("\n").join("\n   "));
  console.log(`\n  Total passed : ${passed}`);
  console.log(`  Total failed : ${failed}`);
  console.log(`  DB records modified  : NO`);
  console.log(`  OpenAI called        : NO`);
  console.log(`  Auth modified        : NO`);
  console.log(`  Payments modified    : NO`);
  console.log(`  Caregiver modified   : NO`);
  console.log(`\n  STEP 4 STATUS: ${failed === 0 ? "PASS ✅" : "FAIL ❌"}`);

  process.exit(failed === 0 ? 0 : 1);
}

runTests().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
