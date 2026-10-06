import { ApiError, toApiErrorCode } from '@/services/api/api-error';
import {
  API_BASE_URL,
  API_CONFIG_ERROR,
  API_V1_URL,
  REQUEST_TIMEOUT_MS,
} from '@/services/api/config';
import { asObject } from '@/services/api/parse';

type RequestOptions<T> = {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  /** Sent as JSON. */
  body?: unknown;
  headers?: Record<string, string>;
  /** Lets a screen cancel the request when it goes away. */
  signal?: AbortSignal;
  /** Overrides the default timeout. */
  timeoutMs?: number;
  /** Validates and converts the `data` field of a successful response. */
  parse: (data: unknown) => T;
  /** Set for endpoints outside /api/v1, such as /health. */
  unversioned?: boolean;
};

let hasReportedConfigError = false;

/**
 * The only function that talks to the network. It resolves with parsed data or rejects
 * with an ApiError; it never resolves with an error shape and never throws anything else.
 *
 * Nothing about a request or response is logged: they carry addresses, phone numbers and
 * tracking tokens. The one message below is about the app's own configuration.
 */
export async function apiRequest<T>(path: string, options: RequestOptions<T>): Promise<T> {
  if (API_CONFIG_ERROR) {
    if (!hasReportedConfigError) {
      hasReportedConfigError = true;
      console.error(`[api] ${API_CONFIG_ERROR}`);
    }
    throw new ApiError('CONFIGURATION_ERROR');
  }

  const controller = new AbortController();
  let didTimeOut = false;
  const timeout = setTimeout(() => {
    didTimeOut = true;
    controller.abort();
  }, options.timeoutMs ?? REQUEST_TIMEOUT_MS);

  const forwardAbort = () => controller.abort();
  options.signal?.addEventListener('abort', forwardAbort);

  let response: Response;
  let payload: unknown;
  try {
    response = await fetch(`${options.unversioned ? API_BASE_URL : API_V1_URL}${path}`, {
      method: options.method ?? 'GET',
      headers: {
        Accept: 'application/json',
        ...(options.body === undefined ? {} : { 'Content-Type': 'application/json' }),
        ...options.headers,
      },
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: controller.signal,
    });
    // Read inside the try: the timeout also has to cover a body that never finishes.
    payload = await response.json().catch(() => undefined);
  } catch {
    throw new ApiError(didTimeOut ? 'TIMEOUT' : 'NETWORK_ERROR');
  } finally {
    clearTimeout(timeout);
    options.signal?.removeEventListener('abort', forwardAbort);
  }

  if (!response.ok) {
    throw toErrorFromResponse(response.status, payload);
  }

  const envelope = asObject(payload);
  if (envelope.success !== true) {
    throw new ApiError('MALFORMED_RESPONSE', { status: response.status });
  }
  return options.parse(envelope.data);
}

function toErrorFromResponse(status: number, payload: unknown): ApiError {
  if (typeof payload === 'object' && payload !== null && 'error' in payload) {
    const error = (payload as { error: unknown }).error;
    if (typeof error === 'object' && error !== null) {
      const { code, message, details } = error as Record<string, unknown>;
      return new ApiError(toApiErrorCode(code), {
        status,
        serverMessage: typeof message === 'string' ? message : undefined,
        details,
      });
    }
  }
  // Not our API's error format: a proxy page, a crashed server, a wrong base URL.
  return new ApiError(status >= 500 ? 'SERVER_ERROR' : 'UNKNOWN_ERROR', { status });
}
