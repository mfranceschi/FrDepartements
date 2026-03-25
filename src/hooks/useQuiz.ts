import { useState, useCallback } from 'react';
import { DEPARTEMENTS } from '../data/departements';
import { REGIONS } from '../data/regions';
import type { QuizConfig, Question, Choice, SessionState, QuizMode } from '../quiz/types';

// ─── Fisher-Yates shuffle ────────────────────────────────────────────────────
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickRandom<T>(arr: T[], n: number, excludeCodes: Set<string>, getCode: (item: T) => string): T[] {
  const candidates = arr.filter((item) => !excludeCodes.has(getCode(item)));
  return shuffle(candidates).slice(0, n);
}

// ─── Distractors ─────────────────────────────────────────────────────────────

interface DeptChoice { code: string; nom: string; regionCode: string }
interface RegionChoice { code: string; nom: string }

function buildDeptChoicesFacile(
  correct: DeptChoice,
  allDepts: DeptChoice[],
): Choice[] {
  const exclude = new Set([correct.code]);
  const distractors = pickRandom(allDepts, 3, exclude, (d) => d.code);
  return shuffle([
    { code: correct.code, label: correct.nom, correct: true },
    ...distractors.map((d) => ({ code: d.code, label: d.nom, correct: false })),
  ]);
}

function buildDeptChoicesDifficile(
  correct: DeptChoice,
  allDepts: DeptChoice[],
): Choice[] {
  const exclude = new Set([correct.code]);
  const sameRegion = allDepts.filter(
    (d) => d.regionCode === correct.regionCode && d.code !== correct.code,
  );
  const distractors: DeptChoice[] = shuffle(sameRegion).slice(0, 3);
  if (distractors.length < 3) {
    const remaining = pickRandom(
      allDepts.filter((d) => d.regionCode !== correct.regionCode),
      3 - distractors.length,
      exclude,
      (d) => d.code,
    );
    distractors.push(...remaining);
  }
  return shuffle([
    { code: correct.code, label: correct.nom, correct: true },
    ...distractors.slice(0, 3).map((d) => ({ code: d.code, label: d.nom, correct: false })),
  ]);
}

function buildCodeChoicesFacile(
  correct: DeptChoice,
  allDepts: DeptChoice[],
): Choice[] {
  const exclude = new Set([correct.code]);
  const distractors = pickRandom(allDepts, 3, exclude, (d) => d.code);
  return shuffle([
    { code: correct.code, label: correct.code, correct: true },
    ...distractors.map((d) => ({ code: d.code, label: d.code, correct: false })),
  ]);
}

function buildCodeChoicesDifficile(
  correct: DeptChoice,
  allDepts: DeptChoice[],
): Choice[] {
  const exclude = new Set([correct.code]);
  const sameRegion = allDepts.filter(
    (d) => d.regionCode === correct.regionCode && d.code !== correct.code,
  );
  const distractors: DeptChoice[] = shuffle(sameRegion).slice(0, 3);
  if (distractors.length < 3) {
    const remaining = pickRandom(
      allDepts.filter((d) => d.regionCode !== correct.regionCode),
      3 - distractors.length,
      exclude,
      (d) => d.code,
    );
    distractors.push(...remaining);
  }
  return shuffle([
    { code: correct.code, label: correct.code, correct: true },
    ...distractors.slice(0, 3).map((d) => ({ code: d.code, label: d.code, correct: false })),
  ]);
}

function buildRegionChoicesFacile(
  correctRegion: RegionChoice,
  allRegions: RegionChoice[],
): Choice[] {
  const exclude = new Set([correctRegion.code]);
  const distractors = pickRandom(allRegions, 3, exclude, (r) => r.code);
  return shuffle([
    { code: correctRegion.code, label: correctRegion.nom, correct: true },
    ...distractors.map((r) => ({ code: r.code, label: r.nom, correct: false })),
  ]);
}

function buildRegionChoicesDifficile(
  correctRegion: RegionChoice,
  allRegions: RegionChoice[],
): Choice[] {
  // For region distractors in "difficile" mode we just use random metro regions
  // (there's no "neighboring region" concept in the data model)
  return buildRegionChoicesFacile(correctRegion, allRegions);
}

