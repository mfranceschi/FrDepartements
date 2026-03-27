import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import TableauPage from '../pages/TableauPage';

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

  it("l'onglet actif porte la classe bg-blue-600", () => {
    render(<TableauPage />);
    const listeBtn = screen.getByRole('button', { name: /liste complète/i });
    const regionsBtn = screen.getByRole('button', { name: /par région/i });

    // Par défaut « Liste complète » est actif
    expect(listeBtn.className).toContain('bg-blue-600');
    expect(regionsBtn.className).not.toContain('bg-blue-600');

    fireEvent.click(regionsBtn);

    expect(regionsBtn.className).toContain('bg-blue-600');
    expect(listeBtn.className).not.toContain('bg-blue-600');
  });

  it('affiche le sous-titre « 101 départements répartis en 18 régions »', () => {
    render(<TableauPage />);
    expect(screen.getByText(/101 départements répartis en 18 régions/i)).toBeInTheDocument();
  });
});
