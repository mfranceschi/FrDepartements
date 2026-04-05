import { describe, it, expect } from 'vitest';
import { generateQuestions } from '../quiz/generateQuestions';
import { DEPARTEMENTS } from '../data/departements';
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

  it('depts-carte : répartition 50/50 entre TrouverDeptCarte et DevinerNomDeptCarte', () => {
    const config: QuizConfig = { sujet: 'depts-carte', difficulty: 'facile', sessionLength: 10 };
    const questions = generateQuestions(config);
    const carte = questions.filter((q) => q.mode === 'TrouverDeptCarte').length;
    const qcm   = questions.filter((q) => q.mode === 'DevinerNomDeptCarte').length;
    expect(carte).toBe(5);
    expect(qcm).toBe(5);
  });

  it('regions-carte : répartition 50/50 entre TrouverRegionCarte et DevinerNomRegionCarte', () => {
    const config: QuizConfig = { sujet: 'regions-carte', difficulty: 'facile', sessionLength: 10 };
    const questions = generateQuestions(config);
    const carte = questions.filter((q) => q.mode === 'TrouverRegionCarte').length;
    const qcm   = questions.filter((q) => q.mode === 'DevinerNomRegionCarte').length;
    expect(carte).toBe(5);
    expect(qcm).toBe(5);
  });

  it('difficile : les distracteurs de DevinerNomDept sont dans la même région (quand la région a ≥ 3 autres depts)', () => {
    const config: QuizConfig = { sujet: 'depts-numeros', difficulty: 'difficile', sessionLength: 'tout' };
    const questions = generateQuestions(config);

    questions.filter((q) => q.mode === 'DevinerNomDept').forEach((q) => {
      const targetDept = DEPARTEMENTS.find((d) => d.code === q.targetCode)!;
      const sameRegionCount = DEPARTEMENTS.filter(
        (d) => d.regionCode === targetDept.regionCode && d.code !== targetDept.code,
      ).length;

      // Only assert when there are enough same-region depts to fill all 3 distractor slots
      if (sameRegionCount >= 3) {
        const wrongChoices = q.choices!.filter((c) => !c.correct);
        wrongChoices.forEach((c) => {
          const distractor = DEPARTEMENTS.find((d) => d.code === c.code)!;
          expect(distractor.regionCode).toBe(targetDept.regionCode);
        });
      }
    });
  });

  it('difficile : les distracteurs de DevinerCodeDept sont numériquement proches du code cible', () => {
    const config: QuizConfig = { sujet: 'depts-numeros', difficulty: 'difficile', sessionLength: 'tout' };
    const questions = generateQuestions(config);

    const toNum = (code: string) => code === '2A' ? 20.1 : code === '2B' ? 20.2 : parseInt(code, 10);

    questions.filter((q) => q.mode === 'DevinerCodeDept').forEach((q) => {
      const targetNum = toNum(q.targetCode);
      const wrongChoices = q.choices!.filter((c) => !c.correct);
      wrongChoices.forEach((c) => {
        const distractorNum = toNum(c.code);
        // Each distractor should be among the 6 numerically closest codes
        const closerCount = DEPARTEMENTS.filter(
          (d) => d.code !== q.targetCode && Math.abs(toNum(d.code) - targetNum) < Math.abs(distractorNum - targetNum),
        ).length;
        expect(closerCount).toBeLessThan(6);
      });
    });
  });
});
