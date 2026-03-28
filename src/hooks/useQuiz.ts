import { useState, useCallback } from 'react';
import { DEPARTEMENTS } from '../data/departements';
import { REGIONS } from '../data/regions';
import type { QuizConfig, Question, Choice, SessionState, QuizMode, AnswerRecord } from '../quiz/types';

// ─── Fisher-Yates shuffle ────────────────────────────────────────────────────

/**
 * Mélange un tableau de manière aléatoire uniforme (algorithme Fisher-Yates).
 * Retourne une nouvelle copie du tableau — l'original n'est pas muté.
 */
function shuffle<T>(arr: T[]): T[] {
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
 *
 * @param arr        Pool source
 * @param n          Nombre d'éléments à retourner
 * @param excludeCodes  Codes à exclure (ex : la bonne réponse)
 * @param getCode    Fonction extraisant le code d'un élément
 */
function pickRandom<T>(arr: T[], n: number, excludeCodes: Set<string>, getCode: (item: T) => string): T[] {
  const candidates = arr.filter((item) => !excludeCodes.has(getCode(item)));
  return shuffle(candidates).slice(0, n);
}

// ─── Distractors ─────────────────────────────────────────────────────────────

interface DeptChoice { code: string; nom: string; regionCode: string }
interface RegionChoice { code: string; nom: string }

/**
 * Construit 4 choix QCM pour un mode « Deviner le nom » en difficulté **facile** :
 * les 3 distractors sont tirés aléatoirement parmi tous les départements,
 * toutes régions confondues.
 */
function buildDeptChoicesFacile(correct: DeptChoice, allDepts: DeptChoice[]): Choice[] {
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
 * Si la région ne fournit pas assez de candidats, le reste est complété aléatoirement.
 */
function buildDeptChoicesDifficile(correct: DeptChoice, allDepts: DeptChoice[]): Choice[] {
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

/**
 * Construit 4 choix QCM pour un mode « Deviner le code » en difficulté **facile** :
 * les labels affichés sont les codes (ex. « 75 », « 13 »), distractors aléatoires.
 */
function buildCodeChoicesFacile(correct: DeptChoice, allDepts: DeptChoice[]): Choice[] {
  const exclude = new Set([correct.code]);
  const distractors = pickRandom(allDepts, 3, exclude, (d) => d.code);
  return shuffle([
    { code: correct.code, label: correct.code, correct: true },
    ...distractors.map((d) => ({ code: d.code, label: d.code, correct: false })),
  ]);
}

/**
 * Construit 4 choix QCM pour un mode « Deviner le code » en difficulté **difficile** :
 * les distractors sont des codes de départements de la même région, ce qui crée
 * des confusions entre numéros proches (ex. 75 vs 77, 78, 91…).
 */
function buildCodeChoicesDifficile(correct: DeptChoice, allDepts: DeptChoice[]): Choice[] {
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

/**
 * Construit 4 choix QCM pour un mode « Deviner la région » en difficulté **facile** :
 * les distractors sont des régions tirées aléatoirement parmi toutes les régions.
 */
function buildRegionChoicesFacile(correctRegion: RegionChoice, allRegions: RegionChoice[]): Choice[] {
  const exclude = new Set([correctRegion.code]);
  const distractors = pickRandom(allRegions, 3, exclude, (r) => r.code);
  return shuffle([
    { code: correctRegion.code, label: correctRegion.nom, correct: true },
    ...distractors.map((r) => ({ code: r.code, label: r.nom, correct: false })),
  ]);
}

/**
 * Adjacence géographique des régions métropolitaines françaises.
 * Utilisée en mode difficile pour proposer des régions voisines comme distractors.
 */
const REGION_ADJACENCY: Record<string, string[]> = {
  '11': ['28', '32', '44', '27', '24'],              // Île-de-France
  '24': ['11', '28', '52', '53', '75', '84', '27'],  // Centre-Val de Loire
  '27': ['11', '44', '84', '24'],                    // Bourgogne-Franche-Comté
  '28': ['11', '32', '53', '52', '24'],              // Normandie
  '32': ['11', '28', '44'],                          // Hauts-de-France
  '44': ['11', '32', '27'],                          // Grand Est
  '52': ['28', '53', '75', '24'],                    // Pays de la Loire
  '53': ['28', '52'],                                // Bretagne
  '75': ['24', '52', '84', '76'],                    // Nouvelle-Aquitaine
  '76': ['75', '84', '93'],                          // Occitanie
  '84': ['24', '27', '75', '76', '93'],              // Auvergne-Rhône-Alpes
  '93': ['84', '76', '94'],                          // Provence-Alpes-Côte d'Azur
  '94': ['93'],                                      // Corse
};

/**
 * Construit 4 choix QCM pour un mode « Deviner la région » en difficulté **difficile** :
 * les distractors sont prioritairement des régions géographiquement voisines,
 * ce qui rend la discrimination plus difficile (ex. Occitanie vs Nouvelle-Aquitaine).
 * Pour les régions DROM (sans voisinage défini), repli sur des distractors aléatoires.
 * Si les voisines ne sont pas assez nombreuses, complément aléatoire.
 */
function buildRegionChoicesDifficile(correctRegion: RegionChoice, allRegions: RegionChoice[]): Choice[] {
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

// ─── Question generation ─────────────────────────────────────────────────────

const CARTE_MODES = new Set<QuizMode>(['TrouverDeptCarte', 'TrouverRegionCarte']);
const QCM_MODES = new Set<QuizMode>(['DevinerNomRegionCarte', 'DevinerNomDeptCarte', 'DevinerCodeDept', 'DevinerNomDept', 'DevinerRegionDept']);

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
function generateQuestions(config: QuizConfig): Question[] {
  const dromEnabled = config.includeDrom !== false;

  const allDepts = DEPARTEMENTS
    .filter((d) => dromEnabled || !d.outresMer)
    .map((d) => ({ code: d.code, nom: d.nom, regionCode: d.regionCode, outresMer: d.outresMer }));
  const allRegions = REGIONS
    .filter((r) => dromEnabled || !r.outresMer)
    .map((r) => ({ code: r.code, nom: r.nom, outresMer: r.outresMer }));
  const metroRegions = allRegions.filter((r) => !r.outresMer);

  type PoolItem = { mode: QuizMode; code: string; nom: string; regionCode?: string };

  const cartePool: PoolItem[] = [];
  const qcmPool: PoolItem[] = [];

  const hasCarteMode = config.modes.some((m) => CARTE_MODES.has(m));
  const hasQcmMode = config.modes.some((m) => QCM_MODES.has(m));

  for (const mode of config.modes) {
    switch (mode) {
      case 'TrouverDeptCarte':
        // Include all depts (metro + DROM) for map questions
        allDepts.forEach((d) =>
          cartePool.push({ mode, code: d.code, nom: d.nom, regionCode: d.regionCode }),
        );
        break;
      case 'TrouverRegionCarte':
        // Include all regions for map questions
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
        // Exclut les DROM : leurs régions ne font pas partie des 13 régions métropolitaines
        allDepts
          .filter((d) => !d.outresMer)
          .forEach((d) =>
            qcmPool.push({ mode, code: d.code, nom: d.nom, regionCode: d.regionCode }),
          );
        break;
    }
  }

  // Déduplique un pool par code d'entité (régions ou départements).
  // Après mélange, on ne garde que la première occurrence de chaque code :
  // une même région/département ne peut être l'objet que d'une seule question.
  function deduplicateByCode(items: PoolItem[]): PoolItem[] {
    const seen = new Set<string>();
    return items.filter((item) => {
      if (seen.has(item.code)) return false;
      seen.add(item.code);
      return true;
    });
  }

  // Sélection avec équilibrage carte / QCM à 50/50 quand les deux familles sont actives.
  // « tout » = une question par entité unique (région ou département), pas la somme brute.
  let selected: PoolItem[];

  if (hasCarteMode && hasQcmMode) {
    if (config.sessionLength === 'tout') {
      // Une question par entité unique, mode assigné aléatoirement
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

/**
 * Construit l'état initial d'une session à partir de la configuration.
 * Appelé au démarrage et lors d'un redémarrage complet (`restart`).
 */
function buildInitialSession(config: QuizConfig): SessionState {
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

/**
 * Hook principal gérant l'intégralité de l'état d'une session de quiz.
 *
 * @param config  Configuration choisie par l'utilisateur (modes, difficulté, longueur).
 *
 * @returns
 * - `session`           État courant de la session (questions, score, index, etc.)
 * - `submitAnswer`      Enregistre la réponse de l'utilisateur pour la question courante.
 *                       Sans effet si la question est déjà répondue ou la session terminée.
 * - `nextQuestion`      Avance à la question suivante (ou marque la session comme terminée).
 *                       Sans effet si aucune réponse n'a encore été soumise.
 * - `restart`           Génère une nouvelle session complète avec la même configuration.
 * - `restartWithErrors` Repart uniquement sur les questions mal répondues (mode révision),
 *                       les choix étant re-mélangés. Sans effet s'il n'y a pas d'erreurs.
 */
export function useQuiz(config: QuizConfig): {
  session: SessionState;
  submitAnswer: (code: string) => void;
  nextQuestion: () => void;
  restart: () => void;
  restartWithErrors: () => void;
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
        case 'DevinerNomRegionCarte':
        case 'DevinerNomDeptCarte':
        case 'DevinerCodeDept':
        case 'DevinerNomDept':
          correct = code === question.targetCode;
          break;
        case 'DevinerRegionDept':
          correct = code === question.targetRegionCode;
          break;
      }

      const record: AnswerRecord = { mode: question.mode, correct, question };

      return {
        ...prev,
        answerState: correct ? 'correct' : 'wrong',
        score: correct ? prev.score + 1 : prev.score,
        selectedCode: code,
        answerHistory: [...prev.answerHistory, record],
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
    const newSession = buildInitialSession(config);
    setSession(newSession);
  }, [config]);

  const restartWithErrors = useCallback(() => {
    setSession((prev) => {
      const wrongQuestions = prev.answerHistory
        .filter((r) => !r.correct)
        .map((r, idx): Question => ({
          ...r.question,
          id: `retry-${idx}-${r.question.targetCode}-${r.question.mode}`,
          choices: r.question.choices ? shuffle([...r.question.choices]) : undefined,
        }));

      if (wrongQuestions.length === 0) return prev;

      return {
        questions: shuffle(wrongQuestions),
        currentIndex: 0,
        score: 0,
        answerState: 'pending',
        selectedCode: null,
        finished: false,
        answerHistory: [],
      };
    });
  }, []);

  return { session, submitAnswer, nextQuestion, restart, restartWithErrors };
}
