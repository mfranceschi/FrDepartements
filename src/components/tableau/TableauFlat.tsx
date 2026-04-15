import { useState, useMemo } from 'react';
import { DEPARTEMENTS } from '../../data/departements';
import { REGIONS } from '../../data/regions';

type SortKey = 'code' | 'nom' | 'region' | 'prefecture';
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
        (regionMap.get(d.regionCode) ?? '').toLowerCase().includes(q) ||
        d.prefecture.toLowerCase().includes(q),
    );
  }, [filter]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'code') {
        cmp = codeToSortKey(a.code) - codeToSortKey(b.code);
      } else if (sortKey === 'nom') {
        cmp = a.nom.localeCompare(b.nom, 'fr');
      } else if (sortKey === 'region') {
        const ra = regionMap.get(a.regionCode) ?? '';
        const rb = regionMap.get(b.regionCode) ?? '';
        cmp = ra.localeCompare(rb, 'fr');
      } else {
        cmp = a.prefecture.localeCompare(b.prefecture, 'fr');
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [filtered, sortKey, sortDir]);

  const indicator = (key: SortKey) => {
    if (sortKey !== key) return <span className="ml-1" style={{ color: 'var(--text-muted)' }}>↕</span>;
    return <span className="ml-1 text-blue-500">{sortDir === 'asc' ? '↑' : '↓'}</span>;
  };

  return (
    <div className="space-y-4">
      {/* Filtre */}
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filtrer par numéro, nom ou région…"
          className="w-full max-w-sm rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          style={{
            backgroundColor: 'var(--bg-card)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border)',
          }}
        />
        {filter && (
          <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            {sorted.length} résultat{sorted.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Tableau */}
      <div className="overflow-x-auto rounded-lg shadow-sm" style={{ border: '1px solid var(--border)' }}>
        <table className="table-theme min-w-full text-sm" style={{ borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {(['code', 'nom', 'region', 'prefecture'] as SortKey[]).map((key) => (
                <th
                  key={key}
                  onClick={() => handleHeaderClick(key)}
                  className="hover-surface px-4 py-3 text-left font-semibold select-none cursor-pointer whitespace-nowrap transition-colors"
                  style={{ color: 'var(--text-primary)', borderBottom: '1px solid var(--border)' }}
                >
                  {{ code: 'Numéro', nom: 'Nom', region: 'Région', prefecture: 'Préfecture' }[key]}
                  {indicator(key)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center italic" style={{ color: 'var(--text-muted)' }}>
                  Aucun département ne correspond à votre recherche.
                </td>
              </tr>
            ) : (
              sorted.map((dept) => (
                <tr key={dept.code} className="transition-colors">
                  <td className="px-4 py-2.5 font-mono font-medium" style={{ color: 'var(--text-primary)' }}>
                    {dept.code}
                  </td>
                  <td className="px-4 py-2.5" style={{ color: 'var(--text-primary)' }}>{dept.nom}</td>
                  <td className="px-4 py-2.5" style={{ color: 'var(--text-secondary)' }}>
                    {regionMap.get(dept.regionCode) ?? dept.regionCode}
                  </td>
                  <td className="px-4 py-2.5" style={{ color: 'var(--text-secondary)' }}>
                    {dept.prefecture}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-right" style={{ color: 'var(--text-muted)' }}>
        {sorted.length} / {DEPARTEMENTS.length} départements
      </p>
    </div>
  );
}
