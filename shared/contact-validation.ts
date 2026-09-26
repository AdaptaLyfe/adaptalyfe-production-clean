import { isValidPhoneNumber } from "libphonenumber-js/max";
import { z } from "zod";

const CONTACT_PHONE_SEPARATORS = /[\s().-]/g;
const CONTACT_PHONE_CHARACTERS = /^\+?[0-9\s().-]+$/;
const CONTACT_EMAIL_SCHEMA = z.string().trim().email();

/**
 * Keep the stored contact number compact while accepting common human-readable
 * formats such as "+1 (650) 253-0000".
 */
export const normalizeContactPhoneNumber = (value: string) =>
  value.trim().replace(CONTACT_PHONE_SEPARATORS, "");

export const isValidContactPhoneNumber = (value: string) => {
  const trimmedValue = value.trim();
  if (!trimmedValue || !CONTACT_PHONE_CHARACTERS.test(trimmedValue)) {
    return false;
  }

  return isValidPhoneNumber(normalizeContactPhoneNumber(trimmedValue), "US");
};

export const isValidContactEmail = (value: string) =>
  CONTACT_EMAIL_SCHEMA.safeParse(value).success;

export type ContactFieldValidationErrors = {
  email?: string;
  phoneNumber?: string;
};

export function getEmergencyContactFieldErrors(
  email: string,
  phoneNumber: string,
  { emailRequired = true }: { emailRequired?: boolean } = {},
): ContactFieldValidationErrors {
  const errors: ContactFieldValidationErrors = {};
  const hasEmail = email.trim().length > 0;

  if ((emailRequired && !hasEmail) || (hasEmail && !isValidContactEmail(email))) {
    errors.email = "Please enter a valid email address.";
  }

  if (!isValidContactPhoneNumber(phoneNumber)) {
    errors.phoneNumber = "Please enter a valid phone number.";
  }

  return errors;
}