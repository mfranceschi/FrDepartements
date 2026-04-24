import { describe, it, expect } from 'vitest';
import type { Feature } from 'geojson';
import { computeDeptColors } from '../geo/colorMap';

const PALETTE = ['#60a5fa', '#4ade80', '#facc15', '#fb923c', '#c084fc'];

function poly(code: string, rings: number[][][]): Feature {
  return { type: 'Feature', properties: { code }, geometry: { type: 'Polygon', coordinates: rings } };
}

// Grille 2×2 — adjacences latérales uniquement (pas diagonales) :
//  A | B
//  -----
//  C | D
// A adj B, A adj C, B adj D, C adj D  —  A/D et B/C ne se touchent pas
const A = poly('A', [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]]);
const B = poly('B', [[[1, 0], [2, 0], [2, 1], [1, 1], [1, 0]]]);
const C = poly('C', [[[0, 1], [1, 1], [1, 2], [0, 2], [0, 1]]]);
const D = poly('D', [[[1, 1], [2, 1], [2, 2], [1, 2], [1, 1]]]);
const GRID = [A, B, C, D];

describe('computeDeptColors – coloriage glouton', () => {
  it('retourne une couleur pour chaque feature avec code', () => {
    const colors = computeDeptColors(GRID);
    expect(colors.size).toBe(4);
    for (const code of ['A', 'B', 'C', 'D']) {
      expect(colors.has(code)).toBe(true);
    }
  });

  it('toutes les couleurs sont dans la palette', () => {
    const colors = computeDeptColors(GRID);
    for (const color of colors.values()) {
      expect(PALETTE).toContain(color);
    }
  });

  it('aucune paire de voisins n\'a la même couleur', () => {
    const colors = computeDeptColors(GRID);
    for (const [x, y] of [['A', 'B'], ['A', 'C'], ['B', 'D'], ['C', 'D']]) {
      expect(colors.get(x), `${x} et ${y} sont voisins mais ont la même couleur`).not.toBe(colors.get(y));
    }
  });

  it('le graphe biparti 2×2 est colorié en 2 couleurs seulement', () => {
    const colors = computeDeptColors(GRID);
    // A et D ne sont pas voisins → même couleur ; idem B et C
    expect(colors.get('A')).toBe(colors.get('D'));
    expect(colors.get('B')).toBe(colors.get('C'));
    expect(new Set(colors.values()).size).toBe(2);
  });

  it('met le résultat en cache — même référence retourne le même objet Map', () => {
    const first  = computeDeptColors(GRID);
    const second = computeDeptColors(GRID);
    expect(first).toBe(second);
  });

  it('tableaux différents ont des caches indépendants', () => {
    const copy = [...GRID];
    const fromOrig = computeDeptColors(GRID);
    const fromCopy = computeDeptColors(copy);
    expect(fromOrig).not.toBe(fromCopy);
    // …mais le résultat est identique
    for (const [code, color] of fromOrig) {
      expect(fromCopy.get(code)).toBe(color);
    }
  });

  it('feature sans propriété "code" est ignoré', () => {
    const noCode: Feature = {
      type: 'Feature',
      properties: {},
      geometry: { type: 'Polygon', coordinates: [[[0, 0], [1, 0], [1, 1], [0, 0]]] },
    };
    const colors = computeDeptColors([noCode, A]);
    expect(colors.size).toBe(1);
    expect(colors.has('A')).toBe(true);
  });

  it('feature isolé (sans voisin) reçoit la première couleur de la palette', () => {
    const iso = poly('ISO', [[[10, 10], [11, 10], [11, 11], [10, 11], [10, 10]]]);
    expect(computeDeptColors([iso]).get('ISO')).toBe(PALETTE[0]);
  });

  it('supporte les géométries MultiPolygon', () => {
    const multi: Feature = {
      type: 'Feature',
      properties: { code: 'M' },
      geometry: {
        type: 'MultiPolygon',
        coordinates: [
          [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]],
          [[[5, 5], [6, 5], [6, 6], [5, 6], [5, 5]]],
        ],
      },
    };
    const colors = computeDeptColors([multi]);
    expect(colors.size).toBe(1);
    expect(PALETTE).toContain(colors.get('M'));
  });

  it('chaîne linéaire A–B–C : utilise 2 couleurs alternées', () => {
    const X = poly('X', [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]]);
    const Y = poly('Y', [[[1, 0], [2, 0], [2, 1], [1, 1], [1, 0]]]);
    const Z = poly('Z', [[[2, 0], [3, 0], [3, 1], [2, 1], [2, 0]]]);
    const colors = computeDeptColors([X, Y, Z]);
    expect(colors.get('X')).not.toBe(colors.get('Y'));
    expect(colors.get('Y')).not.toBe(colors.get('Z'));
    expect(colors.get('X')).toBe(colors.get('Z')); // X et Z non voisins → même couleur
  });
});
