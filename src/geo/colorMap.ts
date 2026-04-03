import type { Feature } from 'geojson';

/**
 * Palette de 5 couleurs pastel pour le coloriage des départements.
 * Assez distinctes pour être différenciées, assez claires pour garder les
 * étiquettes lisibles.
 */
const PALETTE = [
  '#60a5fa', // bleu     (blue-400)
  '#4ade80', // vert     (green-400)
  '#facc15', // jaune    (yellow-400)
  '#fb923c', // orange   (orange-400)
  '#c084fc', // violet   (purple-400)
];

// ─── Adjacence ────────────────────────────────────────────────────────────────

function roundCoord(n: number): string {
  return (Math.round(n * 1e5) / 1e5).toString();
}

function segmentKey(p1: number[], p2: number[]): string {
  const a = `${roundCoord(p1[0])},${roundCoord(p1[1])}`;
  const b = `${roundCoord(p2[0])},${roundCoord(p2[1])}`;
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

function getRings(feature: Feature): number[][][] {
  const geom = feature.geometry;
  if (!geom) return [];
  if (geom.type === 'Polygon') return geom.coordinates as number[][][];
  if (geom.type === 'MultiPolygon') return (geom.coordinates as number[][][][]).flat();
  return [];
}

function computeAdjacency(features: Feature[]): Map<string, Set<string>> {
  // segmentKey → premier code à avoir enregistré ce segment
  const segToCode = new Map<string, string>();
  const adjacency = new Map<string, Set<string>>();

  for (const f of features) {
    const code = f.properties?.code as string | undefined;
    if (!code) continue;
    if (!adjacency.has(code)) adjacency.set(code, new Set());

    for (const ring of getRings(f)) {
      for (let i = 0; i < ring.length - 1; i++) {
        const key = segmentKey(ring[i], ring[i + 1]);
        const other = segToCode.get(key);
        if (other !== undefined && other !== code) {
          adjacency.get(code)!.add(other);
          adjacency.get(other)?.add(code);
        } else if (other === undefined) {
          segToCode.set(key, code);
        }
      }
    }
  }

  return adjacency;
}

// ─── Coloriage glouton ────────────────────────────────────────────────────────

/**
 * Calcule un coloriage valide (aucun voisin de même couleur) par algorithme
 * glouton. Les départements les plus connectés sont colorés en premier pour
 * minimiser le nombre de couleurs nécessaires.
 *
 * Le résultat est déterministe : les features étant des données statiques,
 * le même ordre de traitement produit toujours la même carte.
 */
export function computeDeptColors(features: Feature[]): Map<string, string> {
  const adjacency = computeAdjacency(features);

  // Trier par nombre de voisins décroissant (nœuds les plus contraints d'abord)
  const sortedCodes = [...adjacency.keys()].sort(
    (a, b) => (adjacency.get(b)?.size ?? 0) - (adjacency.get(a)?.size ?? 0),
  );

  const colorIndex = new Map<string, number>();

  for (const code of sortedCodes) {
    const usedByNeighbors = new Set<number>();
    for (const neighbor of adjacency.get(code) ?? []) {
      const idx = colorIndex.get(neighbor);
      if (idx !== undefined) usedByNeighbors.add(idx);
    }
    let chosen = 0;
    while (usedByNeighbors.has(chosen)) chosen++;
    colorIndex.set(code, chosen);
  }

  const result = new Map<string, string>();
  for (const [code, idx] of colorIndex) {
    result.set(code, PALETTE[idx % PALETTE.length]);
  }
  return result;
}
