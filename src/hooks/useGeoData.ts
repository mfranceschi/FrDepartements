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

interface GeoDataState {
  departements: FeatureCollection | null;
  regions: FeatureCollection | null;
  loading: boolean;
  error: Error | null;
}

// Module-level cache so data is loaded only once across all hook instances
const cache: {
  departements: FeatureCollection | null;
  regions: FeatureCollection | null;
  promise: Promise<void> | null;
} = {
  departements: null,
  regions: null,
  promise: null,
};

const LOAD_TIMEOUT_MS = 15_000;

export function useGeoData(): GeoDataState {
  const [state, setState] = useState<GeoDataState>({
    departements: cache.departements,
    regions: cache.regions,
    loading: cache.departements === null || cache.regions === null,
    error: null,
  });

  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    if (cache.departements !== null && cache.regions !== null) {
      setState({ departements: cache.departements, regions: cache.regions, loading: false, error: null });
      return;
    }

    if (cache.promise === null) {
      const loadPromise = Promise.all([
        import('../geo/departements.json'),
        import('../geo/regions.json'),
      ]).then(([depts, regs]) => {
        cache.departements = assertFeatureCollection(depts.default, 'departements');
        cache.regions = assertFeatureCollection(regs.default, 'regions');
      });

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Délai de chargement dépassé')), LOAD_TIMEOUT_MS),
      );

      cache.promise = Promise.race([loadPromise, timeoutPromise]).catch((err: unknown) => {
        cache.promise = null;
        cache.departements = null;
        cache.regions = null;
        throw err;
      });
    }

    cache.promise.then(() => {
      if (mountedRef.current) {
        setState({
          departements: cache.departements,
          regions: cache.regions,
          loading: false,
          error: null,
        });
      }
    }).catch((err: unknown) => {
      if (mountedRef.current) {
        setState({ departements: null, regions: null, loading: false, error: err instanceof Error ? err : new Error(String(err)) });
      }
    });

    return () => {
      mountedRef.current = false;
    };
  }, []);

  return state;
}
