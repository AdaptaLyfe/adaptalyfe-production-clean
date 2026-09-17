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

test("trusted contact accepts a valid 10-digit phone and email", () => {
  const result = insertEmergencyContactSchema.safeParse({
    ...baseContact,
    email: "jane.doe@example.com",
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
  for (const phoneNumber of ["123", "123456789", "12345678901", "abc5551234", "555-123-4567"]) {
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
      phoneNumber: "12",
    }).success,
    false,
  );
});