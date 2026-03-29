import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import QuizConfig from '../components/quiz/QuizConfig';
import type { QuizConfig as QuizConfigType } from '../quiz/types';

describe('QuizConfig – affichage initial', () => {
  it('coche uniquement TrouverDeptCarte et DROM par défaut', () => {
    render(<QuizConfig onStart={vi.fn()} />);
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes).toHaveLength(8); // 7 modes + 1 DROM
    // TrouverDeptCarte = index 2 (après 2 modes Région), DROM = index 7
    checkboxes.forEach((cb, i) => {
      if (i === 2 || i === 7) expect(cb).toBeChecked();
      else expect(cb).not.toBeChecked();
    });
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
    const checkedCheckbox = screen.getAllByRole('checkbox')[2]; // TrouverDeptCarte
    fireEvent.click(checkedCheckbox);
    expect(checkedCheckbox).not.toBeChecked();
  });

  it('affiche un message d\'erreur si tous les modes sont décochés', () => {
    render(<QuizConfig onStart={vi.fn()} />);
    // Décocher TrouverDeptCarte (seul mode coché par défaut, index 2)
    fireEvent.click(screen.getAllByRole('checkbox')[2]);
    expect(screen.getByText(/Sélectionnez au moins un type de question/i)).toBeInTheDocument();
  });

  it('désactive le bouton "Commencer" si aucun mode sélectionné', () => {
    render(<QuizConfig onStart={vi.fn()} />);
    fireEvent.click(screen.getAllByRole('checkbox')[2]); // décocher TrouverDeptCarte
    expect(screen.getByRole('button', { name: /Commencer/i })).toBeDisabled();
  });

  it('réactive le bouton en re-cochant au moins un mode', () => {
    render(<QuizConfig onStart={vi.fn()} />);
    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[2]); // décoche TrouverDeptCarte → 0 modes, bouton disabled
    fireEvent.click(checkboxes[0]); // coche TrouverRegionCarte → 1 mode, bouton enabled
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
  it('appelle onStart avec la config par défaut au clic sur Commencer', () => {
    const onStart = vi.fn();
    render(<QuizConfig onStart={onStart} />);
    fireEvent.click(screen.getByRole('button', { name: /Commencer/i }));

    expect(onStart).toHaveBeenCalledOnce();
    const config: QuizConfigType = onStart.mock.calls[0][0];
    expect(config.modes).toEqual(['TrouverDeptCarte']);
    expect(config.difficulty).toBe('facile');
    expect(config.sessionLength).toBe(25);
    expect(config.includeDrom).toBe(true);
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

  it('transmet includeDrom: false quand la case DROM est décochée', () => {
    const onStart = vi.fn();
    render(<QuizConfig onStart={onStart} />);
    const dromCheckbox = screen.getByRole('checkbox', { name: /outre-mer/i });
    fireEvent.click(dromCheckbox);
    fireEvent.click(screen.getByRole('button', { name: /Commencer/i }));
    const config: QuizConfigType = onStart.mock.calls[0][0];
    expect(config.includeDrom).toBe(false);
  });

  it('transmet uniquement les modes cochés', () => {
    const onStart = vi.fn();
    render(<QuizConfig onStart={onStart} />);

    // Cocher TrouverRegionCarte (index 0) et décocher TrouverDeptCarte (index 2)
    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[0]); // coche TrouverRegionCarte
    fireEvent.click(checkboxes[2]); // décoche TrouverDeptCarte
    fireEvent.click(screen.getByRole('button', { name: /Commencer/i }));

    const config: QuizConfigType = onStart.mock.calls[0][0];
    expect(config.modes).toHaveLength(1);
    expect(config.modes).toContain('TrouverRegionCarte');
  });

  it('ne déclenche pas onStart si aucun mode coché', () => {
    const onStart = vi.fn();
    render(<QuizConfig onStart={onStart} />);
    fireEvent.click(screen.getAllByRole('checkbox')[2]); // décocher TrouverDeptCarte (seul mode coché)
    fireEvent.click(screen.getByRole('button', { name: /Commencer/i }));
    expect(onStart).not.toHaveBeenCalled();
  });
});
