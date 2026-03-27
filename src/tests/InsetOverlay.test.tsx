import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { Feature } from 'geojson';
import InsetOutreMer from '../components/carte/InsetOutreMer';
import InsetIleDeFrance from '../components/carte/InsetIleDeFrance';
import CarteFrance from '../components/carte/CarteFrance';

// ── Données minimales ──────────────────────────────────────────────────────────

function makeFeature(code: string, coords: number[][][]): Feature {
  return {
    type: 'Feature',
    properties: { code, nom: code },
    geometry: { type: 'Polygon', coordinates: coords },
  };
}

const TINY_POLY = [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]];

const DROM_DEPTS   = ['971', '972', '973', '974', '976'].map(c => makeFeature(c, TINY_POLY));
const DROM_REGIONS = ['01',  '02',  '03',  '04',  '06' ].map(c => makeFeature(c, TINY_POLY));

const IDF_FEATURE = makeFeature(
  '75',
  [[[2.2, 48.8], [2.4, 48.8], [2.4, 48.9], [2.2, 48.9], [2.2, 48.8]]],
);

// ── InsetOutreMer – regroupement géographique ──────────────────────────────────

describe('InsetOutreMer – labels de groupes géographiques', () => {
  function renderInset() {
    render(
      <svg>
        <InsetOutreMer
          allDepts={DROM_DEPTS}
          allRegions={DROM_REGIONS}
          showDepts={true}
          showRegions={false}
          onHover={() => {}}
        />
      </svg>,
    );
  }

  it('affiche le label "Antilles"', () => {
    renderInset();
    expect(screen.getByText('Antilles')).toBeInTheDocument();
  });

  it('affiche le label "Amérique du Sud"', () => {
    renderInset();
    expect(screen.getByText('Amérique du Sud')).toBeInTheDocument();
  });

  it('affiche le label "Océan Indien"', () => {
    renderInset();
    expect(screen.getByText('Océan Indien')).toBeInTheDocument();
  });
});

// ── InsetIleDeFrance – pas de connecteur ──────────────────────────────────────

describe('InsetIleDeFrance – absence d\'éléments connecteurs', () => {
  function renderInset() {
    const { container } = render(
      <svg>
        <InsetIleDeFrance
          features={[IDF_FEATURE]}
          visible={true}
          onHover={() => {}}
        />
      </svg>,
    );
    return container;
  }

  it('ne rend aucune ligne de connexion', () => {
    const container = renderInset();
    expect(container.querySelector('line')).toBeNull();
  });

  it('ne rend aucun rectangle pointillé (boîte de zoom)', () => {
    const container = renderInset();
    const rects = Array.from(container.querySelectorAll('rect'));
    rects.forEach(rect => {
      expect(rect).not.toHaveAttribute('stroke-dasharray');
    });
  });
});

// ── CarteFrance – position structurelle des insets ────────────────────────────

describe('CarteFrance – insets en overlay fixe hors du groupe zoomable', () => {
  it('l\'inset DROM n\'est pas un descendant du groupe zoomable', () => {
    const { container } = render(
      <CarteFrance features={{ departements: [], regions: [] }} />,
    );
    const svg       = container.querySelector('svg')!;
    const zoomGroup = svg.querySelector('g[transform]');
    const insetGroup = svg.querySelector('.insets-outre-mer');

    expect(insetGroup).not.toBeNull();
    expect(zoomGroup?.contains(insetGroup)).toBe(false);
  });
});
