import { useState, useMemo } from 'react';
import { useGeoData } from '../hooks/useGeoData';
import CarteFrance from '../components/carte/CarteFrance';
import { DEPARTEMENTS } from '../data/departements';
import { REGIONS } from '../data/regions';
import FLEUVES_DEPTS from '../data/fleuvesDepts.json';
import type { Feature } from 'geojson';

const FLEUVE_SCALERANK_THRESHOLD = 11;
const FLEUVES_DEPTS_TYPED = FLEUVES_DEPTS as Record<string, { depts: string[]; scalerank: number }>;

interface SelectedTerritory {
  code: string;
  type: 'departement' | 'region' | 'prefecture';
}

function buildDeptMap(): Map<string, { nom: string; regionCode: string; prefecture: string; isPrefectureRegionale?: boolean }> {
  const map = new Map<string, { nom: string; regionCode: string; prefecture: string; isPrefectureRegionale?: boolean }>();
  for (const d of DEPARTEMENTS) {
    map.set(d.code, { nom: d.nom, regionCode: d.regionCode, prefecture: d.prefecture, isPrefectureRegionale: d.isPrefectureRegionale });
  }
  return map;
}

function buildRegionMap(): Map<string, { nom: string; prefectureRegionale: string }> {
  const map = new Map<string, { nom: string; prefectureRegionale: string }>();
  for (const r of REGIONS) {
    map.set(r.code, { nom: r.nom, prefectureRegionale: r.prefectureRegionale });
  }
  return map;
}

const DEPT_MAP = buildDeptMap();
const REGION_MAP = buildRegionMap();

const DROPDOWN_BLUR_DELAY_MS = 150;

// ---------------------------------------------------------------------------
// Panneau vide
// ---------------------------------------------------------------------------

function EmptyPanel() {
  return (
    <div className="flex flex-col items-center gap-3 text-center py-6 px-2">
      <svg
        className="w-10 h-10 text-gray-300"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
      </svg>
      <p className="text-sm text-gray-500 leading-relaxed">
        Cliquez sur un département, une région, une préfecture ou un cours d'eau pour afficher ses informations.
      </p>
      <p className="text-xs text-gray-400 leading-relaxed">
        Activez les couches <span className="font-semibold text-gray-500">Préfectures</span> ou{' '}
        <span className="font-semibold text-gray-500">Cours d'eau</span> dans la barre d'outils pour les rendre cliquables,
        ou lancez un <span className="font-semibold text-blue-400">Quiz</span> pour vous entraîner.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Panneau d'informations — territoire sélectionné
// ---------------------------------------------------------------------------

function TerritoryPanel({ selected }: { selected: SelectedTerritory }) {
  if (selected.type === 'prefecture') {
    const dept = DEPT_MAP.get(selected.code);
    const regionInfo = dept?.regionCode ? REGION_MAP.get(dept.regionCode) : null;
    const isRegionale = dept?.isPrefectureRegionale;
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="inline-block w-3 h-3 rounded-full bg-amber-200 border border-amber-500" />
          <span className="text-xs uppercase tracking-wide text-amber-700 font-semibold">
            Préfecture{isRegionale ? ' régionale' : ''}
          </span>
        </div>
        <h2 className="text-xl font-bold text-gray-800">{dept?.prefecture ?? selected.code}</h2>
        {dept && (
          <p className="text-sm text-gray-500">
            Chef-lieu du : <span className="font-semibold text-blue-700">{dept.nom} ({selected.code})</span>
          </p>
        )}
        {regionInfo && (
          <p className="text-sm text-gray-500">
            Région : <span className="font-semibold text-green-700">{regionInfo.nom}</span>
          </p>
        )}
      </div>
    );
  }

  if (selected.type === 'region') {
    const region = REGION_MAP.get(selected.code);
    const nom = region?.nom ?? selected.code;
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="inline-block w-3 h-3 rounded-sm bg-green-200 border border-green-500" />
          <span className="text-xs uppercase tracking-wide text-green-700 font-semibold">Région</span>
        </div>
        <h2 className="text-xl font-bold text-gray-800">{nom}</h2>
        <p className="text-sm text-gray-500">
          Code : <span className="font-mono font-semibold text-gray-700">{selected.code}</span>
        </p>
        {region?.prefectureRegionale && (
          <p className="text-sm text-gray-500">
            Préfecture régionale : <span className="font-semibold text-rose-700">{region.prefectureRegionale}</span>
          </p>
        )}
      </div>
    );
  }

  const dept = DEPT_MAP.get(selected.code);
  const nom = dept?.nom ?? selected.code;
  const regionInfo = dept?.regionCode ? REGION_MAP.get(dept.regionCode) : null;
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="inline-block w-3 h-3 rounded-sm bg-blue-200 border border-blue-500" />
        <span className="text-xs uppercase tracking-wide text-blue-700 font-semibold">Département</span>
      </div>
      <h2 className="text-xl font-bold text-gray-800">{nom}</h2>
      <p className="text-sm text-gray-500">
        Code : <span className="font-mono font-semibold text-gray-700">{selected.code}</span>
      </p>
      {regionInfo && (
        <p className="text-sm text-gray-500">
          Région : <span className="font-semibold text-green-700">{regionInfo.nom}</span>
        </p>
      )}
      {dept?.prefecture && (
        <p className="text-sm text-gray-500">
          Préfecture : <span className="font-semibold text-rose-700">{dept.prefecture}</span>
        </p>
      )}
    </div>
  );
}

