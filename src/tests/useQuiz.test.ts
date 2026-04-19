import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useQuiz } from '../hooks/useQuiz';
import type { QuizConfig, QcmQuestion } from '../quiz/types';

describe('useQuiz – état initial', () => {
  it('démarre à la première question en attente de réponse', () => {
    const config: QuizConfig = { sujet: 'depts-carte', difficulty: 'facile', sessionLength: 10 };
    const { result } = renderHook(() => useQuiz(config));

    expect(result.current.session.currentIndex).toBe(0);
    expect(result.current.session.answerState).toBe('pending');
    expect(result.current.session.score).toBe(0);
    expect(result.current.session.finished).toBe(false);
  });

  it('génère le bon nombre de questions', () => {
    const config: QuizConfig = { sujet: 'depts-carte', difficulty: 'facile', sessionLength: 10 };
    const { result } = renderHook(() => useQuiz(config));
    expect(result.current.session.questions).toHaveLength(10);
  });
});

describe('useQuiz – submitAnswer', () => {
  it('bonne réponse : answerState devient "correct" et score augmente', () => {
    const config: QuizConfig = { sujet: 'depts-carte', difficulty: 'facile', sessionLength: 10 };
    const { result } = renderHook(() => useQuiz(config));
    const targetCode = result.current.session.questions[0].targetCode;

    act(() => { result.current.submitAnswer(targetCode); });

    expect(result.current.session.answerState).toBe('correct');
    expect(result.current.session.score).toBe(1);
    expect(result.current.session.selectedCode).toBe(targetCode);
  });

  it('mauvaise réponse : answerState devient "wrong" et score reste à 0', () => {
    const config: QuizConfig = { sujet: 'depts-carte', difficulty: 'facile', sessionLength: 10 };
    const { result } = renderHook(() => useQuiz(config));

    act(() => { result.current.submitAnswer('__FAUX__'); });

    expect(result.current.session.answerState).toBe('wrong');
    expect(result.current.session.score).toBe(0);
  });

  it('une deuxième réponse sur la même question est ignorée', () => {
    const config: QuizConfig = { sujet: 'depts-carte', difficulty: 'facile', sessionLength: 10 };
    const { result } = renderHook(() => useQuiz(config));
    const targetCode = result.current.session.questions[0].targetCode;

    act(() => { result.current.submitAnswer(targetCode); });
    act(() => { result.current.submitAnswer('__FAUX__'); });

    expect(result.current.session.score).toBe(1); // inchangé
    expect(result.current.session.answerState).toBe('correct'); // inchangé
  });

});

describe('useQuiz – nextQuestion', () => {
  it('avance à la question suivante après avoir répondu', () => {
    const config: QuizConfig = { sujet: 'depts-carte', difficulty: 'facile', sessionLength: 10 };
    const { result } = renderHook(() => useQuiz(config));

    act(() => { result.current.submitAnswer('__FAUX__'); });
    act(() => { result.current.nextQuestion(); });

    expect(result.current.session.currentIndex).toBe(1);
    expect(result.current.session.answerState).toBe('pending');
    expect(result.current.session.selectedCode).toBeNull();
  });

  it('ne passe pas à la suivante si la question est encore en attente', () => {
    const config: QuizConfig = { sujet: 'depts-carte', difficulty: 'facile', sessionLength: 10 };
    const { result } = renderHook(() => useQuiz(config));

    act(() => { result.current.nextQuestion(); });

    expect(result.current.session.currentIndex).toBe(0);
  });

  it('marque la session terminée après la dernière question', () => {
    const config: QuizConfig = { sujet: 'depts-carte', difficulty: 'facile', sessionLength: 10 };
    const { result } = renderHook(() => useQuiz(config));
    const total = result.current.session.questions.length;

    for (let i = 0; i < total; i++) {
      act(() => { result.current.submitAnswer('__FAUX__'); });
      act(() => { result.current.nextQuestion(); });
    }

    expect(result.current.session.finished).toBe(true);
  });
});

describe('useQuiz – QCM (depts-numeros)', () => {
  it('génère des choix pour les questions QCM', () => {
    const config: QuizConfig = { sujet: 'depts-numeros', difficulty: 'facile', sessionLength: 10 };
    const { result } = renderHook(() => useQuiz(config));

    result.current.session.questions.forEach((q) => {
      const qcm = q as QcmQuestion;
      expect(qcm.choices).toHaveLength(4);
      expect(qcm.choices.filter((c) => c.correct)).toHaveLength(1);
    });
  });

  it('la bonne réponse correspond au targetCode', () => {
    const config: QuizConfig = { sujet: 'depts-numeros', difficulty: 'facile', sessionLength: 10 };
    const { result } = renderHook(() => useQuiz(config));
    const q = result.current.session.questions[0] as QcmQuestion;
    const correctChoice = q.choices.find((c) => c.correct)!;

    act(() => { result.current.submitAnswer(correctChoice.code); });

    expect(result.current.session.answerState).toBe('correct');
  });

  it('difficulté "difficile" : génère 4 choix par question', () => {
    const config: QuizConfig = { sujet: 'depts-numeros', difficulty: 'difficile', sessionLength: 10 };
    const { result } = renderHook(() => useQuiz(config));

    result.current.session.questions.forEach((q) => {
      expect((q as QcmQuestion).choices.length).toBe(4);
    });
  });
});

