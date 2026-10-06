import { apiRequest } from '@/services/api/client';
import { asBoolean, asNullableString, asObject, asInteger, asString } from '@/services/api/parse';

export type Account = { id: string; email: string; fullName: string | null };

export type AuthConfig = {
  emailEnabled: boolean;
  google: { enabled: boolean; webClientId: string | null };
};

export type SignInResult = { token: string; account: Account };

export type CodeRequestResult = { expiresInSeconds: number; resendInSeconds: number };

function parseAccount(value: unknown): Account {
  const dto = asObject(value);
  return { id: asString(dto.id), email: asString(dto.email), fullName: asNullableString(dto.fullName) };
}

function parseSignIn(value: unknown): SignInResult {
  const dto = asObject(value);
  return { token: asString(dto.token), account: parseAccount(dto.account) };
}

const bearer = (token: string) => ({ Authorization: `Bearer ${token}` });

/** Which sign-in methods the shop has turned on. The Google client ID comes from here, so the shop can change it without a new app. */
export const fetchAuthConfig = (signal?: AbortSignal) =>
  apiRequest('/auth/config', {
    signal,
    parse: (data): AuthConfig => {
      const dto = asObject(data);
      const google = asObject(dto.google);
      return {
        emailEnabled: asBoolean(dto.emailEnabled),
        google: { enabled: asBoolean(google.enabled), webClientId: asNullableString(google.webClientId) },
      };
    },
  });

export const requestEmailCode = (email: string) =>
  apiRequest('/auth/email-otp/request', {
    method: 'POST',
    body: { email },
    parse: (data): CodeRequestResult => {
      const dto = asObject(data);
      return { expiresInSeconds: asInteger(dto.expiresInSeconds), resendInSeconds: asInteger(dto.resendInSeconds) };
    },
  });

export const verifyEmailCode = (email: string, code: string) =>
  apiRequest('/auth/email-otp/verify', { method: 'POST', body: { email, code }, parse: parseSignIn });

export const signInWithGoogleToken = (idToken: string) =>
  apiRequest('/auth/google', { method: 'POST', body: { idToken }, parse: parseSignIn });

export const fetchAccount = (token: string, signal?: AbortSignal) =>
  apiRequest('/account/me', { headers: bearer(token), signal, parse: parseAccount });

export const signOutRequest = (token: string) =>
  apiRequest('/auth/logout', { method: 'POST', headers: bearer(token), parse: () => undefined });

export const deleteAccountRequest = (token: string) =>
  apiRequest('/account/me', { method: 'DELETE', headers: bearer(token), parse: () => undefined });
