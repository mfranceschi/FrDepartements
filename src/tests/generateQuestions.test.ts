import { describe, it, expect } from 'vitest';
import { generateQuestions } from '../quiz/generateQuestions';
import type { QuizConfig } from '../quiz/types';

describe('generateQuestions – fonction pure', () => {
  it('retourne le bon nombre de questions', () => {
    const config: QuizConfig = { sujet: 'depts-carte', difficulty: 'facile', sessionLength: 10 };
    expect(generateQuestions(config)).toHaveLength(10);
  });

  it('chaque question a un id unique', () => {
    const config: QuizConfig = { sujet: 'depts-numeros', difficulty: 'facile', sessionLength: 25 };
    const questions = generateQuestions(config);
    const ids = questions.map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('les questions QCM ont 4 choices dont exactement 1 correct', () => {
    const config: QuizConfig = { sujet: 'depts-numeros', difficulty: 'facile', sessionLength: 'tout' };
    const questions = generateQuestions(config);
    questions.forEach((q) => {
      expect(q.choices).toHaveLength(4);
      expect(q.choices!.filter((c) => c.correct)).toHaveLength(1);
    });
  });

  it('les questions DevinerNomDeptCarte ont 4 choices dont exactement 1 correct', () => {
    const config: QuizConfig = { sujet: 'depts-carte', difficulty: 'facile', sessionLength: 'tout' };
    const questions = generateQuestions(config);
    questions.filter((q) => q.mode === 'DevinerNomDeptCarte').forEach((q) => {
      expect(q.choices).toBeDefined();
      expect(q.choices!).toHaveLength(4);
      expect(q.choices!.filter((c) => c.correct)).toHaveLength(1);
    });
  });

  it('les labels des choix DevinerCodeDept sont des codes (pas des noms)', () => {
    const config: QuizConfig = { sujet: 'depts-numeros', difficulty: 'facile', sessionLength: 'tout' };
    const questions = generateQuestions(config);
    questions.filter((q) => q.mode === 'DevinerCodeDept').forEach((q) => {
      q.choices!.forEach((c) => {
        expect(c.label).toBe(c.code);
      });
    });
  });

  it('pas de doublon de code cible en mode mixte carte+QCM', () => {
    const config: QuizConfig = { sujet: 'depts-carte', difficulty: 'facile', sessionLength: 25 };
    const questions = generateQuestions(config);
    const codes = questions.map((q) => q.targetCode);
    expect(new Set(codes).size).toBe(codes.length);
  });

  it('sessionLength "tout" avec sujet depts-carte : au plus 101 questions', () => {
    const config: QuizConfig = { sujet: 'depts-carte', difficulty: 'facile', sessionLength: 'tout' };
    const questions = generateQuestions(config);
    expect(questions.length).toBeLessThanOrEqual(101);
    const codes = questions.map((q) => q.targetCode);
    expect(new Set(codes).size).toBe(codes.length);
  });
});
