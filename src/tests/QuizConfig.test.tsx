import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import QuizConfig from '../components/quiz/QuizConfig';
import type { QuizConfig as QuizConfigType } from '../quiz/types';

describe('QuizConfig – affichage initial', () => {
  it('coche tous les modes par défaut', () => {
    render(<QuizConfig onStart={vi.fn()} />);
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes).toHaveLength(5);
    checkboxes.forEach((cb) => expect(cb).toBeChecked());
  });

  it('sélectionne "facile" comme difficulté par défaut', () => {
    render(<QuizConfig onStart={vi.fn()} />);
    expect(screen.getByRole('radio', { name: 'facile' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'difficile' })).not.toBeChecked();
  });

  it('sélectionne 25 questions par défaut', () => {
    render(<QuizConfig onStart={vi.fn()} />);
    // Le bouton "25" doit avoir la classe active (bg-blue-600)
    const btn25 = screen.getByRole('button', { name: '25' });
    expect(btn25).toHaveClass('bg-blue-600');
  });

  it('affiche le bouton "Commencer" actif', () => {
    render(<QuizConfig onStart={vi.fn()} />);
    expect(screen.getByRole('button', { name: /Commencer/i })).not.toBeDisabled();
  });
});

describe('QuizConfig – interaction modes', () => {
  it('décoche un mode en cliquant sur sa case', () => {
    render(<QuizConfig onStart={vi.fn()} />);
    const firstCheckbox = screen.getAllByRole('checkbox')[0];
    fireEvent.click(firstCheckbox);
    expect(firstCheckbox).not.toBeChecked();
  });

  it('affiche un message d\'erreur si tous les modes sont décochés', () => {
    render(<QuizConfig onStart={vi.fn()} />);
    screen.getAllByRole('checkbox').forEach((cb) => fireEvent.click(cb));
    expect(screen.getByText(/Sélectionnez au moins un type de question/i)).toBeInTheDocument();
  });

  it('désactive le bouton "Commencer" si aucun mode sélectionné', () => {
    render(<QuizConfig onStart={vi.fn()} />);
    screen.getAllByRole('checkbox').forEach((cb) => fireEvent.click(cb));
    expect(screen.getByRole('button', { name: /Commencer/i })).toBeDisabled();
  });

  it('réactive le bouton en re-cochant au moins un mode', () => {
    render(<QuizConfig onStart={vi.fn()} />);
    const checkboxes = screen.getAllByRole('checkbox');
    checkboxes.forEach((cb) => fireEvent.click(cb));
    fireEvent.click(checkboxes[0]); // on en recoche un
    expect(screen.getByRole('button', { name: /Commencer/i })).not.toBeDisabled();
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
  it('appelle onStart avec la config complète au clic sur Commencer', () => {
    const onStart = vi.fn();
    render(<QuizConfig onStart={onStart} />);
    fireEvent.click(screen.getByRole('button', { name: /Commencer/i }));

    expect(onStart).toHaveBeenCalledOnce();
    const config: QuizConfigType = onStart.mock.calls[0][0];
    expect(config.modes).toHaveLength(5);
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

  it('transmet uniquement les modes cochés', () => {
    const onStart = vi.fn();
    render(<QuizConfig onStart={onStart} />);

    // Décoche tous sauf le premier
    const checkboxes = screen.getAllByRole('checkbox');
    checkboxes.slice(1).forEach((cb) => fireEvent.click(cb));
    fireEvent.click(screen.getByRole('button', { name: /Commencer/i }));

    const config: QuizConfigType = onStart.mock.calls[0][0];
    expect(config.modes).toHaveLength(1);
  });

  it('ne déclenche pas onStart si aucun mode coché', () => {
    const onStart = vi.fn();
    render(<QuizConfig onStart={onStart} />);
    screen.getAllByRole('checkbox').forEach((cb) => fireEvent.click(cb));
    fireEvent.click(screen.getByRole('button', { name: /Commencer/i }));
    expect(onStart).not.toHaveBeenCalled();
  });
});
