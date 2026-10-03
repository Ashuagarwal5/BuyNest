/** What the customer fills in at checkout, plus the rules for whether it is acceptable. */

export type CheckoutDetails = {
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  landmark: string;
  city: string;
  pincode: string;
  deliveryAreaId: string | null;
};

export type CheckoutField = keyof CheckoutDetails;

export type CheckoutErrors = Partial<Record<CheckoutField, string>>;

export const emptyCheckoutDetails: CheckoutDetails = {
  fullName: '',
  phone: '',
  addressLine1: '',
  addressLine2: '',
  landmark: '',
  city: '',
  pincode: '',
  deliveryAreaId: null,
};

const MOBILE_PATTERN = /^[6-9]\d{9}$/;
const PINCODE_PATTERN = /^[1-9]\d{5}$/;

/**
 * Returns the 10-digit Indian mobile number, or null if the input is not one.
 * Accepts spaces, dashes and a leading +91, 91 or 0.
 */
export function normalizeMobileNumber(input: string): string | null {
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

export function validateCheckoutDetails(details: CheckoutDetails): CheckoutErrors {
  const errors: CheckoutErrors = {};

  if (details.fullName.trim().length < 2) {
    errors.fullName = 'Enter your full name';
  }

  if (details.phone.trim() === '') {
    errors.phone = 'Enter your mobile number';
  } else if (normalizeMobileNumber(details.phone) === null) {
    errors.phone = 'Enter a valid 10-digit mobile number';
  }

  if (details.addressLine1.trim() === '') {
    errors.addressLine1 = 'Enter your house number and street';
  }

  if (details.city.trim() === '') {
    errors.city = 'Enter your city';
  }

  if (details.pincode.trim() === '') {
    errors.pincode = 'Enter your pincode';
  } else if (!PINCODE_PATTERN.test(details.pincode.trim())) {
    errors.pincode = 'Pincode must be 6 digits';
  }

  if (details.deliveryAreaId === null) {
    errors.deliveryAreaId = 'Select your delivery area';
  }

  return errors;
}

export function hasErrors(errors: CheckoutErrors): boolean {
  return Object.keys(errors).length > 0;
}
