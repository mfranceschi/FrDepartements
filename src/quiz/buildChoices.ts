import { REGION_ADJACENCY } from '../data/regionAdjacency';
import type { Choice } from './types';

export interface DeptChoice { code: string; nom: string; regionCode: string }
export interface RegionChoice { code: string; nom: string }
export interface PrefDeptChoice { code: string; nom: string; prefecture: string }
export interface PrefRegionChoice { code: string; nom: string; prefectureRegionale: string }

// ─── Utilitaires ──────────────────────────────────────────────────────────────

/**
 * Mélange un tableau de manière aléatoire uniforme (algorithme Fisher-Yates).
 * Retourne une nouvelle copie du tableau — l'original n'est pas muté.
 */
export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Sélectionne `n` éléments aléatoires depuis `arr`, en excluant les codes
 * présents dans `excludeCodes`. Si le pool filtré contient moins de `n`
 * éléments, retourne autant que possible.
 */
function pickRandom<T>(arr: T[], n: number, excludeCodes: Set<string>, getCode: (item: T) => string): T[] {
  const candidates = arr.filter((item) => !excludeCodes.has(getCode(item)));
  return shuffle(candidates).slice(0, n);
}

// ─── Factory générique ────────────────────────────────────────────────────────

/**
 * Construit 4 choix QCM mélangés depuis un pool.
 *
 * @param correct       L'élément dont la réponse est correcte.
 * @param allItems      Pool complet dans lequel piocher les distractors.
 * @param getCode       Extrait le code unique d'un élément.
 * @param getLabel      Extrait le label affiché d'un élément.
 * @param priorityPool  En mode difficile : éléments à préférer comme distractors
 *                      (ex. même région, régions voisines). Le fallback pioche
 *                      dans les éléments absents de ce pool si moins de 3 sont disponibles.
 */
function buildChoicesFrom<T>(
  correct: T,
  allItems: T[],
  getCode: (item: T) => string,
  getLabel: (item: T) => string,
  priorityPool?: T[],
): Choice[] {
  const exclude = new Set([getCode(correct)]);
  let distractors: T[];

  if (priorityPool && priorityPool.length > 0) {
    distractors = shuffle(priorityPool).slice(0, 3);
    if (distractors.length < 3) {
      const priorityCodes = new Set(priorityPool.map(getCode));
      const fallback = pickRandom(
        allItems.filter((item) => !priorityCodes.has(getCode(item))),
        3 - distractors.length,
        exclude,
        getCode,
      );
      distractors.push(...fallback);
    }
  } else {
    distractors = pickRandom(allItems, 3, exclude, getCode);
  }

  return shuffle([
    { code: getCode(correct), label: getLabel(correct), correct: true },
    ...distractors.slice(0, 3).map((item) => ({ code: getCode(item), label: getLabel(item), correct: false })),
  ]);
}

// ─── API publique ─────────────────────────────────────────────────────────────

/** Nom de département — distractors aléatoires toutes régions confondues. */
export function buildDeptChoicesFacile(correct: DeptChoice, allDepts: DeptChoice[]): Choice[] {
  return buildChoicesFrom(correct, allDepts, (d) => d.code, (d) => d.nom);
}

/** Nom de département — distractors prioritairement dans la même région. */
export function buildDeptChoicesDifficile(correct: DeptChoice, allDepts: DeptChoice[]): Choice[] {
  const sameRegion = allDepts.filter(
    (d) => d.regionCode === correct.regionCode && d.code !== correct.code,
  );
  return buildChoicesFrom(correct, allDepts, (d) => d.code, (d) => d.nom, sameRegion);
}

/** Code de département — distractors aléatoires toutes régions confondues. */
export function buildCodeChoicesFacile(correct: DeptChoice, allDepts: DeptChoice[]): Choice[] {
  return buildChoicesFrom(correct, allDepts, (d) => d.code, (d) => d.code);
}

/** Code de département — distractors prioritairement dans la même région. */
export function buildCodeChoicesDifficile(correct: DeptChoice, allDepts: DeptChoice[]): Choice[] {
  const sameRegion = allDepts.filter(
    (d) => d.regionCode === correct.regionCode && d.code !== correct.code,
  );
  return buildChoicesFrom(correct, allDepts, (d) => d.code, (d) => d.code, sameRegion);
}

/** Nom de région — distractors aléatoires. */
export function buildRegionChoicesFacile(correctRegion: RegionChoice, allRegions: RegionChoice[]): Choice[] {
  return buildChoicesFrom(correctRegion, allRegions, (r) => r.code, (r) => r.nom);
}

/** Nom de région — distractors prioritairement parmi les régions géographiquement voisines. */
export function buildRegionChoicesDifficile(correctRegion: RegionChoice, allRegions: RegionChoice[]): Choice[] {
  const adjacentCodes = REGION_ADJACENCY[correctRegion.code] ?? [];
  const adjacent = allRegions.filter((r) => adjacentCodes.includes(r.code));
  return buildChoicesFrom(correctRegion, allRegions, (r) => r.code, (r) => r.nom, adjacent);
}

/** Préfecture de département — distractors aléatoires. */
export function buildPrefDeptChoices(correct: PrefDeptChoice, allDepts: PrefDeptChoice[]): Choice[] {
  return buildChoicesFrom(correct, allDepts, (d) => d.code, (d) => d.prefecture);
}

/** Préfecture de région — distractors aléatoires. */
export function buildPrefRegionChoices(correct: PrefRegionChoice, allRegions: PrefRegionChoice[]): Choice[] {
  return buildChoicesFrom(correct, allRegions, (r) => r.code, (r) => r.prefectureRegionale);
}
