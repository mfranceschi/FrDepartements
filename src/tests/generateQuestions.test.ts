import { describe, it, expect } from 'vitest';
import { generateQuestions } from '../quiz/generateQuestions';
import { DEPARTEMENTS } from '../data/departements';
import type { QuizConfig, QcmQuestion } from '../quiz/types';

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
      const qcm = q as QcmQuestion;
      expect(qcm.choices).toHaveLength(4);
      expect(qcm.choices.filter((c) => c.correct)).toHaveLength(1);
    });
  });

  it('les questions DevinerNomDeptCarte ont 4 choices dont exactement 1 correct', () => {
    const config: QuizConfig = { sujet: 'depts-carte', difficulty: 'facile', sessionLength: 'tout' };
    const questions = generateQuestions(config);
    questions.filter((q) => q.mode === 'DevinerNomDeptCarte').forEach((q) => {
      const qcm = q as QcmQuestion;
      expect(qcm.choices).toHaveLength(4);
      expect(qcm.choices.filter((c) => c.correct)).toHaveLength(1);
    });
  });

  it('les labels des choix DevinerCodeDept sont des codes (pas des noms)', () => {
    const config: QuizConfig = { sujet: 'depts-numeros', difficulty: 'facile', sessionLength: 'tout' };
    const questions = generateQuestions(config);
    questions.filter((q) => q.mode === 'DevinerCodeDept').forEach((q) => {
      (q as QcmQuestion).choices.forEach((c) => {
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
        const wrongChoices = (q as QcmQuestion).choices.filter((c) => !c.correct);
        wrongChoices.forEach((c) => {
          const distractor = DEPARTEMENTS.find((d) => d.code === c.code)!;
          expect(distractor.regionCode).toBe(targetDept.regionCode);
        });
      }
    });
  });

  it('répartition carte/QCM avec nombre impair : carte prend ceil(n/2)', () => {
    for (const sessionLength of [25, 10] as const) {
      const config: QuizConfig = { sujet: 'depts-carte', difficulty: 'facile', sessionLength };
      const questions = generateQuestions(config);
      const carte = questions.filter((q) => q.mode === 'TrouverDeptCarte').length;
      const qcm   = questions.filter((q) => q.mode === 'DevinerNomDeptCarte').length;
      expect(carte).toBe(Math.ceil(sessionLength / 2));
      expect(qcm).toBe(sessionLength - Math.ceil(sessionLength / 2));
    }
  });

  describe('filterCodes', () => {
    it('restreint les questions aux codes fournis', () => {
      const codes = ['14', '27', '50', '61', '76']; // Normandie
      const config: QuizConfig = { sujet: 'depts-numeros', difficulty: 'facile', sessionLength: 'tout', filterCodes: codes };
      const questions = generateQuestions(config);
      expect(questions.length).toBe(codes.length);
      questions.forEach((q) => expect(codes).toContain(q.targetCode));
    });

    it('sessionLength est respecté dans la limite de filterCodes', () => {
      const codes = ['14', '27', '50', '61', '76'];
      const config: QuizConfig = { sujet: 'depts-numeros', difficulty: 'facile', sessionLength: 10, filterCodes: codes };
      const questions = generateQuestions(config);
      expect(questions.length).toBe(5); // filterCodes a 5 items < sessionLength 10
    });

    it('filterCodes sur sujet mixte carte/QCM : seuls les codes filtrés apparaissent', () => {
      const codes = ['14', '27', '50', '61', '76'];
      const config: QuizConfig = { sujet: 'depts-carte', difficulty: 'facile', sessionLength: 'tout', filterCodes: codes };
      const questions = generateQuestions(config);
      questions.forEach((q) => expect(codes).toContain(q.targetCode));
    });

    it('les distracteurs QCM incluent des depts hors filterCodes', () => {
      const codes = ['14', '27', '50', '61', '76'];
      const config: QuizConfig = { sujet: 'depts-numeros', difficulty: 'facile', sessionLength: 'tout', filterCodes: codes };
      const questions = generateQuestions(config);
      const allDistractorCodes = questions.flatMap((q) =>
        (q as QcmQuestion).choices.filter((c) => !c.correct).map((c) => c.code),
      );
      expect(allDistractorCodes.some((c) => !codes.includes(c))).toBe(true);
    });
  });

  it('difficile : les distracteurs de DevinerCodeDept sont numériquement proches du code cible', () => {
    const config: QuizConfig = { sujet: 'depts-numeros', difficulty: 'difficile', sessionLength: 'tout' };
    const questions = generateQuestions(config);

    const toNum = (code: string) => code === '2A' ? 20.1 : code === '2B' ? 20.2 : parseInt(code, 10);

    questions.filter((q) => q.mode === 'DevinerCodeDept').forEach((q) => {
      const targetNum = toNum(q.targetCode);
      const wrongChoices = (q as QcmQuestion).choices.filter((c) => !c.correct);
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
