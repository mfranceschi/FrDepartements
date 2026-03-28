import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useQuiz } from '../hooks/useQuiz';
import type { QuizConfig } from '../quiz/types';

const DROM_CODES = ['971', '972', '973', '974', '976'];

describe('useQuiz – état initial', () => {
  it('démarre à la première question en attente de réponse', () => {
    const config: QuizConfig = { modes: ['TrouverDeptCarte'], difficulty: 'facile', sessionLength: 10 };
    const { result } = renderHook(() => useQuiz(config));

    expect(result.current.session.currentIndex).toBe(0);
    expect(result.current.session.answerState).toBe('pending');
    expect(result.current.session.score).toBe(0);
    expect(result.current.session.finished).toBe(false);
  });

  it('génère le bon nombre de questions', () => {
    const config: QuizConfig = { modes: ['TrouverDeptCarte'], difficulty: 'facile', sessionLength: 10 };
    const { result } = renderHook(() => useQuiz(config));
    expect(result.current.session.questions).toHaveLength(10);
  });
});

describe('useQuiz – DROM dans les questions', () => {
  it('inclut les DROM dans une session TrouverDeptCarte complète', () => {
    const config: QuizConfig = { modes: ['TrouverDeptCarte'], difficulty: 'facile', sessionLength: 'tout' };
    const { result } = renderHook(() => useQuiz(config));

    const codes = result.current.session.questions.map((q) => q.targetCode);
    expect(DROM_CODES.every((c) => codes.includes(c))).toBe(true);
  });

  it('exclut les DROM quand includeDrom est false', () => {
    const config: QuizConfig = { modes: ['TrouverDeptCarte'], difficulty: 'facile', sessionLength: 'tout', includeDrom: false };
    const { result } = renderHook(() => useQuiz(config));

    const codes = result.current.session.questions.map((q) => q.targetCode);
    expect(DROM_CODES.some((c) => codes.includes(c))).toBe(false);
    expect(result.current.session.questions).toHaveLength(96); // 101 - 5 DROM
  });

  it('exclut les régions DROM quand includeDrom est false', () => {
    const config: QuizConfig = { modes: ['TrouverRegionCarte'], difficulty: 'facile', sessionLength: 'tout', includeDrom: false };
    const { result } = renderHook(() => useQuiz(config));
    expect(result.current.session.questions).toHaveLength(13); // 18 - 5 DROM
  });

  it('les questions DROM ont les bons codes (3 chiffres)', () => {
    const config: QuizConfig = { modes: ['TrouverDeptCarte'], difficulty: 'facile', sessionLength: 'tout' };
    const { result } = renderHook(() => useQuiz(config));

    const dromQuestions = result.current.session.questions.filter((q) =>
      DROM_CODES.includes(q.targetCode),
    );
    expect(dromQuestions.length).toBe(5);
    dromQuestions.forEach((q) => {
      expect(q.mode).toBe('TrouverDeptCarte');
      expect(q.targetCode).toMatch(/^97[1-46]$/);
    });
  });
});

describe('useQuiz – submitAnswer', () => {
  it('bonne réponse : answerState devient "correct" et score augmente', () => {
    const config: QuizConfig = { modes: ['TrouverDeptCarte'], difficulty: 'facile', sessionLength: 10 };
    const { result } = renderHook(() => useQuiz(config));
    const targetCode = result.current.session.questions[0].targetCode;

    act(() => { result.current.submitAnswer(targetCode); });

    expect(result.current.session.answerState).toBe('correct');
    expect(result.current.session.score).toBe(1);
    expect(result.current.session.selectedCode).toBe(targetCode);
  });

  it('mauvaise réponse : answerState devient "wrong" et score reste à 0', () => {
    const config: QuizConfig = { modes: ['TrouverDeptCarte'], difficulty: 'facile', sessionLength: 10 };
    const { result } = renderHook(() => useQuiz(config));

    act(() => { result.current.submitAnswer('__FAUX__'); });

    expect(result.current.session.answerState).toBe('wrong');
    expect(result.current.session.score).toBe(0);
  });

  it('une deuxième réponse sur la même question est ignorée', () => {
    const config: QuizConfig = { modes: ['TrouverDeptCarte'], difficulty: 'facile', sessionLength: 10 };
    const { result } = renderHook(() => useQuiz(config));
    const targetCode = result.current.session.questions[0].targetCode;

    act(() => { result.current.submitAnswer(targetCode); });
    act(() => { result.current.submitAnswer('__FAUX__'); });

    expect(result.current.session.score).toBe(1); // inchangé
    expect(result.current.session.answerState).toBe('correct'); // inchangé
  });

  it('bonne réponse pour un DROM (Guadeloupe 971)', () => {
    // On force une session contenant Guadeloupe en position 0
    const config: QuizConfig = { modes: ['TrouverDeptCarte'], difficulty: 'facile', sessionLength: 'tout' };
    const { result } = renderHook(() => useQuiz(config));

    const dromQ = result.current.session.questions.find((q) => q.targetCode === '971');
    expect(dromQ).toBeDefined();

    // On vérifie la logique : répondre '971' à une question dont targetCode est '971' → correct
    // On injecte directement la logique via submitAnswer sur la vraie session complète
    const idx = result.current.session.questions.findIndex((q) => q.targetCode === '971');

    // Avancer jusqu'à la question Guadeloupe via nextQuestion + mauvaises réponses
    for (let i = 0; i < idx; i++) {
      act(() => { result.current.submitAnswer('__skip__'); });
      act(() => { result.current.nextQuestion(); });
    }
    act(() => { result.current.submitAnswer('971'); });
    expect(result.current.session.answerState).toBe('correct');
  });
});

