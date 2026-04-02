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
  type DeptChoice,
} from './buildChoices';
import type { QuizConfig, Question, SessionState, QuizMode } from './types';

export const CARTE_MODES = new Set<QuizMode>(['TrouverDeptCarte', 'TrouverRegionCarte']);
export const QCM_MODES = new Set<QuizMode>(['DevinerNomRegionCarte', 'DevinerNomDeptCarte', 'DevinerCodeDept', 'DevinerNomDept', 'DevinerRegionDept']);

/**
 * Génère la liste ordonnée de questions pour une session à partir de la
 * configuration utilisateur.
 *
 * **Équilibrage carte / QCM** : quand les deux familles de modes sont activées
 * simultanément, les questions sont réparties à 50/50 (arrondi supérieur pour
 * la carte). Cela évite qu'un type n'écrase l'autre quand le pool carte est
 * plus grand que le pool QCM.
 *
 * **Choix multiples** : les questions QCM incluent leurs `choices` pré-construits
 * ici afin que le rendu n'ait aucune logique de génération à exécuter.
 *
 * **Longueur `'tout'`** : quand l'utilisateur sélectionne « tout », la session
 * contient l'intégralité des éléments combinés des pools sélectionnés.
 */
export function generateQuestions(config: QuizConfig): Question[] {
  const allDepts = DEPARTEMENTS.map((d) => ({ code: d.code, nom: d.nom, regionCode: d.regionCode }));
  const allRegions = REGIONS.map((r) => ({ code: r.code, nom: r.nom }));

  type PoolItem = { mode: QuizMode; code: string; nom: string; regionCode?: string };

  const cartePool: PoolItem[] = [];
  const qcmPool: PoolItem[] = [];

  const hasCarteMode = config.modes.some((m) => CARTE_MODES.has(m));
  const hasQcmMode = config.modes.some((m) => QCM_MODES.has(m));

  for (const mode of config.modes) {
    switch (mode) {
      case 'TrouverDeptCarte':
        allDepts.forEach((d) =>
          cartePool.push({ mode, code: d.code, nom: d.nom, regionCode: d.regionCode }),
        );
        break;
      case 'TrouverRegionCarte':
        allRegions.forEach((r) => cartePool.push({ mode, code: r.code, nom: r.nom }));
        break;
      case 'DevinerNomRegionCarte':
        allRegions.forEach((r) => qcmPool.push({ mode, code: r.code, nom: r.nom }));
        break;
      case 'DevinerNomDeptCarte':
        allDepts.forEach((d) =>
          qcmPool.push({ mode, code: d.code, nom: d.nom, regionCode: d.regionCode }),
        );
        break;
      case 'DevinerCodeDept':
      case 'DevinerNomDept':
        allDepts.forEach((d) =>
          qcmPool.push({ mode, code: d.code, nom: d.nom, regionCode: d.regionCode }),
        );
        break;
      case 'DevinerRegionDept':
        allDepts.forEach((d) =>
          qcmPool.push({ mode, code: d.code, nom: d.nom, regionCode: d.regionCode }),
        );
        break;
    }
  }

  // Déduplique un pool par code d'entité (régions ou départements).
  function deduplicateByCode(items: PoolItem[]): PoolItem[] {
    const seen = new Set<string>();
    return items.filter((item) => {
      if (seen.has(item.code)) return false;
      seen.add(item.code);
      return true;
    });
  }

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
      case 'DevinerNomRegionCarte': {
        const correctRegion = allRegions.find((r) => r.code === item.code);
        if (correctRegion) {
          base.choices =
            config.difficulty === 'facile'
              ? buildRegionChoicesFacile(correctRegion, allRegions)
              : buildRegionChoicesDifficile(correctRegion, allRegions);
        }
        break;
      }
      case 'DevinerNomDeptCarte': {
        const deptItem: DeptChoice = { code: item.code, nom: item.nom, regionCode: item.regionCode ?? '' };
        base.choices =
          config.difficulty === 'facile'
            ? buildDeptChoicesFacile(deptItem, allDepts)
            : buildDeptChoicesDifficile(deptItem, allDepts);
        break;
      }
      case 'DevinerRegionDept': {
        const correctRegion = allRegions.find((r) => r.code === item.regionCode);
        if (correctRegion) {
          base.choices =
            config.difficulty === 'facile'
              ? buildRegionChoicesFacile(correctRegion, allRegions)
              : buildRegionChoicesDifficile(correctRegion, allRegions);
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
