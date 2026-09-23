import assert from "node:assert/strict";
import test from "node:test";

import {
  insertEmergencyContactSchema,
  updateEmergencyContactSchema,
} from "./schema.js";

const baseContact = {
  userId: 1,
  name: "Jane Doe",
  phoneNumber: "5551234567",
};

test("trusted contact accepts common national and international phone formats", () => {
  for (const phoneNumber of [
    "5551234567",
    "555-123-4567",
    "(555) 123-4567",
    "+1 555 123 4567",
    "+91 98765 43210",
  ]) {
    const result = insertEmergencyContactSchema.safeParse({
      ...baseContact,
      phoneNumber,
      email: " jane.doe@example.com ",
    });

    assert.equal(result.success, true);
    if (result.success) {
      assert.equal(result.data.phoneNumber, phoneNumber.trim().replace(/[\s().-]/g, ""));
      assert.equal(result.data.email, "jane.doe@example.com");
    }
  }
});

test("trusted contact accepts a valid email with surrounding whitespace", () => {
  const result = insertEmergencyContactSchema.safeParse({
    ...baseContact,
    email: " jane.doe@example.com ",
  });

  assert.equal(result.success, true);
});

test("trusted contact rejects invalid email formats", () => {
  const result = insertEmergencyContactSchema.safeParse({
    ...baseContact,
    email: "not-an-email",
  });

  assert.equal(result.success, false);
});

test("trusted contact rejects invalid phone formats and lengths", () => {
  for (const phoneNumber of [
    "123",
    "123456",
    "1234567890123456",
    "abc5551234",
    "++15551234567",
    "+1 (555) 12A-4567",
  ]) {
    const result = insertEmergencyContactSchema.safeParse({
      ...baseContact,
      phoneNumber,
    });

    assert.equal(result.success, false);
  }
});

test("trusted contact updates validate changed email and phone values", () => {
  assert.equal(
    updateEmergencyContactSchema.safeParse({
      email: "invalid-email",
    }).success,
    false,
  );
  assert.equal(
    updateEmergencyContactSchema.safeParse({
      phoneNumber: "+1 555 123 4567",
    }).success,
    true,
  );
  assert.equal(
    updateEmergencyContactSchema.safeParse({
      phoneNumber: "12",
    }).success,
    false,
  );
});