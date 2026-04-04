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
  buildPrefDeptChoices,
  buildPrefRegionChoices,
  type DeptChoice,
  type PrefDeptChoice,
  type PrefRegionChoice,
} from './buildChoices';
import type { QuizConfig, QuizSujet, Question, SessionState, QuizMode } from './types';

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

  type PoolItem = { mode: QuizMode; code: string; nom: string; regionCode?: string };

  const cartePool: PoolItem[] = [];
  const qcmPool: PoolItem[] = [];

  for (const mode of modes) {
    switch (mode) {
      case 'TrouverDeptCarte':
        ALL_DEPTS.forEach((d) => cartePool.push({ mode, code: d.code, nom: d.nom, regionCode: d.regionCode }));
        break;
      case 'TrouverRegionCarte':
        ALL_REGIONS.forEach((r) => cartePool.push({ mode, code: r.code, nom: r.nom }));
        break;
      case 'DevinerNomRegionCarte':
        ALL_REGIONS.forEach((r) => qcmPool.push({ mode, code: r.code, nom: r.nom }));
        break;
      case 'DevinerNomDeptCarte':
        ALL_DEPTS.forEach((d) => qcmPool.push({ mode, code: d.code, nom: d.nom, regionCode: d.regionCode }));
        break;
      case 'DevinerCodeDept':
      case 'DevinerNomDept':
        ALL_DEPTS.forEach((d) => qcmPool.push({ mode, code: d.code, nom: d.nom, regionCode: d.regionCode }));
        break;
      case 'DevinerPrefectureDept':
        ALL_DEPTS.forEach((d) => qcmPool.push({ mode, code: d.code, nom: d.nom, regionCode: d.regionCode }));
        break;
      case 'DevinerPrefectureRegion':
        ALL_REGIONS.forEach((r) => qcmPool.push({ mode, code: r.code, nom: r.nom }));
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

  const allDeptsPref: PrefDeptChoice[] = ALL_DEPTS;
  const allRegionsPref: PrefRegionChoice[] = ALL_REGIONS;

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
            ? buildCodeChoicesFacile(deptItem, ALL_DEPTS)
            : buildCodeChoicesDifficile(deptItem, ALL_DEPTS);
        break;
      }
      case 'DevinerNomDept': {
        const deptItem: DeptChoice = { code: item.code, nom: item.nom, regionCode: item.regionCode ?? '' };
        base.choices =
          config.difficulty === 'facile'
            ? buildDeptChoicesFacile(deptItem, ALL_DEPTS)
            : buildDeptChoicesDifficile(deptItem, ALL_DEPTS);
        break;
      }
      case 'DevinerNomRegionCarte': {
        const correctRegion = ALL_REGIONS.find((r) => r.code === item.code);
        if (correctRegion) {
          base.choices =
            config.difficulty === 'facile'
              ? buildRegionChoicesFacile(correctRegion, ALL_REGIONS)
              : buildRegionChoicesDifficile(correctRegion, ALL_REGIONS);
        }
        break;
      }
      case 'DevinerNomDeptCarte': {
        const deptItem: DeptChoice = { code: item.code, nom: item.nom, regionCode: item.regionCode ?? '' };
        base.choices =
          config.difficulty === 'facile'
            ? buildDeptChoicesFacile(deptItem, ALL_DEPTS)
            : buildDeptChoicesDifficile(deptItem, ALL_DEPTS);
        break;
      }
      case 'DevinerPrefectureDept': {
        const deptItem = allDeptsPref.find((d) => d.code === item.code);
        if (deptItem) {
          base.choices = buildPrefDeptChoices(deptItem, allDeptsPref);
        }
        break;
      }
      case 'DevinerPrefectureRegion': {
        const regionItem = allRegionsPref.find((r) => r.code === item.code);
        if (regionItem) {
          base.choices = buildPrefRegionChoices(regionItem, allRegionsPref);
        }
        break;
      }
      default:
        break;
    }

    return base;
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
  };
}
