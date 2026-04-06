import { useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';
import type { QuizSujet, AnswerRecord } from '../quiz/types';

export interface ItemStat {
  ok: number;
  fail: number;
  lastSeen: string; // ISO 8601
}

/** { sujet → { targetCode → ItemStat } } */
export type ItemStatsStore = Partial<Record<QuizSujet, Record<string, ItemStat>>>;

export function useItemStats() {
  const [stats, setStats] = useLocalStorage<ItemStatsStore>('frdepts.itemStats', {});

  /**
   * Enregistre les réponses d'une session terminée.
   * Cumulatif : additionne aux stats existantes.
   */
  const recordAnswers = useCallback(
    (sujet: QuizSujet, answers: AnswerRecord[]) => {
      if (answers.length === 0) return;
      const now = new Date().toISOString();
      setStats(prev => {
        const sujetStats = { ...(prev[sujet] ?? {}) };
        for (const answer of answers) {
          const code = answer.question.targetCode;
          const existing = sujetStats[code] ?? { ok: 0, fail: 0, lastSeen: '' };
          sujetStats[code] = {
            ok: existing.ok + (answer.correct ? 1 : 0),
            fail: existing.fail + (answer.correct ? 0 : 1),
            lastSeen: now,
          };
        }
        return { ...prev, [sujet]: sujetStats };
      });
    },
    [setStats],
  );

  const clearStats = useCallback(() => setStats({}), [setStats]);

  return { stats, recordAnswers, clearStats };
}
