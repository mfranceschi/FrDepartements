import { DEPARTEMENTS } from '../data/departements';
import { REGIONS } from '../data/regions';
import {
  shuffle,
  buildDeptChoicesFacile,
  buildDeptChoicesDifficile,
  buildCodeChoicesFacile,
  buildCodeChoicesDifficile,
  buildRegionChoicesFacile,
  buildRegionChoicesDifficile,
  buildPrefDeptChoicesFacile,
  buildPrefDeptChoicesDifficile,
  buildPrefRegionChoicesFacile,
  buildPrefRegionChoicesDifficile,
  type DeptChoice,
} from './buildChoices';
import type { QuizConfig, QuizSujet, Question, SessionState, QuizMode, CarteMode, QcmMode, Choice } from './types';
import type { ItemStatsStore } from '../storage/useItemStats';

// Pre-computed once — these are static data that never change at runtime
const ALL_DEPTS = DEPARTEMENTS.map((d) => ({
  code: d.code,
  nom: d.nom,
  regionCode: d.regionCode,
  prefecture: d.prefecture,
}));

const ALL_REGIONS = REGIONS.map((r) => ({
  code: r.code,
  nom: r.nom,
  prefectureRegionale: r.prefectureRegionale,
}));

function deduplicateByCode<T extends { code: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.code)) return false;
    seen.add(item.code);
    return true;
  });
}

export const CARTE_MODES = new Set<QuizMode>(['TrouverDeptCarte', 'TrouverRegionCarte']);
export const QCM_MODES = new Set<QuizMode>([
  'DevinerNomRegionCarte',
  'DevinerNomDeptCarte',
  'DevinerCodeDept',
  'DevinerNomDept',
  'DevinerPrefectureDept',
  'DevinerPrefectureRegion',
]);

/** Modes internes utilisés pour chaque sujet. */
const SUJET_MODES: Record<QuizSujet, QuizMode[]> = {
  'regions-carte':       ['TrouverRegionCarte', 'DevinerNomRegionCarte'],
  'depts-carte':         ['TrouverDeptCarte', 'DevinerNomDeptCarte'],
  'depts-numeros':       ['DevinerCodeDept', 'DevinerNomDept'],
  'depts-prefectures':   ['DevinerPrefectureDept'],
  'regions-prefectures': ['DevinerPrefectureRegion'],
};

// Pool item for internal question generation — moved to module level so it's reusable
type PoolItem = { mode: QuizMode; code: string; nom: string; regionCode?: string };

/** Construit les choix QCM pour un item donné selon la config. */
function buildQcmChoices(item: PoolItem, config: QuizConfig): Choice[] {
  const { code, nom, regionCode = '', mode } = item;

  switch (mode) {
    case 'DevinerCodeDept': {
      const dept: DeptChoice = { code, nom, regionCode };
      return config.difficulty === 'facile'
        ? buildCodeChoicesFacile(dept, ALL_DEPTS)
        : buildCodeChoicesDifficile(dept, ALL_DEPTS);
    }
    case 'DevinerNomDept':
    case 'DevinerNomDeptCarte': {
      const dept: DeptChoice = { code, nom, regionCode };
      return config.difficulty === 'facile'
        ? buildDeptChoicesFacile(dept, ALL_DEPTS)
        : buildDeptChoicesDifficile(dept, ALL_DEPTS);
    }
    case 'DevinerNomRegionCarte': {
      const region = ALL_REGIONS.find((r) => r.code === code);
      if (!region) return [];
      return config.difficulty === 'facile'
        ? buildRegionChoicesFacile(region, ALL_REGIONS)
        : buildRegionChoicesDifficile(region, ALL_REGIONS);
    }
    case 'DevinerPrefectureDept': {
      const dept = ALL_DEPTS.find((d) => d.code === code);
      if (!dept) return [];
      return config.difficulty === 'facile'
        ? buildPrefDeptChoicesFacile(dept, ALL_DEPTS)
        : buildPrefDeptChoicesDifficile(dept, ALL_DEPTS);
    }
    case 'DevinerPrefectureRegion': {
      const region = ALL_REGIONS.find((r) => r.code === code);
      if (!region) return [];
      return config.difficulty === 'facile'
        ? buildPrefRegionChoicesFacile(region, ALL_REGIONS)
        : buildPrefRegionChoicesDifficile(region, ALL_REGIONS);
    }
    default:
      return [];
  }
}

function itemWeight(code: string, sujetStats: Record<string, { ok: number; fail: number }> | undefined): number {
  if (!sujetStats) return 1;
  const stat = sujetStats[code];
  if (!stat) return 1;
  const total = stat.ok + stat.fail;
  if (total === 0) return 1;
  const rate = stat.ok / total;
  if (rate < 0.5) return 3;
  if (rate < 0.8) return 1.5;
  return 0.5;
}

function weightedSample<T>(items: T[], n: number, getWeight: (item: T) => number): T[] {
  if (n >= items.length) return shuffle(items);
  const pool = [...items];
  const result: T[] = [];
  while (result.length < n && pool.length > 0) {
    const weights = pool.map(getWeight);
    const total = weights.reduce((a, b) => a + b, 0);
    let rand = Math.random() * total;
    let idx = pool.length - 1;
    for (let i = 0; i < weights.length; i++) {
      rand -= weights[i];
      if (rand <= 0) { idx = i; break; }
    }
    result.push(pool[idx]);
    pool.splice(idx, 1);
  }
  return result;
}

