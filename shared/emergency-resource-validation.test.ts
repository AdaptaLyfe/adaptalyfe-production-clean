import assert from "node:assert/strict";
import test from "node:test";

import {
  insertEmergencyResourceSchema,
  updateEmergencyResourceSchema,
} from "./schema.js";

const baseResource = {
  userId: 1,
  name: "Local Crisis Hotline",
  resourceType: "crisis",
};

test("emergency resources accept an omitted or blank optional phone number", () => {
  for (const value of [undefined, null, "", "   "]) {
    const result = insertEmergencyResourceSchema.safeParse({
      ...baseResource,
      phoneNumber: value,
    });

    assert.equal(result.success, true, `${JSON.stringify(value)} should pass`);
  }
});

test("emergency resources accept and normalize valid US phone formats", () => {
  for (const phoneNumber of [
    "6502530000",
    "650-253-0000",
    "(650) 253-0000",
    "+1 (650) 253-0000",
    "+12762066748",
  ]) {
    const result = insertEmergencyResourceSchema.safeParse({
      ...baseResource,
      phoneNumber,
    });

    assert.equal(result.success, true, `${phoneNumber} should pass`);
    if (result.success) {
      assert.equal(
        result.data.phoneNumber,
        phoneNumber.trim().replace(/[\s().-]/g, ""),
      );
    }
  }
});

test("emergency resources reject short, international, and invalid US phone numbers", () => {
  for (const phoneNumber of [
    "1",
    "123",
    "1234",
    "123456",
    "abc5551234",
    "+91 98765 43210",
    "+1 416 555 0123",
    "9876543210",
    "1212121212",
  ]) {
    const result = insertEmergencyResourceSchema.safeParse({
      ...baseResource,
      phoneNumber,
    });

    assert.equal(result.success, false, `${phoneNumber} must fail`);
  }
});

test("emergency resource updates validate phone numbers with the same rules", () => {
  assert.equal(
    updateEmergencyResourceSchema.safeParse({
      phoneNumber: "+1 650 253 0000",
    }).success,
    true,
  );
  assert.equal(
    updateEmergencyResourceSchema.safeParse({
      phoneNumber: "1234",
    }).success,
    false,
  );
});