import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import QuizConfig from '../components/quiz/QuizConfig';
import type { QuizConfig as QuizConfigType } from '../quiz/types';

function renderConfig(onStart = vi.fn()) {
  render(<QuizConfig onStart={onStart} />);
  return { onStart };
}

// ── Affichage initial ─────────────────────────────────────────────────────────

describe('QuizConfig – affichage initial', () => {
  it('sélectionne "depts-carte" comme sujet par défaut', () => {
    renderConfig();
    expect(screen.getByRole('radio', { name: /Départements — Carte/i })).toBeChecked();
  });

  it('affiche 5 sujets disponibles', () => {
    renderConfig();
    expect(screen.getAllByRole('radio', { name: /Régions|Départements/i })).toHaveLength(5);
  });

  it('sélectionne "facile" comme difficulté par défaut', () => {
    renderConfig();
    expect(screen.getByRole('radio', { name: 'facile' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'difficile' })).not.toBeChecked();
  });

  it('sélectionne 25 questions par défaut', () => {
    renderConfig();
    expect(screen.getByRole('button', { name: '25' })).toHaveClass('bg-blue-600');
  });

  it('affiche le bouton "Commencer" actif', () => {
    renderConfig();
    expect(screen.getByRole('button', { name: /Commencer/i })).not.toBeDisabled();
  });

  it('le mode adaptatif est désactivé par défaut', () => {
    renderConfig();
    expect(screen.getByRole('checkbox', { name: /points faibles/i })).not.toBeChecked();
  });
});

// ── Visibilité des sections selon le sujet ────────────────────────────────────

describe('QuizConfig – visibilité conditionnelle des sections', () => {
  it('affiche la difficulté pour tous les sujets', () => {
    renderConfig();
    for (const label of [
      /Départements — Carte/i,
      /Régions — Carte/i,
      /Départements — Numéros/i,
      /Départements — Préfectures/i,
      /Régions — Préfectures/i,
    ]) {
      fireEvent.click(screen.getByRole('radio', { name: label }));
      expect(screen.getByText(/Niveau de difficulté/i)).toBeInTheDocument();
    }
  });

  it('affiche la zone géographique pour depts-carte (défaut)', () => {
    renderConfig();
    expect(screen.getByText(/Zone géographique/i)).toBeInTheDocument();
  });

  it('affiche la zone géographique pour depts-numeros et depts-prefectures', () => {
    renderConfig();
    for (const label of [/Départements — Numéros/i, /Départements — Préfectures/i]) {
      fireEvent.click(screen.getByRole('radio', { name: label }));
      expect(screen.getByText(/Zone géographique/i)).toBeInTheDocument();
    }
  });

  it('n\'affiche pas la zone géographique pour les sujets régions', () => {
    renderConfig();
    for (const label of [/Régions — Carte/i, /Régions — Préfectures/i]) {
      fireEvent.click(screen.getByRole('radio', { name: label }));
      expect(screen.queryByText(/Zone géographique/i)).not.toBeInTheDocument();
    }
  });

  it('affiche le nombre de questions pour depts-carte (défaut)', () => {
    renderConfig();
    expect(screen.getByText(/Nombre de questions/i)).toBeInTheDocument();
  });

  it('n\'affiche pas le nombre de questions pour regions-carte', () => {
    renderConfig();
    fireEvent.click(screen.getByRole('radio', { name: /Régions — Carte/i }));
    expect(screen.queryByText(/Nombre de questions/i)).not.toBeInTheDocument();
  });

  it('n\'affiche pas le nombre de questions pour regions-prefectures', () => {
    renderConfig();
    fireEvent.click(screen.getByRole('radio', { name: /Régions — Préfectures/i }));
    expect(screen.queryByText(/Nombre de questions/i)).not.toBeInTheDocument();
  });
});

// ── Interaction difficulté ────────────────────────────────────────────────────

describe('QuizConfig – interaction difficulté', () => {
  it('change la difficulté en cliquant "difficile"', () => {
    renderConfig();
    fireEvent.click(screen.getByRole('radio', { name: 'difficile' }));
    expect(screen.getByRole('radio', { name: 'difficile' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'facile' })).not.toBeChecked();
  });
});

// ── Interaction longueur de session ───────────────────────────────────────────

describe('QuizConfig – interaction longueur de session', () => {
  it('change la longueur en cliquant sur un bouton', () => {
    renderConfig();
    fireEvent.click(screen.getByRole('button', { name: '10' }));
    expect(screen.getByRole('button', { name: '10' })).toHaveClass('bg-blue-600');
    expect(screen.getByRole('button', { name: '25' })).not.toHaveClass('bg-blue-600');
  });

  it('sélectionne "Tout" comme longueur', () => {
    renderConfig();
    fireEvent.click(screen.getByRole('button', { name: 'Tout' }));
    expect(screen.getByRole('button', { name: 'Tout' })).toHaveClass('bg-blue-600');
  });
});

// ── Zone géographique ─────────────────────────────────────────────────────────

