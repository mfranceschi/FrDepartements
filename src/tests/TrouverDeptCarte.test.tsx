import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import TrouverDeptCarte from '../components/quiz/types-questions/TrouverDeptCarte';
import type { CarteFranceProps } from '../components/carte/CarteFrance';
import type { Question } from '../quiz/types';

const GEO_DATA = {
  departements: { type: 'FeatureCollection' as const, features: [] },
  regions: { type: 'FeatureCollection' as const, features: [] },
};

// CarteFrance : simule les clics sur des départements via des boutons data-testid
vi.mock('../components/carte/CarteFrance', () => ({
  default: ({ onFeatureClick }: CarteFranceProps) => (
    <div data-testid="carte-france">
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

describe('TrouverDeptCarte – quiz de localisation sur carte', () => {
  it('affiche l\'énoncé avec le nom et le code du département cible', () => {
    render(
      <TrouverDeptCarte
        question={makeQuestion('971', 'Guadeloupe')}
        geoData={GEO_DATA}
        answerState="pending"
        onAnswer={vi.fn()}
      />,
    );
    expect(screen.getByText('Guadeloupe')).toBeInTheDocument();
    expect(screen.getByText('(971)')).toBeInTheDocument();
  });

  it('appelle onAnswer avec le bon code au clic sur la carte (DROM Guadeloupe)', () => {
    const onAnswer = vi.fn();
    render(
      <TrouverDeptCarte
        question={makeQuestion('971', 'Guadeloupe')}
        geoData={GEO_DATA}
        answerState="pending"
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
      <TrouverDeptCarte
        question={makeQuestion('971', 'Guadeloupe')}
        geoData={GEO_DATA}
        answerState="pending"
        onAnswer={onAnswer}
      />,
    );
    fireEvent.click(screen.getByTestId('click-75'));
    expect(onAnswer).toHaveBeenCalledWith('75');
  });

  it('affiche "Bonne réponse !" quand answerState est "correct"', () => {
    render(
      <TrouverDeptCarte
        question={makeQuestion('971', 'Guadeloupe')}
        geoData={GEO_DATA}
        answerState="correct"
        onAnswer={vi.fn()}
      />,
    );
    expect(screen.getByText(/Bonne réponse/i)).toBeInTheDocument();
  });

  it('affiche la correction quand answerState est "wrong"', () => {
    render(
      <TrouverDeptCarte
        question={makeQuestion('971', 'Guadeloupe')}
        geoData={GEO_DATA}
        answerState="wrong"
        onAnswer={vi.fn()}
      />,
    );
    // Le texte de correction contient le nom ET le code dans la même phrase
    expect(screen.getByText(/La bonne réponse était : Guadeloupe \(971\)/)).toBeInTheDocument();
  });

  it('ne déclenche pas onAnswer si la question est déjà répondue', () => {
    const onAnswer = vi.fn();
    render(
      <TrouverDeptCarte
        question={makeQuestion('971', 'Guadeloupe')}
        geoData={GEO_DATA}
        answerState="correct"
        onAnswer={onAnswer}
      />,
    );
    fireEvent.click(screen.getByTestId('click-972'));
    expect(onAnswer).not.toHaveBeenCalled();
  });

  it('fonctionne aussi pour un département métropolitain (Paris 75)', () => {
    const onAnswer = vi.fn();
    render(
      <TrouverDeptCarte
        question={makeQuestion('75', 'Paris')}
        geoData={GEO_DATA}
        answerState="pending"
        onAnswer={onAnswer}
      />,
    );
    expect(screen.getByText('Paris')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('click-75'));
    expect(onAnswer).toHaveBeenCalledWith('75');
  });

  it('affiche le message de chargement si les données géo sont absentes', () => {
    render(
      <TrouverDeptCarte
        question={makeQuestion('971', 'Guadeloupe')}
        geoData={{ departements: null, regions: null }}
        answerState="pending"
        onAnswer={vi.fn()}
      />,
    );
    expect(screen.getByText(/Chargement de la carte/i)).toBeInTheDocument();
  });
});
