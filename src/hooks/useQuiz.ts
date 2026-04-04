import { useState, useCallback } from 'react';
import { shuffle } from '../quiz/buildChoices';
import { buildInitialSession } from '../quiz/generateQuestions';
import type { QuizConfig, Question, SessionState, AnswerRecord } from '../quiz/types';

/**
 * Hook principal gérant l'intégralité de l'état d'une session de quiz.
 *
 * @param config  Configuration choisie par l'utilisateur (modes, difficulté, longueur).
 *
 * @returns
 * - `session`           État courant de la session (questions, score, index, etc.)
 * - `submitAnswer`      Enregistre la réponse de l'utilisateur pour la question courante.
 *                       Sans effet si la question est déjà répondue ou la session terminée.
 * - `nextQuestion`      Avance à la question suivante (ou marque la session comme terminée).
 *                       Sans effet si aucune réponse n'a encore été soumise.
 * - `restart`           Génère une nouvelle session complète avec la même configuration.
 * - `restartWithErrors` Repart uniquement sur les questions mal répondues (mode révision),
 *                       les choix étant re-mélangés. Sans effet s'il n'y a pas d'erreurs.
 */
export function useQuiz(config: QuizConfig): {
  session: SessionState;
  submitAnswer: (code: string) => void;
  nextQuestion: () => void;
  restart: () => void;
  restartWithErrors: () => void;
} {
  const [session, setSession] = useState<SessionState>(() => buildInitialSession(config));

  const submitAnswer = useCallback((code: string) => {
    setSession((prev) => {
      if (prev.answerState !== 'pending' || prev.finished) return prev;
      const question = prev.questions[prev.currentIndex];
      let correct = false;

      switch (question.mode) {
        case 'TrouverDeptCarte':
        case 'TrouverRegionCarte':
        case 'DevinerNomRegionCarte':
        case 'DevinerNomDeptCarte':
        case 'DevinerCodeDept':
        case 'DevinerNomDept':
        case 'DevinerPrefectureDept':
        case 'DevinerPrefectureRegion':
          correct = code === question.targetCode;
          break;
      }

      const record: AnswerRecord = { mode: question.mode, correct, question };

      return {
        ...prev,
        answerState: correct ? 'correct' : 'wrong',
        score: correct ? prev.score + 1 : prev.score,
        selectedCode: code,
        answerHistory: [...prev.answerHistory, record],
      };
    });
  }, []);

  const nextQuestion = useCallback(() => {
    setSession((prev) => {
      if (prev.answerState === 'pending') return prev;
      const nextIndex = prev.currentIndex + 1;
      if (nextIndex >= prev.questions.length) {
        return { ...prev, finished: true };
      }
      return {
        ...prev,
        currentIndex: nextIndex,
        answerState: 'pending',
        selectedCode: null,
      };
    });
  }, []);

  const restart = useCallback(() => {
    const newSession = buildInitialSession(config);
    setSession(newSession);
  }, [config]);

  const restartWithErrors = useCallback(() => {
    setSession((prev) => {
      const wrongQuestions = prev.answerHistory
        .filter((r) => !r.correct)
        .map((r, idx): Question => ({
          ...r.question,
          id: `retry-${idx}-${r.question.targetCode}-${r.question.mode}`,
          choices: r.question.choices ? shuffle([...r.question.choices]) : undefined,
        }));

      if (wrongQuestions.length === 0) return prev;

      return {
        questions: shuffle(wrongQuestions),
        currentIndex: 0,
        score: 0,
        answerState: 'pending',
        selectedCode: null,
        finished: false,
        answerHistory: [],
      };
    });
  }, []);

  return { session, submitAnswer, nextQuestion, restart, restartWithErrors };
}
