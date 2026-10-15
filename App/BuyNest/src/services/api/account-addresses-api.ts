import { ADDRESS_LABELS, type AddressDraft, type SavedAddress } from '@/features/addresses/address-types';
import { apiRequest } from '@/services/api/client';
import { ApiError } from '@/services/api/api-error';
import { asArray, asBoolean, asNullableString, asObject, asOneOf, asString } from '@/services/api/parse';

const bearer = (token: string) => ({ Authorization: `Bearer ${token}` });
const addressPath = (id: string) => `/account/addresses/${encodeURIComponent(id)}`;

function parseAddress(value: unknown): SavedAddress {
  const dto = asObject(value);
  return {
    id: asString(dto.id), label: asOneOf(dto.label, ADDRESS_LABELS), isDefault: asBoolean(dto.isDefault),
    fullName: asString(dto.fullName), phone: asString(dto.phone),
    addressLine1: asString(dto.addressLine1), addressLine2: asString(dto.addressLine2),
    landmark: asString(dto.landmark), city: asString(dto.city), pincode: asString(dto.pincode),
    deliveryAreaId: asNullableString(dto.deliveryAreaId),
  };
}

export const fetchAccountAddresses = (token: string, signal?: AbortSignal) =>
  apiRequest('/account/addresses', { headers: bearer(token), signal, parse: (data) => asArray(data, parseAddress) });

export const addAccountAddress = (token: string, draft: AddressDraft) =>
  apiRequest('/account/addresses', { method: 'POST', headers: bearer(token), body: draft, parse: parseAddress });

export const updateAccountAddress = (token: string, id: string, draft: AddressDraft) =>
  apiRequest(addressPath(id), { method: 'PATCH', headers: bearer(token), body: draft, parse: parseAddress });

export const removeAccountAddress = (token: string, id: string) =>
  apiRequest(addressPath(id), { method: 'DELETE', headers: bearer(token), parse: (data) => {
    const dto = asObject(data);
    if (!asBoolean(dto.deleted)) throw new ApiError('MALFORMED_RESPONSE');
  } });

export const defaultAccountAddress = (token: string, id: string) =>
  apiRequest(`${addressPath(id)}/default`, { method: 'POST', headers: bearer(token), body: {}, parse: (data) => asArray(data, parseAddress) });
