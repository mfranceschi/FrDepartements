import { useState } from 'react';
import type { QuizConfig, QuizMode, Difficulty } from '../../quiz/types';

interface QuizConfigProps {
  onStart: (config: QuizConfig) => void;
}

const REGION_MODES: { mode: QuizMode; label: string }[] = [
  { mode: 'TrouverRegionCarte', label: 'Trouver une région sur la carte' },
  { mode: 'DevinerNomRegionCarte', label: 'Deviner le nom d\'une région sur la carte' },
];

const DEPT_MODES: { mode: QuizMode; label: string }[] = [
  { mode: 'TrouverDeptCarte', label: 'Trouver un département sur la carte' },
  { mode: 'DevinerNomDeptCarte', label: 'Deviner le nom d\'un département sur la carte' },
  { mode: 'DevinerCodeDept', label: 'Deviner le numéro d\'un département' },
  { mode: 'DevinerNomDept', label: 'Deviner le nom d\'un département' },
  { mode: 'DevinerRegionDept', label: 'Deviner la région d\'un département' },
];

const REGION_MODE_SET = new Set<QuizMode>(REGION_MODES.map((m) => m.mode));

type SessionLength = 10 | 25 | 50 | 'tout';
const SESSION_LENGTHS: SessionLength[] = [10, 25, 50, 'tout'];

export default function QuizConfig({ onStart }: QuizConfigProps) {
  const [selectedModes, setSelectedModes] = useState<Set<QuizMode>>(new Set<QuizMode>(['TrouverDeptCarte']));
  const [difficulty, setDifficulty] = useState<Difficulty>('facile');
  const [sessionLength, setSessionLength] = useState<SessionLength>(25);
  const [includeDrom, setIncludeDrom] = useState(true);

  const toggleMode = (mode: QuizMode) => {
    setSelectedModes((prev) => {
      const next = new Set(prev);
      if (next.has(mode)) {
        next.delete(mode);
      } else {
        next.add(mode);
      }
      return next;
    });
  };

  const toggleGroup = (modes: QuizMode[]) => {
    setSelectedModes((prev) => {
      const allChecked = modes.every((m) => prev.has(m));
      const next = new Set(prev);
      if (allChecked) {
        modes.forEach((m) => next.delete(m));
      } else {
        modes.forEach((m) => next.add(m));
      }
      return next;
    });
  };

  const onlyRegionModes =
    selectedModes.size > 0 && [...selectedModes].every((m) => REGION_MODE_SET.has(m));

  const effectiveSessionLength: SessionLength = onlyRegionModes ? 'tout' : sessionLength;

  const handleStart = () => {
    if (selectedModes.size === 0) return;
    onStart({
      modes: Array.from(selectedModes),
      difficulty,
      sessionLength: effectiveSessionLength,
      includeDrom,
    });
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Quiz départements et régions de France</h1>
      </div>

{/* Types de questions */}
      <section className="mb-6">
        <h2 className="text-base font-medium mb-3">Types de questions</h2>

        <div className="grid grid-cols-[2fr_3fr] gap-4">
          {/* Groupe Région */}
          <div>
            <button
              type="button"
              onClick={() => toggleGroup(REGION_MODES.map((m) => m.mode))}
              className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 hover:text-blue-600 cursor-pointer select-none text-left"
            >Région</button>
            <div className="flex flex-col gap-2 pl-1">
              {REGION_MODES.map(({ mode, label }) => (
                <label key={mode} className="flex items-center gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={selectedModes.has(mode)}
                    onChange={() => toggleMode(mode)}
                    className="w-4 h-4 rounded accent-blue-600 shrink-0"
                  />
                  <span className="text-sm">{label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Groupe Département */}
          <div>
            <button
              type="button"
              onClick={() => toggleGroup(DEPT_MODES.map((m) => m.mode))}
              className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 hover:text-blue-600 cursor-pointer select-none text-left"
            >Département</button>
            <div className="flex flex-col gap-2 pl-1">
              {DEPT_MODES.map(({ mode, label }) => (
                <label key={mode} className="flex items-center gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={selectedModes.has(mode)}
                    onChange={() => toggleMode(mode)}
                    className="w-4 h-4 rounded accent-blue-600 shrink-0"
                  />
                  <span className="text-sm">{label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-gray-100">
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={includeDrom}
              onChange={() => setIncludeDrom((prev) => !prev)}
              className="w-4 h-4 rounded accent-blue-600 shrink-0"
            />
            <span className="text-sm">Inclure les départements et régions d'outre-mer (DROM)</span>
          </label>
        </div>

        {selectedModes.size === 0 && (
          <p className="text-red-500 text-xs mt-2">Sélectionnez au moins un type de question.</p>
        )}
      </section>

      {/* Difficulté */}
      <section className="mb-6">
        <h2 className="text-base font-medium mb-3">Niveau de difficulté</h2>
        <div className="flex gap-6">
          {(['facile', 'difficile'] as Difficulty[]).map((d) => (
            <label key={d} className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="radio"
                name="difficulty"
                value={d}
                checked={difficulty === d}
                onChange={() => setDifficulty(d)}
                className="accent-blue-600"
              />
              <span className="text-sm capitalize">{d}</span>
            </label>
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-2">S'applique uniquement aux questions QCM</p>
      </section>

      {/* Nombre de questions */}
      <section className="mb-8">
        <h2 className="text-base font-medium mb-3">Nombre de questions</h2>
        <div className="flex gap-3">
          {SESSION_LENGTHS.map((len) => (
            <button
              key={len}
              type="button"
              onClick={() => !onlyRegionModes && setSessionLength(len)}
              disabled={onlyRegionModes}
              className={`px-4 py-2 rounded text-sm font-medium border transition-colors ${
                effectiveSessionLength === len
                  ? 'bg-blue-600 text-white border-blue-600'
                  : onlyRegionModes
                  ? 'bg-gray-50 text-gray-300 border-gray-200 cursor-not-allowed'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
              }`}
            >
              {len === 'tout' ? 'Tout' : len}
            </button>
          ))}
        </div>
        {onlyRegionModes && (
          <p className="text-xs text-gray-500 mt-2">
            Fixé sur « Tout » pour les questions de type Région.
          </p>
        )}
      </section>

      {/* Bouton Commencer */}
      <button
        type="button"
        onClick={handleStart}
        disabled={selectedModes.size === 0}
        className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        Commencer
      </button>
    </div>
  );
}
