import { useState } from 'react';
import { useGeoData } from '../hooks/useGeoData';
import CarteFrance from '../components/carte/CarteFrance';
import { DEPARTEMENTS } from '../data/departements';
import { REGIONS } from '../data/regions';
import type { Feature } from 'geojson';

interface SelectedInfo {
  code: string;
  type: 'departement' | 'region';
}

function buildDeptMap(): Map<string, { nom: string; regionCode: string }> {
  const map = new Map<string, { nom: string; regionCode: string }>();
  for (const d of DEPARTEMENTS) {
    map.set(d.code, { nom: d.nom, regionCode: d.regionCode });
  }
  return map;
}

function buildRegionMap(): Map<string, string> {
  const map = new Map<string, string>();
  for (const r of REGIONS) {
    map.set(r.code, r.nom);
  }
  return map;
}

const DEPT_MAP = buildDeptMap();
const REGION_MAP = buildRegionMap();

function InfoPanel({ selected }: { selected: SelectedInfo | null }) {
  if (!selected) {
    return (
      <div className="text-sm text-gray-400 italic">
        Cliquez sur un territoire pour voir ses informations.
      </div>
    );
  }

  if (selected.type === 'region') {
    const nom = REGION_MAP.get(selected.code) ?? selected.code;
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="inline-block w-3 h-3 rounded-sm bg-green-200 border border-green-500" />
          <span className="text-xs uppercase tracking-wide text-green-700 font-semibold">Région</span>
        </div>
        <h2 className="text-xl font-bold text-gray-800">{nom}</h2>
        <p className="text-sm text-gray-500">Code : <span className="font-mono font-semibold text-gray-700">{selected.code}</span></p>
      </div>
    );
  }

  const dept = DEPT_MAP.get(selected.code);
  const nom = dept?.nom ?? selected.code;
  const regionNom = dept?.regionCode ? (REGION_MAP.get(dept.regionCode) ?? dept.regionCode) : null;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="inline-block w-3 h-3 rounded-sm bg-blue-200 border border-blue-500" />
        <span className="text-xs uppercase tracking-wide text-blue-700 font-semibold">Département</span>
      </div>
      <h2 className="text-xl font-bold text-gray-800">{nom}</h2>
      <p className="text-sm text-gray-500">Code : <span className="font-mono font-semibold text-gray-700">{selected.code}</span></p>
      {regionNom && (
        <p className="text-sm text-gray-500">
          Région :{' '}
          <span className="font-semibold text-green-700">{regionNom}</span>
        </p>
      )}
    </div>
  );
}

export default function CartePage() {
  const { departements, regions, loading } = useGeoData();
  const [selected, setSelected] = useState<SelectedInfo | null>(null);

  const handleFeatureClick = (code: string, type: 'departement' | 'region') => {
    setSelected((prev) =>
      prev?.code === code && prev.type === type ? null : { code, type },
    );
  };

  if (loading) {
    return (
      <main className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-gray-500">
          <svg
            className="animate-spin w-8 h-8 text-blue-500"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v8z"
            />
          </svg>
          <span className="text-sm">Chargement des données géographiques…</span>
        </div>
      </main>
    );
  }

  if (!departements || !regions) {
    return (
      <main className="flex-1 flex items-center justify-center">
        <p className="text-red-500 text-sm">Erreur lors du chargement des données.</p>
      </main>
    );
  }

  const features = {
    departements: departements.features as Feature[],
    regions: regions.features as Feature[],
  };

  return (
    <main className="flex-1 flex flex-col lg:flex-row gap-0 overflow-hidden">
      {/* Map */}
      <div className="flex-1 min-w-0 p-4">
        <CarteFrance
          features={features}
          onFeatureClick={handleFeatureClick}
          highlightCode={selected?.code}
        />
      </div>

      {/* Info sidebar */}
      <aside className="lg:w-64 xl:w-72 border-t lg:border-t-0 lg:border-l border-gray-200 bg-gray-50 p-4 shrink-0">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
          Informations
        </h3>
        <InfoPanel selected={selected} />
      </aside>
    </main>
  );
}
