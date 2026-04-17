import { useState, useEffect, useRef } from 'react';

interface AsyncResourceCache<T> {
  data: T | null;
  promise: Promise<void> | null;
}

interface AsyncResourceState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

interface UseAsyncResourceOptions {
  enabled?: boolean;
  timeoutMs?: number;
}

export function assertFeatureCollection(data: unknown, name: string) {
  if (
    data === null ||
    typeof data !== 'object' ||
    !('type' in data) ||
    (data as Record<string, unknown>).type !== 'FeatureCollection' ||
    !('features' in data) ||
    !Array.isArray((data as Record<string, unknown>).features)
  ) {
    throw new Error(`${name} is not a valid GeoJSON FeatureCollection`);
  }
  return data;
}

const DEFAULT_TIMEOUT_MS = 15_000;

export function useAsyncResource<T>(
  cache: AsyncResourceCache<T>,
  load: () => Promise<T>,
  options: UseAsyncResourceOptions = {},
): AsyncResourceState<T> {
  const { enabled = true, timeoutMs = DEFAULT_TIMEOUT_MS } = options;

  const [state, setState] = useState<AsyncResourceState<T>>({
    data: cache.data,
    loading: enabled && cache.data === null,
    error: null,
  });

  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    if (!enabled) return;

    if (cache.data !== null) {
      setState({ data: cache.data, loading: false, error: null });
      return;
    }

    setState(prev => ({ ...prev, loading: true }));

    if (cache.promise === null) {
      const loadPromise = load().then((result) => { cache.data = result; });
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Délai de chargement dépassé')), timeoutMs),
      );
      cache.promise = Promise.race([loadPromise, timeoutPromise]).catch((err: unknown) => {
        cache.promise = null;
        cache.data = null;
        throw err;
      });
    }

    cache.promise
      .then(() => {
        if (mountedRef.current) setState({ data: cache.data, loading: false, error: null });
      })
      .catch((err: unknown) => {
        if (mountedRef.current) setState({ data: null, loading: false, error: err instanceof Error ? err : new Error(String(err)) });
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  return state;
}
