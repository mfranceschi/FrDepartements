/**
 * Tests des trois composants QCM :
 *   - DevinerCodeDept  — quel est le numéro du département X ?
 *   - DevinerNomDept   — quel département porte le numéro X ?
 *   - DevinerRegionDept — dans quelle région se trouve X ?
 *
 * Point clé pour DevinerRegionDept : onAnswer est appelé avec le code de la
 * RÉGION (et non le code du département). Le hook useQuiz compare ensuite
 * ce code contre question.targetRegionCode.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import DevinerCodeDept from '../components/quiz/types-questions/QuestionDevinerCodeDept';
import DevinerNomDept from '../components/quiz/types-questions/QuestionDevinerNomDept';
import DevinerRegionDept from '../components/quiz/types-questions/QuestionDevinerRegionDept';
import type { Question } from '../quiz/types';

// ── Fixtures ─────────────────────────────────────────────────────────────────

const qCode: Question = {
  id: 'q-code',
  mode: 'DevinerCodeDept',
  targetCode: '75',
  targetNom: 'Paris',
  choices: [
    { code: '75', label: '75', correct: true },
    { code: '01', label: '01', correct: false },
    { code: '13', label: '13', correct: false },
    { code: '69', label: '69', correct: false },
  ],
};

const qNom: Question = {
  id: 'q-nom',
  mode: 'DevinerNomDept',
  targetCode: '29',
  targetNom: 'Finistère',
  choices: [
    { code: '29', label: 'Finistère', correct: true },
    { code: '22', label: "Côtes-d'Armor", correct: false },
    { code: '35', label: 'Ille-et-Vilaine', correct: false },
    { code: '56', label: 'Morbihan', correct: false },
  ],
};

// Isère (38) appartient à Auvergne-Rhône-Alpes (code région 84)
const qRegion: Question = {
  id: 'q-region',
  mode: 'DevinerRegionDept',
  targetCode: '38',
  targetNom: 'Isère',
  targetRegionCode: '84',
  choices: [
    { code: '84', label: 'Auvergne-Rhône-Alpes', correct: true },
    { code: '11', label: 'Île-de-France', correct: false },
    { code: '75', label: 'Nouvelle-Aquitaine', correct: false },
    { code: '53', label: 'Bretagne', correct: false },
  ],
};

// ── DevinerCodeDept ───────────────────────────────────────────────────────────

describe('DevinerCodeDept', () => {
  it('affiche l\'énoncé avec le nom du département cible', () => {
    render(<DevinerCodeDept question={qCode} answerState="pending" selectedCode={null} onAnswer={vi.fn()} />);
    expect(screen.getByText('Paris', { selector: 'strong' })).toBeInTheDocument();
    expect(screen.getByText(/Quel est le numéro du département/i)).toBeInTheDocument();
  });

  it('affiche les 4 choix de codes', () => {
    render(<DevinerCodeDept question={qCode} answerState="pending" selectedCode={null} onAnswer={vi.fn()} />);
    expect(screen.getAllByRole('button')).toHaveLength(4);
  });

  it('appelle onAnswer avec le code du choix cliqué', () => {
    const onAnswer = vi.fn();
    render(<DevinerCodeDept question={qCode} answerState="pending" selectedCode={null} onAnswer={onAnswer} />);
    fireEvent.click(screen.getByText('75'));
    expect(onAnswer).toHaveBeenCalledOnce();
    expect(onAnswer).toHaveBeenCalledWith('75');
  });

  it('affiche "Bonne réponse !" quand correct', () => {
    render(<DevinerCodeDept question={qCode} answerState="correct" selectedCode="75" onAnswer={vi.fn()} />);
    expect(screen.getByText(/Bonne réponse/i)).toBeInTheDocument();
  });

  it('affiche la correction avec le bon code quand wrong', () => {
    render(<DevinerCodeDept question={qCode} answerState="wrong" selectedCode="01" onAnswer={vi.fn()} />);
    expect(screen.getByText(/La bonne réponse était : 75/)).toBeInTheDocument();
  });

  it('désactive les boutons après réponse', () => {
    const onAnswer = vi.fn();
    render(<DevinerCodeDept question={qCode} answerState="wrong" selectedCode="01" onAnswer={onAnswer} />);
    screen.getAllByRole('button').forEach((btn) => expect(btn).toBeDisabled());
    fireEvent.click(screen.getByText('75'));
    expect(onAnswer).not.toHaveBeenCalled();
  });
});

// ── DevinerNomDept ────────────────────────────────────────────────────────────

describe('DevinerNomDept', () => {
  it('affiche l\'énoncé avec le code du département cible', () => {
    render(<DevinerNomDept question={qNom} answerState="pending" selectedCode={null} onAnswer={vi.fn()} />);
    expect(screen.getByText('29', { selector: 'strong' })).toBeInTheDocument();
    expect(screen.getByText(/Quel département porte le numéro/i)).toBeInTheDocument();
  });

  it('appelle onAnswer avec le code du choix cliqué', () => {
    const onAnswer = vi.fn();
    render(<DevinerNomDept question={qNom} answerState="pending" selectedCode={null} onAnswer={onAnswer} />);
    fireEvent.click(screen.getByText('Finistère'));
    expect(onAnswer).toHaveBeenCalledWith('29');
  });

  it('affiche "Bonne réponse !" quand correct', () => {
    render(<DevinerNomDept question={qNom} answerState="correct" selectedCode="29" onAnswer={vi.fn()} />);
    expect(screen.getByText(/Bonne réponse/i)).toBeInTheDocument();
  });

  it('affiche la correction avec le nom du département quand wrong', () => {
    render(<DevinerNomDept question={qNom} answerState="wrong" selectedCode="22" onAnswer={vi.fn()} />);
    expect(screen.getByText(/La bonne réponse était : Finistère/)).toBeInTheDocument();
  });

  it('désactive les boutons après réponse', () => {
    const onAnswer = vi.fn();
    render(<DevinerNomDept question={qNom} answerState="correct" selectedCode="29" onAnswer={onAnswer} />);
    screen.getAllByRole('button').forEach((btn) => expect(btn).toBeDisabled());
  });
});

// ── DevinerRegionDept ─────────────────────────────────────────────────────────

describe('DevinerRegionDept', () => {
  it('affiche l\'énoncé avec le nom du département cible', () => {
    render(<DevinerRegionDept question={qRegion} answerState="pending" selectedCode={null} onAnswer={vi.fn()} />);
    expect(screen.getByText('Isère', { selector: 'strong' })).toBeInTheDocument();
    expect(screen.getByText(/Dans quelle région se trouve/i)).toBeInTheDocument();
  });

  it('appelle onAnswer avec le CODE DE RÉGION (pas le code dept)', () => {
    const onAnswer = vi.fn();
    render(<DevinerRegionDept question={qRegion} answerState="pending" selectedCode={null} onAnswer={onAnswer} />);
    fireEvent.click(screen.getByText('Auvergne-Rhône-Alpes'));
    // Crucial : le code transmis est '84' (région), pas '38' (département)
    expect(onAnswer).toHaveBeenCalledWith('84');
  });

  it('affiche "Bonne réponse !" quand correct', () => {
    render(<DevinerRegionDept question={qRegion} answerState="correct" selectedCode="84" onAnswer={vi.fn()} />);
    expect(screen.getByText(/Bonne réponse/i)).toBeInTheDocument();
  });

  it('affiche le nom de la région correcte quand wrong (lookup dans REGIONS)', () => {
    render(<DevinerRegionDept question={qRegion} answerState="wrong" selectedCode="11" onAnswer={vi.fn()} />);
    // Le composant résout le nom via REGIONS.find(r => r.code === targetRegionCode)
    expect(screen.getByText(/La bonne réponse était : Auvergne-Rhône-Alpes/)).toBeInTheDocument();
  });

  it('désactive les boutons après réponse', () => {
    const onAnswer = vi.fn();
    render(<DevinerRegionDept question={qRegion} answerState="wrong" selectedCode="11" onAnswer={onAnswer} />);
    screen.getAllByRole('button').forEach((btn) => expect(btn).toBeDisabled());
  });
});
