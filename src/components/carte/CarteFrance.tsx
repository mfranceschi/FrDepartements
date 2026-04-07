import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
  geoConicConformal,
  geoPath,
  zoom as d3zoom,
  zoomIdentity,
  select,
} from 'd3';
import type { ZoomBehavior, D3ZoomEvent } from 'd3';
import type { Feature } from 'geojson';
import CoucheRegions from './CoucheRegions';
import CoucheDepts from './CoucheDepts';
import CouchePrefectures from './CouchePrefectures';
import CoucheFleuves from './CoucheFleuves';
import { isValidCentroid } from './featureStyle';
import { useFleuveData } from '../../hooks/useFleuveData';

const FOCUS_SVG_W = 900;
const FOCUS_SVG_H = 700;
const FOCUS_SCALE = 4;
const ZOOM_STEP = 1.5;

export interface CarteFranceProps {
  features: {
    departements: Feature[];
    regions: Feature[];
  };
  onFeatureClick?: (code: string, type: 'departement' | 'region') => void;
  highlightCode?: string;
  highlightType?: 'departement' | 'region';
  highlightVariant?: 'correct' | 'target';
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

const PATH_GEN = geoPath(PROJECTION);

const DEFAULT_ZOOM = zoomIdentity;
const NOOP_HOVER = () => {};

interface ZoomTransform { x: number; y: number; k: number }

export default function CarteFrance({
  features,
  onFeatureClick,
  highlightCode,
  highlightType,
  highlightVariant = 'correct',
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
  const [showPrefectures, setShowPrefectures] = useState(false);
  const [showFleuves, setShowFleuves] = useState(false);

  const { fleuves: fleuveFeatures } = useFleuveData(showFleuves);

  const svgRef = useRef<SVGSVGElement>(null);
  const zoomRef = useRef<ZoomBehavior<SVGSVGElement, unknown> | undefined>(undefined);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef(features);
  featuresRef.current = features;

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
    select(svgRef.current).call(zoomBehavior.transform, DEFAULT_ZOOM);

    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      select(svgRef.current).on('.zoom', null);
    };
  }, []);

  // Zoom programmatique vers un territoire (recherche sidebar).
  // featuresRef est toujours à jour sans être une dépendance : l'effet ne se
  // déclenche que sur un changement de focusCode / focusType.
  useEffect(() => {
    if (!focusCode || !svgRef.current || !zoomRef.current) return;

    const pool = focusType === 'region' ? featuresRef.current.regions : featuresRef.current.departements;
    const target = pool.find((f) => f.properties?.code === focusCode);
    if (!target) return;

    const centroid = PATH_GEN.centroid(target);
    if (!centroid || !isValidCentroid(centroid)) return;

    const tx = FOCUS_SVG_W / 2 - FOCUS_SCALE * centroid[0];
    const ty = FOCUS_SVG_H / 2 - FOCUS_SCALE * centroid[1];
    const newTransform = zoomIdentity.translate(tx, ty).scale(FOCUS_SCALE);

    select(svgRef.current)
      .transition()
      .duration(500)
      .call(zoomRef.current.transform, newTransform);
  }, [focusCode, focusType]);

  const handleZoomIn = useCallback(() => {
    if (!svgRef.current || !zoomRef.current) return;
    select(svgRef.current).transition().duration(250).call(zoomRef.current.scaleBy, ZOOM_STEP);
  }, []);

  const handleZoomOut = useCallback(() => {
    if (!svgRef.current || !zoomRef.current) return;
    select(svgRef.current).transition().duration(250).call(zoomRef.current.scaleBy, 1 / ZOOM_STEP);
  }, []);

  const handleZoomReset = useCallback(() => {
    if (!svgRef.current || !zoomRef.current) return;
    select(svgRef.current).transition().duration(300).call(zoomRef.current.transform, DEFAULT_ZOOM);
  }, []);

  const showTooltip = useCallback((text: string, x: number, y: number) => {
    const el = tooltipRef.current;
    if (!el) return;
    el.textContent = text;
    el.style.left = `${x + 12}px`;
    el.style.top = `${y - 30}px`;
    el.style.display = 'block';
  }, []);

  const hideTooltip = useCallback(() => {
    const el = tooltipRef.current;
    if (el) el.style.display = 'none';
  }, []);

  const handleDeptHover = useCallback((feature: Feature | null, x: number, y: number) => {
    if (!feature) { hideTooltip(); return; }
    const rawNom = feature.properties?.nom;
    const rawCode = feature.properties?.code;
    const nom = typeof rawNom === 'string' ? rawNom : undefined;
    const code = typeof rawCode === 'string' ? rawCode : undefined;
    showTooltip(nom && code ? `${nom} (${code})` : nom ?? code ?? '', x, y);
  }, [showTooltip, hideTooltip]);

  const handleRegionHover = useCallback((feature: Feature | null, x: number, y: number) => {
    if (!feature) { hideTooltip(); return; }
    const rawNom = feature.properties?.nom;
    const nom = typeof rawNom === 'string' ? rawNom : undefined;
    showTooltip(nom ?? '', x, y);
  }, [showTooltip, hideTooltip]);

  const handleRegionClick = useCallback(
    (code: string) => onFeatureClick?.(code, 'region'),
    [onFeatureClick],
  );

  const handleDeptClick = useCallback(
    (code: string) => onFeatureClick?.(code, 'departement'),
    [onFeatureClick],
  );

  const handlePrefectureHover = useCallback(
    (label: string | null, x: number, y: number) => {
      if (label) showTooltip(label, x, y);
      else hideTooltip();
    },
    [showTooltip, hideTooltip],
  );

  const effectiveShowRegions = quizMode ? quizLayer === 'regions' : activeLayer === 'regions';
  const effectiveShowDepts = quizMode ? quizLayer === 'departements' : activeLayer === 'departements';
  // Contours de régions superposés sur les départements colorés (mode carte uniquement)
  const effectiveShowRegionBorders = !quizMode && activeLayer === 'departements';

  // Restreint la surbrillance à la bonne couche pour éviter les collisions de codes
  const highlightDeptCode = !highlightType || highlightType === 'departement' ? highlightCode : undefined;
  const highlightRegionCode = !highlightType || highlightType === 'region' ? highlightCode : undefined;
  const wrongDeptCode = !wrongType || wrongType === 'departement' ? wrongCode : undefined;
  const wrongRegionCode = !wrongType || wrongType === 'region' ? wrongCode : undefined;

  // Contrôles de zoom — partagés entre toolbar (non-quiz) et overlay absolu (quiz)
  const zoomControls = useMemo(() => (
    <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
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
      <span className="px-1 h-7 flex items-center justify-center text-xs font-mono text-gray-500 tabular-nums min-w-[3rem] text-center">
        {Math.round(transform.k * 100)}%
      </span>
      <button
        type="button"
        onClick={handleZoomReset}
        title="Réinitialiser le zoom"
        className="px-2 h-7 flex items-center justify-center rounded-md text-gray-500 hover:bg-white hover:shadow-sm text-sm transition-colors"
      >
        ↺
      </button>
    </div>
  ), [handleZoomIn, handleZoomOut, handleZoomReset, transform.k]);

  return (
    <div className="relative w-full h-full flex flex-col" style={{ minHeight: '480px' }}>
      {/* Toolbar — mode exploration uniquement */}
      {!quizMode && (
        <div className="flex items-center gap-2 mb-2 shrink-0">
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

          {activeLayer === 'departements' && (
            <>
              <label className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium cursor-pointer select-none transition-colors bg-gray-100 hover:bg-gray-200 text-gray-700">
                <input
                  type="checkbox"
                  checked={showLabels}
                  onChange={() => setShowLabels((v) => !v)}
                  className="w-4 h-4 accent-blue-600 cursor-pointer"
                />
                Afficher les noms
              </label>
              <label className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium cursor-pointer select-none transition-colors bg-gray-100 hover:bg-gray-200 text-gray-700">
                <input
                  type="checkbox"
                  checked={showPrefectures}
                  onChange={() => setShowPrefectures((v) => !v)}
                  className="w-4 h-4 accent-blue-600 cursor-pointer"
                />
                Afficher les préfectures
              </label>
            </>
          )}

          <label className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium cursor-pointer select-none transition-colors bg-gray-100 hover:bg-gray-200 text-gray-700">
            <input
              type="checkbox"
              checked={showFleuves}
              onChange={() => setShowFleuves((v) => !v)}
              className="w-4 h-4 accent-blue-600 cursor-pointer"
            />
            Cours d'eau
          </label>

          <div className="ml-auto">{zoomControls}</div>
        </div>
      )}

      {/* Overlay zoom — mode quiz uniquement */}
      {quizMode && (
        <div className="absolute top-2 right-2 z-10">
          {zoomControls}
        </div>
      )}

      <svg
        ref={svgRef}
        viewBox="0 0 1200 730"
        preserveAspectRatio="xMidYMid meet"
        style={{ width: '100%', height: '100%', minHeight: 0, cursor: 'grab', touchAction: 'none' }}
        className="block flex-1"
      >
        <g transform={`translate(${transform.x},${transform.y}) scale(${transform.k})`}>
          <CoucheRegions
            features={features.regions}
            pathGen={PATH_GEN}
            visible={effectiveShowRegions}
            quizMode={quizMode}
            highlightCode={highlightRegionCode}
            highlightVariant={highlightVariant}
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
            highlightVariant={highlightVariant}
            wrongCode={wrongDeptCode}
            onHover={handleDeptHover}
            onClick={onFeatureClick ? handleDeptClick : undefined}
            zoomK={transform.k}
            showLabels={showLabels}
          />
          <CoucheFleuves
            features={fleuveFeatures?.features ?? []}
            pathGen={PATH_GEN}
            visible={!quizMode && showFleuves}
            zoomK={transform.k}
          />
          <CouchePrefectures
            projection={PROJECTION}
            zoomK={transform.k}
            visible={!quizMode && showPrefectures}
            highlightDeptCode={highlightDeptCode}
            onHover={handlePrefectureHover}
            onlyRegionales={effectiveShowRegions}
          />
          {/* Contours de régions en surcouche sur les départements colorés */}
          <CoucheRegions
            features={features.regions}
            pathGen={PATH_GEN}
            visible={effectiveShowRegionBorders}
            borderOnly={true}
            quizMode={false}
            onHover={NOOP_HOVER}
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
