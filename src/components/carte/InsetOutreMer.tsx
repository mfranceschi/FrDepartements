import { useState, useEffect, useMemo } from 'react';
import type { Feature, FeatureCollection } from 'geojson';
import GroupInset, { type GroupInsetConfig } from './GroupInset';

const INSET_X    = 910;
const INSET_W    = 283;
const INSET_H    = 175;
const INSET_GAP  = 4;   // px entre la baseline du label et le haut de l'inset
const LABEL_H    = 16;  // hauteur réservée au label au-dessus de chaque inset
const SECTION_H  = LABEL_H + INSET_GAP + INSET_H; // = 193
const FIRST_Y    = 138; // y du premier label DROM (après IDF : Y=8, H=120, +10 gap)

function insetY(sectionIndex: number): number {
  return FIRST_Y + sectionIndex * (SECTION_H + 6) + LABEL_H + INSET_GAP;
}
function labelY(sectionIndex: number): number {
  return FIRST_Y + sectionIndex * (SECTION_H + 6);
}

const GROUP_INSET_CONFIGS: GroupInsetConfig[] = [
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
    // Centré sur les îles : évite les 1500 km de côte africaine peu pertinente
    geoBounds: [42, -24, 58, -10],
    territories: [
      { code: '974', nom: 'La Réunion', targetSizePx: 20 },
      { code: '976', nom: 'Mayotte',    targetSizePx: 18 },
    ],
  },
];

const GROUP_LABELS = [
  { label: 'Antilles',        x: INSET_X + 3, y: labelY(0) },
  { label: 'Amérique du Sud', x: INSET_X + 3, y: labelY(1) },
  { label: 'Océan Indien',    x: INSET_X + 3, y: labelY(2) },
];

// Region codes corresponding to each DROM département
const DEPT_TO_REGION: Record<string, string> = {
  '971': '01', // Guadeloupe
  '972': '02', // Martinique
  '973': '03', // Guyane
  '974': '04', // La Réunion
  '976': '06', // Mayotte
};

interface InsetOutreMerProps {
  allDepts: Feature[];
  allRegions: Feature[];
  showDepts: boolean;
  showRegions: boolean;
  quizMode?: boolean;
  highlightDeptCode?: string;
  highlightRegionCode?: string;
  wrongDeptCode?: string;
  wrongRegionCode?: string;
  onHover: (feature: Feature | null, x: number, y: number) => void;
  onClick?: (code: string, type: 'departement' | 'region') => void;
}

export default function InsetOutreMer({
  allDepts,
  allRegions,
  showDepts,
  showRegions,
  quizMode = false,
  highlightDeptCode,
  highlightRegionCode,
  wrongDeptCode,
  wrongRegionCode,
  onHover,
  onClick,
}: InsetOutreMerProps) {
  const [worldFeatures, setWorldFeatures] = useState<Feature[]>([]);

  useEffect(() => {
    import('../../geo/world-50m.json')
      .then((m) => {
        const fc = m.default as unknown as FeatureCollection;
        setWorldFeatures(fc.features as Feature[]);
      })
      .catch(() => {
        // Dégradation gracieuse : GroupInset s'affiche sans contexte mondial
      });
  }, []);

  const deptsByCode = useMemo(() => {
    const map = new Map<string, Feature>();
    allDepts.forEach((f) => {
      const c = f.properties?.code as string | undefined;
      if (c) map.set(c, f);
    });
    return map;
  }, [allDepts]);

  const regionsByCode = useMemo(() => {
    const map = new Map<string, Feature>();
    allRegions.forEach((f) => {
      const c = f.properties?.code as string | undefined;
      if (c) map.set(c, f);
    });
    return map;
  }, [allRegions]);

  return (
    <g className="insets-outre-mer">
      {GROUP_LABELS.map(({ label, x, y }) => (
        <text
          key={label}
          x={x}
          y={y}
          fontSize={13}
          fill="#475569"
          fontWeight="600"
        >
          {label}
        </text>
      ))}

      {GROUP_INSET_CONFIGS.map((config) => (
        <GroupInset
          key={config.id}
          config={config}
          deptsByCode={deptsByCode}
          regionsByCode={regionsByCode}
          deptToRegion={DEPT_TO_REGION}
          worldFeatures={worldFeatures}
          showDepts={showDepts}
          showRegions={showRegions}
          quizMode={quizMode}
          highlightDeptCode={highlightDeptCode}
          highlightRegionCode={highlightRegionCode}
          wrongDeptCode={wrongDeptCode}
          wrongRegionCode={wrongRegionCode}
          onHover={onHover}
          onClick={onClick}
        />
      ))}

    </g>
  );
}
