/**
 * Constantes de couleur, utilitaires géographiques et de style partagés
 * entre CoucheDepts, CoucheRegions et CarteFrance.
 */

import type { GeoPath, GeoPermissibleObjects } from 'd3';

/**
 * Type alias for the D3 path generator used throughout the carte components.
 * The `any` is D3's `This` context parameter: GeoPath<null, ...> would require
 * `.call(null, feature)` at every call site, which is impractical.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type D3PathGen = GeoPath<any, GeoPermissibleObjects>;

export const STROKE_HIGHLIGHT_CORRECT = '#16a34a';
export const STROKE_HIGHLIGHT_TARGET  = '#f59e0b';
export const STROKE_WRONG             = '#dc2626';
export const STROKE_WIDTH_ACTIVE      = 2.5;

/**
 * Résout la couleur de contour d'un territoire selon son état.
 *
 * @param isQuizHighlighted  Le territoire est la bonne réponse affichée en quiz.
 * @param isWrong            Le territoire est la mauvaise réponse sélectionnée.
 * @param highlightVariant   Variante de surbrillance ('correct' | 'target').
 * @param baseStroke         Couleur de contour par défaut (diffère entre depts et régions).
 */
/** Returns true if the centroid coordinates are finite numbers (not NaN). */
export function isValidCentroid(centroid: [number, number]): boolean {
  return !isNaN(centroid[0]) && !isNaN(centroid[1]);
}

export function resolveStroke(
  isQuizHighlighted: boolean,
  isWrong: boolean,
  highlightVariant: 'correct' | 'target',
  baseStroke: string,
): string {
  if (isQuizHighlighted) return highlightVariant === 'target' ? STROKE_HIGHLIGHT_TARGET : STROKE_HIGHLIGHT_CORRECT;
  if (isWrong) return STROKE_WRONG;
  return baseStroke;
}
