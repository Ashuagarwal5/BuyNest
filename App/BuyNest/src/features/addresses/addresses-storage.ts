import {
  ADDRESS_LABELS,
  type AddressLabel,
  MAX_SAVED_ADDRESSES,
  type SavedAddress,
} from '@/features/addresses/address-types';
import { readJson, StorageKeys, writeJson } from '@/services/storage';

function parseAddress(value: unknown): SavedAddress | null {
  if (typeof value !== 'object' || value === null) {
    return null;
  }
  const entry = value as Record<string, unknown>;
  const text = (key: string) => (typeof entry[key] === 'string' ? (entry[key] as string) : '');
  const label =
    ADDRESS_LABELS.find((known) => known === entry['label']) ?? ('Other' as AddressLabel);

  const id = text('id');
  if (id === '' || text('addressLine1').trim() === '' || text('pincode').trim() === '') {
    return null;
  }
  return {
    id,
    label,
    isDefault: entry['isDefault'] === true,
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

/** Makes sure exactly one address is the default (the first, if none or several claim to be). */
export function normaliseDefaults(addresses: SavedAddress[]): SavedAddress[] {
  const defaultId = addresses.find((address) => address.isDefault)?.id ?? addresses[0]?.id;
  return addresses.map((address) => ({ ...address, isDefault: address.id === defaultId }));
}

/** The saved addresses. Damaged entries are dropped; unreadable storage means an empty book. */
export async function loadAddresses(): Promise<SavedAddress[]> {
  const result = await readJson(StorageKeys.addresses);
  if (!result.ok || !Array.isArray(result.value)) {
    return [];
  }
  const parsed = result.value.flatMap((value) => parseAddress(value) ?? []);
  return normaliseDefaults(parsed.slice(0, MAX_SAVED_ADDRESSES));
}

export function saveAddresses(addresses: SavedAddress[]): Promise<boolean> {
  return writeJson(StorageKeys.addresses, addresses);
}
