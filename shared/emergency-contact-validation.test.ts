import assert from "node:assert/strict";
import test from "node:test";

import {
  insertEmergencyContactSchema,
  updateEmergencyContactSchema,
} from "./schema.js";

const baseContact = {
  userId: 1,
  name: "Jane Doe",
  phoneNumber: "+1 (555) 123-4567",
};

test("trusted contact accepts valid phone and email formats", () => {
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

test("trusted contact rejects invalid phone formats", () => {
  for (const phoneNumber of ["123", "abc5551234", "+++---"]) {
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