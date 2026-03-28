import type { GroupInsetConfig } from '../components/carte/types';

/** Codes des départements DROM */
export const DROM_CODES = new Set(['971', '972', '973', '974', '976']);

/** Correspondance code département DROM → code région */
export const DROM_DEPT_TO_REGION: Record<string, string> = {
  '971': '01', // Guadeloupe
  '972': '02', // Martinique
  '973': '03', // Guyane
  '974': '04', // La Réunion
  '976': '06', // Mayotte
};

// ─── Constantes de mise en page des insets (espace SVG 1200×730) ──────────────

const INSET_X   = 910;
const INSET_W   = 283;
const INSET_H   = 175;
const INSET_GAP = 4;   // px entre la baseline du label et le haut de l'inset
const LABEL_H   = 16;  // hauteur réservée au label au-dessus de chaque inset
const SECTION_H = LABEL_H + INSET_GAP + INSET_H; // = 195
const FIRST_Y   = 138; // y du premier label DROM (après IDF : Y=8, H=120, +10 gap)

function insetY(i: number): number { return FIRST_Y + i * (SECTION_H + 6) + LABEL_H + INSET_GAP; }
function labelY(i: number): number { return FIRST_Y + i * (SECTION_H + 6); }

export const DROM_GROUP_INSET_CONFIGS: GroupInsetConfig[] = [
  {
    id: 'antilles',
    x: INSET_X, y: insetY(0), width: INSET_W, height: INSET_H,
    // Guadeloupe + Martinique + voisins immédiats (Dominique, Sainte-Lucie, Antigua…)
    geoBounds: [-63, 13, -59.5, 17.5],
    territories: [
      { code: '971', nom: 'Guadeloupe' },
      { code: '972', nom: 'Martinique' },
    ],
  },
  {
    id: 'guyane',
    x: INSET_X, y: insetY(1), width: INSET_W, height: INSET_H,
    // Guyane + Suriname (est) + Brésil/Amapá (sud-est)
    geoBounds: [-56, 1, -50, 8],
    territories: [
      { code: '973', nom: 'Guyane' },
    ],
  },
  {
    id: 'ocean-indien',
    x: INSET_X, y: insetY(2), width: INSET_W, height: INSET_H,
    // La Réunion + Mayotte + Madagascar + Comores + Maurice
    geoBounds: [42, -24, 58, -10],
    territories: [
      { code: '974', nom: 'La Réunion', targetSizePx: 20 },
      { code: '976', nom: 'Mayotte',    targetSizePx: 18 },
    ],
  },
];

export const DROM_GROUP_LABELS = [
  { label: 'Antilles',        x: INSET_X + 3, y: labelY(0) },
  { label: 'Amérique du Sud', x: INSET_X + 3, y: labelY(1) },
  { label: 'Océan Indien',    x: INSET_X + 3, y: labelY(2) },
];
