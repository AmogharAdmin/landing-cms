/** Strip everything except digits from a phone input. */
export function extractPhoneDigits(value: string): string {
  return value.replace(/\D/g, "");
}

/**
 * Normalize common Indian mobile formats to a 10-digit string.
 * Accepts: 9876543210, +91 9876543210, 09876543210
 */
export function normalizeIndianMobileNumber(value: string): string | null {
  let digits = extractPhoneDigits(value);

  if (digits.length === 12 && digits.startsWith("91")) {
    digits = digits.slice(2);
  } else if (digits.length === 11 && digits.startsWith("0")) {
    digits = digits.slice(1);
  }

  if (digits.length !== 10) return null;
  return digits;
}

/** True when all 10 digits are the same (e.g. 9999999999, 5555555555). */
export function isRepeatedDigitPhone(digits: string): boolean {
  return /^(\d)\1{9}$/.test(digits);
}

export function isValidIndianMobileNumber(value: string): boolean {
  const digits = normalizeIndianMobileNumber(value);
  if (!digits) return false;
  return !isRepeatedDigitPhone(digits);
}

export function phoneValidationError(value: string, label = "contact number"): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const digits = normalizeIndianMobileNumber(trimmed);
  if (!digits) {
    return `Please enter a valid 10-digit ${label.toLowerCase()}.`;
  }

  if (isRepeatedDigitPhone(digits)) {
    return `Please enter a valid ${label.toLowerCase()}. Numbers with all same digits (e.g. 9999999999) are not allowed.`;
  }

  return null;
}
