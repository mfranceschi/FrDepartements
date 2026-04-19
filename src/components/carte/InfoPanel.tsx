import { DEPT_MAP, REGION_MAP } from '../../data/maps';
import { FLEUVES_DEPTS } from '../../data/fleuvesDepts';

const FLEUVE_SCALERANK_THRESHOLD = 11;

interface SelectedTerritory {
  code: string;
  type: 'departement' | 'region' | 'prefecture';
}

// ---------------------------------------------------------------------------
// Panneau vide
// ---------------------------------------------------------------------------

export function EmptyPanel() {
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
  const entry = FLEUVES_DEPTS[name];
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

export interface InfoPanelProps {
  selectedTerritory: SelectedTerritory | null;
  selectedFleuve: string | null;
}

export default function InfoPanel({ selectedTerritory, selectedFleuve }: InfoPanelProps) {
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
