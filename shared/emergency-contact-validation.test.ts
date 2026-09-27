import assert from "node:assert/strict";
import test from "node:test";

import {
  insertEmergencyContactSchema,
  updateEmergencyContactSchema,
} from "./schema.js";
import { getEmergencyContactFieldErrors } from "./contact-validation.js";

const baseContact = {
  userId: 1,
  name: "Jane Doe",
  phoneNumber: "6502530000",
};

test("trusted contact accepts valid US numbers in common US formats", () => {
  for (const phoneNumber of [
    "6502530000",
    "650-253-0000",
    "650.253.0000",
    "(650) 253-0000",
    "+1 650 253 0000",
    "+1 (650) 253-0000",
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
  for (const email of [
    "",
    " ",
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
    const result = insertEmergencyContactSchema.safeParse({
      ...baseContact,
      email,
    });

    assert.equal(result.success, false, `${JSON.stringify(email)} must fail`);
  }
});

test("trusted contact accepts emails with alphanumeric names and letter-only extensions", () => {
  for (const email of [
    "test@gmail.com",
    "john.doe@example.com",
    "asfsd@gmail.com",
    "a@b.co",
    "person+tag@sub.example.org",
  ]) {
    const result = insertEmergencyContactSchema.safeParse({
      ...baseContact,
      email,
    });

    assert.equal(result.success, true, `${email} should pass`);
  }
});

test("trusted contact rejects non-US, unassigned, and malformed numbers", () => {
  for (const phoneNumber of [
    "123",
    "123456",
    "1234567890123456",
    "abc5551234",
    "++15551234567",
    "+1 (650) 25A-3000",
    "+91 98765 43210",
    "+2 650 253 0000",
    "+1 416 555 0123",
    "9876543210",
    "1212121212",
    "0000000000",
    "1111111111",
    "650)253(0000",
    "(650253-0000",
    "!!!",
    "650/253/0000",
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
      email: "test..test@gmail.com",
    }).success,
    false,
  );
  assert.equal(
    updateEmergencyContactSchema.safeParse({
      email: "",
    }).success,
    false,
  );
  assert.equal(
    updateEmergencyContactSchema.safeParse({
      phoneNumber: "+1 650 253 0000",
    }).success,
    true,
  );
  assert.equal(
    updateEmergencyContactSchema.safeParse({
      phoneNumber: "12",
    }).success,
    false,
  );
  assert.equal(
    updateEmergencyContactSchema.safeParse({
      phoneNumber: "1212121212",
    }).success,
    false,
  );
});

test("trusted contact form errors are field-specific and share backend rules", () => {
  assert.deepEqual(
    getEmergencyContactFieldErrors("", "6502530000"),
    { email: "Please enter a valid email address." },
  );
  assert.deepEqual(
    getEmergencyContactFieldErrors("test..test@gmail.com", "6502530000"),
    { email: "Please enter a valid email address." },
  );
  assert.deepEqual(
    getEmergencyContactFieldErrors("jane.doe@example.com", "123"),
    { phoneNumber: "Please enter a valid phone number." },
  );
  assert.deepEqual(
    getEmergencyContactFieldErrors("test@", "abc"),
    {
      email: "Please enter a valid email address.",
      phoneNumber: "Please enter a valid phone number.",
    },
  );
  assert.deepEqual(
    getEmergencyContactFieldErrors("jane.doe@example.com", "+91 98765 43210"),
    { phoneNumber: "Please enter a valid phone number." },
  );
  assert.deepEqual(
    getEmergencyContactFieldErrors("asfsd@gmail.com", "1212121212"),
    { phoneNumber: "Please enter a valid phone number." },
  );
});