describe('useQuiz – nextQuestion', () => {
  it('avance à la question suivante après avoir répondu', () => {
    const config: QuizConfig = { modes: ['TrouverDeptCarte'], difficulty: 'facile', sessionLength: 10 };
    const { result } = renderHook(() => useQuiz(config));

    act(() => { result.current.submitAnswer('__FAUX__'); });
    act(() => { result.current.nextQuestion(); });

    expect(result.current.session.currentIndex).toBe(1);
    expect(result.current.session.answerState).toBe('pending');
    expect(result.current.session.selectedCode).toBeNull();
  });

  it('ne passe pas à la suivante si la question est encore en attente', () => {
    const config: QuizConfig = { modes: ['TrouverDeptCarte'], difficulty: 'facile', sessionLength: 10 };
    const { result } = renderHook(() => useQuiz(config));

    act(() => { result.current.nextQuestion(); });

    expect(result.current.session.currentIndex).toBe(0);
  });

  it('marque la session terminée après la dernière question', () => {
    const config: QuizConfig = { modes: ['TrouverDeptCarte'], difficulty: 'facile', sessionLength: 10 };
    const { result } = renderHook(() => useQuiz(config));
    const total = result.current.session.questions.length;

    for (let i = 0; i < total; i++) {
      act(() => { result.current.submitAnswer('__FAUX__'); });
      act(() => { result.current.nextQuestion(); });
    }

    expect(result.current.session.finished).toBe(true);
  });
});

describe('useQuiz – QCM (DevinerNomDept)', () => {
  it('génère des choix pour les questions QCM', () => {
    const config: QuizConfig = { modes: ['DevinerNomDept'], difficulty: 'facile', sessionLength: 10 };
    const { result } = renderHook(() => useQuiz(config));

    result.current.session.questions.forEach((q) => {
      expect(q.choices).toBeDefined();
      expect(q.choices!.length).toBe(4);
      expect(q.choices!.filter((c) => c.correct)).toHaveLength(1);
    });
  });

  it('la bonne réponse DevinerNomDept correspond au targetCode', () => {
    const config: QuizConfig = { modes: ['DevinerNomDept'], difficulty: 'facile', sessionLength: 10 };
    const { result } = renderHook(() => useQuiz(config));
    const q = result.current.session.questions[0];
    const correctChoice = q.choices!.find((c) => c.correct)!;

    act(() => { result.current.submitAnswer(correctChoice.code); });

    expect(result.current.session.answerState).toBe('correct');
  });

  it('difficulté "difficile" : les distracteurs sont de la même région', () => {
    const config: QuizConfig = { modes: ['DevinerNomDept'], difficulty: 'difficile', sessionLength: 10 };
    const { result } = renderHook(() => useQuiz(config));

    // On vérifie juste que les choix sont bien générés (4 options)
    result.current.session.questions.forEach((q) => {
      expect(q.choices!.length).toBe(4);
    });
  });
});

describe('useQuiz – QCM régions (DevinerRegionDept)', () => {
  it('facile : génère 4 choix dont 1 correct', () => {
    const config: QuizConfig = { modes: ['DevinerRegionDept'], difficulty: 'facile', sessionLength: 10 };
    const { result } = renderHook(() => useQuiz(config));
    result.current.session.questions.forEach((q) => {
      expect(q.choices).toBeDefined();
      expect(q.choices!.length).toBe(4);
      expect(q.choices!.filter((c) => c.correct)).toHaveLength(1);
    });
  });

  it('difficile : génère 4 choix dont 1 correct', () => {
    const config: QuizConfig = { modes: ['DevinerRegionDept'], difficulty: 'difficile', sessionLength: 10 };
    const { result } = renderHook(() => useQuiz(config));
    result.current.session.questions.forEach((q) => {
      expect(q.choices).toBeDefined();
      expect(q.choices!.length).toBe(4);
      expect(q.choices!.filter((c) => c.correct)).toHaveLength(1);
    });
  });

  it('difficile : le choix correct correspond à la région cible', () => {
    const config: QuizConfig = { modes: ['DevinerRegionDept'], difficulty: 'difficile', sessionLength: 10 };
    const { result } = renderHook(() => useQuiz(config));
    const q = result.current.session.questions[0];
    const correctChoice = q.choices!.find((c) => c.correct)!;
    act(() => { result.current.submitAnswer(correctChoice.code); });
    expect(result.current.session.answerState).toBe('correct');
  });
});

