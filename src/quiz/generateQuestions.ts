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
export function generateQuestions(config: QuizConfig): Question[] {
  const modes = SUJET_MODES[config.sujet];

  const filterSet = config.filterCodes ? new Set(config.filterCodes) : null;
  const deptPool = filterSet ? ALL_DEPTS.filter(d => filterSet.has(d.code)) : ALL_DEPTS;
  const regionPool = filterSet ? ALL_REGIONS.filter(r => filterSet.has(r.code)) : ALL_REGIONS;

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
      const carteDedup = deduplicateByCode(shuffle(cartePool));
      const qcmDedup = deduplicateByCode(shuffle(qcmPool));
      const carteSelected = carteDedup.slice(0, Math.min(half, carteDedup.length));
      const carteSelectedCodes = new Set(carteSelected.map((i) => i.code));
      const qcmFiltered = qcmDedup.filter((i) => !carteSelectedCodes.has(i.code));
      const qcmSelected = qcmFiltered.slice(0, Math.min(count - carteSelected.length, qcmFiltered.length));
      selected = shuffle([...carteSelected, ...qcmSelected]);
    }
  } else if (hasCarteMode) {
    const dedup = deduplicateByCode(shuffle(cartePool));
    const count = config.sessionLength === 'tout' ? dedup.length : config.sessionLength;
    selected = dedup.slice(0, Math.min(count, dedup.length));
  } else {
    const dedup = deduplicateByCode(shuffle(qcmPool));
    const count = config.sessionLength === 'tout' ? dedup.length : config.sessionLength;
    selected = dedup.slice(0, Math.min(count, dedup.length));
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
export function buildInitialSession(config: QuizConfig): SessionState {
  return {
    questions: generateQuestions(config),
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
