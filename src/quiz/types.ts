export type QuizSujet =
  | 'regions-carte'
  | 'depts-carte'
  | 'depts-numeros'
  | 'depts-prefectures'
  | 'regions-prefectures';

export type QuizMode =
  | 'TrouverDeptCarte'
  | 'TrouverRegionCarte'
  | 'DevinerNomRegionCarte'
  | 'DevinerNomDeptCarte'
  | 'DevinerCodeDept'
  | 'DevinerNomDept'
  | 'DevinerPrefectureDept'
  | 'DevinerPrefectureRegion';

export type CarteMode = 'TrouverDeptCarte' | 'TrouverRegionCarte';
export type QcmMode = Exclude<QuizMode, CarteMode>;

export type Difficulty = 'facile' | 'difficile';
export type SessionLength = 10 | 25 | 50 | 'tout';

export interface QuizConfig {
  sujet: QuizSujet;
  difficulty: Difficulty;
  sessionLength: SessionLength;
  /** Restreint la session aux codes cibles listés (depts ou régions selon le sujet). */
  filterCodes?: string[];
}

export interface Choice {
  code: string;
  label: string;
  correct: boolean;
}

interface QuestionBase {
  id: string;
  targetCode: string;
  targetNom: string;
  targetRegionCode?: string;
}

export interface CarteQuestion extends QuestionBase {
  mode: CarteMode;
}

export interface QcmQuestion extends QuestionBase {
  mode: QcmMode;
  choices: Choice[];
}

export type Question = CarteQuestion | QcmQuestion;

export function isQcmQuestion(q: Question): q is QcmQuestion {
  return 'choices' in q;
}

export type AnswerState = 'pending' | 'correct' | 'wrong';

export const MODE_LABELS: Readonly<Record<QuizMode, string>> = {
  TrouverDeptCarte: 'Dept. sur carte',
  TrouverRegionCarte: 'Région sur carte',
  DevinerNomRegionCarte: 'Nom de région',
  DevinerNomDeptCarte: 'Nom de dept. (carte)',
  DevinerCodeDept: 'Numéro de dept.',
  DevinerNomDept: 'Nom de dept.',
  DevinerPrefectureDept: 'Préfecture de dept.',
  DevinerPrefectureRegion: 'Préfecture de région',
};

export interface AnswerRecord {
  mode: QuizMode;
  correct: boolean;
  answeredCode: string;
  question: Question;
}

/** Props partagées par tous les composants de type de question. */
export interface QuestionProps {
  question: Question;
  answerState: AnswerState;
  selectedCode: string | null;
  onAnswer: (code: string) => void;
  onNext?: () => void;
  isLastQuestion?: boolean;
  onMarkReview?: () => void;
  isMarked?: boolean;
}

export interface SessionState {
  questions: Question[];
  currentIndex: number;
  score: number;
  answerState: AnswerState;
  selectedCode: string | null;
  finished: boolean;
  answerHistory: AnswerRecord[];
  isReview: boolean;
  markedQuestionIds: string[];
}
