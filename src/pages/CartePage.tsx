import { useState, useMemo } from 'react';
import { useGeoData } from '../hooks/useGeoData';
import CarteFrance from '../components/carte/CarteFrance';
import FLEUVES_DEPTS from '../data/fleuvesDepts.json';
import { DEPT_MAP, REGION_MAP } from '../data/maps';
import { useSearch } from '../hooks/useSearch';
import type { SearchResult } from '../hooks/useSearch';
import SearchBar from '../components/carte/SearchBar';
import type { Feature } from 'geojson';

const FLEUVE_SCALERANK_THRESHOLD = 11;
const FLEUVES_DEPTS_TYPED = FLEUVES_DEPTS as Record<string, { depts: string[]; scalerank: number }>;

interface SelectedTerritory {
  code: string;
  type: 'departement' | 'region' | 'prefecture';
}

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

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function CartePage() {
  const { departements, regions, loading } = useGeoData();
  const [selectedTerritory, setSelectedTerritory] = useState<SelectedTerritory | null>(null);
  const [selectedFleuve, setSelectedFleuve] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [focusTarget, setFocusTarget] = useState<{ code: string; type: 'departement' | 'region'; seq: number } | undefined>(undefined);
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
      const focusType = result.type === 'prefecture' ? 'departement' : result.type;
      setFocusTarget(prev => ({ code: result.code, type: focusType, seq: (prev?.seq ?? 0) + 1 }));
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

  const searchBarProps = {
    query: searchQuery,
    onQueryChange: setSearchQuery,
    results: searchResults,
    showResults,
    onShowResults: setShowResults,
    onSelect: handleSearchSelect,
  };

  return (
    <main className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden" style={{ height: '100%' }}>
      {/* Barre de recherche mobile */}
      <div className="lg:hidden shrink-0 px-3 py-2 border-b border-gray-200 bg-white">
        <SearchBar {...searchBarProps} />
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
          focusCode={focusTarget?.code}
          focusType={focusTarget?.type}
          focusSeq={focusTarget?.seq}
          showPrefectures={showPrefectures}
          onShowPrefecturesChange={setShowPrefectures}
          showFleuves={showFleuves}
          onShowFleuvesChange={setShowFleuves}
        />
      </div>

      {/* Info sidebar */}
      <aside className="lg:w-64 xl:w-72 border-t lg:border-t-0 lg:border-l border-gray-200 bg-gray-50 flex flex-col shrink-0 overflow-y-auto max-h-[40vh] lg:max-h-none">
        <div className="hidden lg:block p-3 border-b border-gray-200">
          <SearchBar {...searchBarProps} />
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
