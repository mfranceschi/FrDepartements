import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import App from '../App';
import type { CarteFranceProps } from '../components/carte/CarteFrance';

// useBlocker n'est pas supporté par BrowserRouter (legacy) ; on le neutralise
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useBlocker: () => ({ state: 'unblocked' as const, proceed: vi.fn(), reset: vi.fn() }),
  };
});

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
  default: (_props: CarteFranceProps) => <div data-testid="carte-france-stub" />,
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

  it('redirige vers /carte par défaut et affiche la carte', () => {
    render(<App />);
    // La carte est visible (les 3 pages sont toutes montées, seule /carte est affichée)
    expect(screen.getByTestId('carte-france-stub')).toBeInTheDocument();
  });
});
