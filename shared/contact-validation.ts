const CONTACT_PHONE_SEPARATORS = /[\s().-]/g;

// Format-only US validation: optionally +1, a balanced or plain area code,
// and a seven-digit local number with optional single separators.
export const usPhoneRegex = /^(?:\+1[-. ]?)?(?:\([0-9]{3}\)|[0-9]{3})[-. ]?[0-9]{3}[-. ]?[0-9]{4}$/;
export const emailRegex = /^[A-Z0-9]+(?:[._%+-][A-Z0-9]+)*@[A-Z0-9]+(?:-[A-Z0-9]+)*(?:\.[A-Z0-9]+(?:-[A-Z0-9]+)*)*\.[A-Z]{2,}$/i;

/**
 * Keep the stored contact number compact while accepting common human-readable
 * formats such as "+1 (650) 253-0000".
 */
export const normalizeContactPhoneNumber = (value: string) =>
  value.trim().replace(CONTACT_PHONE_SEPARATORS, "");

export const isValidContactPhoneNumber = (value: string) => {
  return usPhoneRegex.test(value.trim());
};

export const isValidContactEmail = (value: string) =>
  emailRegex.test(value.trim());

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