import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AccordionRegions from '../components/tableau/AccordionRegions';
import { REGIONS } from '../data/regions';
import { DEPARTEMENTS } from '../data/departements';

// Département d'Île-de-France (regionCode '11') pour les assertions de contenu
const idfDepts = DEPARTEMENTS.filter((d) => d.regionCode === '11');

function renderAccordion() {
  return render(
    <MemoryRouter>
      <AccordionRegions />
    </MemoryRouter>,
  );
}

describe('AccordionRegions – structure', () => {
  it('affiche toutes les régions', () => {
    renderAccordion();
    for (const region of REGIONS) {
      expect(screen.getByRole('button', { name: new RegExp(region.nom, 'i') })).toBeInTheDocument();
    }
  });

  it('tous les accordéons expand sont fermés par défaut (aria-expanded = false)', () => {
    renderAccordion();
    const expandButtons = screen.getAllByRole('button').filter((btn) => btn.hasAttribute('aria-expanded'));
    expect(expandButtons.every((btn) => btn.getAttribute('aria-expanded') === 'false')).toBe(true);
  });

  it('affiche le compteur de départements pour chaque région', () => {
    renderAccordion();
    // Île-de-France a 8 depts — plusieurs régions peuvent avoir le même nombre,
    // on vérifie qu'au moins un élément correspondant est dans le DOM
    expect(screen.getAllByText(new RegExp(`${idfDepts.length}\\s*dept`)).length).toBeGreaterThanOrEqual(1);
  });

  it('affiche un bouton Tester pour chaque région', () => {
    renderAccordion();
    const testerButtons = screen.getAllByRole('button', { name: /tester/i });
    expect(testerButtons).toHaveLength(REGIONS.length);
  });
});

describe('AccordionRegions – interaction', () => {
  it('ouvre un accordéon au clic et affiche ses départements', () => {
    renderAccordion();
    const idfBtn = screen.getByRole('button', { name: /île-de-france/i });

    fireEvent.click(idfBtn);

    expect(idfBtn).toHaveAttribute('aria-expanded', 'true');
    for (const dept of idfDepts) {
      // getAllByText car certains noms (ex: "Paris") apparaissent aussi en préfecture
      expect(screen.getAllByText(dept.nom).length).toBeGreaterThanOrEqual(1);
    }
  });

  it("ferme l'accordéon au deuxième clic", () => {
    renderAccordion();
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
    renderAccordion();
    const idfBtn  = screen.getByRole('button', { name: /île-de-france/i });
    const bretBtn = screen.getByRole('button', { name: /bretagne/i });

    fireEvent.click(idfBtn);
    fireEvent.click(bretBtn);

    expect(idfBtn).toHaveAttribute('aria-expanded', 'true');
    expect(bretBtn).toHaveAttribute('aria-expanded', 'true');
  });

  it('les départements sont triés par code dans un accordéon ouvert', () => {
    renderAccordion();
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
