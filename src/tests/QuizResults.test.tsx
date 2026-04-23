import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import QuizResults from '../components/quiz/QuizResults';
import type { SessionState, AnswerRecord, Question } from '../quiz/types';

function renderResults(element: React.ReactElement) {
  return render(<MemoryRouter>{element}</MemoryRouter>);
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeQcmQuestion(code: string, nom: string): Question {
  return {
    id: `q-${code}`,
    mode: 'DevinerNomDept',
    targetCode: code,
    targetNom: nom,
    choices: [
      { code, label: nom, correct: true },
      { code: 'XX', label: 'Autre1', correct: false },
      { code: 'YY', label: 'Autre2', correct: false },
      { code: 'ZZ', label: 'Autre3', correct: false },
    ],
  };
}

function makeCarteQuestion(code: string, nom: string): Question {
  return { id: `q-${code}`, mode: 'TrouverDeptCarte', targetCode: code, targetNom: nom };
}

function makeSession(overrides: Partial<SessionState> = {}): SessionState {
  const question = makeQcmQuestion('75', 'Paris');
  return {
    questions: [question],
    currentIndex: 0,
    score: 1,
    answerState: 'correct',
    selectedCode: '75',
    finished: true,
    answerHistory: [],
    isReview: false,
    markedQuestionIds: [],
    ...overrides,
  };
}

function makeRecord(correct: boolean, question?: Question): AnswerRecord {
  const q = question ?? makeQcmQuestion('75', 'Paris');
  return {
    mode: 'DevinerNomDept',
    correct,
    answeredCode: correct ? '75' : 'XX',
    question: q,
  };
}

// ── Messages de résultat ──────────────────────────────────────────────────────

describe('QuizResults — message selon le score', () => {
  it('affiche "Parfait !" à 100%', () => {
    const session = makeSession({ score: 10, questions: Array(10).fill(makeQcmQuestion('75', 'Paris')) });
    renderResults(<QuizResults session={session} onRestart={vi.fn()} onReview={vi.fn()} />);
    expect(screen.getByText(/Parfait/)).toBeInTheDocument();
  });

  it('affiche "Excellent !" entre 85% et 99%', () => {
    const qs = Array(10).fill(makeQcmQuestion('75', 'Paris'));
    const session = makeSession({ score: 9, questions: qs });
    renderResults(<QuizResults session={session} onRestart={vi.fn()} onReview={vi.fn()} />);
    expect(screen.getByText(/Excellent/)).toBeInTheDocument();
  });

  it('affiche "Bien !" entre 60% et 84%', () => {
    const qs = Array(10).fill(makeQcmQuestion('75', 'Paris'));
    const session = makeSession({ score: 7, questions: qs });
    renderResults(<QuizResults session={session} onRestart={vi.fn()} onReview={vi.fn()} />);
    expect(screen.getByText(/Bien/)).toBeInTheDocument();
  });

  it('affiche "Continuez !" en dessous de 60%', () => {
    const qs = Array(10).fill(makeQcmQuestion('75', 'Paris'));
    const session = makeSession({ score: 5, questions: qs });
    renderResults(<QuizResults session={session} onRestart={vi.fn()} onReview={vi.fn()} />);
    expect(screen.getByText(/Continuez/)).toBeInTheDocument();
  });

  it('affiche "Toutes les questions révisées !" en mode révision score parfait', () => {
    const qs = Array(5).fill(makeQcmQuestion('75', 'Paris'));
    const session = makeSession({ score: 5, questions: qs, isReview: true });
    renderResults(<QuizResults session={session} onRestart={vi.fn()} onReview={vi.fn()} />);
    expect(screen.getByText(/Toutes les questions révisées/)).toBeInTheDocument();
  });
});

// ── Étoiles ───────────────────────────────────────────────────────────────────

describe('QuizResults — étoiles', () => {
  it('aria-label indique 3 étoiles à ≥85%', () => {
    const qs = Array(10).fill(makeQcmQuestion('75', 'Paris'));
    renderResults(<QuizResults session={makeSession({ score: 9, questions: qs })} onRestart={vi.fn()} onReview={vi.fn()} />);
    expect(screen.getByLabelText(/3 étoile/)).toBeInTheDocument();
  });

  it('aria-label indique 2 étoiles à ≥60%', () => {
    const qs = Array(10).fill(makeQcmQuestion('75', 'Paris'));
    renderResults(<QuizResults session={makeSession({ score: 6, questions: qs })} onRestart={vi.fn()} onReview={vi.fn()} />);
    expect(screen.getByLabelText(/2 étoile/)).toBeInTheDocument();
  });

  it('aria-label indique 1 étoile en dessous de 60%', () => {
    const qs = Array(10).fill(makeQcmQuestion('75', 'Paris'));
    renderResults(<QuizResults session={makeSession({ score: 5, questions: qs })} onRestart={vi.fn()} onReview={vi.fn()} />);
    expect(screen.getByLabelText(/1 étoile/)).toBeInTheDocument();
  });
});

// ── Pourcentage ───────────────────────────────────────────────────────────────

describe('QuizResults — pourcentage affiché', () => {
  it('affiche le bon pourcentage (arrondi)', () => {
    const qs = Array(3).fill(makeQcmQuestion('75', 'Paris'));
    renderResults(<QuizResults session={makeSession({ score: 2, questions: qs })} onRestart={vi.fn()} onReview={vi.fn()} />);
    expect(screen.getByText(/67 % de bonnes réponses/)).toBeInTheDocument();
  });

  it('affiche 0 % pour score nul', () => {
    const qs = Array(5).fill(makeQcmQuestion('75', 'Paris'));
    renderResults(<QuizResults session={makeSession({ score: 0, questions: qs })} onRestart={vi.fn()} onReview={vi.fn()} />);
    expect(screen.getByText(/0 % de bonnes réponses/)).toBeInTheDocument();
  });
});

// ── Section erreurs ───────────────────────────────────────────────────────────

describe('QuizResults — section erreurs', () => {
  it('n\'affiche pas la section erreurs si score parfait', () => {
    const qs = [makeQcmQuestion('75', 'Paris')];
    const session = makeSession({ score: 1, questions: qs, answerHistory: [makeRecord(true)] });
    renderResults(<QuizResults session={session} onRestart={vi.fn()} onReview={vi.fn()} />);
    expect(screen.queryByText(/erreur/)).not.toBeInTheDocument();
  });

  it('affiche le nombre d\'erreurs dans le résumé', () => {
    const qs = [makeQcmQuestion('75', 'Paris'), makeQcmQuestion('69', 'Rhône')];
    const session = makeSession({
      score: 0,
      questions: qs,
      answerHistory: [makeRecord(false, qs[0]), makeRecord(false, qs[1])],
    });
    renderResults(<QuizResults session={session} onRestart={vi.fn()} onReview={vi.fn()} />);
    expect(screen.getByText(/2 erreurs — voir le détail/)).toBeInTheDocument();
  });

  it('le bouton "Réviser" est absent si score parfait et aucune question marquée', () => {
    const qs = [makeQcmQuestion('75', 'Paris')];
    const session = makeSession({ score: 1, questions: qs, answerHistory: [] });
    renderResults(<QuizResults session={session} onRestart={vi.fn()} onReview={vi.fn()} />);
    expect(screen.queryByText(/Réviser \(/)).not.toBeInTheDocument();
  });

  it('le bouton "Réviser" est présent si au moins 1 erreur', () => {
    const qs = [makeQcmQuestion('75', 'Paris')];
    const session = makeSession({ score: 0, questions: qs, answerHistory: [makeRecord(false)] });
    renderResults(<QuizResults session={session} onRestart={vi.fn()} onReview={vi.fn()} />);
    expect(screen.getByText(/Réviser \(1 question\)/)).toBeInTheDocument();
  });

  it('appelle onReview au clic sur "Réviser"', () => {
    const onReview = vi.fn();
    const qs = [makeQcmQuestion('75', 'Paris')];
    const session = makeSession({ score: 0, questions: qs, answerHistory: [makeRecord(false)] });
    renderResults(<QuizResults session={session} onRestart={vi.fn()} onReview={onReview} />);
    fireEvent.click(screen.getByText(/Réviser \(1 question\)/));
    expect(onReview).toHaveBeenCalledOnce();
  });

  it('les erreurs carte n\'affichent pas de bonne réponse texte', () => {
    const carteQ = makeCarteQuestion('75', 'Paris');
    const record: AnswerRecord = { mode: 'TrouverDeptCarte', correct: false, answeredCode: 'XX', question: carteQ };
    const session = makeSession({ score: 0, questions: [carteQ], answerHistory: [record] });
    renderResults(<QuizResults session={session} onRestart={vi.fn()} onReview={vi.fn()} />);
    expect(screen.queryByText(/Bonne réponse :/)).not.toBeInTheDocument();
  });
});

// ── Bouton Rejouer ────────────────────────────────────────────────────────────

describe('QuizResults — bouton Rejouer', () => {
  it('appelle onRestart au clic', () => {
    const onRestart = vi.fn();
    renderResults(<QuizResults session={makeSession()} onRestart={onRestart} onReview={vi.fn()} />);
    fireEvent.click(screen.getByText('Rejouer'));
    expect(onRestart).toHaveBeenCalledOnce();
  });
});
