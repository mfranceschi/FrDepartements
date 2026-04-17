import type { FeatureCollection } from 'geojson';
import { useAsyncResource, assertFeatureCollection } from './useAsyncResource';

interface GeoData {
  departements: FeatureCollection;
  regions: FeatureCollection;
}

interface GeoDataState {
  departements: FeatureCollection | null;
  regions: FeatureCollection | null;
  loading: boolean;
  error: Error | null;
}

const cache: { data: GeoData | null; promise: Promise<void> | null } = {
  data: null,
  promise: null,
};

async function loadGeoData(): Promise<GeoData> {
  const [depts, regs] = await Promise.all([
    import('../geo/departements.json'),
    import('../geo/regions.json'),
  ]);
  return {
    departements: assertFeatureCollection(depts.default, 'departements') as FeatureCollection,
    regions: assertFeatureCollection(regs.default, 'regions') as FeatureCollection,
  };
}

export function useGeoData(): GeoDataState {
  const { data, loading, error } = useAsyncResource(cache, loadGeoData);
  return {
    departements: data?.departements ?? null,
    regions: data?.regions ?? null,
    loading,
    error,
  };
}
