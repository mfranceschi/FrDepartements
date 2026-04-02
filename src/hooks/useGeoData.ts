import { useState, useEffect, useRef } from 'react';
import type { FeatureCollection } from 'geojson';

interface GeoDataState {
  departements: FeatureCollection | null;
  regions: FeatureCollection | null;
  loading: boolean;
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

export function useGeoData(): GeoDataState {
  const [state, setState] = useState<GeoDataState>({
    departements: cache.departements,
    regions: cache.regions,
    loading: cache.departements === null || cache.regions === null,
  });

  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    if (cache.departements !== null && cache.regions !== null) {
      setState({ departements: cache.departements, regions: cache.regions, loading: false });
      return;
    }

    if (cache.promise === null) {
      cache.promise = Promise.all([
        import('../geo/departements.json'),
        import('../geo/regions.json'),
      ]).then(([depts, regs]) => {
        cache.departements = depts.default as unknown as FeatureCollection;
        cache.regions = regs.default as unknown as FeatureCollection;
      });
    }

    cache.promise.then(() => {
      if (mountedRef.current) {
        setState({
          departements: cache.departements,
          regions: cache.regions,
          loading: false,
        });
      }
    });

    return () => {
      mountedRef.current = false;
    };
  }, []);

  return state;
}
