import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import AccordionRegions from '../components/tableau/AccordionRegions';
import { REGIONS } from '../data/regions';
import { DEPARTEMENTS } from '../data/departements';

const metropole = REGIONS.filter((r) => !r.outresMer);
const outremer  = REGIONS.filter((r) => r.outresMer);

// Département d'Île-de-France (regionCode '11') pour les assertions de contenu
const idfDepts = DEPARTEMENTS.filter((d) => d.regionCode === '11');

describe('AccordionRegions – structure', () => {
  it('affiche toutes les régions métropolitaines', () => {
    render(<AccordionRegions />);
    for (const region of metropole) {
      expect(screen.getByRole('button', { name: new RegExp(region.nom, 'i') })).toBeInTheDocument();
    }
  });

  it("affiche toutes les régions d'outre-mer", () => {
    render(<AccordionRegions />);
    for (const region of outremer) {
      expect(screen.getByRole('button', { name: new RegExp(region.nom, 'i') })).toBeInTheDocument();
    }
  });

  it('affiche le séparateur « Outre-mer »', () => {
    render(<AccordionRegions />);
    expect(screen.getByText(/outre-mer/i)).toBeInTheDocument();
  });

  it('tous les accordéons sont fermés par défaut (aria-expanded = false)', () => {
    render(<AccordionRegions />);
    const buttons = screen.getAllByRole('button');
    expect(buttons.every((btn) => btn.getAttribute('aria-expanded') === 'false')).toBe(true);
  });

  it('affiche le compteur de départements dans le bouton de région', () => {
    render(<AccordionRegions />);
    const idfBtn = screen.getByRole('button', { name: /île-de-france/i });
    // Île-de-France a 8 départements (75, 77, 78, 91, 92, 93, 94, 95)
    expect(idfBtn.textContent).toContain(`${idfDepts.length} dept`);
  });
});

describe('AccordionRegions – interaction', () => {
  it('ouvre un accordéon au clic et affiche ses départements', () => {
    render(<AccordionRegions />);
    const idfBtn = screen.getByRole('button', { name: /île-de-france/i });

    fireEvent.click(idfBtn);

    expect(idfBtn).toHaveAttribute('aria-expanded', 'true');
    for (const dept of idfDepts) {
      expect(screen.getByText(dept.nom)).toBeInTheDocument();
    }
  });

  it("ferme l'accordéon au deuxième clic", () => {
    render(<AccordionRegions />);
    const idfBtn = screen.getByRole('button', { name: /île-de-france/i });

    fireEvent.click(idfBtn); // ouvre
    expect(idfBtn).toHaveAttribute('aria-expanded', 'true');

    fireEvent.click(idfBtn); // ferme
    expect(idfBtn).toHaveAttribute('aria-expanded', 'false');

    // Les noms de département ne sont plus dans le DOM
    for (const dept of idfDepts) {
      expect(screen.queryByText(dept.nom)).not.toBeInTheDocument();
    }
  });

  it('deux accordéons peuvent être ouverts simultanément', () => {
    render(<AccordionRegions />);
    const idfBtn  = screen.getByRole('button', { name: /île-de-france/i });
    const bretBtn = screen.getByRole('button', { name: /bretagne/i });

    fireEvent.click(idfBtn);
    fireEvent.click(bretBtn);

    expect(idfBtn).toHaveAttribute('aria-expanded', 'true');
    expect(bretBtn).toHaveAttribute('aria-expanded', 'true');
  });

  it("ouvrir une région d'outre-mer affiche ses départements", () => {
    render(<AccordionRegions />);
    // Guadeloupe (code région '01') contient le département 971
    const guadeBtn = screen.getByRole('button', { name: /guadeloupe/i });
    fireEvent.click(guadeBtn);

    expect(guadeBtn).toHaveAttribute('aria-expanded', 'true');
    // Le code '971' est unique dans le DOM (code dept ; le code région Guadeloupe est '01')
    expect(screen.getByText('971')).toBeInTheDocument();
  });

  it('les départements sont triés par code dans un accordéon ouvert', () => {
    render(<AccordionRegions />);
    const idfBtn = screen.getByRole('button', { name: /île-de-france/i });
    fireEvent.click(idfBtn);

    // Les <li> n'existent que dans l'accordéon ouvert → pas d'ambiguïté
    const listItems = screen.getAllByRole('listitem');
    const codesInList = listItems.map((li) => {
      // Premier <span> de chaque <li> = le code du département
      const codeSpan = li.querySelector('span');
      return codeSpan?.textContent ?? '';
    });

    const idfCodes = idfDepts
      .map((d) => d.code)
      .sort((a, b) => a.localeCompare(b, 'fr', { numeric: true }));

    expect(codesInList).toEqual(idfCodes);
  });
});
