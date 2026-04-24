import { useMemo } from 'react';
import type { QuizConfig, QuizSujet, Difficulty, SessionLength } from '../../quiz/types';
import { useQuizConfig } from '../../storage/useQuizConfig';
import { useQuizHistory, relativeTime } from '../../storage/useQuizHistory';
import type { SessionResult } from '../../storage/useQuizHistory';
import { ZONES, ZONES_BY_CODE } from '../../data/zones';
import type { ZoneCode } from '../../data/zones';
import { DEPARTEMENTS } from '../../data/departements';
import { REGIONS } from '../../data/regions';

interface QuizConfigProps {
  onStart: (config: QuizConfig) => void;
}

interface SujetOption {
  sujet: QuizSujet;
  label: string;
  description: string;
  hasDifficulty: boolean;
  hasSessionLength: boolean;
  hasZone: boolean;
}

const SUJETS: SujetOption[] = [
  {
    sujet: 'regions-carte',
    label: 'Régions — Carte',
    description: 'Retrouver les régions sur la carte de France',
    hasDifficulty: true,
    hasSessionLength: false,
    hasZone: false,
  },
  {
    sujet: 'depts-carte',
    label: 'Départements — Carte',
    description: 'Retrouver les départements sur la carte de France',
    hasDifficulty: true,
    hasSessionLength: true,
    hasZone: true,
  },
  {
    sujet: 'depts-numeros',
    label: 'Départements — Numéros',
    description: 'Associer les départements à leur numéro',
    hasDifficulty: true,
    hasSessionLength: true,
    hasZone: true,
  },
  {
    sujet: 'depts-prefectures',
    label: 'Départements — Préfectures',
    description: 'Retrouver la préfecture de chaque département',
    hasDifficulty: true,
    hasSessionLength: true,
    hasZone: true,
  },
  {
    sujet: 'regions-prefectures',
    label: 'Régions — Préfectures',
    description: 'Retrouver la préfecture de chaque région',
    hasDifficulty: true,
    hasSessionLength: false,
    hasZone: false,
  },
];

// Record for O(1) lookup without non-null assertions — TypeScript enforces all keys are present.
const SUJETS_BY_KEY: Record<QuizSujet, SujetOption> = Object.fromEntries(
  SUJETS.map((s) => [s.sujet, s]),
) as Record<QuizSujet, SujetOption>;

const SESSION_LENGTHS: SessionLength[] = [10, 25, 50, 'tout'];

const DIFFICULTY_DESCRIPTIONS: Record<Difficulty, string> = {
  facile:    'Mauvaises réponses géographiquement éloignées',
  difficile: 'Mauvaises réponses géographiquement proches',
};

