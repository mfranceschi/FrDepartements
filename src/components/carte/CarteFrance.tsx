import { useState, useCallback, useRef, useEffect } from 'react';
import {
  geoConicConformal,
  geoPath,
  zoom as d3zoom,
  zoomIdentity,
  select,
} from 'd3';
import type { GeoPath, GeoPermissibleObjects, ZoomBehavior, D3ZoomEvent } from 'd3';
import type { Feature } from 'geojson';
import CoucheRegions from './CoucheRegions';
import CoucheDepts from './CoucheDepts';

export interface CarteFranceProps {
  features: {
    departements: Feature[];
    regions: Feature[];
  };
  onFeatureClick?: (code: string, type: 'departement' | 'region') => void;
  highlightCode?: string;
  highlightType?: 'departement' | 'region';
  wrongCode?: string;
  wrongType?: 'departement' | 'region';
  focusCode?: string;
  focusType?: 'departement' | 'region';
  quizMode?: boolean;
  quizLayer?: 'departements' | 'regions';
}

const PROJECTION = geoConicConformal()
  .center([2.5, 46.5])
  .scale(3800)
  .translate([530, 355]);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const PATH_GEN: GeoPath<any, GeoPermissibleObjects> = geoPath(PROJECTION);

interface ZoomTransform { x: number; y: number; k: number }

export default function CarteFrance({
  features,
  onFeatureClick,
  highlightCode,
  highlightType,
  wrongCode,
  wrongType,
  focusCode,
  focusType,
  quizMode = false,
  quizLayer = 'departements',
}: CarteFranceProps) {
  type Layer = 'departements' | 'regions';
  const [activeLayer, setActiveLayer] = useState<Layer>('departements');
  const [transform, setTransform] = useState<ZoomTransform>({ x: 0, y: 0, k: 1 });
  const [showLabels, setShowLabels] = useState(false);

  const svgRef = useRef<SVGSVGElement>(null);
  const zoomRef = useRef<ZoomBehavior<SVGSVGElement, unknown> | undefined>(undefined);
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Setup d3.zoom
  useEffect(() => {
    if (!svgRef.current) return;
    const zoomBehavior = d3zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 8])
      .on('zoom', (event: D3ZoomEvent<SVGSVGElement, unknown>) => {
        const { x, y, k } = event.transform;
        setTransform({ x, y, k });
      });

    zoomRef.current = zoomBehavior;
    select(svgRef.current).call(zoomBehavior);

    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      select(svgRef.current).on('.zoom', null);
    };
  }, []);

  // Zoom programmatique vers un territoire (recherche sidebar)
  useEffect(() => {
    if (!focusCode || !svgRef.current || !zoomRef.current) return;

    // Cherche dans le bon tableau selon le type
    const pool = focusType === 'region' ? features.regions : features.departements;
    const target = pool.find((f) => f.properties?.code === focusCode);
    if (!target) return;

    const centroid = PATH_GEN.centroid(target);
    if (!centroid || isNaN(centroid[0]) || isNaN(centroid[1])) return;

    const svgW = 900;
    const svgH = 700;
    const scale = 4;
    const tx = svgW / 2 - scale * centroid[0];
    const ty = svgH / 2 - scale * centroid[1];
    const newTransform = zoomIdentity.translate(tx, ty).scale(scale);

    select(svgRef.current)
      .transition()
      .duration(500)
      .call(zoomRef.current.transform, newTransform);
  }, [focusCode, focusType, features]);

  const handleZoomIn = useCallback(() => {
    if (!svgRef.current || !zoomRef.current) return;
    select(svgRef.current).transition().duration(250).call(zoomRef.current.scaleBy, 1.5);
  }, []);

  const handleZoomOut = useCallback(() => {
    if (!svgRef.current || !zoomRef.current) return;
    select(svgRef.current).transition().duration(250).call(zoomRef.current.scaleBy, 1 / 1.5);
  }, []);

  const handleZoomReset = useCallback(() => {
    if (!svgRef.current || !zoomRef.current) return;
    select(svgRef.current).transition().duration(300).call(zoomRef.current.transform, zoomIdentity);
  }, []);

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

  const effectiveShowRegions = quizMode ? quizLayer === 'regions' : activeLayer === 'regions';
  const effectiveShowDepts = quizMode ? quizLayer === 'departements' : activeLayer === 'departements';

  // Restreint la surbrillance à la bonne couche pour éviter les collisions de codes
  const highlightDeptCode = !highlightType || highlightType === 'departement' ? highlightCode : undefined;
  const highlightRegionCode = !highlightType || highlightType === 'region' ? highlightCode : undefined;
  const wrongDeptCode = !wrongType || wrongType === 'departement' ? wrongCode : undefined;
  const wrongRegionCode = !wrongType || wrongType === 'region' ? wrongCode : undefined;

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

        {/* Bouton étiquettes (mode exploration uniquement) */}
        {!quizMode && activeLayer === 'departements' && (
          <button
            type="button"
            onClick={() => setShowLabels((v) => !v)}
            title={showLabels ? 'Masquer les étiquettes' : 'Afficher les étiquettes'}
            className={[
              'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
              showLabels
                ? 'bg-blue-100 text-blue-700 border border-blue-300'
                : 'bg-gray-100 text-gray-500 hover:text-gray-700',
            ].join(' ')}
          >
            <span className="text-xs leading-none">Aa</span>
            Étiquettes
          </button>
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
        viewBox="0 0 1200 730"
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
            highlightCode={highlightRegionCode}
            wrongCode={wrongRegionCode}
            onHover={handleRegionHover}
            onClick={onFeatureClick ? handleRegionClick : undefined}
          />
          <CoucheDepts
            features={features.departements}
            pathGen={PATH_GEN}
            visible={effectiveShowDepts}
            quizMode={quizMode}
            highlightCode={highlightDeptCode}
            wrongCode={wrongDeptCode}
            onHover={handleDeptHover}
            onClick={onFeatureClick ? handleDeptClick : undefined}
            zoomK={transform.k}
            showLabels={showLabels}
          />
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
