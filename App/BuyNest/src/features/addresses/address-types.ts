import type { CheckoutDetails } from '@/features/checkout/checkout-details';

/** A delivery address the customer keeps on this phone, with the contact details to go with it. */

export const ADDRESS_LABELS = ['Home', 'Work', 'Other'] as const;
export type AddressLabel = (typeof ADDRESS_LABELS)[number];

export const MAX_SAVED_ADDRESSES = 10;

export type SavedAddress = CheckoutDetails & {
  id: string;
  label: AddressLabel;
  /** The one checkout starts with. Exactly one saved address is the default. */
  isDefault: boolean;
};

/** What the editor produces: everything except what the address book assigns. */
export type AddressDraft = CheckoutDetails & { label: AddressLabel; isDefault: boolean };

/** The address as lines of text, for showing on a card. */
export function formatAddressLines(address: CheckoutDetails): string[] {
  return [
    address.addressLine1.trim(),
    address.addressLine2.trim(),
    address.landmark.trim() ? `Near ${address.landmark.trim()}` : '',
    `${address.city.trim()} - ${address.pincode.trim()}`,
  ].filter((line) => line !== '');
}

const clean = (text: string) => text.trim().replace(/\s+/g, ' ').toLowerCase();

/** True when two entries are the same place for the same person, ignoring case and spacing. */
export function isSameAddress(a: CheckoutDetails, b: CheckoutDetails): boolean {
  return (
    clean(a.addressLine1) === clean(b.addressLine1) &&
    clean(a.addressLine2) === clean(b.addressLine2) &&
    a.pincode.trim() === b.pincode.trim() &&
    a.phone.replace(/\D/g, '').slice(-10) === b.phone.replace(/\D/g, '').slice(-10)
  );
}

/** The checkout form values for a saved address. */
export function toCheckoutDetails(address: SavedAddress): CheckoutDetails {
  return {
    fullName: address.fullName,
    phone: address.phone,
    addressLine1: address.addressLine1,
    addressLine2: address.addressLine2,
    landmark: address.landmark,
    city: address.city,
    pincode: address.pincode,
    deliveryAreaId: address.deliveryAreaId,
  };
}
