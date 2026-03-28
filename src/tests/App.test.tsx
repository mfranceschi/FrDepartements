import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import App from '../App';

// Données géo vides mais valides pour éviter les erreurs de chargement
vi.mock('../hooks/useGeoData', () => ({
  useGeoData: () => ({
    departements: { type: 'FeatureCollection', features: [] },
    regions: { type: 'FeatureCollection', features: [] },
    loading: false,
  }),
}));

// CarteFrance : stub léger (évite D3 + SVG dans jsdom)
vi.mock('../components/carte/CarteFrance', () => ({
  default: () => <div data-testid="carte-france-stub" />,
}));

describe('App – smoke test', () => {
  it('se monte sans erreur et affiche la navigation', () => {
    render(<App />);
    const nav = screen.getByRole('navigation');
    expect(nav).toBeInTheDocument();
    expect(within(nav).getByText('Carte')).toBeInTheDocument();
    expect(within(nav).getByText('Quiz')).toBeInTheDocument();
    expect(within(nav).getByText('Tableau')).toBeInTheDocument();
  });

  it('redirige vers /quiz par défaut et affiche la page quiz', () => {
    render(<App />);
    // La page quiz est visible (les 3 pages sont montées, seule /quiz est affichée)
    expect(screen.getByText('Départements de France')).toBeInTheDocument();
  });
});
