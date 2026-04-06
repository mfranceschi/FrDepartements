import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import Nav from '../components/Nav';

function renderNavAt(path: string) {
  const router = createMemoryRouter(
    [{ path: '*', element: <Nav /> }],
    { initialEntries: [path] },
  );
  return render(<RouterProvider router={router} />);
}

function getTopNav() {
  return screen.getByRole('navigation', { name: 'Navigation principale' });
}

describe('Nav – liens de navigation', () => {
  it('affiche les trois liens', () => {
    renderNavAt('/carte');
    const nav = getTopNav();
    expect(within(nav).getByRole('link', { name: 'Carte' })).toBeInTheDocument();
    expect(within(nav).getByRole('link', { name: 'Quiz' })).toBeInTheDocument();
    expect(within(nav).getByRole('link', { name: 'Tableau' })).toBeInTheDocument();
  });

  it('les liens pointent vers les bonnes routes', () => {
    renderNavAt('/carte');
    const nav = getTopNav();
    expect(within(nav).getByRole('link', { name: 'Carte' })).toHaveAttribute('href', '/carte');
    expect(within(nav).getByRole('link', { name: 'Quiz' })).toHaveAttribute('href', '/quiz');
    expect(within(nav).getByRole('link', { name: 'Tableau' })).toHaveAttribute('href', '/tableau');
  });
});

describe('Nav – lien actif (aria-current)', () => {
  it('marque /carte comme actif sur /carte', () => {
    renderNavAt('/carte');
    const nav = getTopNav();
    expect(within(nav).getByRole('link', { name: 'Carte' })).toHaveAttribute('aria-current', 'page');
    expect(within(nav).getByRole('link', { name: 'Quiz' })).not.toHaveAttribute('aria-current');
    expect(within(nav).getByRole('link', { name: 'Tableau' })).not.toHaveAttribute('aria-current');
  });

  it('marque /quiz comme actif sur /quiz', () => {
    renderNavAt('/quiz');
    const nav = getTopNav();
    expect(within(nav).getByRole('link', { name: 'Quiz' })).toHaveAttribute('aria-current', 'page');
    expect(within(nav).getByRole('link', { name: 'Carte' })).not.toHaveAttribute('aria-current');
    expect(within(nav).getByRole('link', { name: 'Tableau' })).not.toHaveAttribute('aria-current');
  });

  it('marque /tableau comme actif sur /tableau', () => {
    renderNavAt('/tableau');
    const nav = getTopNav();
    expect(within(nav).getByRole('link', { name: 'Tableau' })).toHaveAttribute('aria-current', 'page');
    expect(within(nav).getByRole('link', { name: 'Carte' })).not.toHaveAttribute('aria-current');
    expect(within(nav).getByRole('link', { name: 'Quiz' })).not.toHaveAttribute('aria-current');
  });

  it('aucun lien actif sur une route inconnue', () => {
    renderNavAt('/autre');
    within(getTopNav()).getAllByRole('link').forEach((link) => {
      expect(link).not.toHaveAttribute('aria-current');
    });
  });
});
