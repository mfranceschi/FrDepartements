import { useState, useCallback } from 'react';
import { shuffle } from '../quiz/buildChoices';
import { buildInitialSession } from '../quiz/generateQuestions';
import type { QuizConfig, Question, SessionState, AnswerRecord } from '../quiz/types';
import { isQcmQuestion } from '../quiz/types';

export function useQuiz(config: QuizConfig): {
  session: SessionState;
  submitAnswer: (code: string) => void;
  nextQuestion: () => void;
  restart: () => void;
  restartWithReview: () => void;
  toggleMarkCurrentForReview: () => void;
} {
  const [session, setSession] = useState<SessionState>(() => buildInitialSession(config));

  const submitAnswer = useCallback((code: string) => {
    setSession((prev) => {
      if (prev.answerState !== 'pending' || prev.finished) return prev;
      const question = prev.questions[prev.currentIndex];
      const correct = code === question.targetCode;

      const record: AnswerRecord = { mode: question.mode, correct, answeredCode: code, question };

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

  const toggleMarkCurrentForReview = useCallback(() => {
    setSession((prev) => {
      if (prev.answerState === 'pending' || prev.finished) return prev;
      const id = prev.questions[prev.currentIndex].id;
      const already = prev.markedQuestionIds.includes(id);
      return {
        ...prev,
        markedQuestionIds: already
          ? prev.markedQuestionIds.filter((x) => x !== id)
          : [...prev.markedQuestionIds, id],
      };
    });
  }, []);

  const restartWithReview = useCallback(() => {
    setSession((prev) => {
      const wrongQuestions = prev.answerHistory
        .filter((r) => !r.correct)
        .map((r, idx): Question => {
          const id = `retry-${idx}-${r.question.targetCode}-${r.question.mode}`;
          if (isQcmQuestion(r.question)) {
            return { ...r.question, id, choices: shuffle([...r.question.choices]) };
          }
          return { ...r.question, id };
        });

      const markedQuestions = prev.questions
        .filter((q) => prev.markedQuestionIds.includes(q.id))
        .map((q, idx): Question => {
          const id = `marked-${idx}-${q.targetCode}-${q.mode}`;
          if (isQcmQuestion(q)) {
            return { ...q, id, choices: shuffle([...q.choices]) };
          }
          return { ...q, id };
        });

      const reviewQuestions = [...wrongQuestions, ...markedQuestions];
      if (reviewQuestions.length === 0) return prev;

      return {
        questions: shuffle(reviewQuestions),
        currentIndex: 0,
        score: 0,
        answerState: 'pending',
        selectedCode: null,
        finished: false,
        answerHistory: [],
        isReview: true,
        markedQuestionIds: [],
      };
    });
  }, []);

  return { session, submitAnswer, nextQuestion, restart, restartWithReview, toggleMarkCurrentForReview };
}
