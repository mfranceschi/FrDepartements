import { useState, useEffect, useMemo } from 'react';
import type { Feature, FeatureCollection } from 'geojson';
import GroupInset from './GroupInset';
import {
  DROM_DEPT_TO_REGION,
  DROM_GROUP_INSET_CONFIGS,
  DROM_GROUP_LABELS,
} from '../../data/dromsConfig';

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
      {DROM_GROUP_LABELS.map(({ label, x, y }) => (
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

      {DROM_GROUP_INSET_CONFIGS.map((config) => (
        <GroupInset
          key={config.id}
          config={config}
          deptsByCode={deptsByCode}
          regionsByCode={regionsByCode}
          deptToRegion={DROM_DEPT_TO_REGION}
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
