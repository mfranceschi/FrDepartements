import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useQuiz } from '../hooks/useQuiz';
import type { QuizConfig, QcmQuestion } from '../quiz/types';

const CARTE_CONFIG: QuizConfig = { sujet: 'depts-carte', difficulty: 'facile', sessionLength: 10 };
const QCM_CONFIG: QuizConfig = { sujet: 'depts-numeros', difficulty: 'facile', sessionLength: 10 };

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
    const expectedMode = result.current.session.questions[0].mode;
    act(() => { result.current.submitAnswer('__FAUX__'); });
    expect(result.current.session.answerHistory[0].mode).toBe(expectedMode);
  });

  it('est réinitialisé après restart', () => {
    const { result } = renderHook(() => useQuiz(CARTE_CONFIG));
    act(() => { result.current.submitAnswer('__FAUX__'); });
    expect(result.current.session.answerHistory).toHaveLength(1);

    act(() => { result.current.restart(); });
    expect(result.current.session.answerHistory).toHaveLength(0);
  });
});

// ── Modes par sujet ───────────────────────────────────────────────────────────

describe('useQuiz – modes par sujet', () => {
  it('depts-numeros : toutes les questions sont DevinerNomDept ou DevinerCodeDept', () => {
    const config: QuizConfig = { sujet: 'depts-numeros', difficulty: 'facile', sessionLength: 10 };
    const { result } = renderHook(() => useQuiz(config));
    const allowed = new Set(['DevinerNomDept', 'DevinerCodeDept']);
    const modes = result.current.session.questions.map((q) => q.mode);
    expect(modes.every((m) => allowed.has(m))).toBe(true);
    expect(result.current.session.questions).toHaveLength(10);
  });

  it('depts-carte : toutes les questions sont TrouverDeptCarte ou DevinerNomDeptCarte', () => {
    const config: QuizConfig = { sujet: 'depts-carte', difficulty: 'facile', sessionLength: 10 };
    const { result } = renderHook(() => useQuiz(config));
    const allowed = new Set(['TrouverDeptCarte', 'DevinerNomDeptCarte']);
    const modes = result.current.session.questions.map((q) => q.mode);
    expect(modes.every((m) => allowed.has(m))).toBe(true);
  });

  it('depts-prefectures : toutes les questions sont DevinerPrefectureDept', () => {
    const config: QuizConfig = { sujet: 'depts-prefectures', difficulty: 'facile', sessionLength: 10 };
    const { result } = renderHook(() => useQuiz(config));
    const modes = result.current.session.questions.map((q) => q.mode);
    expect(modes.every((m) => m === 'DevinerPrefectureDept')).toBe(true);
  });

  it('regions-prefectures : toutes les questions sont DevinerPrefectureRegion', () => {
    const config: QuizConfig = { sujet: 'regions-prefectures', difficulty: 'facile', sessionLength: 10 };
    const { result } = renderHook(() => useQuiz(config));
    const modes = result.current.session.questions.map((q) => q.mode);
    expect(modes.every((m) => m === 'DevinerPrefectureRegion')).toBe(true);
  });

  it('sessionLength "tout" génère une session avec tous les départements (≥ 96)', () => {
    const config: QuizConfig = { sujet: 'depts-numeros', difficulty: 'facile', sessionLength: 'tout' };
    const { result } = renderHook(() => useQuiz(config));
    expect(result.current.session.questions.length).toBeGreaterThanOrEqual(96);
  });

  it('sessionLength "tout" ne génère pas de doublon de département cible', () => {
    const config: QuizConfig = { sujet: 'depts-carte', difficulty: 'facile', sessionLength: 'tout' };
    const { result } = renderHook(() => useQuiz(config));
    const targetCodes = result.current.session.questions.map((q) => q.targetCode);
    const unique = new Set(targetCodes);
    expect(unique.size).toBe(targetCodes.length);
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
    const origChoices = (result.current.session.questions[0] as QcmQuestion).choices;

    act(() => { result.current.restartWithErrors(); });

    const retryChoices = (result.current.session.questions[0] as QcmQuestion).choices;
    expect(retryChoices).toHaveLength(origChoices.length);
    // Les codes sont les mêmes (même choix, ordre potentiellement différent)
    expect(retryChoices.map((c) => c.code).sort()).toEqual(
      origChoices.map((c) => c.code).sort(),
    );
  });

  it('les flags correct/incorrect sont préservés après le mélange de restartWithErrors', () => {
    const { result } = renderHook(() => useQuiz(QCM_CONFIG));

    act(() => { result.current.submitAnswer('__FAUX__'); }); // wrong
    const origCorrectCode = (result.current.session.questions[0] as QcmQuestion).choices.find((c) => c.correct)!.code;

    act(() => { result.current.restartWithErrors(); });

    const retryChoices = (result.current.session.questions[0] as QcmQuestion).choices;
    const correctChoices = retryChoices.filter((c) => c.correct);
    const wrongChoices   = retryChoices.filter((c) => !c.correct);

    // Exactement 1 choix correct, 3 incorrects
    expect(correctChoices).toHaveLength(1);
    expect(wrongChoices).toHaveLength(3);

    // Le bon code est toujours marqué correct
    expect(correctChoices[0].code).toBe(origCorrectCode);

    // Aucun des distracteurs ne porte le flag correct
    wrongChoices.forEach((c) => expect(c.code).not.toBe(origCorrectCode));
  });
});
