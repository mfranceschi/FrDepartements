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
  default: ({ onFeatureClick }: CarteFranceProps) => (
    <div data-testid="carte-france">
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
        onAnswer={vi.fn()}
      />,
    );
    expect(screen.getByText(/Cliquez sur la région/i)).toBeInTheDocument();
    // Le nom de la région est dans un <strong>
    expect(screen.getByText('Île-de-France', { selector: 'strong' })).toBeInTheDocument();
  });

  it('appelle onAnswer avec le code correct au clic', () => {
    const onAnswer = vi.fn();
    render(
      <TrouverRegionCarte
        question={makeQuestion('11', 'Île-de-France')}
        geoData={GEO_DATA}
        answerState="pending"
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
        onAnswer={vi.fn()}
      />,
    );
    expect(screen.getByText(/Bonne réponse/i)).toBeInTheDocument();
  });

  it('affiche la correction avec le nom de la région quand answerState est "wrong"', () => {
    render(
      <TrouverRegionCarte
        question={makeQuestion('84', 'Auvergne-Rhône-Alpes')}
        geoData={GEO_DATA}
        answerState="wrong"
        onAnswer={vi.fn()}
      />,
    );
    // Le message de correction contient le nom entier dans la même phrase
    expect(screen.getByText(/La bonne réponse était : Auvergne-Rhône-Alpes/)).toBeInTheDocument();
  });

  it('ne déclenche pas onAnswer si la question est déjà répondue', () => {
    const onAnswer = vi.fn();
    render(
      <TrouverRegionCarte
        question={makeQuestion('11', 'Île-de-France')}
        geoData={GEO_DATA}
        answerState="wrong"
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
        onAnswer={onAnswer}
      />,
    );
    expect(screen.getByText('Guadeloupe', { selector: 'strong' })).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('click-region-01'));
    expect(onAnswer).toHaveBeenCalledWith('01');
  });
});
