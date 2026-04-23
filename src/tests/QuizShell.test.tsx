import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import QuizShell from '../components/quiz/QuizShell';
import type { SessionState } from '../quiz/types';

function renderShell(element: React.ReactElement) {
  return render(<MemoryRouter>{element}</MemoryRouter>);
}


// Session terminée avec score parfait (10/10)
function makeFinishedSession(score: number, total: number): SessionState {
  const wrongCount = total - score;
  const answerHistory = [
    ...Array.from({ length: score }, (_, i) => ({
      mode: 'DevinerNomDept' as const,
      correct: true,
      answeredCode: String(i).padStart(2, '0'),
      question: { id: `q${i}`, mode: 'DevinerNomDept' as const, targetCode: String(i).padStart(2, '0'), targetNom: `Dept${i}`, choices: [] },
    })),
    ...Array.from({ length: wrongCount }, (_, i) => ({
      mode: 'DevinerNomDept' as const,
      correct: false,
      answeredCode: '00',
      question: { id: `qw${i}`, mode: 'DevinerNomDept' as const, targetCode: String(i + 50).padStart(2, '0'), targetNom: `Dept${i + 50}`, choices: [] },
    })),
  ];

  return {
    questions: Array.from({ length: total }, (_, i) => ({
      id: `q${i}`,
      mode: 'DevinerNomDept' as const,
      targetCode: String(i).padStart(2, '0'),
      targetNom: `Dept${i}`,
      choices: [],
    })),
    currentIndex: 0,
    score,
    answerState: 'pending',
    selectedCode: null,
    finished: true,
    answerHistory,
    isReview: false,
    markedQuestionIds: [],
  };
}

// Session en cours avec N bonnes réponses consécutives en fin d'historique
function makeSessionWithStreak(streak: number, brokenBy?: 'wrong'): SessionState {
  const total = 10;
  const history = brokenBy === 'wrong'
    ? [
        ...Array.from({ length: streak }, (_, i) => ({
          mode: 'DevinerNomDept' as const,
          correct: true,
          answeredCode: String(i).padStart(2, '0'),
          question: { id: `q${i}`, mode: 'DevinerNomDept' as const, targetCode: String(i).padStart(2, '0'), targetNom: `Dept${i}`, choices: [] },
        })),
        {
          mode: 'DevinerNomDept' as const,
          correct: false,
          answeredCode: '00',
          question: { id: 'qw', mode: 'DevinerNomDept' as const, targetCode: '99', targetNom: 'DeptW', choices: [] },
        },
      ]
    : Array.from({ length: streak }, (_, i) => ({
        mode: 'DevinerNomDept' as const,
        correct: true,
        answeredCode: String(i).padStart(2, '0'),
        question: { id: `q${i}`, mode: 'DevinerNomDept' as const, targetCode: String(i).padStart(2, '0'), targetNom: `Dept${i}`, choices: [] },
      }));

  return {
    questions: Array.from({ length: total }, (_, i) => ({
      id: `q${i}`,
      mode: 'DevinerNomDept' as const,
      targetCode: String(i).padStart(2, '0'),
      targetNom: `Dept${i}`,
      choices: [
        { code: String(i).padStart(2, '0'), label: `Dept${i}`, correct: true },
        { code: '97', label: 'Autre1', correct: false },
        { code: '98', label: 'Autre2', correct: false },
        { code: '99', label: 'Autre3', correct: false },
      ],
    })),
    currentIndex: history.length,
    score: streak,
    answerState: 'pending',
    selectedCode: null,
    finished: false,
    answerHistory: history,
    isReview: false,
    markedQuestionIds: [],
  };
}

