import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import QuizShell from '../components/quiz/QuizShell';
import type { SessionState } from '../quiz/types';


// Session terminée avec score parfait (10/10)
function makeFinishedSession(score: number, total: number): SessionState {
  const wrongCount = total - score;
  const answerHistory = [
    ...Array.from({ length: score }, (_, i) => ({
      mode: 'DevinerNomDept' as const,
      correct: true,
      question: { id: `q${i}`, mode: 'DevinerNomDept' as const, targetCode: String(i).padStart(2, '0'), targetNom: `Dept${i}` },
    })),
    ...Array.from({ length: wrongCount }, (_, i) => ({
      mode: 'DevinerNomDept' as const,
      correct: false,
      question: { id: `qw${i}`, mode: 'DevinerNomDept' as const, targetCode: String(i + 50).padStart(2, '0'), targetNom: `Dept${i + 50}` },
    })),
  ];

  return {
    questions: Array.from({ length: total }, (_, i) => ({
      id: `q${i}`,
      mode: 'DevinerNomDept' as const,
      targetCode: String(i).padStart(2, '0'),
      targetNom: `Dept${i}`,
    })),
    currentIndex: 0,
    score,
    answerState: 'pending',
    selectedCode: null,
    finished: true,
    answerHistory,
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
  };
}

// ── Écran de fin ──────────────────────────────────────────────────────────────

describe('QuizShell – écran de fin', () => {
  it('affiche le score final et le pourcentage', () => {
    render(
      <QuizShell
        session={makeFinishedSession(8, 10)}
        onAnswer={vi.fn()}
        onNext={vi.fn()}
        onRestart={vi.fn()}
        onReviewErrors={vi.fn()}
      />,
    );
    expect(screen.getByText('8')).toBeInTheDocument();
    expect(screen.getByText(/10/)).toBeInTheDocument();
    expect(screen.getByText(/80 %/)).toBeInTheDocument();
  });

  it('affiche "Excellent !" pour un score ≥ 85 %', () => {
    render(
      <QuizShell
        session={makeFinishedSession(10, 10)}
        onAnswer={vi.fn()}
        onNext={vi.fn()}
        onRestart={vi.fn()}
        onReviewErrors={vi.fn()}
      />,
    );
    expect(screen.getByText('Excellent !')).toBeInTheDocument();
  });

  it('affiche "Bien !" pour un score entre 60 % et 84 %', () => {
    render(
      <QuizShell
        session={makeFinishedSession(7, 10)}
        onAnswer={vi.fn()}
        onNext={vi.fn()}
        onRestart={vi.fn()}
        onReviewErrors={vi.fn()}
      />,
    );
    expect(screen.getByText('Bien !')).toBeInTheDocument();
  });

  it('affiche "Continuez !" pour un score < 60 %', () => {
    render(
      <QuizShell
        session={makeFinishedSession(3, 10)}
        onAnswer={vi.fn()}
        onNext={vi.fn()}
        onRestart={vi.fn()}
        onReviewErrors={vi.fn()}
      />,
    );
    expect(screen.getByText('Continuez !')).toBeInTheDocument();
  });

  it('affiche "Rejouer" dans tous les cas', () => {
    render(
      <QuizShell
        session={makeFinishedSession(5, 10)}
        onAnswer={vi.fn()}
        onNext={vi.fn()}
        onRestart={vi.fn()}
        onReviewErrors={vi.fn()}
      />,
    );
    expect(screen.getByRole('button', { name: /Rejouer/i })).toBeInTheDocument();
  });

  it('affiche "Revoir mes erreurs (N)" quand des erreurs existent', () => {
    render(
      <QuizShell
        session={makeFinishedSession(6, 10)}
        onAnswer={vi.fn()}
        onNext={vi.fn()}
        onRestart={vi.fn()}
        onReviewErrors={vi.fn()}
      />,
    );
    expect(screen.getByRole('button', { name: /Revoir mes erreurs \(4\)/i })).toBeInTheDocument();
  });

  it('n\'affiche pas "Revoir mes erreurs" si score parfait', () => {
    render(
      <QuizShell
        session={makeFinishedSession(10, 10)}
        onAnswer={vi.fn()}
        onNext={vi.fn()}
        onRestart={vi.fn()}
        onReviewErrors={vi.fn()}
      />,
    );
    expect(screen.queryByText(/Revoir mes erreurs/i)).not.toBeInTheDocument();
  });

  it('appelle onRestart au clic sur "Rejouer"', () => {
    const onRestart = vi.fn();
    render(
      <QuizShell
        session={makeFinishedSession(10, 10)}
        onAnswer={vi.fn()}
        onNext={vi.fn()}
        onRestart={onRestart}
        onReviewErrors={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /Rejouer/i }));
    expect(onRestart).toHaveBeenCalledOnce();
  });

  it('appelle onReviewErrors au clic sur "Revoir mes erreurs"', () => {
    const onReviewErrors = vi.fn();
    render(
      <QuizShell
        session={makeFinishedSession(8, 10)}
        onAnswer={vi.fn()}
        onNext={vi.fn()}
        onRestart={vi.fn()}
        onReviewErrors={onReviewErrors}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /Revoir mes erreurs/i }));
    expect(onReviewErrors).toHaveBeenCalledOnce();
  });
});

// ── Session en cours ──────────────────────────────────────────────────────────

describe('QuizShell – session en cours', () => {
  it('affiche le compteur de questions', () => {
    render(
      <QuizShell
        session={makeActiveSession()}
        onAnswer={vi.fn()}
        onNext={vi.fn()}
        onRestart={vi.fn()}
        onReviewErrors={vi.fn()}
      />,
    );
    expect(screen.getByText(/Question 1 \/ 1/i)).toBeInTheDocument();
  });

  it('affiche le bouton "Question suivante" après réponse', () => {
    const session = { ...makeActiveSession(), answerState: 'correct' as const, selectedCode: '29' };
    render(
      <QuizShell
        session={session}
        onAnswer={vi.fn()}
        onNext={vi.fn()}
        onRestart={vi.fn()}
        onReviewErrors={vi.fn()}
      />,
    );
    expect(screen.getByRole('button', { name: /Voir le résultat/i })).toBeInTheDocument();
  });

  it('appelle onAnswer quand on clique sur un choix QCM', () => {
    const onAnswer = vi.fn();
    render(
      <QuizShell
        session={makeActiveSession()}
        onAnswer={onAnswer}
        onNext={vi.fn()}
        onRestart={vi.fn()}
        onReviewErrors={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByText('Finistère'));
    expect(onAnswer).toHaveBeenCalledWith('29');
  });
});
