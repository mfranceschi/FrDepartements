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

// ─── Distractors départements ─────────────────────────────────────────────────

/**
 * Construit 4 choix QCM pour un mode « Deviner le nom » en difficulté **facile** :
 * les 3 distractors sont tirés aléatoirement parmi tous les départements,
 * toutes régions confondues.
 */
export function buildDeptChoicesFacile(correct: DeptChoice, allDepts: DeptChoice[]): Choice[] {
  const exclude = new Set([correct.code]);
  const distractors = pickRandom(allDepts, 3, exclude, (d) => d.code);
  return shuffle([
    { code: correct.code, label: correct.nom, correct: true },
    ...distractors.map((d) => ({ code: d.code, label: d.nom, correct: false })),
  ]);
}

/**
 * Construit 4 choix QCM pour un mode « Deviner le nom » en difficulté **difficile** :
 * les distractors sont prioritairement pris dans la même région que le département
 * cible (voisins proches), ce qui rend la discrimination plus difficile.
 */
export function buildDeptChoicesDifficile(correct: DeptChoice, allDepts: DeptChoice[]): Choice[] {
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

// ─── Distractors codes ────────────────────────────────────────────────────────

/**
 * Construit 4 choix QCM pour un mode « Deviner le code » en difficulté **facile** :
 * les labels affichés sont les codes (ex. « 75 », « 13 »), distractors aléatoires.
 */
export function buildCodeChoicesFacile(correct: DeptChoice, allDepts: DeptChoice[]): Choice[] {
  const exclude = new Set([correct.code]);
  const distractors = pickRandom(allDepts, 3, exclude, (d) => d.code);
  return shuffle([
    { code: correct.code, label: correct.code, correct: true },
    ...distractors.map((d) => ({ code: d.code, label: d.code, correct: false })),
  ]);
}

/**
 * Construit 4 choix QCM pour un mode « Deviner le code » en difficulté **difficile** :
 * les distractors sont des codes de départements de la même région.
 */
export function buildCodeChoicesDifficile(correct: DeptChoice, allDepts: DeptChoice[]): Choice[] {
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

// ─── Distractors régions ──────────────────────────────────────────────────────

/**
 * Construit 4 choix QCM pour un mode « Deviner la région » en difficulté **facile** :
 * les distractors sont des régions tirées aléatoirement parmi toutes les régions.
 */
export function buildRegionChoicesFacile(correctRegion: RegionChoice, allRegions: RegionChoice[]): Choice[] {
  const exclude = new Set([correctRegion.code]);
  const distractors = pickRandom(allRegions, 3, exclude, (r) => r.code);
  return shuffle([
    { code: correctRegion.code, label: correctRegion.nom, correct: true },
    ...distractors.map((r) => ({ code: r.code, label: r.nom, correct: false })),
  ]);
}

/**
 * Construit 4 choix QCM pour un mode « Deviner la région » en difficulté **difficile** :
 * les distractors sont prioritairement des régions géographiquement voisines.
 */
export function buildRegionChoicesDifficile(correctRegion: RegionChoice, allRegions: RegionChoice[]): Choice[] {
  const exclude = new Set([correctRegion.code]);
  const adjacentCodes = REGION_ADJACENCY[correctRegion.code] ?? [];
  const adjacent = allRegions.filter((r) => adjacentCodes.includes(r.code));
  const distractors: RegionChoice[] = shuffle(adjacent).slice(0, 3);
  if (distractors.length < 3) {
    const remaining = pickRandom(
      allRegions.filter((r) => !adjacentCodes.includes(r.code)),
      3 - distractors.length,
      exclude,
      (r) => r.code,
    );
    distractors.push(...remaining);
  }
  return shuffle([
    { code: correctRegion.code, label: correctRegion.nom, correct: true },
    ...distractors.slice(0, 3).map((r) => ({ code: r.code, label: r.nom, correct: false })),
  ]);
}

// ─── Distractors préfectures ──────────────────────────────────────────────────

/**
 * Construit 4 choix QCM pour « Deviner la préfecture d'un département » :
 * la bonne réponse est le nom de la préfecture du département cible ;
 * les distractors sont des préfectures d'autres départements.
 * Le `code` de chaque choix correspond au code du département (permet la validation
 * par comparaison avec `targetCode`).
 */
export function buildPrefDeptChoices(correct: PrefDeptChoice, allDepts: PrefDeptChoice[]): Choice[] {
  const exclude = new Set([correct.code]);
  const distractors = pickRandom(allDepts, 3, exclude, (d) => d.code);
  return shuffle([
    { code: correct.code, label: correct.prefecture, correct: true },
    ...distractors.map((d) => ({ code: d.code, label: d.prefecture, correct: false })),
  ]);
}

/**
 * Construit 4 choix QCM pour « Deviner la préfecture d'une région » :
 * la bonne réponse est le nom de la préfecture régionale ;
 * les distractors sont des préfectures régionales d'autres régions.
 */
export function buildPrefRegionChoices(correct: PrefRegionChoice, allRegions: PrefRegionChoice[]): Choice[] {
  const exclude = new Set([correct.code]);
  const distractors = pickRandom(allRegions, 3, exclude, (r) => r.code);
  return shuffle([
    { code: correct.code, label: correct.prefectureRegionale, correct: true },
    ...distractors.map((r) => ({ code: r.code, label: r.prefectureRegionale, correct: false })),
  ]);
}
