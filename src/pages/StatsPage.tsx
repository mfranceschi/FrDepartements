import { useState, useMemo } from 'react';
import { useItemStats } from '../storage/useItemStats';
import { relativeTime } from '../storage/useQuizHistory';
import { DEPARTEMENTS } from '../data/departements';
import { REGIONS } from '../data/regions';
import { DEPT_MAP, REGION_MAP } from '../data/maps';
import { scoreColor, barColor } from '../utils/scoreTheme';
import type { QuizSujet } from '../quiz/types';

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

function SuccessBar({ ok, fail }: { ok: number; fail: number }) {
  const total = ok + fail;
  const ratio = total > 0 ? ok / total : 0;
  return (
    <div className="w-20 h-1.5 rounded-full overflow-hidden shrink-0" style={{ backgroundColor: 'var(--border)' }}>
      <div
        className={`h-full rounded-full ${barColor(ratio)}`}
        style={{ width: `${ratio * 100}%` }}
      />
    </div>
  );
}

export default function StatsPage() {
  const { stats, clearStats } = useItemStats();
  const [selectedSujet, setSelectedSujet] = useState<QuizSujet>('depts-carte');
  const [confirmClear, setConfirmClear] = useState(false);

  const meta = SUJETS.find(s => s.sujet === selectedSujet)!;

  const { seenItems, totalEntities } = useMemo(() => {
    const sujetStats = stats[selectedSujet] ?? {};
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
  }, [selectedSujet, stats, meta.isDept]);

  const globalOk   = seenItems.reduce((s, { stat }) => s + stat.ok, 0);
  const globalFail = seenItems.reduce((s, { stat }) => s + stat.fail, 0);
  const globalRatio = globalOk + globalFail > 0 ? globalOk / (globalOk + globalFail) : null;
  const globalPct  = globalRatio !== null ? Math.round(globalRatio * 100) : null;
  const unseenCount = totalEntities - seenItems.length;

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-3xl mx-auto p-4 sm:p-6 flex flex-col gap-6">

        {/* Titre */}
        <div>
          <h1 className="text-xl sm:text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Statistiques</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Maîtrise par item, accumulée sur toutes vos sessions</p>
        </div>

        {/* Onglets sujet */}
        <div className="flex flex-wrap gap-2">
          {SUJETS.map(({ sujet, label }) => (
            <button
              key={sujet}
              type="button"
              onClick={() => { setSelectedSujet(sujet); setConfirmClear(false); }}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
              style={
                selectedSujet === sujet
                  ? { backgroundColor: '#2563eb', color: '#fff', border: '1px solid #2563eb' }
                  : { backgroundColor: 'var(--bg-card)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }
              }
            >
              {label}
            </button>
          ))}
        </div>

        {/* Résumé */}
        <div
          className="rounded-lg px-4 py-3 flex flex-wrap gap-4 text-sm"
          style={{ border: '1px solid var(--border)', backgroundColor: 'var(--bg-surface)' }}
        >
          <span>
            <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{seenItems.length}</span>
            <span style={{ color: 'var(--text-secondary)' }}> / {totalEntities} vus</span>
          </span>
          {globalRatio !== null && globalPct !== null && (
            <span>
              <span className={`font-semibold ${scoreColor(globalRatio)}`}>{globalPct}%</span>
              <span style={{ color: 'var(--text-secondary)' }}> de réussite</span>
            </span>
          )}
          {globalOk + globalFail > 0 && (
            <span style={{ color: 'var(--text-muted)' }}>
              {globalOk + globalFail} réponse{globalOk + globalFail > 1 ? 's' : ''} au total
            </span>
          )}
          {seenItems.length === 0 && (
            <span style={{ color: 'var(--text-muted)' }}>Aucune donnée — lancez un quiz pour commencer.</span>
          )}
        </div>

        {/* Liste des items vus */}
        {seenItems.length > 0 && (
          <ul className="flex flex-col gap-1.5">
            {seenItems.map(({ entity, stat }) => {
              const dept = meta.isDept ? DEPT_MAP.get(entity.code) : null;
              const regionNom = dept ? REGION_MAP.get(dept.regionCode)?.nom : null;
              const total = stat.ok + stat.fail;
              const ratio = stat.ok / total;
              const pct = Math.round(ratio * 100);

              return (
                <li
                  key={entity.code}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg"
                  style={{ border: '1px solid var(--border)', backgroundColor: 'var(--bg-card)' }}
                >
                  {/* Nom + code/région */}
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{entity.nom}</span>
                    {meta.isDept && (
                      <span className="text-xs ml-2" style={{ color: 'var(--text-muted)' }}>
                        {entity.code}{regionNom ? ` · ${regionNom}` : ''}
                      </span>
                    )}
                  </div>

                  {/* Barre + stats */}
                  <div className="flex items-center gap-2 shrink-0">
                    <SuccessBar ok={stat.ok} fail={stat.fail} />
                    <span className={`text-xs font-semibold tabular-nums w-9 text-right ${scoreColor(ratio)}`}>
                      {pct}%
                    </span>
                    <span className="text-xs tabular-nums" style={{ color: 'var(--text-muted)' }}>
                      <span className="text-green-600">{stat.ok}✓</span>
                      {' '}
                      <span className="text-red-400">{stat.fail}✗</span>
                    </span>
                    <span className="hidden sm:inline text-xs w-20 text-right" style={{ color: 'var(--text-muted)' }}>
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
          <p className="text-xs text-center" style={{ color: 'var(--text-muted)' }}>
            {unseenCount} {meta.isDept ? 'département' : 'région'}{unseenCount > 1 ? 's' : ''} pas encore rencontrés
          </p>
        )}

        {/* Bouton vider */}
        <div className="pt-4" style={{ borderTop: '1px solid var(--border-subtle)' }}>
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
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Confirmer la suppression ?</span>
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
                className="px-3 py-1.5 text-xs font-medium rounded-lg transition-colors hover-surface"
                style={{ backgroundColor: 'var(--bg-surface)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
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
