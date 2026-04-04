/**
 * Tests des composants QCM préfectures :
 *   - DevinerPrefectureDept   — quelle est la préfecture du département X ?
 *   - DevinerPrefectureRegion — quelle est la préfecture de la région X ?
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import DevinerPrefectureDept from '../components/quiz/types-questions/QuestionDevinerPrefectureDept';
import DevinerPrefectureRegion from '../components/quiz/types-questions/QuestionDevinerPrefectureRegion';
import type { Question } from '../quiz/types';

// ── Fixtures ─────────────────────────────────────────────────────────────────

const qPrefDept: Question = {
  id: 'q-pref-dept',
  mode: 'DevinerPrefectureDept',
  targetCode: '01',
  targetNom: 'Ain',
  choices: [
    { code: '01', label: 'Bourg-en-Bresse', correct: true },
    { code: '03', label: 'Moulins', correct: false },
    { code: '07', label: 'Privas', correct: false },
    { code: '15', label: 'Aurillac', correct: false },
  ],
};

const qPrefRegion: Question = {
  id: 'q-pref-region',
  mode: 'DevinerPrefectureRegion',
  targetCode: '11',
  targetNom: 'Île-de-France',
  choices: [
    { code: '11', label: 'Paris', correct: true },
    { code: '24', label: 'Orléans', correct: false },
    { code: '27', label: 'Dijon', correct: false },
    { code: '28', label: 'Rouen', correct: false },
  ],
};

// ── DevinerPrefectureDept ────────────────────────────────────────────────────

describe('DevinerPrefectureDept', () => {
  it('affiche l\'énoncé avec le nom et le code du département cible', () => {
    render(<DevinerPrefectureDept question={qPrefDept} answerState="pending" selectedCode={null} onAnswer={vi.fn()} />);
    expect(screen.getByText(/Ain/)).toBeInTheDocument();
    expect(screen.getByText(/01/)).toBeInTheDocument();
    expect(screen.getByText(/préfecture du département/i)).toBeInTheDocument();
  });

  it('affiche les 4 choix de préfectures', () => {
    render(<DevinerPrefectureDept question={qPrefDept} answerState="pending" selectedCode={null} onAnswer={vi.fn()} />);
    expect(screen.getAllByRole('button')).toHaveLength(4);
    expect(screen.getByText('Bourg-en-Bresse')).toBeInTheDocument();
    expect(screen.getByText('Moulins')).toBeInTheDocument();
  });

  it('appelle onAnswer avec le code du choix cliqué', () => {
    const onAnswer = vi.fn();
    render(<DevinerPrefectureDept question={qPrefDept} answerState="pending" selectedCode={null} onAnswer={onAnswer} />);
    fireEvent.click(screen.getByText('Bourg-en-Bresse'));
    expect(onAnswer).toHaveBeenCalledOnce();
    expect(onAnswer).toHaveBeenCalledWith('01');
  });

  it('affiche "Bonne réponse !" quand correct', () => {
    render(<DevinerPrefectureDept question={qPrefDept} answerState="correct" selectedCode="01" onAnswer={vi.fn()} />);
    expect(screen.getByText(/Bonne réponse/i)).toBeInTheDocument();
  });

  it('affiche la correction avec la bonne préfecture quand wrong', () => {
    render(<DevinerPrefectureDept question={qPrefDept} answerState="wrong" selectedCode="03" onAnswer={vi.fn()} />);
    expect(screen.getByText(/La bonne réponse était : Bourg-en-Bresse/)).toBeInTheDocument();
  });

  it('désactive les boutons après réponse', () => {
    const onAnswer = vi.fn();
    render(<DevinerPrefectureDept question={qPrefDept} answerState="wrong" selectedCode="03" onAnswer={onAnswer} />);
    screen.getAllByRole('button').forEach((btn) => expect(btn).toBeDisabled());
    fireEvent.click(screen.getByText('Bourg-en-Bresse'));
    expect(onAnswer).not.toHaveBeenCalled();
  });
});

// ── DevinerPrefectureRegion ──────────────────────────────────────────────────

describe('DevinerPrefectureRegion', () => {
  it('affiche l\'énoncé avec le nom de la région cible', () => {
    render(<DevinerPrefectureRegion question={qPrefRegion} answerState="pending" selectedCode={null} onAnswer={vi.fn()} />);
    expect(screen.getByText(/Île-de-France/, { selector: 'strong' })).toBeInTheDocument();
    expect(screen.getByText(/préfecture de la région/i)).toBeInTheDocument();
  });

  it('affiche les 4 choix de préfectures régionales', () => {
    render(<DevinerPrefectureRegion question={qPrefRegion} answerState="pending" selectedCode={null} onAnswer={vi.fn()} />);
    expect(screen.getAllByRole('button')).toHaveLength(4);
    expect(screen.getByText('Paris')).toBeInTheDocument();
    expect(screen.getByText('Orléans')).toBeInTheDocument();
  });

  it('appelle onAnswer avec le code de la région du choix cliqué', () => {
    const onAnswer = vi.fn();
    render(<DevinerPrefectureRegion question={qPrefRegion} answerState="pending" selectedCode={null} onAnswer={onAnswer} />);
    fireEvent.click(screen.getByText('Paris'));
    expect(onAnswer).toHaveBeenCalledOnce();
    expect(onAnswer).toHaveBeenCalledWith('11');
  });

  it('affiche "Bonne réponse !" quand correct', () => {
    render(<DevinerPrefectureRegion question={qPrefRegion} answerState="correct" selectedCode="11" onAnswer={vi.fn()} />);
    expect(screen.getByText(/Bonne réponse/i)).toBeInTheDocument();
  });

  it('affiche la correction avec la bonne préfecture quand wrong', () => {
    render(<DevinerPrefectureRegion question={qPrefRegion} answerState="wrong" selectedCode="24" onAnswer={vi.fn()} />);
    expect(screen.getByText(/La bonne réponse était : Paris/)).toBeInTheDocument();
  });

  it('désactive les boutons après réponse', () => {
    const onAnswer = vi.fn();
    render(<DevinerPrefectureRegion question={qPrefRegion} answerState="correct" selectedCode="11" onAnswer={onAnswer} />);
    screen.getAllByRole('button').forEach((btn) => expect(btn).toBeDisabled());
  });
});
