import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import * as d3 from 'd3';
import type { Feature } from 'geojson';
import CoucheRegions from './CoucheRegions';
import CoucheDepts from './CoucheDepts';
import InsetOutreMer from './InsetOutreMer';
import InsetIleDeFrance from './InsetIleDeFrance';

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

const DROM_CODES = new Set(['971', '972', '973', '974', '976']);

const PROJECTION = d3
  .geoConicConformal()
  .center([2.5, 46.5])
  .scale(3000)
  .translate([520, 340]);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const PATH_GEN: d3.GeoPath<any, d3.GeoPermissibleObjects> = d3.geoPath(PROJECTION);

interface ZoomTransform { x: number; y: number; k: number }

export default function CarteFrance({
  features,
  onFeatureClick,
  highlightCode,
  quizMode = false,
  quizLayer = 'departements',
}: CarteFranceProps) {
  type Layer = 'departements' | 'regions';
  const [activeLayer, setActiveLayer] = useState<Layer>('departements');
  const [transform, setTransform] = useState<ZoomTransform>({ x: 0, y: 0, k: 1 });

  const svgRef = useRef<SVGSVGElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | undefined>(undefined);
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Setup d3.zoom
  useEffect(() => {
    if (!svgRef.current) return;
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 8])
      .on('zoom', (event: d3.D3ZoomEvent<SVGSVGElement, unknown>) => {
        const { x, y, k } = event.transform;
        setTransform({ x, y, k });
      });

    zoomRef.current = zoom;
    d3.select(svgRef.current).call(zoom);

    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      d3.select(svgRef.current).on('.zoom', null);
    };
  }, []);

  const handleZoomIn = useCallback(() => {
    if (!svgRef.current || !zoomRef.current) return;
    d3.select(svgRef.current).transition().duration(250).call(zoomRef.current.scaleBy, 1.5);
  }, []);

  const handleZoomOut = useCallback(() => {
    if (!svgRef.current || !zoomRef.current) return;
    d3.select(svgRef.current).transition().duration(250).call(zoomRef.current.scaleBy, 1 / 1.5);
  }, []);

  const handleZoomReset = useCallback(() => {
    if (!svgRef.current || !zoomRef.current) return;
    d3.select(svgRef.current).transition().duration(300).call(zoomRef.current.transform, d3.zoomIdentity);
  }, []);

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
    <div className="relative w-full h-full flex flex-col" style={{ minHeight: '480px' }}>
      {/* Toolbar */}
      <div className="flex items-center gap-2 mb-2 shrink-0">
        {!quizMode && (
          <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
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

        {/* Boutons de zoom */}
        <div className={`flex gap-1 bg-gray-100 p-1 rounded-lg ${!quizMode ? 'ml-auto' : ''}`}>
          <button
            type="button"
            onClick={handleZoomIn}
            title="Zoomer"
            className="w-7 h-7 flex items-center justify-center rounded-md text-gray-600 hover:bg-white hover:shadow-sm text-base font-bold transition-colors"
          >
            +
          </button>
          <button
            type="button"
            onClick={handleZoomOut}
            title="Dézoomer"
            className="w-7 h-7 flex items-center justify-center rounded-md text-gray-600 hover:bg-white hover:shadow-sm text-base font-bold transition-colors"
          >
            −
          </button>
          <button
            type="button"
            onClick={handleZoomReset}
            title="Réinitialiser le zoom"
            className="px-2 h-7 flex items-center justify-center rounded-md text-gray-500 hover:bg-white hover:shadow-sm text-sm transition-colors"
          >
            ↺
          </button>
        </div>
      </div>

      <svg
        ref={svgRef}
        viewBox="0 0 900 700"
        preserveAspectRatio="xMidYMid meet"
        style={{ width: '100%', height: '100%', minHeight: 0, cursor: 'grab' }}
        className="block flex-1"
      >
        <g transform={`translate(${transform.x},${transform.y}) scale(${transform.k})`}>
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
            scale={transform.k}
            onHover={handleDeptHover}
            onClick={onFeatureClick ? handleInsetClick : undefined}
          />
          <InsetIleDeFrance
            features={metroDepts}
            visible={effectiveShowDepts}
            quizMode={quizMode}
            highlightCode={highlightCode}
            scale={transform.k}
            onHover={handleDeptHover}
            onClick={onFeatureClick ? handleDeptClick : undefined}
          />
          <rect
            x={8} y={424} width={292} height={220}
            fill="none" stroke="#cbd5e1" strokeWidth={0.5} strokeDasharray="4 2" rx={3}
          />
          <text x={12} y={421} fontSize={14 / transform.k} fill="#94a3b8">
            Départements et régions d'outre-mer
          </text>
        </g>
      </svg>

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
