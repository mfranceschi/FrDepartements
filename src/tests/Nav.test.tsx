import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import Nav from '../components/Nav';

function renderNavAt(path: string) {
  const router = createMemoryRouter(
    [{ path: '*', element: <Nav /> }],
    { initialEntries: [path] },
  );
  return render(<RouterProvider router={router} />);
}

describe('Nav – liens de navigation', () => {
  it('affiche les trois liens', () => {
    renderNavAt('/carte');
    expect(screen.getByRole('link', { name: 'Carte' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Quiz' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Tableau' })).toBeInTheDocument();
  });

  it('les liens pointent vers les bonnes routes', () => {
    renderNavAt('/carte');
    expect(screen.getByRole('link', { name: 'Carte' })).toHaveAttribute('href', '/carte');
    expect(screen.getByRole('link', { name: 'Quiz' })).toHaveAttribute('href', '/quiz');
    expect(screen.getByRole('link', { name: 'Tableau' })).toHaveAttribute('href', '/tableau');
  });
});

describe('Nav – lien actif (aria-current)', () => {
  it('marque /carte comme actif sur /carte', () => {
    renderNavAt('/carte');
    expect(screen.getByRole('link', { name: 'Carte' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Quiz' })).not.toHaveAttribute('aria-current');
    expect(screen.getByRole('link', { name: 'Tableau' })).not.toHaveAttribute('aria-current');
  });

  it('marque /quiz comme actif sur /quiz', () => {
    renderNavAt('/quiz');
    expect(screen.getByRole('link', { name: 'Quiz' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Carte' })).not.toHaveAttribute('aria-current');
    expect(screen.getByRole('link', { name: 'Tableau' })).not.toHaveAttribute('aria-current');
  });

  it('marque /tableau comme actif sur /tableau', () => {
    renderNavAt('/tableau');
    expect(screen.getByRole('link', { name: 'Tableau' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Carte' })).not.toHaveAttribute('aria-current');
    expect(screen.getByRole('link', { name: 'Quiz' })).not.toHaveAttribute('aria-current');
  });

  it('aucun lien actif sur une route inconnue', () => {
    renderNavAt('/autre');
    screen.getAllByRole('link').forEach((link) => {
      expect(link).not.toHaveAttribute('aria-current');
    });
  });
});
