/**
 * The one place the app learns where the BuyNest API lives.
 *
 * Set EXPO_PUBLIC_API_BASE_URL in `.env.local` (see `.env.example`). On a physical phone
 * it must be the development computer's LAN address, because `localhost` on a phone is
 * the phone itself. Expo reads it only at startup: restart `expo start` after changing it.
 *
 * Rules:
 *  - Development builds fall back to http://localhost:4000 when it is not set. That only
 *    works for web on the same computer, which is the one case worth defaulting for.
 *  - Production builds NEVER fall back. A missing address is a configuration error that
 *    every request reports, instead of a release app quietly trying to reach "localhost".
 *  - Production builds also require https://. Android blocks plain http in release builds,
 *    and customer addresses and phone numbers should not travel unencrypted anyway.
 */

const DEVELOPMENT_FALLBACK = 'http://localhost:4000';

type ApiConfig = { baseUrl: string; error: null } | { baseUrl: null; error: string };

function resolveConfig(): ApiConfig {
  const configured = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();

  if (!configured) {
    return __DEV__
      ? { baseUrl: DEVELOPMENT_FALLBACK, error: null }
      : {
          baseUrl: null,
          error: 'EXPO_PUBLIC_API_BASE_URL is not set. Set it before building the app.',
        };
  }

  if (!__DEV__ && !configured.toLowerCase().startsWith('https://')) {
    return {
      baseUrl: null,
      error: 'EXPO_PUBLIC_API_BASE_URL must start with https:// in a production build.',
    };
  }

  return { baseUrl: configured.replace(/\/+$/, ''), error: null };
}

const config = resolveConfig();

/** Set when the app cannot know where the API is; requests fail with CONFIGURATION_ERROR. */
export const API_CONFIG_ERROR: string | null = config.error;

/** Origin only, e.g. "http://192.168.1.20:4000". Empty when the configuration is invalid. */
export const API_BASE_URL: string = config.baseUrl ?? '';

export const API_V1_URL = `${API_BASE_URL}/api/v1`;

export const REQUEST_TIMEOUT_MS = 15_000;

/**
 * Placing an order gets longer than a read: giving up early on it is costly, because
 * the server may still be finishing the order when the app gives up.
 */
export const ORDER_REQUEST_TIMEOUT_MS = 30_000;
