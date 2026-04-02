import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import CartePage from '../pages/CartePage';
import type { CarteFranceProps } from '../components/carte/CarteFrance';

// useGeoData renvoie des données vides mais non-null pour passer les gardes
vi.mock('../hooks/useGeoData', () => ({
  useGeoData: () => ({
    departements: { type: 'FeatureCollection', features: [] },
    regions: { type: 'FeatureCollection', features: [] },
    loading: false,
  }),
}));

// CarteFrance expose des boutons cliquables pour simuler les clics sur la carte
vi.mock('../components/carte/CarteFrance', () => ({
  default: ({ onFeatureClick }: CarteFranceProps) => (
    <div data-testid="carte-france">
      <button
        data-testid="btn-dept-75"
        onClick={() => onFeatureClick?.('75', 'departement')}
      >
        Paris [dept]
      </button>
      <button
        data-testid="btn-region-11"
        onClick={() => onFeatureClick?.('11', 'region')}
      >
        Île-de-France [région]
      </button>
    </div>
  ),
}));

function getSidebar() {
  return screen.getByRole('complementary');
}

describe('CartePage – panneau d\'informations', () => {
  it('affiche le message par défaut quand rien n\'est sélectionné', () => {
    render(<CartePage />);
    expect(within(getSidebar()).getByText(/Cliquez sur un département ou une région/i)).toBeInTheDocument();
  });

  it('affiche les infos du département après un clic sur la carte', () => {
    render(<CartePage />);
    fireEvent.click(screen.getByTestId('btn-dept-75'));

    const sidebar = getSidebar();
    expect(within(sidebar).getByRole('heading', { level: 2 })).toHaveTextContent('Paris');
    expect(within(sidebar).getByText('75')).toBeInTheDocument();
    expect(within(sidebar).getByText('Département')).toBeInTheDocument();
    // La région associée doit apparaître
    expect(within(sidebar).getByText('Île-de-France')).toBeInTheDocument();
  });

  it('affiche les infos de la région après un clic sur la carte', () => {
    render(<CartePage />);
    fireEvent.click(screen.getByTestId('btn-region-11'));

    const sidebar = getSidebar();
    expect(within(sidebar).getByRole('heading', { level: 2 })).toHaveTextContent('Île-de-France');
    expect(within(sidebar).getByText('11')).toBeInTheDocument();
    expect(within(sidebar).getByText('Région')).toBeInTheDocument();
  });

  it('désélectionne le territoire en cliquant deux fois sur le même', () => {
    render(<CartePage />);
    fireEvent.click(screen.getByTestId('btn-dept-75'));
    expect(within(getSidebar()).queryByText(/Cliquez sur un département ou une région/i)).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId('btn-dept-75'));
    expect(within(getSidebar()).getByText(/Cliquez sur un département ou une région/i)).toBeInTheDocument();
  });

  it('bascule vers un autre territoire sans désélectionner le premier', () => {
    render(<CartePage />);
    fireEvent.click(screen.getByTestId('btn-dept-75'));
    fireEvent.click(screen.getByTestId('btn-region-11'));

    const sidebar = getSidebar();
    expect(within(sidebar).getByRole('heading', { level: 2 })).toHaveTextContent('Île-de-France');
    expect(within(sidebar).getByText('Région')).toBeInTheDocument();
  });

});

// ── Recherche dans la sidebar ─────────────────────────────────────────────────
// useSearch utilise DEPARTEMENTS/REGIONS statiques — pas besoin de données géo.

describe('CartePage – recherche dans la sidebar', () => {
  function getSearchInput() {
    return screen.getByPlaceholderText(/Rechercher un département/i);
  }

  it('affiche le champ de recherche', () => {
    render(<CartePage />);
    expect(getSearchInput()).toBeInTheDocument();
  });

  it('affiche des résultats en tapant un nom de département', () => {
    render(<CartePage />);
    fireEvent.change(getSearchInput(), { target: { value: 'Paris' } });
    expect(screen.getByText('Paris', { selector: 'span.font-medium' })).toBeInTheDocument();
  });

  it('affiche des résultats en tapant un code département', () => {
    render(<CartePage />);
    fireEvent.change(getSearchInput(), { target: { value: '29' } });
    expect(screen.getByText('Finistère', { selector: 'span.font-medium' })).toBeInTheDocument();
  });

  it('sélectionner un résultat affiche ses infos dans le panneau', () => {
    render(<CartePage />);
    fireEvent.change(getSearchInput(), { target: { value: 'Paris' } });

    const resultBtn = screen.getByText('Paris', { selector: 'span.font-medium' }).closest('button')!;
    fireEvent.mouseDown(resultBtn);

    const sidebar = getSidebar();
    expect(within(sidebar).getByRole('heading', { level: 2 })).toHaveTextContent('Paris');
    expect(within(sidebar).getByText('75')).toBeInTheDocument();
  });

  it('efface la saisie après sélection d\'un résultat', () => {
    render(<CartePage />);
    fireEvent.change(getSearchInput(), { target: { value: 'Paris' } });
    fireEvent.mouseDown(
      screen.getByText('Paris', { selector: 'span.font-medium' }).closest('button')!,
    );
    expect(getSearchInput()).toHaveValue('');
  });

  it('le bouton ✕ vide le champ de recherche', () => {
    render(<CartePage />);
    fireEvent.change(getSearchInput(), { target: { value: 'Paris' } });
    expect(screen.getByText('✕')).toBeInTheDocument();

    fireEvent.click(screen.getByText('✕'));
    expect(getSearchInput()).toHaveValue('');
    expect(screen.queryByText('Paris', { selector: 'span.font-medium' })).not.toBeInTheDocument();
  });

  it('un résultat de type région est aussi accessible', () => {
    render(<CartePage />);
    fireEvent.change(getSearchInput(), { target: { value: 'Bretagne' } });
    expect(screen.getByText('Bretagne', { selector: 'span.font-medium' })).toBeInTheDocument();
  });
});
