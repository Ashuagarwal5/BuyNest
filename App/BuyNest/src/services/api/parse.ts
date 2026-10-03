/**
 * Small runtime checks for server responses. TypeScript types say what the API should
 * send; these confirm what it actually sent, so a contract mismatch fails loudly at the
 * boundary as MALFORMED_RESPONSE instead of as a crash deep inside a screen.
 */

import { ApiError } from '@/services/api/api-error';

export type JsonObject = Record<string, unknown>;

function malformed(): ApiError {
  return new ApiError('MALFORMED_RESPONSE');
}

export function asObject(value: unknown): JsonObject {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw malformed();
  }
  return value as JsonObject;
}

export function asArray<T>(value: unknown, parseItem: (item: unknown) => T): T[] {
  if (!Array.isArray(value)) {
    throw malformed();
  }
  return value.map(parseItem);
}

export function asString(value: unknown): string {
  if (typeof value !== 'string') {
    throw malformed();
  }
  return value;
}

export function asNullableString(value: unknown): string | null {
  return value === null || value === undefined ? null : asString(value);
}

/** Money and quantities are whole numbers (paise, units); anything else is a contract break. */
export function asInteger(value: unknown): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value)) {
    throw malformed();
  }
  return value;
}

export function asNullableInteger(value: unknown): number | null {
  return value === null || value === undefined ? null : asInteger(value);
}

export function asBoolean(value: unknown): boolean {
  if (typeof value !== 'boolean') {
    throw malformed();
  }
  return value;
}

export function asOneOf<T extends string>(value: unknown, allowed: readonly T[]): T {
  if (!allowed.includes(value as T)) {
    throw malformed();
  }
  return value as T;
}
