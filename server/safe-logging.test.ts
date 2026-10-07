import assert from "node:assert/strict";
import test from "node:test";
import { logSanitizedError, sanitizeErrorMetadata } from "./safe-logging";

test("sanitized error metadata keeps only safe operational fields", () => {
  const error = Object.assign(new Error("patient symptom text and request payload"), {
    code: "E_PROVIDER_503",
    type: "rate_limit_exceeded",
    status: 503,
    requestBody: { note: "private health detail" },
  });

  assert.deepEqual(sanitizeErrorMetadata(error), {
    errorType: "Error",
    code: "E_PROVIDER_503",
    providerType: "rate_limit_exceeded",
    status: 503,
  });
});

test("sanitized error logging never serializes the original error", () => {
  const originalError = console.error;
  const logged: unknown[][] = [];
  console.error = (...args: unknown[]) => {
    logged.push(args);
  };

  try {
    logSanitizedError(
      "ai.provider",
      Object.assign(new Error("private response text"), { status: 502 }),
    );
  } finally {
    console.error = originalError;
  }

  assert.deepEqual(logged, [
    ["[ai.provider]", { errorType: "Error", status: 502 }],
  ]);
});
