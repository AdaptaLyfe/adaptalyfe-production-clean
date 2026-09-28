import assert from "node:assert/strict";
import test from "node:test";

import {
  insertPrimaryCareProviderSchema,
  updatePrimaryCareProviderSchema,
} from "./schema.js";
import { getEmergencyContactFieldErrors } from "./contact-validation.js";

const baseProvider = {
  userId: 1,
  name: "Dr. Smith",
  specialty: "Family Medicine",
  phoneNumber: "6502530000",
};

test("healthcare contacts accept valid US phone formats and normalize them", () => {
  for (const phoneNumber of [
    "6502530000",
    "650-253-0000",
    "650.253.0000",
    "(650) 253-0000",
    "+1 650 253 0000",
    "+1 (650) 253-0000",
  ]) {
    const result = insertPrimaryCareProviderSchema.safeParse({
      ...baseProvider,
      phoneNumber,
      email: " office@example.com ",
    });

    assert.equal(result.success, true, `${phoneNumber} should pass`);
    if (result.success) {
      assert.equal(result.data.phoneNumber, phoneNumber.trim().replace(/[\s().-]/g, ""));
      assert.equal(result.data.email, "office@example.com");
    }
  }
});

test("healthcare contact email is optional but validated when provided", () => {
  const noEmail = insertPrimaryCareProviderSchema.safeParse(baseProvider);
  assert.equal(noEmail.success, true);

  const blankEmail = insertPrimaryCareProviderSchema.safeParse({
    ...baseProvider,
    email: "   ",
  });
  assert.equal(blankEmail.success, true);
  if (blankEmail.success) assert.equal(blankEmail.data.email, null);

  for (const email of [
    "test",
    "test@",
    "@gmail.com",
    "test@gmail",
    "test..test@gmail.com",
    "test @gmail.com",
    "a@b..com",
    "test@gmail.c",
    "test@gmail.c0",
    "test@-gmail.com",
  ]) {
    const result = insertPrimaryCareProviderSchema.safeParse({
      ...baseProvider,
      email,
    });
    assert.equal(result.success, false, `${JSON.stringify(email)} must fail`);
  }
});

test("healthcare contacts reject short, non-US, and invalid US numbers", () => {
  for (const phoneNumber of [
    "1",
    "123",
    "1234",
    "123456",
    "1234567890123",
    "abc5551234",
    "+91 98765 43210",
    "+1 416 555 0123",
    "9876543210",
    "1212121212",
  ]) {
    const result = insertPrimaryCareProviderSchema.safeParse({
      ...baseProvider,
      phoneNumber,
    });
    assert.equal(result.success, false, `${JSON.stringify(phoneNumber)} must fail`);
  }
});

test("healthcare contact updates validate phone and email using the same rules", () => {
  assert.equal(
    updatePrimaryCareProviderSchema.safeParse({ phoneNumber: "+1 650 253 0000" }).success,
    true,
  );
  assert.equal(
    updatePrimaryCareProviderSchema.safeParse({ phoneNumber: "1234" }).success,
    false,
  );
  assert.equal(
    updatePrimaryCareProviderSchema.safeParse({ email: "test..test@gmail.com" }).success,
    false,
  );
  assert.equal(
    updatePrimaryCareProviderSchema.safeParse({ email: "" }).success,
    true,
  );
});

test("healthcare contact form helper reports short phone and malformed email", () => {
  assert.deepEqual(
    getEmergencyContactFieldErrors("bad@email", "1234", { emailRequired: false }),
    {
      email: "Please enter a valid email address.",
      phoneNumber: "Please enter a valid phone number.",
    },
  );
  assert.deepEqual(
    getEmergencyContactFieldErrors("", "6502530000", { emailRequired: false }),
    {},
  );
});