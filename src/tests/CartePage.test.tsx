import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import CartePage from '../pages/CartePage';
import type { CarteFranceProps } from '../components/carte/CarteFrance';

vi.mock('../hooks/useGeoData', () => ({
  useGeoData: () => ({
    departements: { type: 'FeatureCollection', features: [] },
    regions: { type: 'FeatureCollection', features: [] },
    loading: false,
  }),
}));

vi.mock('../components/carte/CarteFrance', () => ({
  default: ({ onFeatureClick, onFleuveClick }: CarteFranceProps) => (
    <div data-testid="carte-france">
      <button data-testid="btn-dept-75" onClick={() => onFeatureClick?.('75', 'departement')}>
        Paris [dept]
      </button>
      <button data-testid="btn-region-11" onClick={() => onFeatureClick?.('11', 'region')}>
        Île-de-France [région]
      </button>
      <button data-testid="btn-fleuve-loire" onClick={() => onFleuveClick?.('Loire')}>
        Loire [fleuve]
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
    expect(within(getSidebar()).getByText(/Cliquez sur un département/i)).toBeInTheDocument();
  });

  it('affiche les infos du département après un clic sur la carte', () => {
    render(<CartePage />);
    fireEvent.click(screen.getByTestId('btn-dept-75'));

    const sidebar = getSidebar();
    expect(within(sidebar).getByRole('heading', { level: 2 })).toHaveTextContent('Paris');
    expect(within(sidebar).getByText('75')).toBeInTheDocument();
    expect(within(sidebar).getByText('Département')).toBeInTheDocument();
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
    expect(within(getSidebar()).queryByText(/Cliquez sur un département/i)).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId('btn-dept-75'));
    expect(within(getSidebar()).getByText(/Cliquez sur un département/i)).toBeInTheDocument();
  });

  it('bascule vers un autre territoire sans désélectionner le premier', () => {
    render(<CartePage />);
    fireEvent.click(screen.getByTestId('btn-dept-75'));
    fireEvent.click(screen.getByTestId('btn-region-11'));

    const sidebar = getSidebar();
    expect(within(sidebar).getByRole('heading', { level: 2 })).toHaveTextContent('Île-de-France');
    expect(within(sidebar).getByText('Région')).toBeInTheDocument();
  });

  it('sélection fleuve et territoire coexistent dans le panneau', () => {
    render(<CartePage />);
    fireEvent.click(screen.getByTestId('btn-fleuve-loire'));
    fireEvent.click(screen.getByTestId('btn-dept-75'));

    const sidebar = getSidebar();
    // Les deux headings doivent être présents
    const headings = within(sidebar).getAllByRole('heading', { level: 2 });
    const texts = headings.map((h) => h.textContent);
    expect(texts).toContain('Loire');
    expect(texts).toContain('Paris');
  });

  it('cliquer un territoire ne désélectionne pas le fleuve', () => {
    render(<CartePage />);
    fireEvent.click(screen.getByTestId('btn-fleuve-loire'));
    fireEvent.click(screen.getByTestId('btn-dept-75'));

    const sidebar = getSidebar();
    expect(within(sidebar).getByText('Cours d\'eau')).toBeInTheDocument();
    expect(within(sidebar).getByText('Département')).toBeInTheDocument();
  });
});

// ── Recherche ─────────────────────────────────────────────────────────────────

describe('CartePage – recherche dans la sidebar', () => {
  function getSearchInput() {
    return screen.getAllByPlaceholderText(/Rechercher/i)[0];
  }

  it('affiche le champ de recherche', () => {
    render(<CartePage />);
    expect(getSearchInput()).toBeInTheDocument();
  });

  it('affiche des résultats en tapant un nom de département', () => {
    render(<CartePage />);
    fireEvent.change(getSearchInput(), { target: { value: 'Paris' } });
    expect(screen.getAllByText('Paris', { selector: 'span.font-medium' })[0]).toBeInTheDocument();
  });

  it('affiche des résultats en tapant un code département', () => {
    render(<CartePage />);
    fireEvent.change(getSearchInput(), { target: { value: '29' } });
    expect(screen.getAllByText('Finistère', { selector: 'span.font-medium' })[0]).toBeInTheDocument();
  });

  it('affiche des résultats de type fleuve', () => {
    render(<CartePage />);
    fireEvent.change(getSearchInput(), { target: { value: 'Loire' } });
    expect(screen.getAllByText('Loire', { selector: 'span.font-medium' })[0]).toBeInTheDocument();
  });

  it('sélectionner un résultat affiche ses infos dans le panneau', () => {
    render(<CartePage />);
    fireEvent.change(getSearchInput(), { target: { value: 'Paris' } });

    const resultBtn = screen.getAllByText('Paris', { selector: 'span.font-medium' })[0].closest('button')!;
    fireEvent.mouseDown(resultBtn);

    const sidebar = getSidebar();
    expect(within(sidebar).getByRole('heading', { level: 2 })).toHaveTextContent('Paris');
    expect(within(sidebar).getByText('75')).toBeInTheDocument();
  });

  it('efface la saisie après sélection d\'un résultat', () => {
    render(<CartePage />);
    fireEvent.change(getSearchInput(), { target: { value: 'Paris' } });
    fireEvent.mouseDown(
      screen.getAllByText('Paris', { selector: 'span.font-medium' })[0].closest('button')!,
    );
    expect(getSearchInput()).toHaveValue('');
  });

  it('le bouton ✕ vide le champ de recherche', () => {
    render(<CartePage />);
    fireEvent.change(getSearchInput(), { target: { value: 'Paris' } });
    expect(screen.getAllByText('✕')[0]).toBeInTheDocument();

    fireEvent.click(screen.getAllByText('✕')[0]);
    expect(getSearchInput()).toHaveValue('');
    expect(screen.queryAllByText('Paris', { selector: 'span.font-medium' })).toHaveLength(0);
  });

  it('un résultat de type région est aussi accessible', () => {
    render(<CartePage />);
    fireEvent.change(getSearchInput(), { target: { value: 'Bretagne' } });
    expect(screen.getAllByText('Bretagne', { selector: 'span.font-medium' })[0]).toBeInTheDocument();
  });
});
