import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ErrorBoundary from '../components/ErrorBoundary';

// ─── Composants utilitaires ───────────────────────────────────────────────────

/** Lance toujours une erreur si shouldThrow est true. */
function Bomb({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) throw new Error('Explosion de test');
  return <div>Contenu normal</div>;
}

/**
 * Bombe dont le comportement est contrôlé par une variable externe,
 * utile pour tester le reset sans re-rendre le composant parent.
 */
let throwOnNextRender = true;
function ToggleBomb() {
  if (throwOnNextRender) throw new Error('Erreur contrôlée');
  return <div>Récupéré avec succès</div>;
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('ErrorBoundary', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // Silence les logs d'erreur React pour ne pas polluer la sortie des tests.
    consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it("rend les enfants normalement en l'absence d'erreur", () => {
    render(
      <ErrorBoundary>
        <Bomb shouldThrow={false} />
      </ErrorBoundary>,
    );
    expect(screen.getByText('Contenu normal')).toBeInTheDocument();
  });

  it('affiche le fallback quand un enfant lève une erreur', () => {
    render(
      <ErrorBoundary>
        <Bomb shouldThrow={true} />
      </ErrorBoundary>,
    );
    expect(screen.getByText(/une erreur inattendue s'est produite/i)).toBeInTheDocument();
    expect(screen.getByText('Explosion de test')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Réessayer' })).toBeInTheDocument();
  });

  it("inclut le nom de la zone dans le message d'erreur quand name est fourni", () => {
    render(
      <ErrorBoundary name="CartePage">
        <Bomb shouldThrow={true} />
      </ErrorBoundary>,
    );
    expect(screen.getByText(/dans CartePage/i)).toBeInTheDocument();
  });

  it("n'affiche pas de nom de zone si la prop name est absente", () => {
    render(
      <ErrorBoundary>
        <Bomb shouldThrow={true} />
      </ErrorBoundary>,
    );
    // Le message se termine par un point, sans "dans …"
    const heading = screen.getByRole('heading', { level: 2 });
    expect(heading.textContent).not.toMatch(/dans /);
  });

  it("log l'erreur via console.error avec le nom de la zone", () => {
    render(
      <ErrorBoundary name="TestZone">
        <Bomb shouldThrow={true} />
      </ErrorBoundary>,
    );
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('[ErrorBoundary – TestZone]'),
      expect.any(Error),
      expect.anything(),
    );
  });

  it("log l'erreur via console.error sans nom si name est absent", () => {
    render(
      <ErrorBoundary>
        <Bomb shouldThrow={true} />
      </ErrorBoundary>,
    );
    expect(consoleSpy).toHaveBeenCalledWith(
      '[ErrorBoundary]',
      expect.any(Error),
      expect.anything(),
    );
  });

  it('le bouton Réessayer remet hasError à false et re-rend les enfants', () => {
    throwOnNextRender = true;
    render(
      <ErrorBoundary>
        <ToggleBomb />
      </ErrorBoundary>,
    );

    // Le fallback est affiché
    expect(screen.getByRole('button', { name: 'Réessayer' })).toBeInTheDocument();

    // Le prochain rendu ne lancera plus d'erreur
    throwOnNextRender = false;
    fireEvent.click(screen.getByRole('button', { name: 'Réessayer' }));

    // Les enfants sont de nouveau rendus normalement
    expect(screen.getByText('Récupéré avec succès')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Réessayer' })).not.toBeInTheDocument();
  });

  it("affiche le message de l'erreur dans le paragraphe de description", () => {
    render(
      <ErrorBoundary>
        <Bomb shouldThrow={true} />
      </ErrorBoundary>,
    );
    // Le message exact de l'erreur doit figurer dans la description sous le titre
    const desc = screen.getByText('Explosion de test');
    expect(desc.tagName.toLowerCase()).toBe('p');
  });
});