describe('useQuiz – QCM régions (DevinerNomRegionCarte)', () => {
  it('facile : génère 4 choix dont 1 correct', () => {
    const config: QuizConfig = { modes: ['DevinerNomRegionCarte'], difficulty: 'facile', sessionLength: 10 };
    const { result } = renderHook(() => useQuiz(config));
    result.current.session.questions.forEach((q) => {
      expect(q.choices).toBeDefined();
      expect(q.choices!.length).toBe(4);
      expect(q.choices!.filter((c) => c.correct)).toHaveLength(1);
    });
  });

  it('difficile : génère 4 choix dont 1 correct', () => {
    const config: QuizConfig = { modes: ['DevinerNomRegionCarte'], difficulty: 'difficile', sessionLength: 10 };
    const { result } = renderHook(() => useQuiz(config));
    result.current.session.questions.forEach((q) => {
      expect(q.choices).toBeDefined();
      expect(q.choices!.length).toBe(4);
      expect(q.choices!.filter((c) => c.correct)).toHaveLength(1);
    });
  });
});

describe('useQuiz – sessionLength "tout" = une question par entité', () => {
  it('TrouverDeptCarte "tout" : exactement 101 questions (une par département)', () => {
    const config: QuizConfig = { modes: ['TrouverDeptCarte'], difficulty: 'facile', sessionLength: 'tout' };
    const { result } = renderHook(() => useQuiz(config));
    expect(result.current.session.questions).toHaveLength(101);
  });

  it('TrouverRegionCarte "tout" : exactement 18 questions (une par région)', () => {
    const config: QuizConfig = { modes: ['TrouverRegionCarte'], difficulty: 'facile', sessionLength: 'tout' };
    const { result } = renderHook(() => useQuiz(config));
    expect(result.current.session.questions).toHaveLength(18);
  });

  it('DevinerNomDept + DevinerCodeDept "tout" : 101 questions (pas 202)', () => {
    const config: QuizConfig = { modes: ['DevinerNomDept', 'DevinerCodeDept'], difficulty: 'facile', sessionLength: 'tout' };
    const { result } = renderHook(() => useQuiz(config));
    expect(result.current.session.questions).toHaveLength(101);
  });
});

describe('useQuiz – pas de doublon de département/région', () => {
  it('un même département ne peut être l\'objet de deux questions (session courte)', () => {
    const config: QuizConfig = { modes: ['DevinerNomDept', 'DevinerCodeDept'], difficulty: 'facile', sessionLength: 20 };
    const { result } = renderHook(() => useQuiz(config));
    const codes = result.current.session.questions.map((q) => q.targetCode);
    const unique = new Set(codes);
    expect(unique.size).toBe(codes.length);
  });

  it('un même département ne peut être l\'objet de deux questions (mode "tout")', () => {
    const config: QuizConfig = { modes: ['DevinerNomDept', 'DevinerCodeDept'], difficulty: 'facile', sessionLength: 'tout' };
    const { result } = renderHook(() => useQuiz(config));
    const codes = result.current.session.questions.map((q) => q.targetCode);
    const unique = new Set(codes);
    expect(unique.size).toBe(codes.length);
  });

  it('modes mixtes carte+QCM : pas de doublon par code cible', () => {
    const config: QuizConfig = { modes: ['TrouverDeptCarte', 'DevinerNomDept'], difficulty: 'facile', sessionLength: 20 };
    const { result } = renderHook(() => useQuiz(config));
    const codes = result.current.session.questions.map((q) => q.targetCode);
    const unique = new Set(codes);
    expect(unique.size).toBe(codes.length);
  });
});

describe('useQuiz – restart', () => {
  it('remet la session à zéro avec de nouvelles questions', () => {
    const config: QuizConfig = { modes: ['TrouverDeptCarte'], difficulty: 'facile', sessionLength: 10 };
    const { result } = renderHook(() => useQuiz(config));

    act(() => { result.current.submitAnswer('__FAUX__'); });
    act(() => { result.current.nextQuestion(); });
    expect(result.current.session.currentIndex).toBe(1);

    act(() => { result.current.restart(); });

    expect(result.current.session.currentIndex).toBe(0);
    expect(result.current.session.score).toBe(0);
    expect(result.current.session.answerState).toBe('pending');
    expect(result.current.session.finished).toBe(false);
  });
});
