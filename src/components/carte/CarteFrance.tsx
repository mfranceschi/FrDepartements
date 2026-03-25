import { useState, useMemo, useCallback, useRef } from 'react';
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
  type Layer = 'departements' | 'regions';
  const [activeLayer, setActiveLayer] = useState<Layer>('departements');

  // Tooltip via DOM ref — aucun setState sur mousemove
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Filter out DROM from metro features
  const metroDepts = useMemo(
    () => features.departements.filter((f) => !DROM_CODES.has(f.properties?.code as string)),
    [features.departements],
  );

  const handleDeptHover = useCallback((feature: Feature | null, x: number, y: number) => {
    const el = tooltipRef.current;
    if (!el) return;
    if (!feature) { el.style.display = 'none'; return; }
    const nom = feature.properties?.nom as string | undefined;
    const code = feature.properties?.code as string | undefined;
    el.textContent = nom && code ? `${nom} (${code})` : nom ?? code ?? '';
    el.style.left = `${x + 12}px`;
    el.style.top = `${y - 30}px`;
    el.style.display = 'block';
  }, []);

  const handleRegionHover = useCallback((feature: Feature | null, x: number, y: number) => {
    const el = tooltipRef.current;
    if (!el) return;
    if (!feature) { el.style.display = 'none'; return; }
    const nom = feature.properties?.nom as string | undefined;
    el.textContent = nom ?? '';
    el.style.left = `${x + 12}px`;
    el.style.top = `${y - 30}px`;
    el.style.display = 'block';
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

  const effectiveShowRegions = quizMode ? quizLayer === 'regions' : activeLayer === 'regions';
  const effectiveShowDepts = quizMode ? quizLayer === 'departements' : activeLayer === 'departements';

  return (
    <div className="relative w-full">
      {!quizMode && (
        <div className="flex gap-1 mb-2 px-2 bg-gray-100 p-1 rounded-lg w-fit">
          {(['departements', 'regions'] as const).map((layer) => (
            <button
              key={layer}
              type="button"
              onClick={() => setActiveLayer(layer)}
              className={[
                'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                activeLayer === layer
                  ? 'bg-white shadow-sm text-gray-800'
                  : 'text-gray-500 hover:text-gray-700',
              ].join(' ')}
            >
              <span className={`inline-block w-3 h-3 rounded-sm border ${layer === 'regions' ? 'border-green-500 bg-green-100' : 'border-blue-500 bg-blue-100'}`} />
              {layer === 'regions' ? 'Régions' : 'Départements'}
            </button>
          ))}
        </div>
      )}

      <svg
        viewBox="0 0 900 700"
        style={{ width: '100%', height: 'auto' }}
        className="block"
      >
        <CoucheRegions
          features={features.regions}
          pathGen={PATH_GEN}
          visible={effectiveShowRegions}
          quizMode={quizMode}
          highlightCode={highlightCode}
          onHover={handleRegionHover}
          onClick={onFeatureClick ? handleRegionClick : undefined}
        />
        <CoucheDepts
          features={metroDepts}
          pathGen={PATH_GEN}
          visible={effectiveShowDepts}
          quizMode={quizMode}
          highlightCode={highlightCode}
          onHover={handleDeptHover}
          onClick={onFeatureClick ? handleDeptClick : undefined}
        />
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
        <rect
          x={8} y={424} width={292} height={120}
          fill="none" stroke="#cbd5e1" strokeWidth={0.5} strokeDasharray="4 2" rx={3}
        />
        <text x={12} y={421} fontSize={8} fill="#94a3b8">
          Départements et régions d'outre-mer
        </text>
      </svg>

      {/* Tooltip via ref — jamais de setState sur mousemove */}
      {!quizMode && (
        <div
          ref={tooltipRef}
          className="fixed z-50 pointer-events-none bg-gray-800 text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap"
          style={{ display: 'none' }}
        />
      )}
    </div>
  );
}
