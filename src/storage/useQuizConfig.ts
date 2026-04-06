import { useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';
import type { QuizSujet, Difficulty, SessionLength } from '../quiz/types';

export interface StoredQuizConfig {
  sujet: QuizSujet;
  difficulty: Difficulty;
  sessionLength: SessionLength;
}

const DEFAULT: StoredQuizConfig = {
  sujet: 'depts-carte',
  difficulty: 'facile',
  sessionLength: 25,
};

export function useQuizConfig() {
  const [config, setConfig] = useLocalStorage<StoredQuizConfig>('frdepts.quizConfig', DEFAULT);

  const update = useCallback(
    (partial: Partial<StoredQuizConfig>) => {
      setConfig(prev => ({ ...prev, ...partial }));
    },
    [setConfig],
  );

  return [config, update] as const;
}
