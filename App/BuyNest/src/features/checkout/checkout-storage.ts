/**
 * Remembers the last used checkout details on this device so the next order is quicker.
 * This is a local convenience only; it is not an account and nothing is sent anywhere.
 */

import type { CheckoutDetails } from '@/features/checkout/checkout-details';
import { readJson, StorageKeys, writeJson } from '@/services/storage';

export async function loadSavedCheckoutDetails(): Promise<CheckoutDetails | null> {
  const result = await readJson(StorageKeys.checkoutDetails);
  if (!result.ok || typeof result.value !== 'object' || result.value === null) {
    return null;
  }

  const saved = result.value as Record<string, unknown>;
  const text = (key: keyof CheckoutDetails): string => {
    const value = saved[key];
    return typeof value === 'string' ? value : '';
  };

  return {
    fullName: text('fullName'),
    phone: text('phone'),
    addressLine1: text('addressLine1'),
    addressLine2: text('addressLine2'),
    landmark: text('landmark'),
    city: text('city'),
    pincode: text('pincode'),
    deliveryAreaId: text('deliveryAreaId') || null,
  };
}

export function saveCheckoutDetails(details: CheckoutDetails): Promise<boolean> {
  return writeJson(StorageKeys.checkoutDetails, details);
}
