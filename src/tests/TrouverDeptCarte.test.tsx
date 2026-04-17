import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import QuestionTrouverDeptCarte from '../components/quiz/types-questions/QuestionTrouverCarte';
import type { CarteFranceProps } from '../components/carte/CarteFrance';
import type { Question } from '../quiz/types';

const GEO_STUB = {
  departements: { type: 'FeatureCollection' as const, features: [] },
  regions: { type: 'FeatureCollection' as const, features: [] },
  loading: false,
};

vi.mock('../hooks/useGeoData', () => ({
  useGeoData: () => GEO_STUB,
}));

// CarteFrance : expose wrongCode et highlightCode via data-testid, simule les clics
vi.mock('../components/carte/CarteFrance', () => ({
  default: ({ onFeatureClick, wrongCode, highlightCode }: CarteFranceProps) => (
    <div data-testid="carte-france">
      {wrongCode && <span data-testid="wrong-code">{wrongCode}</span>}
      {highlightCode && <span data-testid="highlight-code">{highlightCode}</span>}
      <button data-testid="click-971" onClick={() => onFeatureClick?.('971', 'departement')}>
        Guadeloupe (971)
      </button>
      <button data-testid="click-972" onClick={() => onFeatureClick?.('972', 'departement')}>
        Martinique (972)
      </button>
      <button data-testid="click-75" onClick={() => onFeatureClick?.('75', 'departement')}>
        Paris (75)
      </button>
    </div>
  ),
}));

const makeQuestion = (code: string, nom: string): Question => ({
  id: `q-test-${code}`,
  mode: 'TrouverDeptCarte',
  targetCode: code,
  targetNom: nom,
});

describe('QuestionTrouverDeptCarte – quiz de localisation sur carte', () => {
  it('affiche l\'énoncé avec le nom et le code du département cible', () => {
    render(
      <QuestionTrouverDeptCarte
        question={makeQuestion('971', 'Guadeloupe')}
        answerState="pending"
        selectedCode={null}
        onAnswer={vi.fn()}
      />,
    );
    expect(screen.getByText('Guadeloupe')).toBeInTheDocument();
    expect(screen.getByText('(971)')).toBeInTheDocument();
  });

  it('appelle onAnswer avec le bon code au clic sur la carte', () => {
    const onAnswer = vi.fn();
    render(
      <QuestionTrouverDeptCarte
        question={makeQuestion('971', 'Guadeloupe')}
        answerState="pending"
        selectedCode={null}
        onAnswer={onAnswer}
      />,
    );
    fireEvent.click(screen.getByTestId('click-971'));
    expect(onAnswer).toHaveBeenCalledOnce();
    expect(onAnswer).toHaveBeenCalledWith('971');
  });

  it('appelle onAnswer avec un mauvais code quand on clique sur le mauvais département', () => {
    const onAnswer = vi.fn();
    render(
      <QuestionTrouverDeptCarte
        question={makeQuestion('971', 'Guadeloupe')}
        answerState="pending"
        selectedCode={null}
        onAnswer={onAnswer}
      />,
    );
    fireEvent.click(screen.getByTestId('click-75'));
    expect(onAnswer).toHaveBeenCalledWith('75');
  });

  it('affiche "Bonne réponse !" quand answerState est "correct"', () => {
    render(
      <QuestionTrouverDeptCarte
        question={makeQuestion('971', 'Guadeloupe')}
        answerState="correct"
        selectedCode="971"
        onAnswer={vi.fn()}
      />,
    );
    expect(screen.getByText(/Bonne réponse/i)).toBeInTheDocument();
  });

  it('affiche "Mauvaise réponse." quand answerState est "wrong"', () => {
    render(
      <QuestionTrouverDeptCarte
        question={makeQuestion('971', 'Guadeloupe')}
        answerState="wrong"
        selectedCode="75"
        onAnswer={vi.fn()}
      />,
    );
    expect(screen.getByText(/Mauvaise réponse/i)).toBeInTheDocument();
  });

  it('ne déclenche pas onAnswer si la question est déjà répondue', () => {
    const onAnswer = vi.fn();
    render(
      <QuestionTrouverDeptCarte
        question={makeQuestion('971', 'Guadeloupe')}
        answerState="correct"
        selectedCode="971"
        onAnswer={onAnswer}
      />,
    );
    fireEvent.click(screen.getByTestId('click-972'));
    expect(onAnswer).not.toHaveBeenCalled();
  });

  it('fonctionne aussi pour un département métropolitain (Paris 75)', () => {
    const onAnswer = vi.fn();
    render(
      <QuestionTrouverDeptCarte
        question={makeQuestion('75', 'Paris')}
        answerState="pending"
        selectedCode={null}
        onAnswer={onAnswer}
      />,
    );
    expect(screen.getByText('Paris')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('click-75'));
    expect(onAnswer).toHaveBeenCalledWith('75');
  });

  // ─── Surbrillance rouge/vert ────────────────────────────────────────────────

  it('passe wrongCode=sélection et highlightCode=cible à CarteFrance après une mauvaise réponse', () => {
    render(
      <QuestionTrouverDeptCarte
        question={makeQuestion('971', 'Guadeloupe')}
        answerState="wrong"
        selectedCode="75"
        onAnswer={vi.fn()}
      />,
    );
    expect(screen.getByTestId('wrong-code')).toHaveTextContent('75');
    expect(screen.getByTestId('highlight-code')).toHaveTextContent('971');
  });

  it('ne passe pas wrongCode à CarteFrance après une bonne réponse', () => {
    render(
      <QuestionTrouverDeptCarte
        question={makeQuestion('971', 'Guadeloupe')}
        answerState="correct"
        selectedCode="971"
        onAnswer={vi.fn()}
      />,
    );
    expect(screen.queryByTestId('wrong-code')).not.toBeInTheDocument();
    expect(screen.getByTestId('highlight-code')).toHaveTextContent('971');
  });

  it('ne passe ni wrongCode ni highlightCode tant que la question est en attente', () => {
    render(
      <QuestionTrouverDeptCarte
        question={makeQuestion('971', 'Guadeloupe')}
        answerState="pending"
        selectedCode={null}
        onAnswer={vi.fn()}
      />,
    );
    expect(screen.queryByTestId('wrong-code')).not.toBeInTheDocument();
    expect(screen.queryByTestId('highlight-code')).not.toBeInTheDocument();
  });
});