/**
 * Génère la liste ordonnée de questions pour une session à partir de la
 * configuration utilisateur.
 *
 * **Équilibrage carte / QCM** : pour les sujets qui mêlent un mode carte et un
 * mode QCM (`regions-carte`, `depts-carte`), les questions sont réparties à
 * 50/50 (arrondi supérieur pour la carte) afin qu'aucun type ne domine l'autre.
 *
 * **Choix multiples** : les questions QCM incluent leurs `choices` pré-construits
 * ici afin que le rendu n'ait aucune logique de génération à exécuter.
 */
export function generateQuestions(config: QuizConfig, itemStats?: ItemStatsStore): Question[] {
  const modes = SUJET_MODES[config.sujet];

  const filterSet = config.filterCodes ? new Set(config.filterCodes) : null;
  const deptPool = filterSet ? ALL_DEPTS.filter(d => filterSet.has(d.code)) : ALL_DEPTS;
  const regionPool = filterSet ? ALL_REGIONS.filter(r => filterSet.has(r.code)) : ALL_REGIONS;

  const sujetStats = itemStats?.[config.sujet];
  const getWeight = config.adaptative
    ? (item: PoolItem) => itemWeight(item.code, sujetStats)
    : () => 1;
  const selectFrom = (pool: PoolItem[], n: number): PoolItem[] =>
    config.adaptative ? weightedSample(pool, n, getWeight) : shuffle(pool).slice(0, n);

  const cartePool: PoolItem[] = [];
  const qcmPool: PoolItem[] = [];

  for (const mode of modes) {
    switch (mode) {
      case 'TrouverDeptCarte':
        deptPool.forEach((d) => cartePool.push({ mode, code: d.code, nom: d.nom, regionCode: d.regionCode }));
        break;
      case 'TrouverRegionCarte':
        regionPool.forEach((r) => cartePool.push({ mode, code: r.code, nom: r.nom }));
        break;
      case 'DevinerNomDeptCarte':
      case 'DevinerCodeDept':
      case 'DevinerNomDept':
        deptPool.forEach((d) => qcmPool.push({ mode, code: d.code, nom: d.nom, regionCode: d.regionCode }));
        break;
      case 'DevinerNomRegionCarte':
      case 'DevinerPrefectureRegion':
        regionPool.forEach((r) => qcmPool.push({ mode, code: r.code, nom: r.nom }));
        break;
      case 'DevinerPrefectureDept':
        deptPool.forEach((d) => qcmPool.push({ mode, code: d.code, nom: d.nom, regionCode: d.regionCode }));
        break;
    }
  }

  const hasCarteMode = cartePool.length > 0;
  const hasQcmMode = qcmPool.length > 0;

  let selected: PoolItem[];

  if (hasCarteMode && hasQcmMode) {
    if (config.sessionLength === 'tout') {
      selected = deduplicateByCode(shuffle([...cartePool, ...qcmPool]));
    } else {
      const count = config.sessionLength;
      const half = Math.ceil(count / 2);
      const carteDedup = deduplicateByCode(cartePool);
      const qcmDedup = deduplicateByCode(qcmPool);
      const carteSelected = selectFrom(carteDedup, Math.min(half, carteDedup.length));
      const carteSelectedCodes = new Set(carteSelected.map((i) => i.code));
      const qcmFiltered = qcmDedup.filter((i) => !carteSelectedCodes.has(i.code));
      const qcmSelected = selectFrom(qcmFiltered, Math.min(count - carteSelected.length, qcmFiltered.length));
      selected = shuffle([...carteSelected, ...qcmSelected]);
    }
  } else if (hasCarteMode) {
    const dedup = deduplicateByCode(cartePool);
    const count = config.sessionLength === 'tout' ? dedup.length : config.sessionLength;
    selected = selectFrom(dedup, Math.min(count, dedup.length));
  } else {
    const dedup = deduplicateByCode(qcmPool);
    const count = config.sessionLength === 'tout' ? dedup.length : config.sessionLength;
    selected = selectFrom(dedup, Math.min(count, dedup.length));
  }

  return selected.map((item, idx): Question => {
    const base = { id: `q-${idx}-${item.code}-${item.mode}`, targetCode: item.code, targetNom: item.nom, targetRegionCode: item.regionCode };
    if (CARTE_MODES.has(item.mode)) {
      return { ...base, mode: item.mode as CarteMode };
    }
    return { ...base, mode: item.mode as QcmMode, choices: buildQcmChoices(item, config) };
  });
}

/**
 * Construit l'état initial d'une session à partir de la configuration.
 * Appelé au démarrage et lors d'un redémarrage complet (`restart`).
 */
export function buildInitialSession(config: QuizConfig, itemStats?: ItemStatsStore): SessionState {
  return {
    questions: generateQuestions(config, itemStats),
    currentIndex: 0,
    score: 0,
    answerState: 'pending',
    selectedCode: null,
    finished: false,
    answerHistory: [],
    isReview: false,
    markedQuestionIds: [],
  };
}