describe('QuizConfig – zone géographique', () => {
  it('sélectionne "Toute la France" par défaut', () => {
    renderConfig();
    expect(screen.getByRole('button', { name: 'Toute la France' })).toHaveClass('bg-blue-600');
  });

  it('change la zone en cliquant "Nord-Ouest"', () => {
    renderConfig();
    fireEvent.click(screen.getByRole('button', { name: 'Nord-Ouest' }));
    expect(screen.getByRole('button', { name: 'Nord-Ouest' })).toHaveClass('bg-blue-600');
    expect(screen.getByRole('button', { name: 'Toute la France' })).not.toHaveClass('bg-blue-600');
  });

  it('affiche la description de la zone sélectionnée', () => {
    renderConfig();
    fireEvent.click(screen.getByRole('button', { name: 'Nord-Ouest' }));
    expect(screen.getByText(/Hauts-de-France/i)).toBeInTheDocument();
  });

  it('n\'affiche pas de description pour "Toute la France"', () => {
    renderConfig();
    expect(screen.queryByText(/Hauts-de-France|Normandie|Bretagne/i)).not.toBeInTheDocument();
  });

  it('affiche un avertissement quand la longueur dépasse le nombre de depts de la zone', () => {
    renderConfig();
    // Nord-Ouest ≈ 19 depts, sessionLength par défaut = 25 → cap dépassé
    fireEvent.click(screen.getByRole('button', { name: 'Nord-Ouest' }));
    expect(screen.getByText(/sera limitée/i)).toBeInTheDocument();
  });

  it('n\'affiche pas d\'avertissement si la longueur est inférieure au nombre de depts', () => {
    renderConfig();
    fireEvent.click(screen.getByRole('button', { name: 'Nord-Ouest' }));
    fireEvent.click(screen.getByRole('button', { name: '10' }));
    expect(screen.queryByText(/sera limitée/i)).not.toBeInTheDocument();
  });
});

// ── Mode adaptatif ────────────────────────────────────────────────────────────

describe('QuizConfig – mode adaptatif', () => {
  it('active le mode adaptatif en cochant la checkbox', () => {
    renderConfig();
    const checkbox = screen.getByRole('checkbox', { name: /points faibles/i });
    fireEvent.click(checkbox);
    expect(checkbox).toBeChecked();
  });

  it('désactive le mode adaptatif en décochant la checkbox', () => {
    renderConfig();
    const checkbox = screen.getByRole('checkbox', { name: /points faibles/i });
    fireEvent.click(checkbox);
    fireEvent.click(checkbox);
    expect(checkbox).not.toBeChecked();
  });
});

// ── Soumission ────────────────────────────────────────────────────────────────

describe('QuizConfig – soumission', () => {
  it('appelle onStart avec la config par défaut au clic sur Commencer', () => {
    const { onStart } = renderConfig();
    fireEvent.click(screen.getByRole('button', { name: /Commencer/i }));

    expect(onStart).toHaveBeenCalledOnce();
    const config: QuizConfigType = onStart.mock.calls[0][0];
    expect(config.sujet).toBe('depts-carte');
    expect(config.difficulty).toBe('facile');
    expect(config.sessionLength).toBe(25);
    expect(config.adaptative).toBe(false);
    expect(config.filterCodes).toBeUndefined();
  });

  it('transmet la difficulté et la longueur choisies', () => {
    const { onStart } = renderConfig();
    fireEvent.click(screen.getByRole('radio', { name: 'difficile' }));
    fireEvent.click(screen.getByRole('button', { name: '50' }));
    fireEvent.click(screen.getByRole('button', { name: /Commencer/i }));

    const config: QuizConfigType = onStart.mock.calls[0][0];
    expect(config.difficulty).toBe('difficile');
    expect(config.sessionLength).toBe(50);
  });

  it('transmet le sujet sélectionné', () => {
    const { onStart } = renderConfig();
    fireEvent.click(screen.getByRole('radio', { name: /Régions — Carte/i }));
    fireEvent.click(screen.getByRole('button', { name: /Commencer/i }));

    expect(onStart.mock.calls[0][0].sujet).toBe('regions-carte');
  });

  it('transmet sessionLength "tout" pour regions-carte quel que soit le réglage', () => {
    const { onStart } = renderConfig();
    fireEvent.click(screen.getByRole('radio', { name: /Régions — Carte/i }));
    fireEvent.click(screen.getByRole('button', { name: /Commencer/i }));

    expect(onStart.mock.calls[0][0].sessionLength).toBe('tout');
  });

  it('transmet adaptative: true quand la checkbox est cochée', () => {
    const { onStart } = renderConfig();
    fireEvent.click(screen.getByRole('checkbox', { name: /points faibles/i }));
    fireEvent.click(screen.getByRole('button', { name: /Commencer/i }));

    expect(onStart.mock.calls[0][0].adaptative).toBe(true);
  });

  it('transmet filterCodes (tableau non vide) quand une zone est sélectionnée', () => {
    const { onStart } = renderConfig();
    fireEvent.click(screen.getByRole('button', { name: 'Nord-Ouest' }));
    fireEvent.click(screen.getByRole('button', { name: /Commencer/i }));

    const config: QuizConfigType = onStart.mock.calls[0][0];
    expect(config.filterCodes).toBeInstanceOf(Array);
    expect((config.filterCodes as string[]).length).toBeGreaterThan(0);
  });

  it('transmet filterCodes: undefined quand "Toute la France" est sélectionnée', () => {
    const { onStart } = renderConfig();
    fireEvent.click(screen.getByRole('button', { name: /Commencer/i }));

    expect(onStart.mock.calls[0][0].filterCodes).toBeUndefined();
  });
});
