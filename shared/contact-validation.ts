const CONTACT_PHONE_SEPARATORS = /[\s().-]/g;

/**
 * Keep the stored contact number compact while accepting common human-readable
 * formats such as "+1 (555) 123-4567".
 */
export const normalizeContactPhoneNumber = (value: string) =>
  value.trim().replace(CONTACT_PHONE_SEPARATORS, "");

export const isValidContactPhoneNumber = (value: string) =>
  /^\+?\d{7,15}$/.test(normalizeContactPhoneNumber(value));

export const isValidContactEmail = (value: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());