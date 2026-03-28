import { useState, useEffect, useMemo } from 'react';
import { geoMercator, geoPath } from 'd3';
import type { Feature, FeatureCollection } from 'geojson';
import type { GeoPermissibleObjects } from 'd3';
import GroupInset, { type GroupInsetConfig } from './GroupInset';

interface InsetConfig {
  code: string;
  nom: string;
  type: 'departement' | 'region';
  x: number;
  y: number;
  width: number;
  height: number;
}

const INSET_X    = 910;
const INSET_W    = 283;
const INSET_H    = 175;
const INSET_GAP  = 6;   // px entre la baseline du label et le haut de l'inset
const LABEL_H    = 12;  // hauteur réservée au label au-dessus de chaque inset
const SECTION_H  = LABEL_H + INSET_GAP + INSET_H; // = 193
const FIRST_Y    = 138; // y du premier label DROM (après IDF : Y=8, H=120, +10 gap)

function insetY(sectionIndex: number): number {
  return FIRST_Y + sectionIndex * (SECTION_H + 6) + LABEL_H + INSET_GAP;
}
function labelY(sectionIndex: number): number {
  return FIRST_Y + sectionIndex * (SECTION_H + 6);
}

// Guyane reste en inset simple (territoire unique, pas de voisin DROM)
const SINGLE_INSET_CONFIGS: InsetConfig[] = [
  { code: '973', nom: 'Guyane', type: 'departement',
    x: INSET_X, y: insetY(1), width: INSET_W, height: INSET_H },
];

const GROUP_INSET_CONFIGS: GroupInsetConfig[] = [
  {
    id: 'antilles',
    x: INSET_X, y: insetY(0), width: INSET_W, height: INSET_H,
    // Guadeloupe + Martinique + Petites Antilles (Dominique, Sainte-Lucie, Barbade, Antigua…)
    geoBounds: [-63, 12, -59, 18],
    territories: [
      { code: '971', nom: 'Guadeloupe', targetSizePx: 46 },
      { code: '972', nom: 'Martinique', targetSizePx: 39 },
    ],
  },
  {
    id: 'ocean-indien',
    x: INSET_X, y: insetY(2), width: INSET_W, height: INSET_H,
    // La Réunion + Mayotte + Madagascar + Comores + Mauritius + Seychelles
    geoBounds: [38, -28, 62, -4],
    territories: [
      { code: '974', nom: 'La Réunion', targetSizePx: 48 },
      { code: '976', nom: 'Mayotte',    targetSizePx: 40 },
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

interface SingleInsetProps {
  config: InsetConfig;
  deptFeature: Feature | null;
  regionFeature: Feature | null;
  showDepts: boolean;
  showRegions: boolean;
  quizMode: boolean;
  highlightDeptCode?: string;
  highlightRegionCode?: string;
  wrongDeptCode?: string;
  wrongRegionCode?: string;
  onHover: (feature: Feature | null, x: number, y: number) => void;
  onClick?: (code: string, type: 'departement' | 'region') => void;
}

function SingleInset({
  config,
  deptFeature,
  regionFeature,
  showDepts,
  showRegions,
  quizMode,
  highlightDeptCode,
  highlightRegionCode,
  wrongDeptCode,
  wrongRegionCode,
  onHover,
  onClick,
}: SingleInsetProps) {
  const { x, y, width, height, nom } = config;
  const padding = 4;

  const deptPath = useMemo(() => {
    if (!deptFeature) return null;
    const proj = geoMercator().fitExtent(
      [[padding, padding], [width - padding, height - padding - 12]],
      deptFeature as GeoPermissibleObjects,
    );
    const gen = geoPath(proj);
    return gen(deptFeature as GeoPermissibleObjects);
  }, [deptFeature, width, height]);

  const regionPath = useMemo(() => {
    if (!regionFeature) return null;
    const proj = geoMercator().fitExtent(
      [[padding, padding], [width - padding, height - padding - 12]],
      regionFeature as GeoPermissibleObjects,
    );
    const gen = geoPath(proj);
    return gen(regionFeature as GeoPermissibleObjects);
  }, [regionFeature, width, height]);

  const deptCode = deptFeature?.properties?.code as string | undefined;
  const regionCode = regionFeature?.properties?.code as string | undefined;
  const isDeptHighlighted = deptCode !== undefined && deptCode === highlightDeptCode;
  const isRegionHighlighted = regionCode !== undefined && regionCode === highlightRegionCode;
  const isDeptWrong = deptCode !== undefined && deptCode === wrongDeptCode;
  const isRegionWrong = regionCode !== undefined && regionCode === wrongRegionCode;

  if (!deptFeature && !regionFeature) {
    return (
      <g transform={`translate(${x}, ${y})`}>
        <rect width={width} height={height} fill="#f8fafc" stroke="#94a3b8" strokeWidth={0.5} rx={2} />
        <text x={width / 2} y={height / 2} textAnchor="middle" dominantBaseline="middle"
          fontSize={13} fill="#64748b">
          {nom}
        </text>
      </g>
    );
  }

  return (
    <g transform={`translate(${x}, ${y})`}>
      <rect width={width} height={height} fill="#f0f9ff" stroke="#7dd3fc" strokeWidth={0.8} rx={2} />

      {showRegions && regionPath && (
        <path
          d={regionPath}
          fill={isRegionHighlighted ? '#4ade80' : isRegionWrong ? '#fca5a5' : '#e8f4e8'}
          stroke={isRegionWrong ? '#dc2626' : '#6aaa6a'}
          strokeWidth={0.8}
          style={{ cursor: onClick ? 'pointer' : 'default' }}
          onMouseMove={(e) => {
            if (!quizMode && regionFeature) onHover(regionFeature, e.clientX, e.clientY);
          }}
          onMouseLeave={() => onHover(null, 0, 0)}
          onClick={() => {
            if (onClick && regionCode) onClick(regionCode, 'region');
          }}
        />
      )}

      {showDepts && deptPath && (
        <path
          d={deptPath}
          fill={isDeptHighlighted ? '#60a5fa' : isDeptWrong ? '#fca5a5' : '#dbeafe'}
          stroke={isDeptWrong ? '#dc2626' : '#3b82f6'}
          strokeWidth={0.5}
          style={{ cursor: onClick ? 'pointer' : 'default' }}
          onMouseMove={(e) => {
            if (!quizMode && deptFeature) onHover(deptFeature, e.clientX, e.clientY);
          }}
          onMouseLeave={() => onHover(null, 0, 0)}
          onClick={() => {
            if (onClick && deptCode) onClick(deptCode, 'departement');
          }}
        />
      )}

      {!quizMode && (
        <text x={width / 2} y={height - 2} textAnchor="middle" fontSize={13}
          fill="#374151" fontWeight="500">
          {nom}
        </text>
      )}
    </g>
  );
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
    import('../../geo/world-110m.json')
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
          fontSize={11}
          fill="#94a3b8"
          fontStyle="italic"
          fontWeight="500"
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

      {SINGLE_INSET_CONFIGS.map((config) => {
        const deptFeature = deptsByCode.get(config.code) ?? null;
        const regionCode = DEPT_TO_REGION[config.code];
        const regionFeature = regionCode ? (regionsByCode.get(regionCode) ?? null) : null;
        return (
          <SingleInset
            key={config.code}
            config={config}
            deptFeature={deptFeature}
            regionFeature={regionFeature}
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
        );
      })}
    </g>
  );
}
