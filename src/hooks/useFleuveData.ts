import { useState, useEffect, useRef } from 'react';
import type { FeatureCollection } from 'geojson';

function assertFeatureCollection(data: unknown, name: string): FeatureCollection {
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
  return data as FeatureCollection;
}

interface FleuveDataState {
  fleuves: FeatureCollection | null;
  loading: boolean;
  error: Error | null;
}

const cache: {
  fleuves: FeatureCollection | null;
  promise: Promise<void> | null;
} = {
  fleuves: null,
  promise: null,
};

const LOAD_TIMEOUT_MS = 15_000;

export function useFleuveData(enabled: boolean): FleuveDataState {
  const [state, setState] = useState<FleuveDataState>({
    fleuves: cache.fleuves,
    loading: enabled && cache.fleuves === null,
    error: null,
  });

  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    if (!enabled) return;

    if (cache.fleuves !== null) {
      setState({ fleuves: cache.fleuves, loading: false, error: null });
      return;
    }

    setState(prev => ({ ...prev, loading: true }));

    if (cache.promise === null) {
      const loadPromise = import('../geo/fleuves.json').then((data) => {
        cache.fleuves = assertFeatureCollection(data.default, 'fleuves');
      });

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Délai de chargement dépassé')), LOAD_TIMEOUT_MS),
      );

      cache.promise = Promise.race([loadPromise, timeoutPromise]).catch((err: unknown) => {
        cache.promise = null;
        cache.fleuves = null;
        throw err;
      });
    }

    cache.promise
      .then(() => {
        if (mountedRef.current) {
          setState({ fleuves: cache.fleuves, loading: false, error: null });
        }
      })
      .catch((err: unknown) => {
        if (mountedRef.current) {
          setState({ fleuves: null, loading: false, error: err instanceof Error ? err : new Error(String(err)) });
        }
      });
  }, [enabled]);

  return state;
}
