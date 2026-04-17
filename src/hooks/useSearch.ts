import { useMemo } from 'react';
import { DEPARTEMENTS } from '../data/departements';
import { REGIONS } from '../data/regions';
import { REGION_MAP } from '../data/maps';
import FLEUVES_DEPTS from '../data/fleuvesDepts.json';

export interface SearchResult {
  code: string;
  nom: string;
  type: 'departement' | 'region' | 'prefecture' | 'fleuve';
  subtitle: string;
}

const FLEUVES_DEPTS_TYPED = FLEUVES_DEPTS as Record<string, { depts: string[]; scalerank: number }>;

export function useSearch(query: string): SearchResult[] {
  return useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 1) return [];

    const results: SearchResult[] = [];

    for (const d of DEPARTEMENTS) {
      if (d.nom.toLowerCase().includes(q) || d.code.toLowerCase().startsWith(q)) {
        const regionNom = REGION_MAP.get(d.regionCode)?.nom ?? '';
        results.push({ code: d.code, nom: d.nom, type: 'departement', subtitle: regionNom });
      }
      if (d.prefecture.toLowerCase().includes(q)) {
        const regionNom = REGION_MAP.get(d.regionCode)?.nom ?? '';
        results.push({ code: d.code, nom: d.prefecture, type: 'prefecture', subtitle: `${d.nom} · ${regionNom}` });
      }
    }

    for (const r of REGIONS) {
      if (r.nom.toLowerCase().includes(q) || r.code.toLowerCase().startsWith(q)) {
        results.push({ code: r.code, nom: r.nom, type: 'region', subtitle: 'Région' });
      }
    }

    for (const name of Object.keys(FLEUVES_DEPTS_TYPED)) {
      if (name.toLowerCase().includes(q)) {
        results.push({ code: name, nom: name, type: 'fleuve', subtitle: "Cours d'eau" });
      }
    }

    return results.slice(0, 8);
  }, [query]);
}
