export type QuizMode =
  | 'TrouverDeptCarte'
  | 'TrouverRegionCarte'
  | 'DevinerCodeDept'
  | 'DevinerNomDept'
  | 'DevinerRegionDept';

export type Difficulty = 'facile' | 'difficile';

export interface QuizConfig {
  modes: QuizMode[];
  difficulty: Difficulty;
  sessionLength: 10 | 25 | 50 | 'tout';
}

export interface Question {
  id: string;
  mode: QuizMode;
  targetCode: string;
  targetNom: string;
  targetRegionCode?: string;
  choices?: Choice[];
}

export interface Choice {
  code: string;
  label: string;
  correct: boolean;
}

export type AnswerState = 'pending' | 'correct' | 'wrong';

export interface AnswerRecord {
  mode: QuizMode;
  correct: boolean;
}

export interface SessionState {
  questions: Question[];
  currentIndex: number;
  score: number;
  answerState: AnswerState;
  selectedCode: string | null;
  finished: boolean;
  answerHistory: AnswerRecord[];
}
