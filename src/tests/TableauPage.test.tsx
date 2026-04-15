import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import TableauPage from '../pages/TableauPage';
import { DEPARTEMENTS } from '../data/departements';
import { REGIONS } from '../data/regions';

// Les sous-composants sont mockés : on teste uniquement le comportement
// de l'onglet (quel composant est monté), pas le contenu interne.
vi.mock('../components/tableau/AccordionRegions', () => ({
  default: () => <div data-testid="accordion-regions">AccordionRegions</div>,
}));
vi.mock('../components/tableau/TableauFlat', () => ({
  default: () => <div data-testid="tableau-flat">TableauFlat</div>,
}));

describe('TableauPage', () => {
  it('affiche le titre et les deux onglets', () => {
    render(<TableauPage />);
    expect(screen.getByRole('heading', { name: /départements français/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /par région/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /liste complète/i })).toBeInTheDocument();
  });

  it('affiche TableauFlat (liste complète) par défaut', () => {
    render(<TableauPage />);
    expect(screen.getByTestId('tableau-flat')).toBeInTheDocument();
    expect(screen.queryByTestId('accordion-regions')).not.toBeInTheDocument();
  });

  it('bascule vers AccordionRegions au clic sur « Par région »', () => {
    render(<TableauPage />);
    fireEvent.click(screen.getByRole('button', { name: /par région/i }));
    expect(screen.getByTestId('accordion-regions')).toBeInTheDocument();
    expect(screen.queryByTestId('tableau-flat')).not.toBeInTheDocument();
  });

  it('revient à TableauFlat au clic sur « Liste complète »', () => {
    render(<TableauPage />);
    fireEvent.click(screen.getByRole('button', { name: /par région/i }));
    fireEvent.click(screen.getByRole('button', { name: /liste complète/i }));
    expect(screen.getByTestId('tableau-flat')).toBeInTheDocument();
    expect(screen.queryByTestId('accordion-regions')).not.toBeInTheDocument();
  });

  it("l'onglet actif a le style de mise en évidence", () => {
    render(<TableauPage />);
    const listeBtn = screen.getByRole('button', { name: /liste complète/i });
    const regionsBtn = screen.getByRole('button', { name: /par région/i });

    // Par défaut « Liste complète » est actif (fond bleu via style inline)
    expect(listeBtn.style.backgroundColor).toBe('rgb(37, 99, 235)');
    expect(regionsBtn.style.backgroundColor).not.toBe('rgb(37, 99, 235)');

    fireEvent.click(regionsBtn);

    expect(regionsBtn.style.backgroundColor).toBe('rgb(37, 99, 235)');
    expect(listeBtn.style.backgroundColor).not.toBe('rgb(37, 99, 235)');
  });

  it('affiche le sous-titre avec le nombre réel de départements et régions', () => {
    render(<TableauPage />);
    expect(
      screen.getByText((_, el) =>
        el?.textContent === `${DEPARTEMENTS.length} départements répartis en ${REGIONS.length} régions`,
      ),
    ).toBeInTheDocument();
  });
});
