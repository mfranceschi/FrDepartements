import { useState } from 'react';
import type { QuizConfig, QuizMode, Difficulty } from '../../quiz/types';

interface QuizConfigProps {
  onStart: (config: QuizConfig) => void;
}

const MODE_LABELS: { mode: QuizMode; label: string }[] = [
  { mode: 'TrouverDeptCarte', label: 'Trouver un département sur la carte' },
  { mode: 'TrouverRegionCarte', label: 'Trouver une région sur la carte' },
  { mode: 'DevinerCodeDept', label: 'Deviner le numéro d\'un département' },
  { mode: 'DevinerNomDept', label: 'Deviner le nom d\'un département' },
  { mode: 'DevinerRegionDept', label: 'Deviner la région d\'un département' },
];

const ALL_MODES: QuizMode[] = MODE_LABELS.map((m) => m.mode);

type SessionLength = 10 | 25 | 50 | 'tout';
const SESSION_LENGTHS: SessionLength[] = [10, 25, 50, 'tout'];

export default function QuizConfig({ onStart }: QuizConfigProps) {
  const [selectedModes, setSelectedModes] = useState<Set<QuizMode>>(new Set(ALL_MODES));
  const [difficulty, setDifficulty] = useState<Difficulty>('facile');
  const [sessionLength, setSessionLength] = useState<SessionLength>(25);

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

  const handleStart = () => {
    if (selectedModes.size === 0) return;
    onStart({
      modes: Array.from(selectedModes),
      difficulty,
      sessionLength,
    });
  };

  return (
    <div className="max-w-lg mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-6">Configurer le Quiz</h1>

      {/* Types de questions */}
      <section className="mb-6">
        <h2 className="text-base font-medium mb-3">Types de questions</h2>
        <div className="flex flex-col gap-2">
          {MODE_LABELS.map(({ mode, label }) => (
            <label key={mode} className="flex items-center gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={selectedModes.has(mode)}
                onChange={() => toggleMode(mode)}
                className="w-4 h-4 rounded accent-blue-600"
              />
              <span className="text-sm">{label}</span>
            </label>
          ))}
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
              onClick={() => setSessionLength(len)}
              className={`px-4 py-2 rounded text-sm font-medium border transition-colors ${
                sessionLength === len
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
              }`}
            >
              {len === 'tout' ? 'Tout' : len}
            </button>
          ))}
        </div>
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
