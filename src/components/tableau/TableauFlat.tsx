import { useState, useMemo } from 'react';
import { DEPARTEMENTS } from '../../data/departements';
import { REGIONS } from '../../data/regions';

type SortKey = 'code' | 'nom' | 'region';
type SortDir = 'asc' | 'desc';

const regionMap = new Map(REGIONS.map((r) => [r.code, r.nom]));

// 2A et 2B remplacent le département 20 : les trier en position 20.x
function codeToSortKey(code: string): number {
  if (code === '2A') return 20.1;
  if (code === '2B') return 20.2;
  return parseInt(code, 10);
}

export default function TableauFlat() {
  const [filter, setFilter] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('code');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const handleHeaderClick = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    return DEPARTEMENTS.filter(
      (d) =>
        d.code.toLowerCase().includes(q) ||
        d.nom.toLowerCase().includes(q) ||
        (regionMap.get(d.regionCode) ?? '').toLowerCase().includes(q),
    );
  }, [filter]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'code') {
        cmp = codeToSortKey(a.code) - codeToSortKey(b.code);
      } else if (sortKey === 'nom') {
        cmp = a.nom.localeCompare(b.nom, 'fr');
      } else {
        const ra = regionMap.get(a.regionCode) ?? '';
        const rb = regionMap.get(b.regionCode) ?? '';
        cmp = ra.localeCompare(rb, 'fr');
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [filtered, sortKey, sortDir]);

  const indicator = (key: SortKey) => {
    if (sortKey !== key) return <span className="ml-1 text-gray-300">↕</span>;
    return (
      <span className="ml-1 text-blue-600">
        {sortDir === 'asc' ? '↑' : '↓'}
      </span>
    );
  };

  const thClass =
    'px-4 py-3 text-left text-sm font-semibold text-gray-700 select-none cursor-pointer whitespace-nowrap hover:bg-gray-100 transition-colors';

  return (
    <div className="space-y-4">
      {/* Filtre */}
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filtrer par numéro, nom ou région…"
          className="w-full max-w-sm border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        {filter && (
          <span className="text-sm text-gray-500">
            {sorted.length} résultat{sorted.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Tableau */}
      <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className={thClass} onClick={() => handleHeaderClick('code')}>
                Numéro {indicator('code')}
              </th>
              <th className={thClass} onClick={() => handleHeaderClick('nom')}>
                Nom {indicator('nom')}
              </th>
              <th
                className={thClass}
                onClick={() => handleHeaderClick('region')}
              >
                Région {indicator('region')}
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 whitespace-nowrap">
                Outre-mer
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {sorted.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-8 text-center text-gray-400 italic"
                >
                  Aucun département ne correspond à votre recherche.
                </td>
              </tr>
            ) : (
              sorted.map((dept) => (
                <tr
                  key={dept.code}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-4 py-2.5 font-mono font-medium text-gray-800">
                    {dept.code}
                  </td>
                  <td className="px-4 py-2.5 text-gray-800">{dept.nom}</td>
                  <td className="px-4 py-2.5 text-gray-600">
                    {regionMap.get(dept.regionCode) ?? dept.regionCode}
                  </td>
                  <td className="px-4 py-2.5">
                    {dept.outresMer && (
                      <span className="inline-block bg-blue-100 text-blue-700 text-xs font-medium px-2 py-0.5 rounded-full">
                        DOM
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-gray-400 text-right">
        {sorted.length} / {DEPARTEMENTS.length} départements
      </p>
    </div>
  );
}
