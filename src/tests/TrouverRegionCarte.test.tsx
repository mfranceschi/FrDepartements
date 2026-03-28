import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import TrouverRegionCarte from '../components/quiz/types-questions/TrouverRegionCarte';
import type { CarteFranceProps } from '../components/carte/CarteFrance';
import type { Question } from '../quiz/types';

const GEO_DATA = {
  departements: { type: 'FeatureCollection' as const, features: [] },
  regions: { type: 'FeatureCollection' as const, features: [] },
};

// Labels neutres pour éviter les ambiguïtés avec les textes du composant testé
vi.mock('../components/carte/CarteFrance', () => ({
  default: ({ onFeatureClick, wrongCode, highlightCode }: CarteFranceProps) => (
    <div data-testid="carte-france">
      {wrongCode && <span data-testid="wrong-code">{wrongCode}</span>}
      {highlightCode && <span data-testid="highlight-code">{highlightCode}</span>}
      <button data-testid="click-region-11" onClick={() => onFeatureClick?.('11', 'region')}>
        [région 11]
      </button>
      <button data-testid="click-region-84" onClick={() => onFeatureClick?.('84', 'region')}>
        [région 84]
      </button>
      <button data-testid="click-region-01" onClick={() => onFeatureClick?.('01', 'region')}>
        [région 01]
      </button>
    </div>
  ),
}));

const makeQuestion = (code: string, nom: string): Question => ({
  id: `q-test-${code}`,
  mode: 'TrouverRegionCarte',
  targetCode: code,
  targetNom: nom,
});

describe('TrouverRegionCarte – quiz de localisation de région', () => {
  it('affiche l\'énoncé avec le nom de la région cible', () => {
    render(
      <TrouverRegionCarte
        question={makeQuestion('11', 'Île-de-France')}
        geoData={GEO_DATA}
        answerState="pending"
        selectedCode={null}
        onAnswer={vi.fn()}
      />,
    );
    expect(screen.getByText(/Cliquez sur la région/i)).toBeInTheDocument();
    expect(screen.getByText('Île-de-France', { selector: 'strong' })).toBeInTheDocument();
  });

  it('appelle onAnswer avec le code correct au clic', () => {
    const onAnswer = vi.fn();
    render(
      <TrouverRegionCarte
        question={makeQuestion('11', 'Île-de-France')}
        geoData={GEO_DATA}
        answerState="pending"
        selectedCode={null}
        onAnswer={onAnswer}
      />,
    );
    fireEvent.click(screen.getByTestId('click-region-11'));
    expect(onAnswer).toHaveBeenCalledOnce();
    expect(onAnswer).toHaveBeenCalledWith('11');
  });

  it('affiche "Bonne réponse !" quand answerState est "correct"', () => {
    render(
      <TrouverRegionCarte
        question={makeQuestion('84', 'Auvergne-Rhône-Alpes')}
        geoData={GEO_DATA}
        answerState="correct"
        selectedCode="84"
        onAnswer={vi.fn()}
      />,
    );
    expect(screen.getByText(/Bonne réponse/i)).toBeInTheDocument();
  });

  it('affiche "Mauvaise réponse." quand answerState est "wrong"', () => {
    render(
      <TrouverRegionCarte
        question={makeQuestion('84', 'Auvergne-Rhône-Alpes')}
        geoData={GEO_DATA}
        answerState="wrong"
        selectedCode="11"
        onAnswer={vi.fn()}
      />,
    );
    expect(screen.getByText(/Mauvaise réponse/i)).toBeInTheDocument();
  });

  it('ne déclenche pas onAnswer si la question est déjà répondue', () => {
    const onAnswer = vi.fn();
    render(
      <TrouverRegionCarte
        question={makeQuestion('11', 'Île-de-France')}
        geoData={GEO_DATA}
        answerState="wrong"
        selectedCode="84"
        onAnswer={onAnswer}
      />,
    );
    fireEvent.click(screen.getByTestId('click-region-84'));
    expect(onAnswer).not.toHaveBeenCalled();
  });

  it('fonctionne pour une région DROM (Guadeloupe, code 01)', () => {
    const onAnswer = vi.fn();
    render(
      <TrouverRegionCarte
        question={makeQuestion('01', 'Guadeloupe')}
        geoData={GEO_DATA}
        answerState="pending"
        selectedCode={null}
        onAnswer={onAnswer}
      />,
    );
    expect(screen.getByText('Guadeloupe', { selector: 'strong' })).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('click-region-01'));
    expect(onAnswer).toHaveBeenCalledWith('01');
  });

  // ─── Surbrillance rouge/vert ────────────────────────────────────────────────

  it('passe wrongCode=sélection et highlightCode=cible à CarteFrance après une mauvaise réponse', () => {
    render(
      <TrouverRegionCarte
        question={makeQuestion('84', 'Auvergne-Rhône-Alpes')}
        geoData={GEO_DATA}
        answerState="wrong"
        selectedCode="11"
        onAnswer={vi.fn()}
      />,
    );
    expect(screen.getByTestId('wrong-code')).toHaveTextContent('11');
    expect(screen.getByTestId('highlight-code')).toHaveTextContent('84');
  });

  it('ne passe pas wrongCode à CarteFrance après une bonne réponse', () => {
    render(
      <TrouverRegionCarte
        question={makeQuestion('84', 'Auvergne-Rhône-Alpes')}
        geoData={GEO_DATA}
        answerState="correct"
        selectedCode="84"
        onAnswer={vi.fn()}
      />,
    );
    expect(screen.queryByTestId('wrong-code')).not.toBeInTheDocument();
    expect(screen.getByTestId('highlight-code')).toHaveTextContent('84');
  });

  it('ne passe ni wrongCode ni highlightCode tant que la question est en attente', () => {
    render(
      <TrouverRegionCarte
        question={makeQuestion('84', 'Auvergne-Rhône-Alpes')}
        geoData={GEO_DATA}
        answerState="pending"
        selectedCode={null}
        onAnswer={vi.fn()}
      />,
    );
    expect(screen.queryByTestId('wrong-code')).not.toBeInTheDocument();
    expect(screen.queryByTestId('highlight-code')).not.toBeInTheDocument();
  });
});