describe('useQuiz – QCM préfectures (depts-prefectures)', () => {
  it('génère 4 choix dont 1 correct', () => {
    const config: QuizConfig = { sujet: 'depts-prefectures', difficulty: 'facile', sessionLength: 10 };
    const { result } = renderHook(() => useQuiz(config));
    result.current.session.questions.forEach((q) => {
      const qcm = q as QcmQuestion;
      expect(qcm.choices).toHaveLength(4);
      expect(qcm.choices.filter((c) => c.correct)).toHaveLength(1);
    });
  });

  it('le choix correct valide la réponse', () => {
    const config: QuizConfig = { sujet: 'depts-prefectures', difficulty: 'facile', sessionLength: 10 };
    const { result } = renderHook(() => useQuiz(config));
    const q = result.current.session.questions[0] as QcmQuestion;
    const correctChoice = q.choices.find((c) => c.correct)!;
    act(() => { result.current.submitAnswer(correctChoice.code); });
    expect(result.current.session.answerState).toBe('correct');
  });
});

describe('useQuiz – QCM régions (regions-carte)', () => {
  it('les questions QCM ont 4 choix dont 1 correct', () => {
    const config: QuizConfig = { sujet: 'regions-carte', difficulty: 'facile', sessionLength: 10 };
    const { result } = renderHook(() => useQuiz(config));
    result.current.session.questions
      .filter((q) => q.mode === 'DevinerNomRegionCarte')
      .forEach((q) => {
        const qcm = q as QcmQuestion;
        expect(qcm.choices).toHaveLength(4);
        expect(qcm.choices.filter((c) => c.correct)).toHaveLength(1);
      });
  });
});

describe('useQuiz – sessionLength "tout" = une question par entité', () => {
  it('depts-carte "tout" : exactement 96 questions (une par département)', () => {
    const config: QuizConfig = { sujet: 'depts-carte', difficulty: 'facile', sessionLength: 'tout' };
    const { result } = renderHook(() => useQuiz(config));
    expect(result.current.session.questions).toHaveLength(96);
  });

  it('regions-carte "tout" : exactement 13 questions (une par région)', () => {
    const config: QuizConfig = { sujet: 'regions-carte', difficulty: 'facile', sessionLength: 'tout' };
    const { result } = renderHook(() => useQuiz(config));
    expect(result.current.session.questions).toHaveLength(13);
  });

  it('depts-numeros "tout" : 96 questions (pas 192)', () => {
    const config: QuizConfig = { sujet: 'depts-numeros', difficulty: 'facile', sessionLength: 'tout' };
    const { result } = renderHook(() => useQuiz(config));
    expect(result.current.session.questions).toHaveLength(96);
  });
});

describe('useQuiz – pas de doublon de département/région', () => {
  it('un même département ne peut être l\'objet de deux questions (session courte)', () => {
    const config: QuizConfig = { sujet: 'depts-numeros', difficulty: 'facile', sessionLength: 25 };
    const { result } = renderHook(() => useQuiz(config));
    const codes = result.current.session.questions.map((q) => q.targetCode);
    const unique = new Set(codes);
    expect(unique.size).toBe(codes.length);
  });

  it('un même département ne peut être l\'objet de deux questions (mode "tout")', () => {
    const config: QuizConfig = { sujet: 'depts-numeros', difficulty: 'facile', sessionLength: 'tout' };
    const { result } = renderHook(() => useQuiz(config));
    const codes = result.current.session.questions.map((q) => q.targetCode);
    const unique = new Set(codes);
    expect(unique.size).toBe(codes.length);
  });

  it('sujet depts-carte (carte+QCM mixte) : pas de doublon par code cible', () => {
    const config: QuizConfig = { sujet: 'depts-carte', difficulty: 'facile', sessionLength: 25 };
    const { result } = renderHook(() => useQuiz(config));
    const codes = result.current.session.questions.map((q) => q.targetCode);
    const unique = new Set(codes);
    expect(unique.size).toBe(codes.length);
  });
});

describe('useQuiz – restart', () => {
  it('remet la session à zéro avec de nouvelles questions', () => {
    const config: QuizConfig = { sujet: 'depts-carte', difficulty: 'facile', sessionLength: 10 };
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

describe('useQuiz – QCM (DevinerCodeDept)', () => {
  it('les labels des choix DevinerCodeDept sont des codes (pas des noms)', () => {
    const config: QuizConfig = { sujet: 'depts-numeros', difficulty: 'facile', sessionLength: 'tout' };
    const { result } = renderHook(() => useQuiz(config));
    result.current.session.questions
      .filter((q) => q.mode === 'DevinerCodeDept')
      .forEach((q) => {
        (q as QcmQuestion).choices.forEach((c) => {
          expect(c.label).toBe(c.code);
        });
      });
  });
});

describe('useQuiz – QCM (DevinerNomDeptCarte)', () => {
  it('génère des choices pour DevinerNomDeptCarte', () => {
    const config: QuizConfig = { sujet: 'depts-carte', difficulty: 'facile', sessionLength: 'tout' };
    const { result } = renderHook(() => useQuiz(config));
    result.current.session.questions
      .filter((q) => q.mode === 'DevinerNomDeptCarte')
      .forEach((q) => {
        const qcm = q as QcmQuestion;
        expect(qcm.choices).toHaveLength(4);
        expect(qcm.choices.filter((c) => c.correct)).toHaveLength(1);
      });
  });
});

describe('useQuiz – restartWithErrors après session terminée', () => {
  it('finished repasse à false après restartWithErrors', () => {
    const config: QuizConfig = { sujet: 'depts-carte', difficulty: 'facile', sessionLength: 10 };
    const { result } = renderHook(() => useQuiz(config));
    const total = result.current.session.questions.length;

    for (let i = 0; i < total; i++) {
      act(() => { result.current.submitAnswer('__FAUX__'); });
      act(() => { result.current.nextQuestion(); });
    }
    expect(result.current.session.finished).toBe(true);

    act(() => { result.current.restartWithErrors(); });
    expect(result.current.session.finished).toBe(false);
    expect(result.current.session.currentIndex).toBe(0);
  });
});
