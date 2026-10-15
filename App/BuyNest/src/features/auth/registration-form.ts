export type RegistrationFields = {
  fullName: string;
  mobile: string;
  email: string;
  termsAccepted: boolean;
};

export type RegistrationInput = {
  fullName: string;
  mobile: string;
  email: string;
  termsAccepted: true;
};

export type RegistrationFieldErrors = Partial<Record<keyof RegistrationFields, string>>;

/** Prepare the same required profile fields that the server validates independently. */
export function validateRegistrationForm(
  fields: RegistrationFields
): { ok: true; input: RegistrationInput } | { ok: false; errors: RegistrationFieldErrors } {
  const fullName = fields.fullName.trim();
  const mobile = fields.mobile.trim().replace(/[\s()-]/g, '');
  const email = fields.email.trim().toLowerCase();
  const errors: RegistrationFieldErrors = {};

  if (fullName.length < 2 || fullName.length > 100) {
    errors.fullName = 'Enter your full name, from 2 to 100 characters.';
  }
  if (!/^\+[1-9]\d{7,14}$/.test(mobile)) {
    errors.mobile = 'Enter a mobile number with its country code, for example +91 9876543210.';
  }
  if (email.length > 200 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = 'Enter a valid email address.';
  }
  if (!fields.termsAccepted) {
    errors.termsAccepted = 'Please accept the Terms of Service and Privacy Policy to continue.';
  }

  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return { ok: true, input: { fullName, mobile, email, termsAccepted: true } };
}

/** Login may continue to the address editor; arbitrary destinations are never followed. */
export function isAddressNext(value: unknown): boolean {
  return value === 'address';
}

/** A small allowlist keeps login redirects within supported application flows. */
export function isCheckoutNext(value: unknown): boolean {
  return value === 'checkout';
}