// ─── Question generation ─────────────────────────────────────────────────────

function generateQuestions(config: QuizConfig): Question[] {
  const allDepts = DEPARTEMENTS.map((d) => ({
    code: d.code,
    nom: d.nom,
    regionCode: d.regionCode,
    outresMer: d.outresMer,
  }));
  const metroDepts = allDepts.filter((d) => !d.outresMer);
  const metroRegions = REGIONS.filter((r) => !r.outresMer).map((r) => ({
    code: r.code,
    nom: r.nom,
  }));

  type PoolItem = { mode: QuizMode; code: string; nom: string; regionCode?: string };
  const pool: PoolItem[] = [];

  for (const mode of config.modes) {
    switch (mode) {
      case 'TrouverDeptCarte':
        metroDepts.forEach((d) =>
          pool.push({ mode, code: d.code, nom: d.nom, regionCode: d.regionCode }),
        );
        break;
      case 'TrouverRegionCarte':
        metroRegions.forEach((r) => pool.push({ mode, code: r.code, nom: r.nom }));
        break;
      case 'DevinerCodeDept':
      case 'DevinerNomDept':
      case 'DevinerRegionDept':
        allDepts.forEach((d) =>
          pool.push({ mode, code: d.code, nom: d.nom, regionCode: d.regionCode }),
        );
        break;
    }
  }

  const shuffled = shuffle(pool);
  const count =
    config.sessionLength === 'tout' ? shuffled.length : Math.min(config.sessionLength, shuffled.length);
  const selected = shuffled.slice(0, count);

  return selected.map((item, idx): Question => {
    const base: Question = {
      id: `q-${idx}-${item.code}-${item.mode}`,
      mode: item.mode,
      targetCode: item.code,
      targetNom: item.nom,
      targetRegionCode: item.regionCode,
    };

    switch (item.mode) {
      case 'DevinerCodeDept': {
        const deptItem: DeptChoice = { code: item.code, nom: item.nom, regionCode: item.regionCode ?? '' };
        base.choices =
          config.difficulty === 'facile'
            ? buildCodeChoicesFacile(deptItem, allDepts)
            : buildCodeChoicesDifficile(deptItem, allDepts);
        break;
      }
      case 'DevinerNomDept': {
        const deptItem: DeptChoice = { code: item.code, nom: item.nom, regionCode: item.regionCode ?? '' };
        base.choices =
          config.difficulty === 'facile'
            ? buildDeptChoicesFacile(deptItem, allDepts)
            : buildDeptChoicesDifficile(deptItem, allDepts);
        break;
      }
      case 'DevinerRegionDept': {
        const correctRegion = metroRegions.find((r) => r.code === item.regionCode);
        if (correctRegion) {
          base.choices =
            config.difficulty === 'facile'
              ? buildRegionChoicesFacile(correctRegion, metroRegions)
              : buildRegionChoicesDifficile(correctRegion, metroRegions);
        }
        break;
      }
      default:
        break;
    }

    return base;
  });
}

// ─── Hook ────────────────────────────────────────────────────────────────────

function buildInitialSession(config: QuizConfig): SessionState {
  return {
    questions: generateQuestions(config),
    currentIndex: 0,
    score: 0,
    answerState: 'pending',
    selectedCode: null,
    finished: false,
  };
}

export function useQuiz(config: QuizConfig): {
  session: SessionState;
  submitAnswer: (code: string) => void;
  nextQuestion: () => void;
  restart: () => void;
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
          correct = code === question.targetCode;
          break;
        case 'DevinerCodeDept':
          correct = code === question.targetCode;
          break;
        case 'DevinerNomDept':
          correct = code === question.targetCode;
          break;
        case 'DevinerRegionDept':
          correct = code === question.targetRegionCode;
          break;
      }

      return {
        ...prev,
        answerState: correct ? 'correct' : 'wrong',
        score: correct ? prev.score + 1 : prev.score,
        selectedCode: code,
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
    setSession(buildInitialSession(config));
  }, [config]);

  return { session, submitAnswer, nextQuestion, restart };
}
