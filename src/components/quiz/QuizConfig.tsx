import { useState } from 'react';
import type { QuizConfig, QuizSujet, Difficulty } from '../../quiz/types';

interface QuizConfigProps {
  onStart: (config: QuizConfig) => void;
}

interface SujetOption {
  sujet: QuizSujet;
  label: string;
  description: string;
  hasDifficulty: boolean;
  hasSessionLength: boolean;
}

const SUJETS: SujetOption[] = [
  {
    sujet: 'regions-carte',
    label: 'Régions — Carte',
    description: 'Retrouver les régions sur la carte de France',
    hasDifficulty: false,
    hasSessionLength: false,
  },
  {
    sujet: 'depts-carte',
    label: 'Départements — Carte',
    description: 'Retrouver les départements sur la carte de France',
    hasDifficulty: true,
    hasSessionLength: true,
  },
  {
    sujet: 'depts-numeros',
    label: 'Départements — Numéros',
    description: 'Associer les départements à leur numéro',
    hasDifficulty: true,
    hasSessionLength: true,
  },
  {
    sujet: 'depts-prefectures',
    label: 'Départements — Préfectures',
    description: 'Retrouver la préfecture de chaque département',
    hasDifficulty: false,
    hasSessionLength: true,
  },
  {
    sujet: 'regions-prefectures',
    label: 'Régions — Préfectures',
    description: 'Retrouver la préfecture de chaque région',
    hasDifficulty: false,
    hasSessionLength: false,
  },
];

type SessionLength = 10 | 25 | 50 | 'tout';
const SESSION_LENGTHS: SessionLength[] = [10, 25, 50, 'tout'];

export default function QuizConfig({ onStart }: QuizConfigProps) {
  const [sujet, setSujet] = useState<QuizSujet>('depts-carte');
  const [difficulty, setDifficulty] = useState<Difficulty>('facile');
  const [sessionLength, setSessionLength] = useState<SessionLength>(25);

  const selectedOption = SUJETS.find((s) => s.sujet === sujet)!;

  const handleStart = () => {
    onStart({
      sujet,
      difficulty,
      sessionLength: selectedOption.hasSessionLength ? sessionLength : 'tout',
    });
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Quiz départements et régions de France</h1>
      </div>

      {/* Choix du sujet */}
      <section className="mb-6">
        <h2 className="text-base font-medium mb-3">Que voulez-vous apprendre ?</h2>
        <div className="flex flex-col gap-2">
          {SUJETS.map((option) => (
            <label
              key={option.sujet}
              className={`flex items-center gap-4 px-4 py-3 rounded-lg border-2 cursor-pointer select-none transition-colors ${
                sujet === option.sujet
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50/40'
              }`}
            >
              <input
                type="radio"
                name="sujet"
                value={option.sujet}
                checked={sujet === option.sujet}
                onChange={() => setSujet(option.sujet)}
                className="accent-blue-600 shrink-0"
              />
              <div>
                <p className="text-sm font-semibold text-gray-800">{option.label}</p>
                <p className="text-xs text-gray-500">{option.description}</p>
              </div>
            </label>
          ))}
        </div>
      </section>

      {/* Difficulté — uniquement pour les sujets qui la supportent */}
      {selectedOption.hasDifficulty && (
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
          <p className="text-xs text-gray-500 mt-2">S'applique aux choix proposés dans les QCM</p>
        </section>
      )}

      {/* Nombre de questions — masqué pour les sujets régions (toujours "tout") */}
      {selectedOption.hasSessionLength && (
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
      )}

      {/* Bouton Commencer */}
      <button
        type="button"
        onClick={handleStart}
        className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
      >
        Commencer
      </button>
    </div>
  );
}