// Session en cours (QCM — pas de CarteFrance)
function makeActiveSession(mode: 'DevinerNomDept' | 'DevinerCodeDept' = 'DevinerNomDept'): SessionState {
  return {
    questions: [
      {
        id: 'q0',
        mode,
        targetCode: '29',
        targetNom: 'Finistère',
        choices: [
          { code: '29', label: 'Finistère', correct: true },
          { code: '22', label: "Côtes-d'Armor", correct: false },
          { code: '35', label: 'Ille-et-Vilaine', correct: false },
          { code: '56', label: 'Morbihan', correct: false },
        ],
      },
    ],
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

// ── Écran de fin ──────────────────────────────────────────────────────────────

describe('QuizShell – écran de fin', () => {
  it('affiche le score final et le pourcentage', () => {
    renderShell(
      <QuizShell
        session={makeFinishedSession(8, 10)}
        onAnswer={vi.fn()}
        onNext={vi.fn()}
        onRestart={vi.fn()}
        onReview={vi.fn()}
        onMarkReview={vi.fn()}
        onReset={vi.fn()}
      />,
    );
    expect(screen.getByText('8')).toBeInTheDocument();
    expect(screen.getByText(/10/)).toBeInTheDocument();
    expect(screen.getByText(/80 %/)).toBeInTheDocument();
  });

  it('affiche "Excellent !" pour un score ≥ 85 %', () => {
    renderShell(
      <QuizShell
        session={makeFinishedSession(9, 10)}
        onAnswer={vi.fn()}
        onNext={vi.fn()}
        onRestart={vi.fn()}
        onReview={vi.fn()}
        onMarkReview={vi.fn()}
        onReset={vi.fn()}
      />,
    );
    expect(screen.getByText('Excellent !')).toBeInTheDocument();
  });

  it('affiche "Bien !" pour un score entre 60 % et 84 %', () => {
    renderShell(
      <QuizShell
        session={makeFinishedSession(7, 10)}
        onAnswer={vi.fn()}
        onNext={vi.fn()}
        onRestart={vi.fn()}
        onReview={vi.fn()}
        onMarkReview={vi.fn()}
        onReset={vi.fn()}
      />,
    );
    expect(screen.getByText('Bien !')).toBeInTheDocument();
  });

  it('affiche "Continuez !" pour un score < 60 %', () => {
    renderShell(
      <QuizShell
        session={makeFinishedSession(3, 10)}
        onAnswer={vi.fn()}
        onNext={vi.fn()}
        onRestart={vi.fn()}
        onReview={vi.fn()}
        onMarkReview={vi.fn()}
        onReset={vi.fn()}
      />,
    );
    expect(screen.getByText('Continuez !')).toBeInTheDocument();
  });

  it('affiche "Rejouer" dans tous les cas', () => {
    renderShell(
      <QuizShell
        session={makeFinishedSession(5, 10)}
        onAnswer={vi.fn()}
        onNext={vi.fn()}
        onRestart={vi.fn()}
        onReview={vi.fn()}
        onMarkReview={vi.fn()}
        onReset={vi.fn()}
      />,
    );
    expect(screen.getByRole('button', { name: /Rejouer/i })).toBeInTheDocument();
  });

  it('affiche "Réviser (N questions)" quand des erreurs existent', () => {
    renderShell(
      <QuizShell
        session={makeFinishedSession(6, 10)}
        onAnswer={vi.fn()}
        onNext={vi.fn()}
        onRestart={vi.fn()}
        onReview={vi.fn()}
        onMarkReview={vi.fn()}
        onReset={vi.fn()}
      />,
    );
    expect(screen.getByRole('button', { name: /Réviser \(4 questions\)/i })).toBeInTheDocument();
  });

  it('n\'affiche pas "Réviser" si score parfait', () => {
    renderShell(
      <QuizShell
        session={makeFinishedSession(10, 10)}
        onAnswer={vi.fn()}
        onNext={vi.fn()}
        onRestart={vi.fn()}
        onReview={vi.fn()}
        onMarkReview={vi.fn()}
        onReset={vi.fn()}
      />,
    );
    expect(screen.queryByRole('button', { name: /Réviser \(/i })).not.toBeInTheDocument();
  });

  it('appelle onRestart au clic sur "Rejouer"', () => {
    const onRestart = vi.fn();
    renderShell(
      <QuizShell
        session={makeFinishedSession(10, 10)}
        onAnswer={vi.fn()}
        onNext={vi.fn()}
        onRestart={onRestart}
        onReview={vi.fn()}
        onMarkReview={vi.fn()}
        onReset={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /Rejouer/i }));
    expect(onRestart).toHaveBeenCalledOnce();
  });

  it('appelle onReview au clic sur "Réviser"', () => {
    const onReview = vi.fn();
    renderShell(
      <QuizShell
        session={makeFinishedSession(8, 10)}
        onAnswer={vi.fn()}
        onNext={vi.fn()}
        onRestart={vi.fn()}
        onReview={onReview}
        onMarkReview={vi.fn()}
        onReset={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /Réviser \(2 questions\)/i }));
    expect(onReview).toHaveBeenCalledOnce();
  });
});

// ── Streak badge ──────────────────────────────────────────────────────────────

describe('QuizShell – badge streak', () => {
  it("n'affiche pas de badge pour un streak < 3", () => {
    renderShell(
      <QuizShell
        session={makeSessionWithStreak(2)}
        onAnswer={vi.fn()}
        onNext={vi.fn()}
        onRestart={vi.fn()}
        onReview={vi.fn()}
        onMarkReview={vi.fn()}
        onReset={vi.fn()}
      />,
    );
    expect(screen.queryByText(/🔥/)).not.toBeInTheDocument();
  });

  it('affiche le badge "🔥 Combo ×3" pour un streak de 3', () => {
    renderShell(
      <QuizShell
        session={makeSessionWithStreak(3)}
        onAnswer={vi.fn()}
        onNext={vi.fn()}
        onRestart={vi.fn()}
        onReview={vi.fn()}
        onMarkReview={vi.fn()}
        onReset={vi.fn()}
      />,
    );
    expect(screen.getByText(/🔥 Combo ×3/)).toBeInTheDocument();
  });

  it('affiche le bon compteur pour un streak de 5', () => {
    renderShell(
      <QuizShell
        session={makeSessionWithStreak(5)}
        onAnswer={vi.fn()}
        onNext={vi.fn()}
        onRestart={vi.fn()}
        onReview={vi.fn()}
        onMarkReview={vi.fn()}
        onReset={vi.fn()}
      />,
    );
    expect(screen.getByText(/🔥 Combo ×5/)).toBeInTheDocument();
  });

  it("n'affiche pas de badge quand le streak est cassé par une mauvaise réponse", () => {
    renderShell(
      <QuizShell
        session={makeSessionWithStreak(3, 'wrong')}
        onAnswer={vi.fn()}
        onNext={vi.fn()}
        onRestart={vi.fn()}
        onReview={vi.fn()}
        onMarkReview={vi.fn()}
        onReset={vi.fn()}
      />,
    );
    expect(screen.queryByText(/🔥/)).not.toBeInTheDocument();
  });
});

// ── Barre de progression ──────────────────────────────────────────────────────

describe('QuizShell – barre de progression', () => {
  it('affiche des points de progression pour une session ≤ 20 questions', () => {
    const { container } = renderShell(
      <QuizShell
        session={makeActiveSession()}
        onAnswer={vi.fn()}
        onNext={vi.fn()}
        onRestart={vi.fn()}
        onReview={vi.fn()}
        onMarkReview={vi.fn()}
        onReset={vi.fn()}
      />,
    );
    // Sessions ≤ 20 questions : points colorés (w-3 h-3 rounded-full)
    const dot = container.querySelector('.w-3.h-3.rounded-full');
    expect(dot).toBeInTheDocument();
  });

  it('affiche la barre fine pour une session > 20 questions', () => {
    const longSession: SessionState = {
      questions: Array.from({ length: 25 }, (_, i) => ({
        id: `q${i}`,
        mode: 'DevinerNomDept' as const,
        targetCode: String(i).padStart(2, '0'),
        targetNom: `Dept${i}`,
        choices: [
          { code: String(i).padStart(2, '0'), label: `Dept${i}`, correct: true },
          { code: '97', label: 'Autre1', correct: false },
          { code: '98', label: 'Autre2', correct: false },
          { code: '99', label: 'Autre3', correct: false },
        ],
      })),
      currentIndex: 0,
      score: 0,
      answerState: 'pending',
      selectedCode: null,
      finished: false,
      answerHistory: [],
      isReview: false,
      markedQuestionIds: [],
    };
    const { container } = renderShell(
      <QuizShell
        session={longSession}
        onAnswer={vi.fn()}
        onNext={vi.fn()}
        onRestart={vi.fn()}
        onReview={vi.fn()}
        onMarkReview={vi.fn()}
        onReset={vi.fn()}
      />,
    );
    const bar = container.querySelector('.h-1\\.5');
    expect(bar).toBeInTheDocument();
  });

  it('la barre de résultats utilise un dégradé rouge→vert', () => {
    const { container } = renderShell(
      <QuizShell
        session={makeFinishedSession(7, 10)}
        onAnswer={vi.fn()}
        onNext={vi.fn()}
        onRestart={vi.fn()}
        onReview={vi.fn()}
        onMarkReview={vi.fn()}
        onReset={vi.fn()}
      />,
    );
    const gradientEl = container.querySelector('[style*="linear-gradient"]');
    expect(gradientEl).toBeInTheDocument();
  });

  it('le masque gris couvre 0 % pour un score parfait (100 %)', () => {
    const { container } = renderShell(
      <QuizShell
        session={makeFinishedSession(10, 10)}
        onAnswer={vi.fn()}
        onNext={vi.fn()}
        onRestart={vi.fn()}
        onReview={vi.fn()}
        onMarkReview={vi.fn()}
        onReset={vi.fn()}
      />,
    );
    // Le masque gris doit avoir width: 0%
    const mask = container.querySelector('[style*="width: 0%"]');
    expect(mask).toBeInTheDocument();
  });
});

// ── Session en cours ──────────────────────────────────────────────────────────

describe('QuizShell – session en cours', () => {
  it('affiche le compteur de questions', () => {
    renderShell(
      <QuizShell
        session={makeActiveSession()}
        onAnswer={vi.fn()}
        onNext={vi.fn()}
        onRestart={vi.fn()}
        onReview={vi.fn()}
        onMarkReview={vi.fn()}
        onReset={vi.fn()}
      />,
    );
    expect(screen.getByText(/Question 1 \/ 1/i)).toBeInTheDocument();
  });

  it('affiche le bouton "Question suivante" après réponse', () => {
    const session = { ...makeActiveSession(), answerState: 'correct' as const, selectedCode: '29' };
    renderShell(
      <QuizShell
        session={session}
        onAnswer={vi.fn()}
        onNext={vi.fn()}
        onRestart={vi.fn()}
        onReview={vi.fn()}
        onMarkReview={vi.fn()}
        onReset={vi.fn()}
      />,
    );
    expect(screen.getByRole('button', { name: /Voir le résultat/i })).toBeInTheDocument();
  });

  it('appelle onAnswer quand on clique sur un choix QCM', () => {
    const onAnswer = vi.fn();
    renderShell(
      <QuizShell
        session={makeActiveSession()}
        onAnswer={onAnswer}
        onNext={vi.fn()}
        onRestart={vi.fn()}
        onReview={vi.fn()}
        onMarkReview={vi.fn()}
        onReset={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByText('Finistère'));
    expect(onAnswer).toHaveBeenCalledWith('29');
  });
});
