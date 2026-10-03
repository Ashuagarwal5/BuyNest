import { useEffect, useEffectEvent, useState } from 'react';

import { type ApiError, toApiError } from '@/services/api/api-error';

type Outcome<T> = { ok: true; data: T } | { ok: false; error: ApiError };

type Settled<T> = {
  key: string;
  attempt: number;
  outcome: Outcome<T>;
};

export type ApiData<T> =
  | { status: 'loading'; data: undefined; error: undefined; isRefreshing: false; reload: () => void }
  | { status: 'error'; data: undefined; error: ApiError; isRefreshing: false; reload: () => void }
  | { status: 'success'; data: T; error: undefined; isRefreshing: boolean; reload: () => void };

/**
 * Loads server data for a screen and exposes exactly one of loading / error / success.
 *
 * `key` identifies what is being loaded: when it changes, the old data is dropped and the
 * new data loads. `reload()` fetches again; data already on screen stays visible while it
 * does (`isRefreshing`), which is what pull-to-refresh needs. Requests are aborted when
 * the screen goes away or the key changes, so a slow response can never overwrite a newer one.
 */
export function useApiData<T>(key: string, load: (signal: AbortSignal) => Promise<T>): ApiData<T> {
  const [attempt, setAttempt] = useState(0);
  const [settled, setSettled] = useState<Settled<T> | null>(null);

  // The loader is recreated every render; only `key` and `attempt` should restart a load.
  const runLoad = useEffectEvent(load);

  useEffect(() => {
    const controller = new AbortController();

    runLoad(controller.signal).then(
      (data) => {
        if (!controller.signal.aborted) {
          setSettled({ key, attempt, outcome: { ok: true, data } });
        }
      },
      (error: unknown) => {
        if (!controller.signal.aborted) {
          setSettled({ key, attempt, outcome: { ok: false, error: toApiError(error) } });
        }
      }
    );

    return () => controller.abort();
  }, [key, attempt]);

  const reload = () => setAttempt((current) => current + 1);

  const current = settled?.key === key ? settled : null;
  const isPending = current?.attempt !== attempt;

  if (current?.outcome.ok) {
    return {
      status: 'success',
      data: current.outcome.data,
      error: undefined,
      isRefreshing: isPending,
      reload,
    };
  }
  if (current && !current.outcome.ok && !isPending) {
    return {
      status: 'error',
      data: undefined,
      error: current.outcome.error,
      isRefreshing: false,
      reload,
    };
  }
  return { status: 'loading', data: undefined, error: undefined, isRefreshing: false, reload };
}
