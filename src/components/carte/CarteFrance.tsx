import { useState, useMemo, useCallback } from 'react';
import * as d3 from 'd3';
import type { Feature } from 'geojson';
import CoucheRegions from './CoucheRegions';
import CoucheDepts from './CoucheDepts';
import InsetOutreMer from './InsetOutreMer';

export interface CarteFranceProps {
  features: {
    departements: Feature[];
    regions: Feature[];
  };
  onFeatureClick?: (code: string, type: 'departement' | 'region') => void;
  highlightCode?: string;
  quizMode?: boolean;
  quizLayer?: 'departements' | 'regions';
}

interface TooltipState {
  visible: boolean;
  x: number;
  y: number;
  content: string;
}

// Départements DROM to exclude from metropolitan map
const DROM_CODES = new Set(['971', '972', '973', '974', '976']);

const PROJECTION = d3
  .geoConicConformal()
  .center([2.5, 46.5])
  .scale(3000)
  .translate([520, 340]);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const PATH_GEN: d3.GeoPath<any, d3.GeoPermissibleObjects> = d3.geoPath(PROJECTION);

export default function CarteFrance({
  features,
  onFeatureClick,
  highlightCode,
  quizMode = false,
  quizLayer = 'departements',
}: CarteFranceProps) {
  const [showRegions, setShowRegions] = useState(true);
  const [showDepts, setShowDepts] = useState(true);
  const [tooltip, setTooltip] = useState<TooltipState>({ visible: false, x: 0, y: 0, content: '' });

  // Filter out DROM from metro features
  const metroDepts = useMemo(
    () => features.departements.filter((f) => !DROM_CODES.has(f.properties?.code as string)),
    [features.departements],
  );

  const handleDeptHover = useCallback((feature: Feature | null, x: number, y: number) => {
    if (!feature) {
      setTooltip((prev) => ({ ...prev, visible: false }));
      return;
    }
    const nom = feature.properties?.nom as string | undefined;
    const code = feature.properties?.code as string | undefined;
    const content = nom && code ? `${nom} (${code})` : nom ?? code ?? '';
    setTooltip({ visible: true, x, y, content });
  }, []);

  const handleRegionHover = useCallback((feature: Feature | null, x: number, y: number) => {
    if (!feature) {
      setTooltip((prev) => ({ ...prev, visible: false }));
      return;
    }
    const nom = feature.properties?.nom as string | undefined;
    const code = feature.properties?.code as string | undefined;
    const content = nom ?? code ?? '';
    setTooltip({ visible: true, x, y, content });
  }, []);

  const handleRegionClick = useCallback(
    (code: string) => onFeatureClick?.(code, 'region'),
    [onFeatureClick],
  );

  const handleDeptClick = useCallback(
    (code: string) => onFeatureClick?.(code, 'departement'),
    [onFeatureClick],
  );

  const handleInsetClick = useCallback(
    (code: string, type: 'departement' | 'region') => onFeatureClick?.(code, type),
    [onFeatureClick],
  );

  const effectiveShowRegions = quizMode ? quizLayer === 'regions' : showRegions;
  const effectiveShowDepts = quizMode ? quizLayer === 'departements' : showDepts;

  return (
    <div className="relative w-full">
      {!quizMode && (
        <div className="flex gap-4 mb-2 px-2">
          <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showRegions}
              onChange={(e) => setShowRegions(e.target.checked)}
              className="rounded"
            />
            <span className="flex items-center gap-1">
              <span className="inline-block w-3 h-3 rounded-sm border border-green-500 bg-green-100" />
              Régions
            </span>
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showDepts}
              onChange={(e) => setShowDepts(e.target.checked)}
              className="rounded"
            />
            <span className="flex items-center gap-1">
              <span className="inline-block w-3 h-3 rounded-sm border border-blue-500 bg-blue-100" />
              Départements
            </span>
          </label>
        </div>
      )}

      <svg
        viewBox="0 0 900 700"
        style={{ width: '100%', height: 'auto' }}
        className="block"
      >
        {/* Metropolitan France — régions */}
        <CoucheRegions
          features={features.regions}
          pathGen={PATH_GEN}
          visible={effectiveShowRegions}
          quizMode={quizMode}
          highlightCode={highlightCode}
          onHover={handleRegionHover}
          onClick={onFeatureClick ? handleRegionClick : undefined}
        />
        {/* Metropolitan France — départements */}
        <CoucheDepts
          features={metroDepts}
          pathGen={PATH_GEN}
          visible={effectiveShowDepts}
          quizMode={quizMode}
          highlightCode={highlightCode}
          onHover={handleDeptHover}
          onClick={onFeatureClick ? handleDeptClick : undefined}
        />

        {/* Insets for Outre-mer */}
        <InsetOutreMer
          allDepts={features.departements}
          allRegions={features.regions}
          showDepts={effectiveShowDepts}
          showRegions={effectiveShowRegions}
          quizMode={quizMode}
          highlightCode={highlightCode}
          onHover={handleDeptHover}
          onClick={onFeatureClick ? handleInsetClick : undefined}
        />

        {/* Dashed border around DROM insets area */}
        <rect
          x={8}
          y={424}
          width={292}
          height={120}
          fill="none"
          stroke="#cbd5e1"
          strokeWidth={0.5}
          strokeDasharray="4 2"
          rx={3}
        />
        <text x={12} y={421} fontSize={8} fill="#94a3b8">
          Départements et régions d'outre-mer
        </text>
      </svg>

      {/* Floating tooltip */}
      {tooltip.visible && !quizMode && (
        <div
          className="fixed z-50 pointer-events-none bg-gray-800 text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap"
          style={{ left: tooltip.x + 12, top: tooltip.y - 30 }}
        >
          {tooltip.content}
        </div>
      )}
    </div>
  );
}
