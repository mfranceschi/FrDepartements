import { useState, useMemo, useCallback } from 'react';
import { useGeoData } from '../hooks/useGeoData';
import CarteFrance from '../components/carte/CarteFrance';
import { FLEUVES_DEPTS } from '../data/fleuvesDepts';
import { useSearch } from '../hooks/useSearch';
import type { SearchResult } from '../hooks/useSearch';
import SearchBar from '../components/carte/SearchBar';
import InfoPanel from '../components/carte/InfoPanel';
import type { Feature } from 'geojson';

interface SelectedTerritory {
  code: string;
  type: 'departement' | 'region' | 'prefecture';
}

export default function CartePage() {
  const { departements, regions, loading } = useGeoData();
  const [selectedTerritory, setSelectedTerritory] = useState<SelectedTerritory | null>(null);
  const [selectedFleuve, setSelectedFleuve] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [focusTarget, setFocusTarget] = useState<{ code: string; type: 'departement' | 'region'; seq: number; scale?: number } | undefined>(undefined);
  const [showResults, setShowResults] = useState(false);
  const [showPrefectures, setShowPrefectures] = useState(false);
  const [showFleuves, setShowFleuves] = useState(false);

  const searchResults = useSearch(searchQuery);

  const traversedDeptCodes = useMemo(
    () => selectedFleuve ? (FLEUVES_DEPTS[selectedFleuve]?.depts ?? []) : [],
    [selectedFleuve],
  );

  const features = useMemo(
    () => departements && regions
      ? { departements: departements.features as Feature[], regions: regions.features as Feature[] }
      : null,
    [departements, regions],
  );

  const handleFeatureClick = useCallback((code: string, type: 'departement' | 'region') => {
    setSelectedTerritory((prev) =>
      prev?.code === code && prev.type === type ? null : { code, type },
    );
    setSearchQuery('');
    setShowResults(false);
  }, []);

  const handlePrefectureClick = useCallback((deptCode: string) => {
    setSelectedTerritory((prev) =>
      prev?.code === deptCode && prev.type === 'prefecture' ? null : { code: deptCode, type: 'prefecture' },
    );
    setSearchQuery('');
    setShowResults(false);
  }, []);

  const handleFleuveClick = useCallback((name: string) => {
    setSelectedFleuve((prev) => (prev === name ? null : name));
    setSearchQuery('');
    setShowResults(false);
  }, []);

  const handleSearchSelect = useCallback((result: SearchResult) => {
    if (result.type === 'fleuve') {
      setSelectedFleuve(result.code);
      setShowFleuves(true);
      const depts = FLEUVES_DEPTS[result.code]?.depts;
      if (depts && depts.length > 0) {
        const midCode = depts[Math.floor(depts.length / 2)];
        setFocusTarget(prev => ({ code: midCode, type: 'departement', seq: (prev?.seq ?? 0) + 1, scale: 2 }));
      }
    } else {
      setSelectedTerritory({ code: result.code, type: result.type });
      const focusType = result.type === 'prefecture' ? 'departement' : result.type;
      setFocusTarget(prev => ({ code: result.code, type: focusType, seq: (prev?.seq ?? 0) + 1 }));
      if (result.type === 'prefecture') setShowPrefectures(true);
    }
    setSearchQuery('');
    setShowResults(false);
  }, []);

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

  if (!departements || !regions || !features) {
    return (
      <main className="flex-1 flex items-center justify-center">
        <p className="text-red-500 text-sm">Erreur lors du chargement des données.</p>
      </main>
    );
  }

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
          focusScale={focusTarget?.scale}
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
