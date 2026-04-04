import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import QuizConfig from '../components/quiz/QuizConfig';
import type { QuizConfig as QuizConfigType } from '../quiz/types';

describe('QuizConfig – affichage initial', () => {
  it('sélectionne "depts-carte" comme sujet par défaut', () => {
    render(<QuizConfig onStart={vi.fn()} />);
    const radio = screen.getByRole('radio', { name: /Départements — Carte/i });
    expect(radio).toBeChecked();
  });

  it('affiche 5 sujets disponibles', () => {
    render(<QuizConfig onStart={vi.fn()} />);
    const radios = screen.getAllByRole('radio', { name: /Régions|Départements/i });
    expect(radios).toHaveLength(5);
  });

  it('sélectionne "facile" comme difficulté par défaut', () => {
    render(<QuizConfig onStart={vi.fn()} />);
    expect(screen.getByRole('radio', { name: 'facile' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'difficile' })).not.toBeChecked();
  });

  it('sélectionne 25 questions par défaut', () => {
    render(<QuizConfig onStart={vi.fn()} />);
    const btn25 = screen.getByRole('button', { name: '25' });
    expect(btn25).toHaveClass('bg-blue-600');
  });

  it('affiche le bouton "Commencer" actif', () => {
    render(<QuizConfig onStart={vi.fn()} />);
    expect(screen.getByRole('button', { name: /Commencer/i })).not.toBeDisabled();
  });
});

describe('QuizConfig – affichage difficulté conditionnel', () => {
  it('affiche la difficulté pour depts-carte (défaut)', () => {
    render(<QuizConfig onStart={vi.fn()} />);
    expect(screen.getByText(/Niveau de difficulté/i)).toBeInTheDocument();
  });

  it('n\'affiche pas la difficulté pour regions-carte', () => {
    render(<QuizConfig onStart={vi.fn()} />);
    fireEvent.click(screen.getByRole('radio', { name: /Régions — Carte/i }));
    expect(screen.queryByText(/Niveau de difficulté/i)).not.toBeInTheDocument();
  });

  it('n\'affiche pas la difficulté pour depts-prefectures', () => {
    render(<QuizConfig onStart={vi.fn()} />);
    fireEvent.click(screen.getByRole('radio', { name: /Départements — Préfectures/i }));
    expect(screen.queryByText(/Niveau de difficulté/i)).not.toBeInTheDocument();
  });

  it('n\'affiche pas la difficulté pour regions-prefectures', () => {
    render(<QuizConfig onStart={vi.fn()} />);
    fireEvent.click(screen.getByRole('radio', { name: /Régions — Préfectures/i }));
    expect(screen.queryByText(/Niveau de difficulté/i)).not.toBeInTheDocument();
  });

  it('affiche la difficulté pour depts-numeros', () => {
    render(<QuizConfig onStart={vi.fn()} />);
    fireEvent.click(screen.getByRole('radio', { name: /Départements — Numéros/i }));
    expect(screen.getByText(/Niveau de difficulté/i)).toBeInTheDocument();
  });
});

describe('QuizConfig – interaction difficulté', () => {
  it('change la difficulté en cliquant "difficile"', () => {
    render(<QuizConfig onStart={vi.fn()} />);
    fireEvent.click(screen.getByRole('radio', { name: 'difficile' }));
    expect(screen.getByRole('radio', { name: 'difficile' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'facile' })).not.toBeChecked();
  });
});

describe('QuizConfig – interaction longueur de session', () => {
  it('change la longueur en cliquant sur un bouton', () => {
    render(<QuizConfig onStart={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: '10' }));
    expect(screen.getByRole('button', { name: '10' })).toHaveClass('bg-blue-600');
    expect(screen.getByRole('button', { name: '25' })).not.toHaveClass('bg-blue-600');
  });

  it('sélectionne "Tout" comme longueur', () => {
    render(<QuizConfig onStart={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Tout' }));
    expect(screen.getByRole('button', { name: 'Tout' })).toHaveClass('bg-blue-600');
  });
});

describe('QuizConfig – soumission', () => {
  it('appelle onStart avec la config par défaut au clic sur Commencer', () => {
    const onStart = vi.fn();
    render(<QuizConfig onStart={onStart} />);
    fireEvent.click(screen.getByRole('button', { name: /Commencer/i }));

    expect(onStart).toHaveBeenCalledOnce();
    const config: QuizConfigType = onStart.mock.calls[0][0];
    expect(config.sujet).toBe('depts-carte');
    expect(config.difficulty).toBe('facile');
    expect(config.sessionLength).toBe(25);
  });

  it('transmet la difficulté et la longueur choisies', () => {
    const onStart = vi.fn();
    render(<QuizConfig onStart={onStart} />);

    fireEvent.click(screen.getByRole('radio', { name: 'difficile' }));
    fireEvent.click(screen.getByRole('button', { name: '50' }));
    fireEvent.click(screen.getByRole('button', { name: /Commencer/i }));

    const config: QuizConfigType = onStart.mock.calls[0][0];
    expect(config.difficulty).toBe('difficile');
    expect(config.sessionLength).toBe(50);
  });

  it('transmet le sujet sélectionné', () => {
    const onStart = vi.fn();
    render(<QuizConfig onStart={onStart} />);

    fireEvent.click(screen.getByRole('radio', { name: /Régions — Carte/i }));
    fireEvent.click(screen.getByRole('button', { name: /Commencer/i }));

    const config: QuizConfigType = onStart.mock.calls[0][0];
    expect(config.sujet).toBe('regions-carte');
  });
});
