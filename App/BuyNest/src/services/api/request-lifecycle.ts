import { ApiError } from './api-error';

/** Covers both fetching headers and reading the response body. */
export async function withRequestTimeout<T>(
  operation: (signal: AbortSignal) => Promise<T>,
  callerSignal: AbortSignal | undefined,
  timeoutMs: number
): Promise<T> {
  // An already-cancelled screen must not start another network request.
  if (callerSignal?.aborted) throw new ApiError('NETWORK_ERROR');

  const controller = new AbortController();
  let didTimeOut = false;
  const forwardAbort = () => controller.abort();
  callerSignal?.addEventListener('abort', forwardAbort, { once: true });
  const timeout = setTimeout(() => {
    didTimeOut = true;
    controller.abort();
  }, timeoutMs);

  try {
    const result = await operation(controller.signal);
    // A response-body parser may catch its own abort rejection. Cancellation
    // still has to be reported as a connection outcome, not malformed JSON.
    if (controller.signal.aborted) throw new ApiError('NETWORK_ERROR');
    return result;
  } catch (error) {
    if (didTimeOut) throw new ApiError('TIMEOUT');
    if (controller.signal.aborted) throw new ApiError('NETWORK_ERROR');
    throw error instanceof ApiError ? error : new ApiError('NETWORK_ERROR');
  } finally {
    clearTimeout(timeout);
    callerSignal?.removeEventListener('abort', forwardAbort);
  }
}
