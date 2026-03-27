import { useMemo } from 'react';
import { geoMercator, geoPath } from 'd3';
import type { Feature } from 'geojson';
import type { GeoPermissibleObjects } from 'd3';

interface InsetConfig {
  code: string;
  nom: string;
  type: 'departement' | 'region';
  x: number;
  y: number;
  width: number;
  height: number;
}

const INSET_CONFIGS: InsetConfig[] = [
  { code: '971', nom: 'Guadeloupe', type: 'departement', x: 10,  y: 437, width: 137, height: 78 },
  { code: '972', nom: 'Martinique', type: 'departement', x: 153, y: 437, width: 137, height: 78 },
  { code: '973', nom: 'Guyane',     type: 'departement', x: 10,  y: 525, width: 280, height: 90 },
  { code: '974', nom: 'La Réunion', type: 'departement', x: 10,  y: 625, width: 137, height: 62 },
  { code: '976', nom: 'Mayotte',    type: 'departement', x: 153, y: 625, width: 137, height: 62 },
];

const GROUP_LABELS = [
  { label: 'Antilles',         y: 433 },
  { label: 'Amérique du Sud',  y: 521 },
  { label: 'Océan Indien',     y: 621 },
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

  // If no data available for this DROM, show placeholder
  if (!deptFeature && !regionFeature) {
    return (
      <g transform={`translate(${x}, ${y})`}>
        <rect
          width={width}
          height={height}
          fill="#f8fafc"
          stroke="#94a3b8"
          strokeWidth={0.5}
          rx={2}
        />
        <text
          x={width / 2}
          y={height / 2}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={11}
          fill="#64748b"
        >
          {nom}
        </text>
      </g>
    );
  }

  return (
    <g transform={`translate(${x}, ${y})`}>
      <rect
        width={width}
        height={height}
        fill="#f0f9ff"
        stroke="#7dd3fc"
        strokeWidth={0.8}
        rx={2}
      />

      {showRegions && regionPath && (
        <path
          d={regionPath}
          fill={isRegionHighlighted ? '#4ade80' : '#e8f4e8'}
          stroke="#6aaa6a"
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
          fill={isDeptHighlighted ? '#60a5fa' : '#dbeafe'}
          stroke="#3b82f6"
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
        <text
          x={width / 2}
          y={height - 2}
          textAnchor="middle"
          fontSize={11}
          fill="#374151"
          fontWeight="500"
        >
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
  onHover,
  onClick,
}: InsetOutreMerProps) {
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
      {GROUP_LABELS.map(({ label, y }) => (
        <text
          key={label}
          x={12}
          y={y}
          fontSize={9}
          fill="#94a3b8"
          fontStyle="italic"
          fontWeight="500"
        >
          {label}
        </text>
      ))}
      {INSET_CONFIGS.map((config) => {
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
            onHover={onHover}
            onClick={onClick}
          />
        );
      })}
    </g>
  );
}
