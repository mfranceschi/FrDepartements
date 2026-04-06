import { useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';
import type { QuizSujet } from '../quiz/types';

export interface SessionResult {
  date: string;    // ISO 8601
  sujet: QuizSujet;
  score: number;
  total: number;
}

/** Nombre maximum de sessions conservées (FIFO). */
const MAX_SESSIONS = 100;

export function useQuizHistory() {
  const [sessions, setSessions] = useLocalStorage<SessionResult[]>('frdepts.sessions', []);

  const addSession = useCallback(
    (result: SessionResult) => {
      setSessions(prev => [result, ...prev].slice(0, MAX_SESSIONS));
    },
    [setSessions],
  );

  return [sessions, addSession] as const;
}

/** Formate une date ISO en durée relative lisible (ex : "il y a 3j"). */
export function relativeTime(isoDate: string): string {
  const diffMs = Date.now() - new Date(isoDate).getTime();
  const days = Math.floor(diffMs / 86_400_000);
  const hours = Math.floor(diffMs / 3_600_000);
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return "à l'instant";
  if (hours < 1) return `il y a ${minutes}min`;
  if (days < 1) return `il y a ${hours}h`;
  if (days === 1) return 'il y a 1j';
  return `il y a ${days}j`;
}