export default function QuizConfig({ onStart }: QuizConfigProps) {
  const [config, updateConfig] = useQuizConfig();
  const { sujet, difficulty, sessionLength, adaptative, zoneCode } = config;

  const setSujet = (s: QuizSujet) => updateConfig({ sujet: s });
  const setDifficulty = (d: Difficulty) => updateConfig({ difficulty: d });
  const setSessionLength = (l: SessionLength) => updateConfig({ sessionLength: l });
  const setAdaptative = (v: boolean) => updateConfig({ adaptative: v });
  const setZoneCode = (z: ZoneCode) => updateConfig({ zoneCode: z });

  const [sessions] = useQuizHistory();
  const lastSessionBySujet = useMemo(() => {
    const map = new Map<QuizSujet, SessionResult>();
    for (const s of sessions) {
      if (!map.has(s.sujet)) map.set(s.sujet, s);
    }
    return map;
  }, [sessions]);

  const selectedOption = SUJETS_BY_KEY[sujet];

  const filterCodes = useMemo(() => {
    if (!selectedOption.hasZone || zoneCode === 'tout') return undefined;
    const zone = ZONES_BY_CODE[zoneCode];
    const zoneRegions = new Set(zone.regionCodes);
    return DEPARTEMENTS.filter((d) => zoneRegions.has(d.regionCode)).map((d) => d.code);
  }, [selectedOption.hasZone, zoneCode]);

  // Taille du pool selon la zone sélectionnée (ou la totalité si pas de zone)
  const availableCount = useMemo(() => {
    if (filterCodes !== undefined) return filterCodes.length;
    if (selectedOption.hasZone) return DEPARTEMENTS.length;
    return REGIONS.length;
  }, [filterCodes, selectedOption.hasZone]);

  // Nombre réel de questions qui seront générées
  const effectiveCount = useMemo(() => {
    if (!selectedOption.hasSessionLength) return availableCount;
    if (sessionLength === 'tout') return availableCount;
    return Math.min(sessionLength, availableCount);
  }, [selectedOption.hasSessionLength, sessionLength, availableCount]);

  const zoneCapExceeded =
    selectedOption.hasZone &&
    zoneCode !== 'tout' &&
    sessionLength !== 'tout' &&
    (sessionLength as number) > availableCount;

  const handleStart = () => {
    onStart({
      sujet,
      difficulty,
      sessionLength: selectedOption.hasSessionLength ? sessionLength : 'tout',
      adaptative,
      filterCodes,
    });
  };

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6">
      <div className="mb-8">
        <h1 className="text-xl sm:text-3xl font-bold">Quiz départements et régions de France</h1>
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
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-800">{option.label}</p>
                <p className="text-xs text-gray-600">{option.description}</p>
                {lastSessionBySujet.get(option.sujet) && (() => {
                  const last = lastSessionBySujet.get(option.sujet)!;
                  const pct = Math.round((last.score / last.total) * 100);
                  return (
                    <p className="text-xs text-gray-600 mt-0.5">
                      Dernière session :{' '}
                      <span className={`font-medium ${pct >= 85 ? 'text-green-600' : pct >= 60 ? 'text-yellow-500' : 'text-red-500'}`}>
                        {last.score}/{last.total}
                      </span>
                      {' · '}{relativeTime(last.date)}
                    </p>
                  );
                })()}
              </div>
            </label>
          ))}
        </div>
      </section>

      {/* Difficulté — uniquement pour les sujets qui la supportent */}
      {selectedOption.hasDifficulty && (
        <section className="mb-6">
          <h2 className="text-base font-medium mb-3">Niveau de difficulté</h2>
          <div className="flex flex-col gap-2 sm:flex-row sm:gap-8">
            {(['facile', 'difficile'] as Difficulty[]).map((d) => (
              <label key={d} className="flex items-start gap-2 cursor-pointer select-none">
                <input
                  type="radio"
                  name="difficulty"
                  value={d}
                  aria-label={d}
                  checked={difficulty === d}
                  onChange={() => setDifficulty(d)}
                  className="accent-blue-600 mt-0.5"
                />
                <div>
                  <p className="text-sm capitalize">{d}</p>
                  <p className="text-xs text-gray-600 mt-0.5">{DIFFICULTY_DESCRIPTIONS[d]}</p>
                </div>
              </label>
            ))}
          </div>
        </section>
      )}

      {/* Zone géographique — sujets depts uniquement */}
      {selectedOption.hasZone && (
        <section className="mb-6">
          <h2 className="text-base font-medium mb-3">Zone géographique</h2>
          <div className="flex flex-wrap gap-2">
            {ZONES.map((zone) => (
              <button
                key={zone.code}
                type="button"
                onClick={() => setZoneCode(zone.code)}
                className={`px-4 py-2 rounded text-sm font-medium border transition-colors ${
                  zoneCode === zone.code
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
                }`}
              >
                {zone.label}
              </button>
            ))}
          </div>
          {zoneCode !== 'tout' && (
            <p className="text-xs text-gray-600 mt-2">{ZONES_BY_CODE[zoneCode].description}</p>
          )}
        </section>
      )}

      {/* Nombre de questions — masqué pour les sujets régions (toujours "tout") */}
      {selectedOption.hasSessionLength && (
        <section className="mb-6">
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
          {zoneCapExceeded && (
            <p className="text-xs text-amber-600 mt-2">
              Cette zone contient {availableCount} départements — la session sera limitée à {availableCount} questions.
            </p>
          )}
        </section>
      )}

      {/* Mode adaptatif */}
      <section className="mb-6">
        <label className="flex items-start gap-3 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={adaptative}
            onChange={(e) => setAdaptative(e.target.checked)}
            className="mt-0.5 accent-blue-600 w-4 h-4 shrink-0"
          />
          <div>
            <p className="text-sm font-medium text-gray-800">Priorité à mes points faibles</p>
            <p className="text-xs text-gray-600 mt-0.5">Les éléments souvent ratés reviennent plus fréquemment</p>
          </div>
        </label>
      </section>

      {/* Résumé + bouton Commencer */}
      <div className="mt-8">
        <p className="text-sm text-gray-600 text-center mb-3">
          {effectiveCount} question{effectiveCount !== 1 ? 's' : ''}
          {selectedOption.hasDifficulty && ` · ${difficulty}`}
          {selectedOption.hasZone && zoneCode !== 'tout' && ` · ${ZONES_BY_CODE[zoneCode].label}`}
          {adaptative && ' · points faibles en priorité'}
        </p>
        <button
          type="button"
          onClick={handleStart}
          className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
        >
          Commencer
        </button>
      </div>
    </div>
  );
}
