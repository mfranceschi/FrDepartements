/**
 * Constantes de couleur et utilitaires partagés entre CoucheDepts et CoucheRegions.
 */

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