function FleuvePanel({ name }: { name: string }) {
  const entry = FLEUVES_DEPTS_TYPED[name];
  const showDepts = entry && entry.scalerank <= FLEUVE_SCALERANK_THRESHOLD;
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="inline-block w-3 h-3 rounded-sm bg-blue-200 border border-blue-700" />
        <span className="text-xs uppercase tracking-wide text-blue-800 font-semibold">Cours d'eau</span>
      </div>
      <h2 className="text-xl font-bold text-gray-800">{name}</h2>
      {showDepts && (
        <div className="space-y-1">
          <p className="text-sm text-gray-500">Départements traversés :</p>
          <ul className="space-y-0.5">
            {entry.depts.map((code) => {
              const dept = DEPT_MAP.get(code);
              return (
                <li key={code} className="text-sm flex items-center gap-1.5">
                  <span className="font-mono text-xs text-gray-400 w-5 shrink-0">{code}</span>
                  <span className="text-gray-700">{dept?.nom ?? code}</span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

function InfoPanel({
  selectedTerritory,
  selectedFleuve,
}: {
  selectedTerritory: SelectedTerritory | null;
  selectedFleuve: string | null;
}) {
  if (!selectedTerritory && !selectedFleuve) return <EmptyPanel />;

  return (
    <div className="space-y-4">
      {selectedFleuve && <FleuvePanel name={selectedFleuve} />}
      {selectedFleuve && selectedTerritory && (
        <hr className="border-gray-200" />
      )}
      {selectedTerritory && <TerritoryPanel selected={selectedTerritory} />}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Recherche
// ---------------------------------------------------------------------------

interface SearchResult {
  code: string;
  nom: string;
  type: 'departement' | 'region' | 'prefecture' | 'fleuve';
  subtitle: string;
}

function useSearch(query: string): SearchResult[] {
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
        results.push({ code: name, nom: name, type: 'fleuve', subtitle: 'Cours d\'eau' });
      }
    }

    return results.slice(0, 8);
  }, [query]);
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function CartePage() {
  const { departements, regions, loading } = useGeoData();
  const [selectedTerritory, setSelectedTerritory] = useState<SelectedTerritory | null>(null);
  const [selectedFleuve, setSelectedFleuve] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [focusCode, setFocusCode] = useState<string | undefined>(undefined);
  const [focusType, setFocusType] = useState<'departement' | 'region' | undefined>(undefined);
  const [showResults, setShowResults] = useState(false);
  const [showPrefectures, setShowPrefectures] = useState(false);
  const [showFleuves, setShowFleuves] = useState(false);

  const searchResults = useSearch(searchQuery);

  const traversedDeptCodes = useMemo(
    () => selectedFleuve ? (FLEUVES_DEPTS_TYPED[selectedFleuve]?.depts ?? []) : [],
    [selectedFleuve],
  );

  const handleFeatureClick = (code: string, type: 'departement' | 'region') => {
    setSelectedTerritory((prev) =>
      prev?.code === code && prev.type === type ? null : { code, type },
    );
    setSearchQuery('');
    setShowResults(false);
  };

  const handlePrefectureClick = (deptCode: string) => {
    setSelectedTerritory((prev) =>
      prev?.code === deptCode && prev.type === 'prefecture' ? null : { code: deptCode, type: 'prefecture' },
    );
    setSearchQuery('');
    setShowResults(false);
  };

  const handleFleuveClick = (name: string) => {
    setSelectedFleuve((prev) => (prev === name ? null : name));
    setSearchQuery('');
    setShowResults(false);
  };

  const handleSearchSelect = (result: SearchResult) => {
    if (result.type === 'fleuve') {
      setSelectedFleuve(result.code);
      setShowFleuves(true);
    } else {
      setSelectedTerritory({ code: result.code, type: result.type });
      setFocusCode(result.code);
      setFocusType(result.type === 'prefecture' ? 'departement' : result.type);
      if (result.type === 'prefecture') setShowPrefectures(true);
    }
    setSearchQuery('');
    setShowResults(false);
  };

  if (loading) {
    return (
      <main className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-gray-500">
          <svg className="animate-spin w-8 h-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
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

  const searchBar = (
    <div className="relative">
      <svg
        className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.197 5.197a7.5 7.5 0 0 0 10.606 10.606Z" />
      </svg>
      <input
        type="text"
        placeholder="Rechercher un territoire, une préfecture…"
        value={searchQuery}
        onChange={(e) => { setSearchQuery(e.target.value); setShowResults(true); }}
        onFocus={() => setShowResults(true)}
        onBlur={() => setTimeout(() => setShowResults(false), DROPDOWN_BLUR_DELAY_MS)}
        className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
      />
      {searchQuery && (
        <button
          type="button"
          onClick={() => { setSearchQuery(''); setShowResults(false); }}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          ✕
        </button>
      )}
    </div>
  );

  const searchDropdown = showResults && searchResults.length > 0 && (
    <ul className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-20 overflow-hidden">
      {searchResults.map((r) => (
        <li key={`${r.type}-${r.code}`}>
          <button
            type="button"
            onMouseDown={() => handleSearchSelect(r)}
            className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 flex items-center gap-2"
          >
            <span
              className={`inline-block w-2.5 h-2.5 shrink-0 border ${
                r.type === 'region'
                  ? 'rounded-sm bg-green-100 border-green-500'
                  : r.type === 'prefecture'
                  ? 'rounded-full bg-amber-100 border-amber-500'
                  : r.type === 'fleuve'
                  ? 'rounded-sm bg-blue-100 border-blue-700'
                  : 'rounded-sm bg-blue-100 border-blue-500'
              }`}
            />
            <span className="font-medium text-gray-800 truncate">{r.nom}</span>
            <span className="text-gray-400 text-xs shrink-0">{r.type === 'fleuve' ? 'cours d\'eau' : r.code}</span>
          </button>
        </li>
      ))}
    </ul>
  );

  return (
    <main className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden" style={{ height: '100%' }}>
      {/* Barre de recherche mobile */}
      <div className="lg:hidden shrink-0 px-3 py-2 border-b border-gray-200 bg-white relative">
        {searchBar}
        {searchDropdown}
      </div>

      {/* Map */}
      <div className="flex-1 min-w-0 min-h-0 p-2 overflow-hidden" style={{ minHeight: '200px' }}>
        <CarteFrance
          features={features}
          onFeatureClick={handleFeatureClick}
          onPrefectureClick={handlePrefectureClick}
          highlightCode={selectedTerritory?.type !== 'prefecture' ? selectedTerritory?.code : undefined}
          highlightType={selectedTerritory?.type !== 'prefecture' ? selectedTerritory?.type : undefined}
          selectedPrefectureCode={selectedTerritory?.type === 'prefecture' ? selectedTerritory.code : undefined}
          onFleuveClick={handleFleuveClick}
          selectedFleuveName={selectedFleuve ?? undefined}
          traversedDeptCodes={traversedDeptCodes}
          focusCode={focusCode}
          focusType={focusType}
          showPrefectures={showPrefectures}
          onShowPrefecturesChange={setShowPrefectures}
          showFleuves={showFleuves}
          onShowFleuvesChange={setShowFleuves}
        />
      </div>

      {/* Info sidebar */}
      <aside className="lg:w-64 xl:w-72 border-t lg:border-t-0 lg:border-l border-gray-200 bg-gray-50 flex flex-col shrink-0 overflow-y-auto max-h-[40vh] lg:max-h-none">
        <div className="hidden lg:block p-3 border-b border-gray-200 relative">
          {searchBar}
          {searchDropdown}
        </div>
        <div className="p-4 flex-1">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Informations
          </h3>
          <InfoPanel selectedTerritory={selectedTerritory} selectedFleuve={selectedFleuve} />
        </div>
      </aside>
    </main>
  );
}
