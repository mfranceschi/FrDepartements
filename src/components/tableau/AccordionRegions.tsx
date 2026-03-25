import { useState } from 'react';
import { REGIONS, Region } from '../../data/regions';
import { DEPARTEMENTS, Departement } from '../../data/departements';

// Grouper les départements par code région
const deptsByRegion = new Map<string, Departement[]>();
for (const dept of DEPARTEMENTS) {
  const list = deptsByRegion.get(dept.regionCode) ?? [];
  list.push(dept);
  deptsByRegion.set(dept.regionCode, list);
}

const metropole: Region[] = REGIONS.filter((r) => !r.outresMer).sort((a, b) =>
  a.nom.localeCompare(b.nom, 'fr'),
);
const outremer: Region[] = REGIONS.filter((r) => r.outresMer).sort((a, b) =>
  a.nom.localeCompare(b.nom, 'fr'),
);

interface RegionRowProps {
  region: Region;
  depts: Departement[];
}

function RegionRow({ region, depts }: RegionRowProps) {
  const [open, setOpen] = useState(false);

  const sorted = [...depts].sort((a, b) =>
    a.code.localeCompare(b.code, 'fr', { numeric: true }),
  );

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      {/* En-tête cliquable */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
        aria-expanded={open}
      >
        {/* Flèche avec rotation animée */}
        <span
          className="text-gray-400 text-xs transition-transform duration-200"
          style={{ transform: open ? 'rotate(90deg)' : 'rotate(0deg)' }}
        >
          ▶
        </span>

        {/* Code région */}
        <span className="font-mono text-xs text-gray-500 w-8 shrink-0">
          {region.code}
        </span>

        {/* Nom région */}
        <span className="font-semibold text-gray-800 flex-1">{region.nom}</span>

        {/* Compteur */}
        <span className="text-sm text-gray-500 shrink-0">
          {depts.length} dept{depts.length > 1 ? 's' : ''}
        </span>
      </button>

      {/* Contenu dépliable */}
      {open && (
        <div className="px-4 py-3 border-t border-gray-100 bg-white">
          <ul className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1.5">
            {sorted.map((dept) => (
              <li key={dept.code} className="flex items-center gap-2 text-sm">
                <span className="font-mono text-gray-500 w-8 shrink-0">
                  {dept.code}
                </span>
                <span className="text-gray-700">{dept.nom}</span>
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
    <div className="space-y-6">
      {/* Régions métropolitaines */}
      <section className="space-y-2">
        {metropole.map((region) => (
          <RegionRow
            key={region.code}
            region={region}
            depts={deptsByRegion.get(region.code) ?? []}
          />
        ))}
      </section>

      {/* Séparateur Outre-mer */}
      <div className="flex items-center gap-3">
        <div className="flex-1 border-t border-gray-300" />
        <span className="text-sm font-semibold text-gray-500 uppercase tracking-wider px-2">
          Outre-mer
        </span>
        <div className="flex-1 border-t border-gray-300" />
      </div>

      {/* Régions d'outre-mer */}
      <section className="space-y-2">
        {outremer.map((region) => (
          <RegionRow
            key={region.code}
            region={region}
            depts={deptsByRegion.get(region.code) ?? []}
          />
        ))}
      </section>
    </div>
  );
}
