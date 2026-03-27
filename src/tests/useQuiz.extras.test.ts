import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useQuiz } from '../hooks/useQuiz';
import type { QuizConfig } from '../quiz/types';

const CARTE_CONFIG: QuizConfig = { modes: ['TrouverDeptCarte'], difficulty: 'facile', sessionLength: 10 };
const QCM_CONFIG: QuizConfig = { modes: ['DevinerNomDept'], difficulty: 'facile', sessionLength: 10 };

// ── answerHistory ─────────────────────────────────────────────────────────────

describe('useQuiz – answerHistory', () => {
  it('commence vide', () => {
    const { result } = renderHook(() => useQuiz(CARTE_CONFIG));
    expect(result.current.session.answerHistory).toHaveLength(0);
  });

  it('ajoute une entrée à chaque réponse', () => {
    const { result } = renderHook(() => useQuiz(CARTE_CONFIG));
    const q0 = result.current.session.questions[0];

    act(() => { result.current.submitAnswer(q0.targetCode); }); // correct
    expect(result.current.session.answerHistory).toHaveLength(1);

    act(() => { result.current.nextQuestion(); });
    act(() => { result.current.submitAnswer('__FAUX__'); }); // wrong
    expect(result.current.session.answerHistory).toHaveLength(2);
  });

  it('reflète correctement correct/wrong dans l\'ordre', () => {
    const { result } = renderHook(() => useQuiz(CARTE_CONFIG));
    const q0Code = result.current.session.questions[0].targetCode;

    act(() => { result.current.submitAnswer(q0Code); });
    act(() => { result.current.nextQuestion(); });
    act(() => { result.current.submitAnswer('__FAUX__'); });

    expect(result.current.session.answerHistory[0].correct).toBe(true);
    expect(result.current.session.answerHistory[1].correct).toBe(false);
  });

  it('enregistre le mode de chaque question', () => {
    const { result } = renderHook(() => useQuiz(QCM_CONFIG));
    act(() => { result.current.submitAnswer('__FAUX__'); });
    expect(result.current.session.answerHistory[0].mode).toBe('DevinerNomDept');
  });

  it('est réinitialisé après restart', () => {
    const { result } = renderHook(() => useQuiz(CARTE_CONFIG));
    act(() => { result.current.submitAnswer('__FAUX__'); });
    expect(result.current.session.answerHistory).toHaveLength(1);

    act(() => { result.current.restart(); });
    expect(result.current.session.answerHistory).toHaveLength(0);
  });
});

// ── restartWithErrors ─────────────────────────────────────────────────────────

describe('useQuiz – restartWithErrors', () => {
  it('crée une session contenant uniquement les questions ratées', () => {
    const { result } = renderHook(() => useQuiz(CARTE_CONFIG));
    const codes = result.current.session.questions.map((q) => q.targetCode);

    // q0 → correct, q1 → wrong, q2 → wrong
    act(() => { result.current.submitAnswer(codes[0]); });
    act(() => { result.current.nextQuestion(); });
    act(() => { result.current.submitAnswer('__FAUX__'); });
    act(() => { result.current.nextQuestion(); });
    act(() => { result.current.submitAnswer('__FAUX__'); });
    // answerHistory = [correct, wrong, wrong] ; on ne termine pas la session

    act(() => { result.current.restartWithErrors(); });

    expect(result.current.session.questions).toHaveLength(2);
    const retryCodes = result.current.session.questions.map((q) => q.targetCode);
    expect(retryCodes).toContain(codes[1]);
    expect(retryCodes).toContain(codes[2]);
    expect(retryCodes).not.toContain(codes[0]); // la bonne réponse est exclue
  });

  it('remet score, index et answerHistory à zéro', () => {
    const { result } = renderHook(() => useQuiz(CARTE_CONFIG));
    act(() => { result.current.submitAnswer('__FAUX__'); });
    act(() => { result.current.restartWithErrors(); });

    expect(result.current.session.score).toBe(0);
    expect(result.current.session.currentIndex).toBe(0);
    expect(result.current.session.answerHistory).toHaveLength(0);
    expect(result.current.session.finished).toBe(false);
  });

  it('ne fait rien si toutes les réponses étaient correctes', () => {
    const { result } = renderHook(() => useQuiz(CARTE_CONFIG));
    const q0Code = result.current.session.questions[0].targetCode;
    const originalQuestions = result.current.session.questions;

    act(() => { result.current.submitAnswer(q0Code); }); // correct
    act(() => { result.current.restartWithErrors(); }); // rien à rejouer

    // La session reste inchangée
    expect(result.current.session.questions).toBe(originalQuestions);
  });

  it('les questions repassées conservent le mode et les choices mélangés', () => {
    const { result } = renderHook(() => useQuiz(QCM_CONFIG));

    act(() => { result.current.submitAnswer('__FAUX__'); }); // wrong
    const origChoices = result.current.session.questions[0].choices!;

    act(() => { result.current.restartWithErrors(); });

    const retryChoices = result.current.session.questions[0].choices!;
    expect(retryChoices).toHaveLength(origChoices.length);
    // Les codes sont les mêmes (même choix, ordre potentiellement différent)
    expect(retryChoices.map((c) => c.code).sort()).toEqual(
      origChoices.map((c) => c.code).sort(),
    );
  });
});
