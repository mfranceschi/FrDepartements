import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import TableauFlat from '../components/tableau/TableauFlat';
import { DEPARTEMENTS } from '../data/departements';

describe('TableauFlat – affichage initial', () => {
  it('affiche les 101 départements par défaut', () => {
    render(<TableauFlat />);
    // Le pied de tableau indique le compte total
    expect(screen.getByText(`${DEPARTEMENTS.length} / ${DEPARTEMENTS.length} départements`)).toBeInTheDocument();
  });

  it('contient les colonnes Numéro, Nom, Région, Outre-mer', () => {
    render(<TableauFlat />);
    expect(screen.getByText(/Numéro/i)).toBeInTheDocument();
    expect(screen.getByText(/Nom/i)).toBeInTheDocument();
    expect(screen.getByText(/Région/i)).toBeInTheDocument();
    expect(screen.getByText(/Outre-mer/i)).toBeInTheDocument();
  });

  it('affiche le champ de filtre vide au départ', () => {
    render(<TableauFlat />);
    expect(screen.getByPlaceholderText(/Filtrer/i)).toHaveValue('');
  });
});

describe('TableauFlat – filtre par nom', () => {
  it('filtre les départements par nom', () => {
    render(<TableauFlat />);
    fireEvent.change(screen.getByPlaceholderText(/Filtrer/i), { target: { value: 'Finistère' } });
    expect(screen.getByText('1 résultat')).toBeInTheDocument();
    expect(screen.getByText('Finistère')).toBeInTheDocument();
  });

  it('filtre est insensible à la casse', () => {
    render(<TableauFlat />);
    fireEvent.change(screen.getByPlaceholderText(/Filtrer/i), { target: { value: 'finistère' } });
    expect(screen.getByText('Finistère')).toBeInTheDocument();
  });

  it('affiche plusieurs résultats pour une recherche partielle', () => {
    render(<TableauFlat />);
    // "Savoie" correspond à Savoie (73) et Haute-Savoie (74)
    fireEvent.change(screen.getByPlaceholderText(/Filtrer/i), { target: { value: 'Savoie' } });
    expect(screen.getByText('2 résultats')).toBeInTheDocument();
  });

  it('affiche "Aucun département" si aucun résultat', () => {
    render(<TableauFlat />);
    fireEvent.change(screen.getByPlaceholderText(/Filtrer/i), { target: { value: 'xxxxxxxxxxx' } });
    expect(screen.getByText(/Aucun département ne correspond/i)).toBeInTheDocument();
  });
});

describe('TableauFlat – filtre par code', () => {
  it('filtre par code département exact', () => {
    render(<TableauFlat />);
    fireEvent.change(screen.getByPlaceholderText(/Filtrer/i), { target: { value: '75' } });
    expect(screen.getByText('Paris')).toBeInTheDocument();
  });

  it('filtre les DROM par leur code à 3 chiffres', () => {
    render(<TableauFlat />);
    fireEvent.change(screen.getByPlaceholderText(/Filtrer/i), { target: { value: '971' } });
    expect(screen.getAllByText('Guadeloupe').length).toBeGreaterThan(0);
    expect(screen.getByText('1 résultat')).toBeInTheDocument();
  });
});

describe('TableauFlat – filtre par région', () => {
  it('filtre par nom de région', () => {
    render(<TableauFlat />);
    fireEvent.change(screen.getByPlaceholderText(/Filtrer/i), { target: { value: 'Bretagne' } });
    // Bretagne a 4 départements (22, 29, 35, 56)
    expect(screen.getByText('4 résultats')).toBeInTheDocument();
    expect(screen.getByText('Finistère')).toBeInTheDocument();
    expect(screen.getByText('Morbihan')).toBeInTheDocument();
  });
});

describe('TableauFlat – tri par colonne', () => {
  it('est trié par numéro croissant par défaut', () => {
    render(<TableauFlat />);
    const rows = screen.getAllByRole('row').slice(1); // exclure l'en-tête
    const firstCode = within(rows[0]).getByText('01');
    expect(firstCode).toBeInTheDocument();
  });

  it('trie par nom croissant en cliquant sur la colonne Nom', () => {
    render(<TableauFlat />);
    fireEvent.click(screen.getByText(/^Nom/));
    const rows = screen.getAllByRole('row').slice(1);
    // Ain commence par A → devrait être en tête (ou proche)
    const firstNom = rows[0].textContent;
    expect(firstNom).toMatch(/ain/i);
  });

  it('inverse le tri en cliquant deux fois sur la même colonne', () => {
    render(<TableauFlat />);
    fireEvent.click(screen.getByText(/^Nom/));
    fireEvent.click(screen.getByText(/^Nom/));
    const rows = screen.getAllByRole('row').slice(1);
    // Trié par nom décroissant → Yvelines (Yv > Yo) devrait être en tête
    const firstNom = rows[0].textContent;
    expect(firstNom).toMatch(/yvelines/i);
  });
});
