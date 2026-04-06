import { useState, useMemo } from 'react';
import { useItemStats } from '../storage/useItemStats';
import { relativeTime } from '../storage/useQuizHistory';
import { DEPARTEMENTS } from '../data/departements';
import { REGIONS } from '../data/regions';
import type { QuizSujet } from '../quiz/types';

const DEPT_MAP = new Map(DEPARTEMENTS.map(d => [d.code, d]));
const REGION_NOM_MAP = new Map(REGIONS.map(r => [r.code, r.nom]));

interface SujetMeta {
  sujet: QuizSujet;
  label: string;
  isDept: boolean;
}

const SUJETS: SujetMeta[] = [
  { sujet: 'depts-carte',         label: 'Depts — Carte',         isDept: true  },
  { sujet: 'depts-numeros',       label: 'Depts — Numéros',       isDept: true  },
  { sujet: 'depts-prefectures',   label: 'Depts — Préfectures',   isDept: true  },
  { sujet: 'regions-carte',       label: 'Régions — Carte',       isDept: false },
  { sujet: 'regions-prefectures', label: 'Régions — Préfectures', isDept: false },
];

function pctColor(pct: number) {
  if (pct >= 85) return 'text-green-600';
  if (pct >= 60) return 'text-yellow-500';
  return 'text-red-500';
}

function barColor(pct: number) {
  if (pct >= 85) return 'bg-green-500';
  if (pct >= 60) return 'bg-yellow-400';
  return 'bg-red-400';
}

function SuccessBar({ ok, fail }: { ok: number; fail: number }) {
  const total = ok + fail;
  const pct = total > 0 ? (ok / total) * 100 : 0;
  return (
    <div className="w-20 h-1.5 rounded-full bg-gray-200 overflow-hidden shrink-0">
      <div
        className={`h-full rounded-full ${barColor(pct)}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export default function StatsPage() {
  const { stats, clearStats } = useItemStats();
  const [selectedSujet, setSelectedSujet] = useState<QuizSujet>('depts-carte');
  const [confirmClear, setConfirmClear] = useState(false);

  const meta = SUJETS.find(s => s.sujet === selectedSujet)!;
  const sujetStats = stats[selectedSujet] ?? {};

  const { seenItems, totalEntities } = useMemo(() => {
    const allEntities = meta.isDept ? DEPARTEMENTS : REGIONS;
    const seen = allEntities
      .map(entity => {
        const stat = sujetStats[entity.code];
        return stat ? { entity, stat } : null;
      })
      .filter((x): x is NonNullable<typeof x> => x !== null)
      .sort((a, b) => {
        const rateA = a.stat.ok / (a.stat.ok + a.stat.fail);
        const rateB = b.stat.ok / (b.stat.ok + b.stat.fail);
        if (rateA !== rateB) return rateA - rateB;
        return b.stat.fail - a.stat.fail;
      });
    return { seenItems: seen, totalEntities: allEntities.length };
  }, [selectedSujet, sujetStats, meta.isDept]);

  const globalOk   = seenItems.reduce((s, { stat }) => s + stat.ok, 0);
  const globalFail = seenItems.reduce((s, { stat }) => s + stat.fail, 0);
  const globalPct  = globalOk + globalFail > 0
    ? Math.round((globalOk / (globalOk + globalFail)) * 100)
    : null;
  const unseenCount = totalEntities - seenItems.length;

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-3xl mx-auto p-4 sm:p-6 flex flex-col gap-6">

        {/* Titre */}
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Statistiques</h1>
          <p className="text-sm text-gray-500 mt-1">Maîtrise par item, accumulée sur toutes vos sessions</p>
        </div>

        {/* Onglets sujet */}
        <div className="flex flex-wrap gap-2">
          {SUJETS.map(({ sujet, label }) => (
            <button
              key={sujet}
              type="button"
              onClick={() => { setSelectedSujet(sujet); setConfirmClear(false); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                selectedSujet === sujet
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Résumé */}
        <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 flex flex-wrap gap-4 text-sm">
          <span>
            <span className="font-semibold text-gray-800">{seenItems.length}</span>
            <span className="text-gray-500"> / {totalEntities} vus</span>
          </span>
          {globalPct !== null && (
            <span>
              <span className={`font-semibold ${pctColor(globalPct)}`}>{globalPct}%</span>
              <span className="text-gray-500"> de réussite</span>
            </span>
          )}
          {globalOk + globalFail > 0 && (
            <span className="text-gray-400">
              {globalOk + globalFail} réponse{globalOk + globalFail > 1 ? 's' : ''} au total
            </span>
          )}
          {seenItems.length === 0 && (
            <span className="text-gray-400">Aucune donnée — lancez un quiz pour commencer.</span>
          )}
        </div>

        {/* Liste des items vus */}
        {seenItems.length > 0 && (
          <ul className="flex flex-col gap-1.5">
            {seenItems.map(({ entity, stat }) => {
              const dept = meta.isDept ? DEPT_MAP.get(entity.code) : null;
              const regionNom = dept ? REGION_NOM_MAP.get(dept.regionCode) : null;
              const total = stat.ok + stat.fail;
              const pct = Math.round((stat.ok / total) * 100);

              return (
                <li
                  key={entity.code}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-gray-200 bg-white"
                >
                  {/* Nom + code/région */}
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium text-gray-800">{entity.nom}</span>
                    {meta.isDept && (
                      <span className="text-xs text-gray-400 ml-2">
                        {entity.code}{regionNom ? ` · ${regionNom}` : ''}
                      </span>
                    )}
                  </div>

                  {/* Barre + stats */}
                  <div className="flex items-center gap-2 shrink-0">
                    <SuccessBar ok={stat.ok} fail={stat.fail} />
                    <span className={`text-xs font-semibold tabular-nums w-9 text-right ${pctColor(pct)}`}>
                      {pct}%
                    </span>
                    <span className="text-xs text-gray-400 tabular-nums">
                      <span className="text-green-600">{stat.ok}✓</span>
                      {' '}
                      <span className="text-red-400">{stat.fail}✗</span>
                    </span>
                    <span className="hidden sm:inline text-xs text-gray-300 w-20 text-right">
                      {relativeTime(stat.lastSeen)}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {/* Items pas encore vus */}
        {unseenCount > 0 && seenItems.length > 0 && (
          <p className="text-xs text-center text-gray-400">
            {unseenCount} {meta.isDept ? 'département' : 'région'}{unseenCount > 1 ? 's' : ''} pas encore rencontrés
          </p>
        )}

        {/* Bouton vider */}
        <div className="pt-4 border-t border-gray-100">
          {!confirmClear ? (
            <button
              type="button"
              onClick={() => setConfirmClear(true)}
              className="text-sm text-red-500 hover:text-red-700 underline underline-offset-2 transition-colors"
            >
              Vider toutes les statistiques
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600">Confirmer la suppression ?</span>
              <button
                type="button"
                onClick={() => { clearStats(); setConfirmClear(false); }}
                className="px-3 py-1.5 text-xs font-semibold bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                Oui, vider
              </button>
              <button
                type="button"
                onClick={() => setConfirmClear(false)}
                className="px-3 py-1.5 text-xs font-medium bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Annuler
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
