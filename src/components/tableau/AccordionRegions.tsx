import { useMemo, useState } from 'react';
import { REGIONS } from '../../data/regions';
import type { Region } from '../../data/regions';
import { DEPARTEMENTS } from '../../data/departements';
import type { Departement } from '../../data/departements';

// Grouper les départements par code région
const deptsByRegion = new Map<string, Departement[]>();
for (const dept of DEPARTEMENTS) {
  const list = deptsByRegion.get(dept.regionCode);
  if (list) list.push(dept);
  else deptsByRegion.set(dept.regionCode, [dept]);
}

const sortedRegions: Region[] = [...REGIONS].sort((a, b) => a.nom.localeCompare(b.nom, 'fr'));

interface RegionRowProps {
  region: Region;
  depts: Departement[];
}

function RegionRow({ region, depts }: RegionRowProps) {
  const [open, setOpen] = useState(false);

  const sorted = useMemo(
    () => [...depts].sort((a, b) => a.code.localeCompare(b.code, 'fr', { numeric: true })),
    [depts],
  );

  return (
    <div className="rounded-lg overflow-hidden" style={{ border: '1px solid var(--border)' }}>
      {/* En-tête cliquable */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 transition-colors text-left hover-surface"
        style={{ backgroundColor: 'var(--bg-surface)' }}
        aria-expanded={open}
      >
        {/* Flèche avec rotation animée */}
        <span
          className="text-xs transition-transform duration-200"
          style={{ color: 'var(--text-muted)', transform: open ? 'rotate(90deg)' : 'rotate(0deg)' }}
        >
          ▶
        </span>

        {/* Code région */}
        <span className="font-mono text-xs w-8 shrink-0" style={{ color: 'var(--text-secondary)' }}>
          {region.code}
        </span>

        {/* Nom région */}
        <span className="font-semibold flex-1" style={{ color: 'var(--text-primary)' }}>{region.nom}</span>

        {/* Compteur */}
        <span className="text-sm shrink-0" style={{ color: 'var(--text-secondary)' }}>
          {depts.length} dept{depts.length > 1 ? 's' : ''}
        </span>
      </button>

      {/* Contenu dépliable */}
      {open && (
        <div className="px-4 py-3" style={{ borderTop: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-card)' }}>
          <p className="text-xs mb-2.5" style={{ color: 'var(--text-secondary)' }}>
            Préfecture régionale :{' '}
            <span className="font-semibold text-rose-600">{region.prefectureRegionale}</span>
          </p>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5">
            {sorted.map((dept) => (
              <li key={dept.code} className="flex items-center gap-2 text-sm">
                <span className="font-mono w-8 shrink-0" style={{ color: 'var(--text-secondary)' }}>
                  {dept.code}
                </span>
                <span className="flex-1" style={{ color: 'var(--text-primary)' }}>{dept.nom}</span>
                <span className="text-xs shrink-0 hidden sm:inline" style={{ color: 'var(--text-muted)' }}>{dept.prefecture}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default function AccordionRegions() {
  return (
    <div className="space-y-2">
      {sortedRegions.map((region) => (
        <RegionRow
          key={region.code}
          region={region}
          depts={deptsByRegion.get(region.code) ?? []}
        />
      ))}
    </div>
  );
}
