const MOBILE_PATTERN = /^[6-9]\d{9}$/;

/**
 * Returns the 10-digit Indian mobile number, or null if the input is not one.
 * Accepts spaces, dashes, brackets and a leading +91, 91 or 0. Customers are keyed by
 * this normalized form, so "+91 98765 43210" and "09876543210" are the same customer.
 */
export function normalizeIndianMobile(input: string): string | null {
  let digits = input.replace(/[\s()-]/g, '');
  if (digits.startsWith('+91')) {
    digits = digits.slice(3);
  } else if (digits.length === 12 && digits.startsWith('91')) {
    digits = digits.slice(2);
  } else if (digits.length === 11 && digits.startsWith('0')) {
    digits = digits.slice(1);
  }
  return MOBILE_PATTERN.test(digits) ? digits : null;
}
