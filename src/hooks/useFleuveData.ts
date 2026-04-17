import type { FeatureCollection } from 'geojson';
import { useAsyncResource, assertFeatureCollection } from './useAsyncResource';

interface FleuveDataState {
  fleuves: FeatureCollection | null;
  loading: boolean;
  error: Error | null;
}

const cache: { data: FeatureCollection | null; promise: Promise<void> | null } = {
  data: null,
  promise: null,
};

// URL servie depuis public/ — JSON.parse natif, bien plus rapide que
// l'évaluation d'un module JS Vite pour des fichiers de plusieurs centaines de Ko.
const FLEUVES_URL = '/fleuves.json';

async function loadFleuves(): Promise<FeatureCollection> {
  const res = await fetch(FLEUVES_URL);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return assertFeatureCollection(await res.json(), 'fleuves') as FeatureCollection;
}

export function useFleuveData(enabled: boolean): FleuveDataState {
  const { data, loading, error } = useAsyncResource(cache, loadFleuves, {
    enabled,
    timeoutMs: 60_000,
  });
  return { fleuves: data, loading, error };
}
