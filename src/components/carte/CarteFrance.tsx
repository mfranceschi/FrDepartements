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
import { useTooltip } from '../../hooks/useTooltip';

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
  onPrefectureClick?: (deptCode: string) => void;
  onFleuveClick?: (name: string) => void;
  selectedFleuveName?: string;
  highlightCode?: string;
  highlightType?: 'departement' | 'region';
  highlightVariant?: 'correct' | 'target';
  wrongCode?: string;
  wrongType?: 'departement' | 'region';
  selectedPrefectureCode?: string;
  focusCode?: string;
  focusType?: 'departement' | 'region';
  focusSeq?: number;
  showPrefectures?: boolean;
  onShowPrefecturesChange?: (v: boolean) => void;
  showFleuves?: boolean;
  onShowFleuvesChange?: (v: boolean) => void;
  traversedDeptCodes?: string[];
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

export default function CarteFrance({
  features,
  onFeatureClick,
  onPrefectureClick,
  onFleuveClick,
  selectedFleuveName,
  highlightCode,
  highlightType,
  highlightVariant = 'correct',
  wrongCode,
  wrongType,
  selectedPrefectureCode,
  focusCode,
  focusType,
  focusSeq,
  showPrefectures: showPrefecturesProp,
  onShowPrefecturesChange,
  showFleuves: showFleuvesProps,
  onShowFleuvesChange,
  traversedDeptCodes,
  quizMode = false,
  quizLayer = 'departements',
}: CarteFranceProps) {
  type Layer = 'departements' | 'regions';
  const [activeLayer, setActiveLayer] = useState<Layer>('departements');
  // zoomK est le seul state lié au zoom : mis à jour uniquement quand k change,
  // pas à chaque frame de pan. Le transform du <g> est appliqué en impératif.
  const [zoomK, setZoomK] = useState(1);
  const [showLabels, setShowLabels] = useState(false);
  const [showPrefecturesInternal, setShowPrefecturesInternal] = useState(false);
  const showPrefectures = showPrefecturesProp ?? showPrefecturesInternal;
  const setShowPrefectures = onShowPrefecturesChange ?? setShowPrefecturesInternal;
  const [showFleuvesInternal, setShowFleuvesInternal] = useState(false);
  const showFleuves = showFleuvesProps ?? showFleuvesInternal;
  const setShowFleuves = onShowFleuvesChange ?? setShowFleuvesInternal;

  const { fleuves: fleuveFeatures } = useFleuveData(showFleuves);

  const svgRef = useRef<SVGSVGElement>(null);
  const gRef = useRef<SVGGElement>(null);
  const lastKRef = useRef(1);
  const zoomRef = useRef<ZoomBehavior<SVGSVGElement, unknown> | undefined>(undefined);
  const { tooltipRef, showTooltip, hideTooltip } = useTooltip();
  const featuresRef = useRef(features);
  featuresRef.current = features;

  // Setup d3.zoom
  useEffect(() => {
    if (!svgRef.current) return;
    const zoomBehavior = d3zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 8])
      .on('zoom', (event: D3ZoomEvent<SVGSVGElement, unknown>) => {
        const { x, y, k } = event.transform;
        // Mise à jour DOM directe : zéro re-render React pendant le pan
        if (gRef.current) {
          gRef.current.style.transform = `translate(${x}px,${y}px) scale(${k})`;
        }
        // Re-render React seulement quand le facteur de zoom change (pas le pan)
        if (k !== lastKRef.current) {
          lastKRef.current = k;
          setZoomK(k);
        }
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
  }, [focusCode, focusType, focusSeq]);

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

  const handlePrefectureClick = useCallback(
    (deptCode: string) => onPrefectureClick?.(deptCode),
    [onPrefectureClick],
  );

  const handleFleuveClick = useCallback(
    (name: string) => onFleuveClick?.(name),
    [onFleuveClick],
  );

  const handleFleuveHover = useCallback(
    (name: string | null, x: number, y: number) => {
      if (name) showTooltip(name, x, y);
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
      <span className="px-1 h-7 flex items-center justify-center text-sm font-medium text-gray-500 tabular-nums min-w-[3rem] text-center">
        {Math.round(zoomK * 100)}%
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
  ), [handleZoomIn, handleZoomOut, handleZoomReset, zoomK]);

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
                Noms
              </label>
              <label className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium cursor-pointer select-none transition-colors bg-gray-100 hover:bg-gray-200 text-gray-700">
                <input
                  type="checkbox"
                  checked={showPrefectures}
                  onChange={() => setShowPrefectures(!showPrefectures)}
                  className="w-4 h-4 accent-blue-600 cursor-pointer"
                />
                Préfectures
              </label>
            </>
          )}

          <label className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium cursor-pointer select-none transition-colors bg-gray-100 hover:bg-gray-200 text-gray-700">
            <input
              type="checkbox"
              checked={showFleuves}
              onChange={() => setShowFleuves(!showFleuves)}
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
        <defs>
          <clipPath id="clip-france">
            {features.regions.map((f, i) => {
              const d = PATH_GEN(f);
              return d ? <path key={i} d={d} /> : null;
            })}
          </clipPath>
        </defs>
        {/* ref impératif : le transform est mis à jour via setAttribute, sans re-render React */}
        {/* transformOrigin: '0 0' est obligatoire — CSS origin par défaut est 50%/50%, */}
        {/* alors que D3 calcule ses translations depuis (0,0) comme l'attribut SVG */}
        <g ref={gRef} style={{ transformOrigin: '0 0' }}>
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
          {/* Remplissages des départements — sans labels pour qu'ils restent au-dessus des contours */}
          <CoucheDepts
            features={features.departements}
            pathGen={PATH_GEN}
            visible={effectiveShowDepts}
            quizMode={quizMode}
            highlightCode={highlightDeptCode}
            highlightVariant={highlightVariant}
            wrongCode={wrongDeptCode}
            traversedCodes={traversedDeptCodes}
            onHover={handleDeptHover}
            onClick={onFeatureClick ? handleDeptClick : undefined}
            zoomK={zoomK}
            showLabels={false}
          />
          {/* Contours de régions : par-dessus les remplissages, sous fleuves/préfectures/labels */}
          <CoucheRegions
            features={features.regions}
            pathGen={PATH_GEN}
            visible={effectiveShowRegionBorders}
            borderOnly={true}
            quizMode={false}
            onHover={NOOP_HOVER}
          />
          <CoucheFleuves
            features={fleuveFeatures?.features ?? []}
            pathGen={PATH_GEN}
            visible={!quizMode && showFleuves}
            zoomK={zoomK}
            onHover={handleFleuveHover}
            onClick={!quizMode ? handleFleuveClick : undefined}
            selectedName={selectedFleuveName}
          />
          <CouchePrefectures
            projection={PROJECTION}
            zoomK={zoomK}
            visible={!quizMode && showPrefectures}
            highlightDeptCode={highlightDeptCode}
            selectedDeptCode={selectedPrefectureCode}
            onHover={handlePrefectureHover}
            onClick={!quizMode ? handlePrefectureClick : undefined}
            onlyRegionales={effectiveShowRegions}
          />
          {/* Labels des départements en dernière couche : toujours par-dessus tout */}
          <CoucheDepts
            features={features.departements}
            pathGen={PATH_GEN}
            visible={effectiveShowDepts}
            quizMode={quizMode}
            highlightCode={highlightDeptCode}
            highlightVariant={highlightVariant}
            wrongCode={wrongDeptCode}
            onHover={NOOP_HOVER}
            zoomK={zoomK}
            showLabels={showLabels}
            showFills={false}
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
