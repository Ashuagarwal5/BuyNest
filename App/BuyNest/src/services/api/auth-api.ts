import { apiRequest } from '@/services/api/client';
import { asBoolean, asNullableString, asObject, asInteger, asString } from '@/services/api/parse';

export type Account = {
  id: string;
  email: string;
  fullName: string | null;
  mobile: string | null;
  emailVerified: boolean;
  mobileVerified: boolean;
  googleLinked: boolean;
  isActive: boolean;
};

export type AuthConfig = {
  emailEnabled: boolean;
  google: { enabled: boolean; webClientId: string | null };
  registration: { enabled: boolean; verificationRequired: boolean };
  loginMethod: 'email_otp';
  otp: { expiresInSeconds: number; resendInSeconds: number; maxAttempts: number };
};

export type SignInResult = { token: string; account: Account };

export type CodeRequestResult = { expiresInSeconds: number; resendInSeconds: number };
export type RegisterRequest = { fullName: string; mobile: string; email: string; termsAccepted: true };
export type RegistrationResult = {
  verificationRequired: boolean;
  loginRequired: boolean;
  expiresInSeconds?: number;
  resendInSeconds?: number;
};

function parseAccount(value: unknown): Account {
  const dto = asObject(value);
  return {
    id: asString(dto.id), email: asString(dto.email), fullName: asNullableString(dto.fullName),
    mobile: asNullableString(dto.mobile),
    emailVerified: dto.emailVerified === undefined ? false : asBoolean(dto.emailVerified),
    mobileVerified: dto.mobileVerified === undefined ? false : asBoolean(dto.mobileVerified),
    googleLinked: dto.googleLinked === undefined ? false : asBoolean(dto.googleLinked),
    isActive: dto.isActive === undefined ? true : asBoolean(dto.isActive),
  };
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
      const registration = dto.registration === undefined ? null : asObject(dto.registration);
      const otp = dto.otp === undefined ? null : asObject(dto.otp);
      return {
        emailEnabled: asBoolean(dto.emailEnabled),
        google: { enabled: asBoolean(google.enabled), webClientId: asNullableString(google.webClientId) },
        registration: registration
          ? { enabled: asBoolean(registration.enabled), verificationRequired: asBoolean(registration.verificationRequired) }
          : { enabled: false, verificationRequired: true },
        loginMethod: 'email_otp',
        otp: otp
          ? { expiresInSeconds: asInteger(otp.expiresInSeconds), resendInSeconds: asInteger(otp.resendInSeconds), maxAttempts: asInteger(otp.maxAttempts) }
          : { expiresInSeconds: 600, resendInSeconds: 60, maxAttempts: 5 },
      };
    },
  });

export const requestEmailCode = (email: string) =>
  apiRequest('/auth/email-otp/request', {
    // SMTP connection, greeting and sending can outlast the general API timeout.
    timeoutMs: 45_000,
    method: 'POST',
    body: { email },
    parse: (data): CodeRequestResult => {
      const dto = asObject(data);
      return { expiresInSeconds: asInteger(dto.expiresInSeconds), resendInSeconds: asInteger(dto.resendInSeconds) };
    },
  });

export const verifyEmailCode = (email: string, code: string) =>
  apiRequest('/auth/email-otp/verify', { method: 'POST', body: { email, code }, parse: parseSignIn });

export const registerAccount = (request: RegisterRequest) =>
  apiRequest('/auth/register', {
    timeoutMs: 45_000,
    method: 'POST', body: request,
    parse: (data): RegistrationResult => {
      const dto = asObject(data);
      return {
        verificationRequired: asBoolean(dto.verificationRequired),
        loginRequired: asBoolean(dto.loginRequired),
        expiresInSeconds: dto.expiresInSeconds === undefined ? undefined : asInteger(dto.expiresInSeconds),
        resendInSeconds: dto.resendInSeconds === undefined ? undefined : asInteger(dto.resendInSeconds),
      };
    },
  });

export const verifyRegistration = (email: string, code: string) =>
  apiRequest('/auth/register/verify', { method: 'POST', body: { email, code }, parse: parseSignIn });

export const signInWithGoogleToken = (idToken: string) =>
  apiRequest('/auth/google', { method: 'POST', body: { idToken }, parse: parseSignIn });

export const fetchAccount = (token: string, signal?: AbortSignal) =>
  apiRequest('/account/me', { headers: bearer(token), signal, parse: parseAccount });

export const updateAccountRequest = (token: string, profile: { fullName: string; mobile: string }) =>
  apiRequest('/account/me', { method: 'PATCH', headers: bearer(token), body: profile, parse: parseAccount });

export const linkGoogleAccountRequest = (token: string, idToken: string) =>
  apiRequest('/account/google/link', { method: 'POST', headers: bearer(token), body: { idToken }, parse: parseAccount });

export const signOutRequest = (token: string) =>
  apiRequest('/auth/logout', { method: 'POST', headers: bearer(token), parse: () => undefined });

export const deleteAccountRequest = (token: string) =>
  apiRequest('/account/me', { method: 'DELETE', headers: bearer(token), parse: () => undefined });
