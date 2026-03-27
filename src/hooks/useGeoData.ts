import { useState, useEffect, useRef } from 'react';
import type { Feature, FeatureCollection } from 'geojson';

interface GeoDataState {
  departements: FeatureCollection | null;
  regions: FeatureCollection | null;
  loading: boolean;
}

const DROM_REGION_MAP: Record<string, { code: string; nom: string }> = {
  '971': { code: '01', nom: 'Guadeloupe' },
  '972': { code: '02', nom: 'Martinique' },
  '973': { code: '03', nom: 'Guyane' },
  '974': { code: '04', nom: 'La Réunion' },
  '976': { code: '06', nom: 'Mayotte' },
};

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
        import('../geo/drom/dept-971.json'),
        import('../geo/drom/dept-972.json'),
        import('../geo/drom/dept-973.json'),
        import('../geo/drom/dept-974.json'),
        import('../geo/drom/dept-976.json'),
      ]).then(([depts, regs, d971, d972, d973, d974, d976]) => {
        const deptsGeo = depts.default as unknown as FeatureCollection;
        const regsGeo = regs.default as unknown as FeatureCollection;
        const dromFeatures = [d971, d972, d973, d974, d976].map(
          (m) => m.default as unknown as Feature,
        );

        for (const feature of dromFeatures) {
          const deptCode = feature.properties?.code as string;
          deptsGeo.features.push(feature);
          const region = DROM_REGION_MAP[deptCode];
          if (region) {
            regsGeo.features.push({
              type: 'Feature',
              properties: { code: region.code, nom: region.nom },
              geometry: feature.geometry,
            });
          }
        }

        cache.departements = deptsGeo;
        cache.regions = regsGeo;
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
